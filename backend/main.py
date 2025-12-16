import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---------------- CONFIG ----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
FRONTEND_DIST = os.path.join(BASE_DIR, "..", "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

os.makedirs(DATA_DIR, exist_ok=True)

app = FastAPI(title="Room Sensor Backend")

# ---------------- MODELS ----------------

class SensorData(BaseModel):
    id: str
    room: str
    temp: float
    hum: float
    pres: float

# ---------------- HEALTH ----------------

@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# ---------------- SENSOR INGEST ----------------

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
                history = json.load(f)
                if not isinstance(history, list):
                    history = []
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

# ---------------- LATEST DATA ----------------

@app.get("/api/latest")
def latest():
    output = []

    for fname in os.listdir(DATA_DIR):
        path = os.path.join(DATA_DIR, fname)
        if not fname.endswith(".json"):
            continue

        try:
            with open(path, "r") as f:
                records = json.load(f)
                if not records:
                    continue
                last = records[-1]
        except Exception:
            continue

        output.append({
            "device_id": fname.replace(".json", ""),
            "room": last.get("room"),
            "temperature": last.get("temperature"),
            "humidity": last.get("humidity"),
            "pressure": last.get("pressure"),
            "last_updated": last.get("timestamp")
        })

    return output

# ---------------- FRONTEND SERVING ----------------

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/")
def frontend():
    index_path = os.path.join(FRONTEND_DIST, "index.html")

    if os.path.isfile(index_path):
        return FileResponse(index_path)

    return JSONResponse(
        {
            "message": "Backend running. Frontend not built.",
            "hint": "Run npm run build in frontend."
        }
    )
