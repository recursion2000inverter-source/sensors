from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import json
import os

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
DATA_DIR = "data"
STATIC_DIR = "frontend/dist"  # Path to your React build

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# Sensor Data model
class SensorData(BaseModel):
    id: str
    room: str
    temp: float
    hum: float
    pres: float

# ---- API ENDPOINTS ----

@app.get("/api/health")
def health():
    return JSONResponse({"status": "online"})

@app.post("/api/sensordata")
def receive_data(data: SensorData):
    file_path = f"{DATA_DIR}/{data.id}.json"

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "room": data.room,
        "temperature": data.temp,
        "humidity": data.hum,
        "pressure": data.pres,
    }

    history = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            history = json.load(f)

    history.append(record)

    # Keep only last 14 days
    cutoff = datetime.utcnow() - timedelta(days=14)
    history = [r for r in history if datetime.fromisoformat(r["timestamp"]) > cutoff]

    with open(file_path, "w") as f:
        json.dump(history, f)

    return {"status": "ok"}

@app.get("/api/latest")
def latest():
    output = []
    for fname in os.listdir(DATA_DIR):
        with open(f"{DATA_DIR}/{fname}") as f:
            records = json.load(f)
            if records:
                last = records[-1]
                output.append({
                    "device_id": fname.replace(".json", ""),
                    "room": last["room"],
                    "temperature": last["temperature"],
                    "humidity": last["humidity"],
                    "pressure": last["pressure"],
                    "timestamp": last["timestamp"],
                })
    return output

# ---- Serve React Frontend ----
app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

@app.get("/")
def frontend():
    return FileResponse(f"{STATIC_DIR}/index.html")
