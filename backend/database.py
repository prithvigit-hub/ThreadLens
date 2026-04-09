import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

MONGODB_URI = os.environ.get("MONGODB_URI", "")

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is not None:
        return _db
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI environment variable is not set")
    _client = MongoClient(MONGODB_URI)
    _db = _client["llm_forensic"]
    _db["logs"].create_index([("timestamp", -1)])
    _db["alerts"].create_index([("timestamp", -1)])
    _db["sessions"].create_index([("created_at", -1)])
    return _db

def ping_db():
    try:
        db = get_db()
        db.command("ping")
        return True
    except Exception:
        return False
