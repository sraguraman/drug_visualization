from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
from dotenv import load_dotenv

# Load environment variables (including OPENAI_API_KEY)
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise Exception("❌ OPENAI_API_KEY is missing. Set it in Vercel environment variables.")

# Set your OpenAI API key
openai.api_key = api_key

app = FastAPI()

# CORS Middleware - allow all origins, or list your specific domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["https://your-frontend.vercel.app"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.post("/api/analyze_pdb")
def analyze_pdb(pdb_data: dict):
    """
    Processes in-memory PDB data with GPT for insights.
    Expects JSON: { "pdbData": "...pdb file contents..." }
    """
    pdb_text = pdb_data.get("pdbData")
    if not pdb_text:
        raise HTTPException(status_code=400, detail="No PDB data provided.")

    try:
        # Prompt GPT with the first ~500 chars of the PDB
        prompt = f"""
        You are an expert in molecular docking and drug discovery.
        Analyze the following PDB file and provide insights:

        {pdb_text[:500]}
        """

        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",  # or "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": "You are a structural biochemist."},
                {"role": "user", "content": prompt},
            ],
        )
        gpt_response = response.choices[0].message.content
        return {"pdb_analysis": gpt_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
