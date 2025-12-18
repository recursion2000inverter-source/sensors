from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime, timedelta
import json
import os

app = FastAPI()

# Paths
BASE_DIR = Path(__file__).parent
DATA_FOLDER = BASE_DIR / "data"
DATA_FOLDER.mkdir(exist_ok=True)
FRONTEND_DIST = BASE_DIR / "dist"

# Serve frontend assets
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
else:
    print("dist folder not found! Copy your frontend build 'dist' into backend folder.")

# Helper: Save device data
def save_device_data(device_id: int, room: str, temperature: float, humidity: float, pressure: float):
    file_path = DATA_FOLDER / f"{device_id}.json"
    if file_path.exists():
        with open(file_path, "r") as f:
            try:
                data_json = json.load(f)
            except:
                data_json = {"device_id": device_id, "room": room, "data": []}
    else:
        data_json = {"device_id": device_id, "room": room, "data": []}

    data_json["room"] = room
    data_json["device_id"] = device_id
    data_json["data"].append({
        "timestamp": datetime.utcnow().isoformat(),
        "temperature": temperature,
        "humidity": humidity,
        "pressure": pressure
    })

    with open(file_path, "w") as f:
        json.dump(data_json, f, indent=2)

# Cleanup: Remove data older than 14 days
def cleanup_old_data():
    now = datetime.utcnow()
    for file in DATA_FOLDER.glob("*.json"):
        try:
            with open(file, "r") as f:
                data_json = json.load(f)
            filtered = [d for d in data_json.get("data", []) if datetime.fromisoformat(d["timestamp"]) >= now - timedelta(days=14)]
            data_json["data"] = filtered
            with open(file, "w") as f:
                json.dump(data_json, f, indent=2)
        except:
            continue

# Endpoint: Receive device data from ESPs
@app.post("/api/update")
async def update_device(request: Request):
    """
    Expected JSON:
    {
      "device_id": 6161,
      "room": "Proteomics Lab",
      "temperature": 30.18,
      "humidity": 60.2,
      "pressure": 1011.6
    }
    """
    try:
        data = await request.json()
        device_id = int(data["device_id"])
        room = str(data["room"])
        temperature = float(data["temperature"])
        humidity = float(data["humidity"])
        pressure = float(data["pressure"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data format: {e}")

    save_device_data(device_id, room, temperature, humidity, pressure)
    cleanup_old_data()
    return JSONResponse({"status": "success", "message": "Data saved."})

# Endpoint: Return latest data for all devices
@app.get("/api/latest")
async def latest():
    devices = []
    for file in DATA_FOLDER.glob("*.json"):
        try:
            with open(file) as f:
                data_json = json.load(f)
            if data_json.get("data"):
                last_entry = data_json["data"][-1]
                ts = datetime.fromisoformat(last_entry["timestamp"])
                online = datetime.utcnow() - ts <= timedelta(minutes=5)
                devices.append({
                    "device_id": data_json["device_id"],
                    "room": data_json["room"],
                    "temperature": last_entry["temperature"],
                    "humidity": last_entry["humidity"],
                    "pressure": last_entry["pressure"],
                    "timestamp": last_entry["timestamp"],
                    "online": online
                })
        except:
            continue
    return {"devices": devices}

# Serve frontend index.html for root and any unmatched route
@app.get("/")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({"message": "Frontend not built."}, status_code=404)
