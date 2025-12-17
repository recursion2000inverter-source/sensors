from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json

app = FastAPI()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR / "dist"

# Serve frontend
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")
@app.get("/")
async def root():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({"message": "Frontend not built."}, status_code=404)

# API endpoint to return latest readings per device
@app.get("/api/latest")
async def latest():
    result = []
    json_files = list(DATA_DIR.glob("*.json"))
    
    if not json_files:
        return JSONResponse({"message": "No sensor data found."}, status_code=404)
    
    for file_path in json_files:
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
            
            readings = data.get("data", [])
            if not readings:
                continue  # skip devices with no readings
            
            last = readings[-1]
            result.append({
                "device_id": data.get("device_id"),
                "room": data.get("room"),
                "timestamp": last.get("timestamp"),
                "temperature": last.get("temperature"),
                "humidity": last.get("humidity"),
                "pressure": last.get("pressure")
            })
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    if not result:
        return JSONResponse({"message": "No valid readings available."}, status_code=404)
    
    return JSONResponse(result)
