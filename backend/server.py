from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
from dotenv import load_dotenv
import requests
import aiohttp

load_dotenv()
api_key = openai.api_key = os.getenv("OPENAI_API_KEY")
print(f"🔑 OpenAI API Key Loaded: {bool(api_key)}")

app = FastAPI()

# ✅ Fix CORS: Explicitly allow frontend domain
origins = [
    "http://localhost:3000",  # Local development
    "https://protein-viz.vercel.app",  # Production frontend
]

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ✅ Allow frontend domains
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],  # ✅ Explicitly expose CORS headers
)

@app.options("/{path:path}")
async def preflight_request(path: str):
    return {"message": "Preflight OK"}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/")
async def upload_pdb(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # ✅ Debugging: Print file size and type
    file_size = await file.read()
    print(f"Received file: {file.filename}, Size: {len(file_size)} bytes, Type: {file.content_type}")

    # ✅ Check if file is empty
    if len(file_size) == 0:
        return {"error": "Uploaded file is empty!"}

    with open(file_path, "wb") as f:
        f.write(file_size)

    return {"message": f"File {file.filename} uploaded successfully", "filename": file.filename}

@app.get("/files/{filename}")
async def get_pdb_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    return FileResponse(file_path, media_type="chemical/x-pdb")

def extract_molecule_info(pdb_text):
    """Extracts basic molecular info from a PDB file for better GPT responses."""
    molecule_info = []
    for line in pdb_text.split("\n"):
        if line.startswith("HETATM"):  # Ligand information
            molecule_info.append(line.strip())
        elif line.startswith("ATOM") and " CA " in line:  # Alpha carbon chain for proteins
            molecule_info.append(line.strip())

    return "\n".join(molecule_info[:100])  # Limit to 100 lines for brevity

@app.post("/analyze_pdb/")
async def analyze_pdb(pdb_data: dict):
    """Fetch PDB file from URL and analyze it with GPT-4-Turbo."""
    
    pdb_url = pdb_data.get("pdbUrl")
    if not pdb_url:
        raise HTTPException(status_code=400, detail="No PDB URL provided.")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(pdb_url) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail="Failed to download PDB file.")
                pdb_text = await response.text()

        extracted_info = extract_molecule_info(pdb_text)

        prompt = f"""
        You are an expert in molecular docking and drug discovery.
        Analyze the following PDB file and provide insights:

        - Are there any ligands present? If so, describe them.
        - Suggest potential molecular interactions and functional relevance.

        Key Molecular Information:
        ```
        {extracted_info}
        ```
        """

        client = openai.OpenAI(api_key=api_key)  # ✅ Initialize OpenAI Client
        response = client.chat.completions.create(  # ✅ REMOVE `await`
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a structural biochemist."},
                {"role": "user", "content": prompt},
            ],
        )

        gpt_response = response.choices[0].message.content
        return {"pdb_analysis": gpt_response}

    except Exception as e:
        return {"error": str(e)}
