from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
from dotenv import load_dotenv
import aiohttp

load_dotenv()
api_key = openai.api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("❌ OPENAI_API_KEY is missing. Set it in Vercel environment variables.")

app = FastAPI()

# ✅ Fix CORS: Explicitly allow frontend domain
origins = [
    "http://localhost:3000",  # Local development
    "https://protein-viz.vercel.app",
    "https://protein-viz.vercel.app/api"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ✅ Allow frontend domains
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],  # ✅ Explicitly expose CORS headers
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.options("/{path:path}")
async def preflight_request(path: str):
    return {"message": "Preflight OK"}

@app.post("/upload/")
async def upload_pdb(file: UploadFile = File(...)):
    """Handles file upload without saving to disk."""
    file_content = await file.read()  # Read file into memory

    # ✅ Debugging: Print file size and type
    print(f"Received file: {file.filename}, Size: {len(file_content)} bytes, Type: {file.content_type}")

    # ✅ Check if file is empty
    if len(file_content) == 0:
        return {"error": "Uploaded file is empty!"}

    return {
        "message": f"File {file.filename} uploaded successfully",
        "filename": file.filename,
        "pdb_data": file_content.decode("utf-8"),  # Return file as string
    }

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
    """Analyze in-memory PDB file content with GPT-4-Turbo."""
    
    pdb_text = pdb_data.get("pdbData")  # Read the PDB text from request body
    if not pdb_text:
        raise HTTPException(status_code=400, detail="No PDB data provided.")

    try:
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
        response = client.chat.completions.create(
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