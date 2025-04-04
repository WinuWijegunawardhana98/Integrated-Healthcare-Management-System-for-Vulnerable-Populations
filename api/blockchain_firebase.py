import pyrebase
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import bcrypt
import hashlib

# Initialize Firebase using Pyrebase
firebase_config = {
    "apiKey": "YOUR_API_KEY",
    "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
    "databaseURL": "https://YOUR_PROJECT_ID.firebaseio.com",
    "projectId": "YOUR_PROJECT_ID",
    "storageBucket": "YOUR_PROJECT_ID.appspot.com",
    "messagingSenderId": "YOUR_SENDER_ID",
    "appId": "YOUR_APP_ID",
    "measurementId": "YOUR_MEASUREMENT_ID"
}

firebase = pyrebase.initialize_app(firebase_config)
db = firebase.database()
auth = firebase.auth()

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

class PrescriptionRecord(BaseModel):
    user: str
    title: str
    details: Optional[str]
    prescriptions: List[dict]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Utility function for hashing
def calculate_hash(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

# Register a new user
@app.post("/register")
async def register_user(user: User):
    user_data = db.child("users").child(user.username).get().val()
    if user_data:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    user_data = user.dict()
    user_data["password"] = hashed_password.decode('utf-8')

    db.child("users").child(user.username).set(user_data)

    return {"message": "User registered successfully", "user": user_data}

# Login user
@app.post("/login")
async def login_user(user: LoginUser):
    user_data = db.child("users").child(user.username).get().val()

    if not user_data:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    if not bcrypt.checkpw(user.password.encode('utf-8'), user_data["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    return {"message": "Login successful", "user": user_data}

@app.post("/add-prescription")
async def add_prescription(prescription: PrescriptionRecord):
    user_data = db.child("users").child(prescription.user).get().val()

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    record = prescription.dict()
    record["hash"] = calculate_hash(f"{record['user']}-{record['title']}-{record['created_at']}")

    db.child("prescriptions").push(record)

    return {"message": "Prescription added with integrity hash", "hash": record["hash"]}

# Verify prescription hash
@app.get("/verify-prescription/{hash}")
async def verify_prescription(hash: str):
    prescriptions = db.child("prescriptions").get().val()

    for key, value in prescriptions.items():
        if value["hash"] == hash:
            return {"message": "Hash verified", "record": value}

    raise HTTPException(status_code=404, detail="Hash not found or record tampered")

# Retrieve user logs
@app.get("/user/{username}/logs")
async def get_user_logs(username: str):
    logs = db.child("logs").order_by_child("username").equal_to(username).get().val()

    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for this user")

    return {"logs": logs}

# Log action
def log_action(username: str, action: str):
    log_data = {
        "username": username,
        "action": action,
        "timestamp": datetime.utcnow().isoformat()
    }
    db.child("logs").push(log_data)

