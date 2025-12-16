import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# --------------------------------------------------
# PATHS
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FRONTEND_DIST = os.path.join(BASE_DIR, "../frontend/dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------------------------------
# APP
# --------------------------------------------------
app = FastAPI(title="Room Sensor Dashboard")

# --------------------------------------------------
# MODELS
# --------------------------------------------------
class SensorData(BaseModel):
    id: str
    room: str
    temp: float
    hum: float
    pres: float

# --------------------------------------------------
# API ENDPOINTS
# --------------------------------------------------
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

    history = []

    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                loaded = json.load(f)
                if isinstance(loaded, list):
                    history = loaded
        except Exception:
            history = []

    history.append(record)

    cutoff = datetime.utcnow() - timedelta(days=14)
    history = [
        r for r in history
        if datetime.fromisoformat(r["timestamp"]) > cutoff
    ]

    with open(file_path, "w") as f:
        json.dump(history, f)

    return {"status": "ok"}

@app.get("/api/latest")
def latest():
    sensors = []

    for fname in os.listdir(DATA_DIR):
        if not fname.endswith(".json"):
            continue

        file_path = os.path.join(DATA_DIR, fname)

        try:
            with open(file_path, "r") as f:
                records = json.load(f)
        except Exception:
            continue

        # IMPORTANT: ensure records is a non-empty list
        if not isinstance(records, list) or len(records) == 0:
            continue

        last = records[-1]

        sensors.append({
            "device_id": fname.replace(".json", ""),
            "room": last.get("room", "Unknown"),
            "temperature": last.get("temperature"),
            "humidity": last.get("humidity"),
            "pressure": last.get("pressure"),
            "timestamp": last.get("timestamp")
        })

    sensors.sort(key=lambda x: x["room"])
    return sensors

@app.get("/api/health")
def health():
    return {"status": "online"}

# --------------------------------------------------
# FRONTEND (SAFE STATIC SERVE)
# --------------------------------------------------
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/")
def serve_frontend():
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return JSONResponse(
        content={
            "message": "Backend running. Frontend not built.",
            "hint": "Run npm run build in frontend."
        }
    )
