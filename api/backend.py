from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama
import os
import uvicorn

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server origin
    allow_credentials=True,
    allow_methods=["*"],                      # Allow all methods (OPTIONS, POST, etc.)
    allow_headers=["*"],                      # Allow all headers
)

# Path to the GGUF model
MODEL_PATH = os.path.abspath("models/Llama-Doctor-3.2-3B-Instruct.Q4_K_M.gguf")

# Load the model on startup
llm = Llama(model_path=MODEL_PATH, use_mmap=True, verbose=False)

class ChatRequest(BaseModel):
    history: list[str] = []   # List of conversation history messages
    message: str              # The latest user message

@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = (
        "Give health motivational and good health habbits. \n"
        "You are a helpful AI assistant. Provide clear and concise responses.\n"
        "Always give noise reduced answers.\n"
        "If you don't know the answer, it's okay to say you don't know.\n"
        "Always you have to give the correct and relevant answer.\n"
        "If the user asks for a joke, you can provide a joke.\n"
        "You are not a specialized AI assistant. You are just a generalized AI assistant to chat\n"
        "with the user and provide relevant answers.\n"
        "Do not add any irrelevant information in the response.\n"
        "Do not suggest medicine, drugs,locations.\n"
        "If you have any diseases immediately meet a doctor.\n"
    )
    # Build the full prompt with context
    prompt = f"[SYSTEM]: {system_prompt}\n"
    for item in request.history:
        prompt += item + "\n"
    prompt += f"[USER]: {request.message}\n[ASSISTANT]:"

    response = llm(
        prompt,
        max_tokens=100,
        temperature=1.8,
        top_p=0.5,
        top_k=50,
        repeat_penalty=1.1,
        stop=["[USER]:", "\n[ASSISTANT]:"]
    )

    text = response["choices"][0]["text"].strip()
    return {"response": text if text else "Error: No output from AI"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)