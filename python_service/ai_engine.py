from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import face_recognition
import pytesseract
from PIL import Image
import io
import base64
import hashlib
import json

app = FastAPI()

class BiometricRequest(BaseModel):
    idImageBase64: str
    selfieBase64: str

@app.post("/process_biometrics")
async def process_biometrics(request: BiometricRequest):
    try:
        # Decode images
        id_image_bytes = base64.b64decode(request.idImageBase64)
        selfie_bytes = base64.b64decode(request.selfieBase64)

        id_image_pil = Image.open(io.BytesIO(id_image_bytes))
        selfie_pil = Image.open(io.BytesIO(selfie_bytes))

        # 1. Extract text from ID using OCR (Tesseract)
        extracted_text = pytesseract.image_to_string(id_image_pil)
        cleaned_text = " ".join(extracted_text.split())

        # Load images for face_recognition
        id_image_np = face_recognition.load_image_file(io.BytesIO(id_image_bytes))
        selfie_np = face_recognition.load_image_file(io.BytesIO(selfie_bytes))

        # 2. Verify face in selfie matches face on ID
        # Find face locations first (with fallback upsampling for smaller faces or lower quality images)
        id_face_locations = face_recognition.face_locations(id_image_np)
        if not id_face_locations:
            id_face_locations = face_recognition.face_locations(id_image_np, number_of_times_to_upsample=2)
            
        selfie_face_locations = face_recognition.face_locations(selfie_np)
        if not selfie_face_locations:
            selfie_face_locations = face_recognition.face_locations(selfie_np, number_of_times_to_upsample=2)

        if not id_face_locations:
            return {"verified": False, "error": "No face found on ID document. Please ensure the photo is clear and well-lit."}
        if not selfie_face_locations:
            return {"verified": False, "error": "No face found in selfie. Please ensure good lighting and look directly at the camera."}

        id_face_encodings = face_recognition.face_encodings(id_image_np, known_face_locations=id_face_locations)
        selfie_face_encodings = face_recognition.face_encodings(selfie_np, known_face_locations=selfie_face_locations)

        # Compare the first face found in both images
        id_encoding = id_face_encodings[0]
        selfie_encoding = selfie_face_encodings[0]

        matches = face_recognition.compare_faces([id_encoding], selfie_encoding, tolerance=0.6)
        
        if not matches[0]:
            return {"verified": False, "error": "Faces do not match."}

        # 3. Generate a secure 'Biometric Hash' (SHA-256 combining ID data and facial landmarks)
        data_to_hash = {
            "id_text": cleaned_text,
            "face_encoding": selfie_encoding.tolist()
        }
        
        hash_input = json.dumps(data_to_hash, sort_keys=True).encode('utf-8')
        biometric_hash = hashlib.sha256(hash_input).hexdigest()

        # In solidity bytes32 requires a hex string with '0x' prefix
        eth_bytes32_hash = "0x" + biometric_hash

        return {
            "verified": True,
            "biometricHash": eth_bytes32_hash,
            "extractedText": cleaned_text
        }

    except Exception as e:
        print(f"Error processing biometrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
