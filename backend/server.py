from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("❌ OPENAI_API_KEY is missing. Set it in Vercel environment variables.")

app = FastAPI()

# ✅ Fix CORS: Explicitly allow frontend domain
origins = [
    "http://localhost:3000",
    "https://protein-viz.vercel.app",
    "https://protein-qiy27j6ga-sid-raguramans-projects.vercel.app"  # ✅ Add deployed frontend domain
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

@app.options("/{path:path}")  # ✅ Handle CORS preflight requests
async def preflight_request(path: str):
    return {"message": "Preflight OK"}

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.post("/api/upload/")
async def upload_pdb(file: UploadFile = File(...)):
    """Handles PDB file uploads and returns the file contents as text."""
    pdb_data = await file.read()
    if not pdb_data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty!")

    return {"filename": file.filename, "pdbData": pdb_data.decode("utf-8")}

@app.post("/api/analyze_pdb/")
async def analyze_pdb(pdb_data: dict):
    """Processes PDB file with OpenAI for molecular insights."""
    pdb_text = pdb_data.get("pdbData")
    if not pdb_text:
        raise HTTPException(status_code=400, detail="No PDB data provided.")

    try:
        prompt = f"""
        You are an expert in molecular docking and drug discovery.
        Analyze the following PDB file and provide insights:

        {pdb_text[:500]}  # Limit input for GPT
        """

        client = openai.OpenAI(api_key=api_key)
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
