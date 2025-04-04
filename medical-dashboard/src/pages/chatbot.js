from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import uvicorn
import os

app = FastAPI()

# Enable CORS for frontend communication (replace "*" with actual domain in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load GGUF model
MODEL_PATH = r"C:\Users\User\Desktop\reserachgit\api\models\unsloth.Q4_K_M.gguf"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

llm = Llama(model_path=MODEL_PATH, use_mmap=True, verbose=False, n_ctx=131072)

# Request model for chat endpoint
class ChatRequest(BaseModel):
    history: list[str] = []
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to my FastAPI chatbot!"}

@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = (
        "You are a helpful AI assistant. Provide clear and concise responses.\n"
        "If you don't know the answer, say so.\n"
        "Only provide relevant information.\n"
    )

    prompt = f"[SYSTEM]: {system_prompt}\n"
    for item in request.history:
        prompt += item + "\n"
    prompt += f"[USER]: {request.message}\n[ASSISTANT]:"

    response = llm(
        prompt,
        max_tokens=512,
        temperature=0.7,
        top_p=0.9,
        top_k=40,
        repeat_penalty=1.1,
        stop=["[USER]:", "\n[ASSISTANT]:"]
    )

    text = response["choices"][0]["text"].strip()
    return {"response": text if text else "Error: No output from AI"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
