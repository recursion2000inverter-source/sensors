from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta
import json
import asyncio

# --------------------------------------------------
# App setup
# --------------------------------------------------
app = FastAPI()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

DATA_DIR.mkdir(exist_ok=True)

# --------------------------------------------------
# Serve frontend (Option 1)
# --------------------------------------------------
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/")
    def serve_frontend():
        return FileResponse(FRONTEND_DIR / "index.html")
else:
    @app.get("/")
    def fallback():
        return {
            "message": "Backend running. Frontend not built.",
            "hint": "Run npm run build in frontend and copy dist/"
        }

# --------------------------------------------------
# WebSocket manager
# --------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for ws in self.active_connections:
            await ws.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

# --------------------------------------------------
# Incoming sensor payload
# --------------------------------------------------
class SensorPayload(BaseModel):
    device_id: int
    room: str
    temperature: float
    humidity: float
    pressure: float

# --------------------------------------------------
# Save sensor data
# --------------------------------------------------
@app.post("/api/sensordata")
async def receive_sensor_data(payload: SensorPayload):
    file_path = DATA_DIR / f"{payload.device_id}.json"
    now = datetime.utcnow()

    entry = {
        "timestamp": now.isoformat(),
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "pressure": payload.pressure
    }

    if file_path.exists():
        with open(file_path, "r") as f:
            content = json.load(f)
    else:
        content = {
            "device_id": payload.device_id,
            "room": payload.room,
            "last_seen": None,
            "data": []
        }

    content["room"] = payload.room
    content["last_seen"] = now.isoformat()
    content["data"].append(entry)

    with open(file_path, "w") as f:
        json.dump(content, f, indent=2)

    # Broadcast live update
    await manager.broadcast({
        "device_id": payload.device_id,
        "room": payload.room,
        "latest": entry,
        "last_seen": content["last_seen"],
        "status": "online"
    })

    return {"status": "ok"}

# --------------------------------------------------
# Get latest data for all devices
# --------------------------------------------------
@app.get("/api/latest")
def get_latest_data():
    results = []
    now = datetime.utcnow()

    for file in DATA_DIR.glob("*.json"):
        with open(file, "r") as f:
            content = json.load(f)

        if not content.get("data"):
            continue

        latest = content["data"][-1]
        last_seen = datetime.fromisoformat(content["last_seen"])

        status = "online" if now - last_seen < timedelta(minutes=5) else "offline"

        results.append({
            "device_id": content["device_id"],
            "room": content["room"],
            "temperature": latest["temperature"],
            "humidity": latest["humidity"],
            "pressure": latest["pressure"],
            "timestamp": latest["timestamp"],
            "status": status
        })

    return results

# --------------------------------------------------
# 14-day cleanup task
# --------------------------------------------------
async def cleanup_task():
    while True:
        cutoff = datetime.utcnow() - timedelta(days=14)

        for file in DATA_DIR.glob("*.json"):
            with open(file, "r") as f:
                content = json.load(f)

            original_len = len(content["data"])
            content["data"] = [
                d for d in content["data"]
                if datetime.fromisoformat(d["timestamp"]) >= cutoff
            ]

            if len(content["data"]) != original_len:
                with open(file, "w") as f:
                    json.dump(content, f, indent=2)

        await asyncio.sleep(24 * 3600)  # run daily

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_task())
