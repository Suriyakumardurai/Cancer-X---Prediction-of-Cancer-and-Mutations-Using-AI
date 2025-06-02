import os
import fitz  # PyMuPDF
from PIL import Image
from io import BytesIO
from ocr import OCRProcessor

class PDFProcessor:
    def __init__(self):
        self.ocr_processor = OCRProcessor.scan_to_text

    def extract_text_from_pdf(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        all_text = ""

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()

            if text.strip():  # If the page has extractable text
                all_text += f"\n{text}"
            else:
                # Render page as image and perform OCR
                pix = page.get_pixmap(dpi=300)
                img_data = pix.tobytes("png")
                img = Image.open(BytesIO(img_data))

                ocr_text = self.ocr_processor.perform_ocr(img)
                all_text += f"\n{ocr_text}"

        return all_text.strip()
