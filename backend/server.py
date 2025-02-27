from fastapi import FastAPI

# Initialize FastAPI app
app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to the Drug-Target Interaction API!"}