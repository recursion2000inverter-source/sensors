from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Path to the frontend dist folder inside backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")

# Serve static assets (JS/CSS/images)
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# Serve index.html at root
@app.get("/")
async def root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Serve API endpoint for sensor data
@app.get("/api/latest")
async def latest():
    # Example dummy data
    return [
        {"room": "Living Room", "sensor": "Temperature", "value": 25, "last_updated": "2025-12-17 18:00:00"},
        {"room": "Kitchen", "sensor": "Humidity", "value": 60, "last_updated": "2025-12-17 18:05:00"}
    ]

# Optional: catch-all to support frontend routing (React Router)
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
