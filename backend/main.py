from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from datetime import datetime, timedelta
import json

app = FastAPI()

# Paths
BASE_DIR = Path(__file__).parent
DATA_FOLDER = BASE_DIR / "data"
DATA_FOLDER.mkdir(exist_ok=True)
FRONTEND_DIST = BASE_DIR / "dist"

# Serve frontend assets
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

# Save device data
def save_device_data(device_id, room, temperature, humidity, pressure):
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

# Cleanup old data (14 days)
def cleanup_old_data():
    now = datetime.utcnow()
    for file in DATA_FOLDER.glob("*.json"):
        try:
            with open(file, "r") as f:
                data_json = json.load(f)

            data_json["data"] = [
                d for d in data_json.get("data", [])
                if datetime.fromisoformat(d["timestamp"]) >= now - timedelta(days=14)
            ]

            with open(file, "w") as f:
                json.dump(data_json, f, indent=2)
        except:
            continue

# Receive ESP data
@app.post("/api/update")
async def update_device(request: Request):
    try:
        data = await request.json()
        save_device_data(
            int(data["device_id"]),
            str(data["room"]),
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["pressure"])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data format: {e}")

    cleanup_old_data()
    return {"status": "success"}

# Return latest data (✅ corrected format)
@app.get("/api/latest")
async def latest():
    devices = []
    for file in DATA_FOLDER.glob("*.json"):
        try:
            with open(file) as f:
                data_json = json.load(f)

            if not data_json.get("data"):
                continue

            last = data_json["data"][-1]

            devices.append({
                "device_id": data_json["device_id"],
                "room": data_json["room"],
                "temperature": last["temperature"],
                "humidity": last["humidity"],
                "pressure": last["pressure"],
                "timestamp": last["timestamp"]
            })
        except:
            continue

    return devices

# Serve frontend
@app.get("/")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Frontend not built."}
