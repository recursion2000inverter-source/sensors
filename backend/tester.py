from pathlib import Path
DATA_DIR = Path("data")
print(list(DATA_DIR.glob("*.json")))