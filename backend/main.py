from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json

app = FastAPI(title="Sensor API")

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
DATA_FILE = BASE_DIR / "data.json"

# -------------------------
# Frontend (Vite build)
# -------------------------
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

# -------------------------
# Utilities
# -------------------------
def load_records():
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return [data]  # normalize single object to list
    except Exception:
        return []

# -------------------------
# API Routes
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/latest")
def latest():
    records = load_records()

    if not records:
        return JSONResponse(
            status_code=200,
            content={
                "message": "No sensor data available yet",
                "data": None
            }
        )

    return records[-1]

# -------------------------
# Frontend entry
# -------------------------
@app.get("/")
def index():
    if FRONTEND_DIST.exists():
        return FileResponse(FRONTEND_DIST / "index.html")

    return {
        "message": "Backend running. Frontend not built.",
        "hint": "Run npm run build in frontend."
    }
