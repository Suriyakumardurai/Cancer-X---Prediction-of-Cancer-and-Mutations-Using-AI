import os
from docx import Document
from ocr import OCRProcessor
from PIL import Image
from io import BytesIO

class DocxProcessor:
    def __init__(self):
        self.ocr_processor = OCRProcessor.scan_to_text()  # returns an instance

    def extract_text(self, file_path: str) -> str:
        if not file_path.lower().endswith(".docx"):
            raise ValueError("Only .docx files are supported by DocxProcessor.")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        doc = Document(file_path)
        all_text = []

        # Extract text paragraphs
        text_paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        all_text.extend(text_paragraphs)

        # Extract and OCR images
        for rel in doc.part._rels:
            rel_obj = doc.part._rels[rel]
            if "image" in rel_obj.target_ref:
                image_data = rel_obj.target_part.blob
                try:
                    image = Image.open(BytesIO(image_data))
                    ocr_text = self.ocr_processor.perform_ocr(image)
                    if ocr_text.strip():
                        all_text.append(ocr_text.strip())
                except Exception as e:
                    print(f"[Warning] Failed to OCR image in DOCX: {e}")

        return "\n".join(all_text)
