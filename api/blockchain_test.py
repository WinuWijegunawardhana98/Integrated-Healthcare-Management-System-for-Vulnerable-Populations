import os
from google.cloud import firestore
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import bcrypt

# Set the environment variable for the service account
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "health-monitoring-system.json"

# Initialize Firestore DB
db = firestore.Client()

def get_firestore_client():
    return db  # DB connection

db = get_firestore_client()

app = FastAPI()

class User(BaseModel):
    username: str
    full_name: str
    email: str
    contact: str
    password: str
    nic: str

class LoginUser(BaseModel):
    username: str
    password: str

class UserLog(BaseModel):
    username: str
    action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

@app.post("/register")
async def register_user(user: User):
    user_ref = db.collection("users").document(user.username)
    if user_ref.get().exists:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash the password before storing it
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    user_data = user.dict()
    user_data["password"] = hashed_password.decode('utf-8')

    user_ref.set(user_data)

    # Log the action
    log_action(user.username, "User registered")

    return {"message": "User registered successfully", "user": user_data}

@app.post("/login")
async def login_user(user: LoginUser):
    user_ref = db.collection("users").document(user.username)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    user_data = user_doc.to_dict()
    
    # Check the hashed password
    if not bcrypt.checkpw(user.password.encode('utf-8'), user_data["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    user_data.pop("password")  # Remove the password field from the response

    # Log the action
    log_action(user.username, "User logged in")

    return {"message": "Login successful", "user": user_data}

@app.get("/user/{username}")
async def get_user_details(username: str):
    user_ref = db.collection("users").document(username)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    user_data.pop("password", None)  # Exclude password from the response

    return {"user": user_data}

@app.get("/user/{username}/logs")
async def get_user_logs(username: str):
    logs_ref = db.collection("logs").where("username", "==", username).order_by("timestamp", direction=firestore.Query.DESCENDING)
    logs = logs_ref.stream()

    user_logs = [{"action": log.to_dict()["action"], "timestamp": log.to_dict()["timestamp"]} for log in logs]

    if not user_logs:
        raise HTTPException(status_code=404, detail="No logs found for this user")

    return {"logs": user_logs}

def log_action(username: str, action: str):
    log_data = {
        "username": username,
        "action": action,
        "timestamp": datetime.utcnow()
    }
    db.collection("logs").add(log_data)
