from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
from dotenv import load_dotenv
import aiohttp

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("❌ OPENAI_API_KEY is missing. Set it in Vercel environment variables.")

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://protein-viz.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.post("/analyze_pdb/")
async def analyze_pdb(pdb_data: dict):
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
