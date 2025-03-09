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

# ✅ Set your OpenAI API key
openai.api_key = api_key

app = FastAPI()

# ✅ CORS Middleware - allows all domains for simplicity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your domain(s) for stricter security
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
        # 🔹 Prompt encouraging data-driven analysis without requesting more info
        prompt = f"""
        You are an advanced structural biology assistant with deep knowledge of protein structures,
        ligand binding, and PDB file conventions. Below is a portion of a PDB file:

        {pdb_text[:500]}

        Analyze ONLY the data provided above. Do not ask for missing data or disclaimers.
        Instead, provide your best possible interpretation of:

        1. The protein’s structural features (secondary structure, domains, motifs).
        2. Any ligands, cofactors, or metal ions you detect from the partial data.
        3. Possible functional insights or binding interactions you can infer.
        4. Any significant or unique aspects you notice in this PDB excerpt.

        Speak as an expert structural biochemist, focusing on the data at hand.
        If certain details appear incomplete, simply note that the data is limited,
        but do not ask for more information. Provide a concise, data-driven analysis.
        """

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a structural biochemist."},
                {"role": "user", "content": prompt},
            ],
        )
        gpt_response = response.choices[0].message.content
        return {"pdb_analysis": gpt_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
