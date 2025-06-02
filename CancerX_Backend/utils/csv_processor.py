import os
import csv
from ocr import OCRProcessor
from PIL import Image
from io import BytesIO
import base64

class CsvProcessor:
    def __init__(self):
        self.ocr_processor = OCRProcessor.scan_to_text()

    def extract_text(self, file_path: str) -> str:
        if not file_path.lower().endswith(".csv"):
            raise ValueError("Only .csv files are supported by CsvProcessor.")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        with open(file_path, mode="r", encoding="utf-8", newline="") as csvfile:
            sample = csvfile.read(1024)
            csvfile.seek(0)

            try:
                dialect = csv.Sniffer().sniff(sample)
            except csv.Error:
                dialect = csv.excel

            reader = csv.reader(csvfile, dialect)
            all_text = []

            for row in reader:
                processed_row = []
                for cell in row:
                    cell = cell.strip()

                    # Detect base64 image or image file path
                    if cell.startswith("data:image/"):
                        try:
                            base64_data = cell.split(",", 1)[1]
                            img = Image.open(BytesIO(base64.b64decode(base64_data)))
                            ocr_text = self.ocr_processor.perform_ocr(img)
                            processed_row.append(ocr_text)
                        except Exception as e:
                            print(f"[Warning] Failed base64 image OCR: {e}")
                            processed_row.append(cell)
                    elif os.path.exists(cell) and cell.lower().endswith((".png", ".jpg", ".jpeg")):
                        try:
                            img = Image.open(cell)
                            ocr_text = self.ocr_processor.perform_ocr(img)
                            processed_row.append(ocr_text)
                        except Exception as e:
                            print(f"[Warning] Failed file image OCR: {e}")
                            processed_row.append(cell)
                    else:
                        processed_row.append(cell)

                all_text.append(", ".join(processed_row))

        return "\n".join(all_text)
