from pydantic import BaseModel
from typing import List

class FileItem(BaseModel):
    filename: str
    content_type: str
    content: str  # base64-encoded string

class InputPayload(BaseModel):
    patient: str
    details: str
    files: List[FileItem]
