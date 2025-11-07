import os
import json
from uuid import uuid4
from typing import Dict, Any
from dotenv import load_dotenv
from loguru import logger

# FastAPI/Web Dependencies
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import httpx # Used if you were proxying, but we will integrate directly

# Pipecat/Bot Dependencies
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.runner.types import WebSocketRunnerArguments
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.base_transport import BaseTransport
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

# Twilio Dependencies
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import Connect, Stream, VoiceResponse
from pydantic import BaseModel

# --- Configuration and Initialization ---
load_dotenv(override=True)
logger.remove(0)
logger.add(os.sys.stderr, level="INFO") # Set to INFO for less verbosity

app = FastAPI()

# 🚨 TEMPORARY IN-MEMORY STORAGE: This dictionary holds the payload 
# indexed by a unique ID (the call_id). Data is deleted after the call or server restart.
# This is the only way to pass context without a database.
temp_payload_cache: Dict[str, Dict[Any, Any]] = {}

# CORS setup remains the same
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Pydantic models needed for Twilio integration
class TwilioCallResult(BaseModel):
    call_sid: str
    to_number: str

# Helper Functions (Simplified from server_utils.py)
def get_websocket_url() -> str:
    """Get the WSS URL for TwiML."""
    local_server_url = os.getenv("LOCAL_SERVER_URL")
    if not local_server_url:
        raise ValueError("Missing LOCAL_SERVER_URL environment variable.")
    # Convert https:// to wss://
    ws_url = local_server_url.replace("https://", "wss://")
    return f"{ws_url}/ws"

def generate_twiml(call_id: str) -> HTMLResponse:
    """Generate TwiML to connect the call to our WebSocket."""
    websocket_url = get_websocket_url()
    
    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=websocket_url)

    # 💡 CRITICAL: Pass the unique ID (call_id) to the WebSocket endpoint
    # The bot will use this ID to retrieve the full payload from the cache.
    stream.parameter(name="call_id_for_context", value=call_id)

    connect.append(stream)
    response.append(connect)
    # Give Twilio a short pause to ensure the stream connects
    response.pause(length=1) 
    
    return HTMLResponse(content=str(response), media_type="application/xml")

async def make_twilio_call(to_number: str, from_number: str, call_id: str) -> TwilioCallResult:
    """Initiate an outbound call via Twilio API."""
    local_server_url = os.getenv("LOCAL_SERVER_URL")
    twiml_url = f"{local_server_url}/twiml"
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")

    if not all([account_sid, auth_token, local_server_url]):
        raise ValueError("Missing Twilio credentials or LOCAL_SERVER_URL.")

    client = TwilioClient(account_sid, auth_token)
    
    # Twilio will call the /twiml endpoint after dialing, 
    # and we pass the custom 'call_id' as a query param for tracking.
    call = client.calls.create(
        to=to_number, 
        from_=from_number, 
        url=f"{twiml_url}?call_id={call_id}", # Pass call_id to /twiml
        method="POST"
    )

    return TwilioCallResult(call_sid=call.sid, to_number=to_number)


# --- FastAPI Endpoints ---

@app.post("/api/initiate")
async def initiate_data_collection(payload: Dict[Any, Any]):
    """
    1. Receives the full JSON payload.
    2. Stores it temporarily in memory with a unique ID.
    3. Initiates the Twilio call.
    4. Returns success.
    """
    to_number = payload.get("phoneNumber")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    
    if not to_number or not from_number:
        raise HTTPException(status_code=400, detail="Payload must contain 'phoneNumber' and TWILIO_FROM_NUMBER must be set.")

    # 🚨 STEP 1 & 2: Generate a unique ID and store the payload
    unique_call_id = str(uuid4())
    temp_payload_cache[unique_call_id] = payload
    logger.info(f"Payload temporarily cached with ID: {unique_call_id}")
    
    try:
        # 🚨 STEP 3: Initiate the call
        call_result = await make_twilio_call(to_number, from_number, unique_call_id)
        
        return {
            "message": "Call initiation successful. Payload ready for AI Agent.", 
            "twilio_sid": call_result.call_sid,
            "call_id": unique_call_id
        }
    except Exception as e:
        # Clean up cache if call initiation fails
        if unique_call_id in temp_payload_cache:
            del temp_payload_cache[unique_call_id]
        logger.error(f"Failed to initiate Twilio call: {e}")
        raise HTTPException(status_code=500, detail=f"Call initiation error: {str(e)}")


@app.post("/twiml")
async def get_twiml(request: Request) -> HTMLResponse:
    """Twilio calls this webhook to get TwiML instructions."""
    # Twilio sends form data, but we passed the call_id as a query parameter
    query_params = request.query_params
    call_id = query_params.get("call_id")
    
    if not call_id or call_id not in temp_payload_cache:
        # Log and return TwiML to hang up the call if context is lost
        logger.error(f"TwiML request received but call context {call_id} not found.")
        response = VoiceResponse()
        response.say("Sorry, there was an error starting your automated call. Goodbye.")
        response.hangup()
        return HTMLResponse(content=str(response), media_type="application/xml")

    # The Twilio request confirms the unique ID is valid and has data
    return generate_twiml(call_id)


# --- Pipecat Bot Logic ---

async def run_bot(transport: BaseTransport, handle_sigint: bool, initial_payload: Dict[Any, Any]):
    """The core Pipecat conversation loop."""

    # 💡 Use the full payload to craft the system prompt
    patient_name = initial_payload.get("caseDetails", {}).get("patientName", "the patient")
    
    # Extract the simplified summary to use as core context
    laypersons_summary = initial_payload.get("caseDetails", {}).get("synthesisReport", {}).get("simplifiedSummaryForPatient", "No specific clinical summary is available.")
    
    full_json_string = json.dumps(initial_payload, indent=2)

    llm = GoogleLLMService(api_key=os.getenv("GOOGLE_API_KEY"))
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",
    )

    system_prompt = (
        "You are an AI assistant making an outbound phone call to follow up on a medical case. "
        f"The caller is related to {patient_name}. Your primary goal is to relay and explain the "
        "medical summary concisely and answer simple, related questions. Be friendly and conversational. "
        "The core clinical findings are: "
        f"'{laypersons_summary}'. "
        "Always keep your responses under two sentences. Start by greeting the person and referencing their case."
        # Optionally, include the full data for deep context
        f"\n\n--- Full Data for Context ---\n{full_json_string}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    context = LLMContext(messages)
    context_aggregator = LLMContextAggregatorPair(context)

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            context_aggregator.user(),
            llm,
            tts,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            audio_in_sample_rate=8000,
            audio_out_sample_rate=8000,
        ),
    )

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Call finished for context ID {initial_payload.get('unique_call_id')}")
        # 🚨 Clean up the temporary cache entry when the call ends
        call_key = initial_payload.get("unique_call_id")
        if call_key in temp_payload_cache:
            del temp_payload_cache[call_key]
            logger.info(f"Cleaned up temporary cache for ID: {call_key}")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=handle_sigint)
    await runner.run(task)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Handles WebSocket connection from Twilio Media Streams.
    1. Retrieves the call context using the unique ID.
    2. Runs the Pipecat bot with the retrieved context.
    """
    from pipecat.runner.types import WebSocketRunnerArguments

    await websocket.accept()
    logger.info("WebSocket connection accepted.")
    
    # Pipecat utility parses the Twilio 'start' message
    runner_args = WebSocketRunnerArguments(websocket=websocket)
    transport_type, call_data = await parse_telephony_websocket(runner_args.websocket)
    
    # 💡 CRITICAL: Get the custom context ID we passed in TwiML
    context_call_id = call_data.get("body", {}).get("call_id_for_context")
    
    if not context_call_id or context_call_id not in temp_payload_cache:
        logger.error(f"WebSocket: Failed to retrieve context for ID: {context_call_id}")
        await websocket.close(code=1008) # Policy Violation
        return

    # 🚨 RETRIEVE THE PAYLOAD FROM CACHE
    initial_payload = temp_payload_cache[context_call_id]
    initial_payload['unique_call_id'] = context_call_id # Add key for cleanup

    # Initialize the Pipecat transport
    serializer = TwilioFrameSerializer(
        stream_sid=call_data["stream_id"],
        call_sid=call_data["call_id"],
        account_sid=os.getenv("TWILIO_ACCOUNT_SID", ""),
        auth_token=os.getenv("TWILIO_AUTH_TOKEN", ""),
    )
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_analyzer=SileroVADAnalyzer(),
            serializer=serializer,
        ),
    )

    try:
        # 🚨 RUN THE BOT WITH THE FULL PAYLOAD CONTEXT
        await run_bot(transport, runner_args.handle_sigint, initial_payload)
    except Exception as e:
        logger.error(f"Error in WebSocket endpoint: {e}")
        await websocket.close()

# --- Run Server ---

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting consolidated Twilio chatbot server on port {port}")
    # Note: Use host="0.0.0.0" if running in a container or on a cloud platform
    uvicorn.run(app, host="127.0.0.1", port=port)