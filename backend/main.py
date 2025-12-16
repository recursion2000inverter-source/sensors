import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ---------- CONFIG ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATIC_DIR = os.path.join(BASE_DIR, "../frontend/dist")  # Vite build folder
os.makedirs(DATA_DIR, exist_ok=True)

# ---------- FastAPI APP ----------
app = FastAPI(title="Room Sensor Dashboard")

# ---------- MODELS ----------
class SensorData(BaseModel):
    id: str
    room: str
    temp: float
    hum: float
    pres: float
    timestamp: str = None  # optional, will be generated if not provided

# ---------- API ROUTES ----------
@app.post("/api/sensordata")
def receive_data(data: SensorData):
    file_path = os.path.join(DATA_DIR, f"{data.id}.json")
    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "room": data.room,
        "temperature": data.temp,
        "humidity": data.hum,
        "pressure": data.pres,
    }

    # Load previous records if exist
    history = []
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            history = json.load(f)

    history.append(record)

    # Keep only last 14 days
    cutoff = datetime.utcnow() - timedelta(days=14)
    history = [r for r in history if datetime.fromisoformat(r["timestamp"]) > cutoff]

    # Save back
    with open(file_path, "w") as f:
        json.dump(history, f)

    return {"status": "ok"}


@app.get("/api/latest")
def latest():
    output = []
    for fname in os.listdir(DATA_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(DATA_DIR, fname)) as f:
                records = json.load(f)
                if records:
                    last = records[-1]
                    output.append({
                        "device_id": fname.replace(".json", ""),
                        "room": last["room"],
                        "temperature": last["temperature"],
                        "humidity": last["humidity"],
                        "pressure": last["pressure"],
                        "timestamp": last["timestamp"]
                    })
    # Sort by room name
    output.sort(key=lambda x: x["room"])
    return output

# ---------- STATIC FILES ----------
app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

@app.get("/")
def frontend():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend not built. Run `npm run build` in frontend folder."}
