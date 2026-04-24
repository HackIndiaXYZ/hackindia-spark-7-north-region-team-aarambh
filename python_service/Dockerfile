FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for face_recognition and pytesseract
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "ai_engine:app", "--host", "0.0.0.0", "--port", "8000"]
