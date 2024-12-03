# main.py
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import bcrypt
import os
import shutil
from typing import List, Optional
from firestore_db import get_firestore_client
from excercise_monitor import exe_launch
from face_detection import FaceRecognition
import joblib
import pandas as pd
from google.cloud import firestore
from datetime import datetime

app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://localhost:3001"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load MOdels
decision_tree_model_for_dosage = joblib.load('drug_strength_model_dt.joblib')
label_encoders = joblib.load('label_encoders.joblib')

# Db connection
db = get_firestore_client()

class User(BaseModel):
    username: str
    full_name: str
    email:str
    contact: str
    password: str
    nic: str

class LoginUser(BaseModel):
    username: str
    password: str

class FaceID(BaseModel):
    username: str

class Drug(BaseModel):
    drug_name: str
    category: str
    dosage_form: str
    indication: str
    classification: str


class PrescriptionItem(BaseModel):
    medication_name: str
    dosage: str
    frequency: List[str]
    duration: str

class PrescriptionRecord(BaseModel):
    user: str
    title: str
    details: Optional[str]
    prescriptions: List[PrescriptionItem]

class PrescriptionRetrieveRecord(BaseModel):
    user: str
    title: str
    details: Optional[str]
    prescriptions: List[PrescriptionItem]
    created_at: datetime = Field(default_factory=datetime.utcnow)

users_db = {}

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

    return {"message": "Login successful", "user": user_data}

# Face Detction
@app.post("/face-detection/upload")
async def upload_face(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    return {"info": "File uploaded successfully"}

@app.post("/face-detection/recognize")
async def recognize_face(user: FaceID):
    name = user.username
    face_rec = FaceRecognition()
    detected = face_rec.run_recognition(name)  
    print(detected)
    return {"detected": detected}
    # if detected:
    #     return JSONResponse(status_code=200, content={"message": "Face recognized"})
    # else:
    #     raise HTTPException(status_code=404, detail="Face not recognized")

def predict_drug_strength(drug_name, category, dosage_form, indication, classification):
    # Create a dictionary for the input
    input_data = {
        'Name': drug_name,
        'Category': category,
        'Dosage Form': dosage_form,
        'Indication': indication,
        'Classification': classification
    }

    # Encode the input data using the label encoders
    for col in input_data:
        if col in label_encoders:
            input_data[col] = label_encoders[col].transform([input_data[col]])[0]

    # Convert the input into a DataFrame to match the model's expected input format
    input_df = pd.DataFrame([input_data])

    # Predict the strength using the loaded Decision Tree model
    predicted_strength = decision_tree_model_for_dosage.predict(input_df)[0]

    return predicted_strength

@app.post("/medicine-suggetion-dosage")
async def get_dosage(user: Drug):
    # Call the prediction function with the input from the client
    prediction = predict_drug_strength(
        drug_name=user.drug_name,
        category=user.category,
        dosage_form=user.dosage_form,
        indication=user.indication,
        classification=user.classification
    )
    
    return {"message": "Prediction successful", "dosage": prediction}


@app.post("/start-exercise")
async def start_exercise():
    exe_launch("squat")
    return JSONResponse(content={"message": "Exercise started!"})


# Drug Addherence 
@app.post("/prescription/create")
async def create_prescription(record: PrescriptionRecord):
    prescription_ref = db.collection("prescriptions").document()
    prescription_data = record.dict()
    prescription_data["created_at"] = firestore.SERVER_TIMESTAMP
    prescription_ref.set(prescription_data)
    return {"message": "Prescription record created successfully", "record_id": prescription_ref.id}

@app.get("/prescription/{user}")
async def get_prescriptions_by_user(user: str):
    try:
        # Query the prescriptions collection for the given user
        prescriptions = db.collection("prescriptions").where("user", "==", user).stream()

        # Add the document ID to each prescription dictionary
        prescription_list = [
            {**doc.to_dict(), "id": doc.id} for doc in prescriptions
        ]

        # Return the result
        return {"message": "Prescriptions retrieved successfully", "prescriptions": prescription_list}

    except Exception as e:
        # Handle any errors during the process
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/prescription/update/{record_id}")
async def update_prescription(record_id: str, record: PrescriptionRetrieveRecord):
    prescription_ref = db.collection("prescriptions").document(record_id)
    if not prescription_ref.get().exists:
        raise HTTPException(status_code=404, detail="Prescription record not found")

    prescription_data = record.dict()
    prescription_ref.update(prescription_data)
    return {"message": "Prescription record updated successfully"}