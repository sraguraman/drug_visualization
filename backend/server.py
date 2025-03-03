from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import os 

# Initialize FastAPI app
app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_pdb(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {"message": f"File {file.filename} uploaded successfully"}