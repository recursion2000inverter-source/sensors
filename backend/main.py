import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.abspath(
    os.path.join(BASE_DIR, "..", "frontend", "dist")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sensor store (safe default)
sensor_records = []

# --------------------
# API ENDPOINTS
# --------------------

@app.get("/health")
def health():
    return {"status": "online"}

@app.get("/api/latest")
def latest():
    if not sensor_records:
        return {"data": None}
    return sensor_records[-1]

@app.post("/api/sensordata")
def receive_data(payload: dict):
    payload["received_at"] = datetime.utcnow().isoformat()
    sensor_records.append(payload)
    return {"status": "ok"}

# --------------------
# FRONTEND SERVING
# --------------------

assets_path = os.path.join(FRONTEND_DIST, "assets")
if os.path.isdir(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/")
def serve_frontend():
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {
        "message": "Backend running. Frontend not built.",
        "hint": "Run npm run build in frontend."
    }
