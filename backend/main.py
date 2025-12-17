from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime, timedelta
import json
import asyncio

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR / "dist"

DATA_DIR.mkdir(exist_ok=True)

DATA_RETENTION_DAYS = 14

app = FastAPI(title="Environment Sensor Backend")

# --------------------------------------------------
# WEBSOCKET MANAGER
# --------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()

# --------------------------------------------------
# UTILITIES
# --------------------------------------------------
def cleanup_old_data():
    cutoff = datetime.utcnow() - timedelta(days=DATA_RETENTION_DAYS)

    for file in DATA_DIR.glob("*.json"):
        try:
            with open(file, "r") as f:
                content = json.load(f)

            filtered = [
                r for r in content.get("data", [])
                if datetime.fromisoformat(r["timestamp"]) >= cutoff
            ]

            content["data"] = filtered

            with open(file, "w") as f:
                json.dump(content, f, indent=2)

        except Exception:
            continue


def load_device_file(device_id: int):
    file_path = DATA_DIR / f"{device_id}.json"
    if not file_path.exists():
        return None
    with open(file_path, "r") as f:
        return json.load(f)


def save_device_file(device_id: int, payload: dict):
    file_path = DATA_DIR / f"{device_id}.json"
    with open(file_path, "w") as f:
        json.dump(payload, f, indent=2)


def get_latest_all_devices():
    results = []

    for file in DATA_DIR.glob("*.json"):
        try:
            with open(file, "r") as f:
                content = json.load(f)

            if not content["data"]:
                continue

            latest = content["data"][-1]

            results.append({
                "device_id": content["device_id"],
                "room": content["room"],
                "temperature": latest["temperature"],
                "humidity": latest["humidity"],
                "pressure": latest["pressure"],
                "timestamp": latest["timestamp"]
            })
        except Exception:
            continue

    return results

# --------------------------------------------------
# API ENDPOINTS
# --------------------------------------------------
@app.post("/api/ingest")
async def ingest_sensor_data(request: Request):
    payload = await request.json()

    device_id = payload["device_id"]
    room = payload["room"]

    reading = {
        "timestamp": datetime.utcnow().isoformat(),
        "temperature": payload["temperature"],
        "humidity": payload["humidity"],
        "pressure": payload["pressure"]
    }

    device_data = load_device_file(device_id)

    if not device_data:
        device_data = {
            "device_id": device_id,
            "room": room,
            "data": []
        }

    device_data["room"] = room
    device_data["data"].append(reading)

    save_device_file(device_id, device_data)
    cleanup_old_data()

    # Broadcast LIVE update
    live_payload = {
        "device_id": device_id,
        "room": room,
        **reading
    }

    await manager.broadcast(live_payload)

    return {"status": "ok"}


@app.get("/api/latest")
def api_latest():
    return get_latest_all_devices()


@app.get("/health")
def health():
    return {"status": "ok"}

# --------------------------------------------------
# WEBSOCKET ENDPOINT
# --------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    # Send initial snapshot
    await websocket.send_json({
        "type": "initial",
        "data": get_latest_all_devices()
    })

    try:
        while True:
            await asyncio.sleep(60)  # keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --------------------------------------------------
# FRONTEND SERVING
# --------------------------------------------------
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/")
    def serve_frontend():
        return FileResponse(FRONTEND_DIR / "index.html")
else:
    @app.get("/")
    def no_frontend():
        return JSONResponse(
            {
                "message": "Backend running. Frontend not built.",
                "hint": "Run npm run build and copy dist/ into backend."
            }
        )
