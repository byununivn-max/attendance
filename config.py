import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "dbname":   os.getenv("DB_NAME", "attendance"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# Legacy single-device config (kept for backward compatibility)
DEVICES = [
    {
        "name":     os.getenv("DEVICE_NAME", "Main Entrance"),
        "ip":       os.getenv("DEVICE_IP", "192.168.0.54"),
        "username": os.getenv("DEVICE_USERNAME", "admin"),
        "password": os.getenv("DEVICE_PASSWORD", ""),
    }
]

# Shared credentials used when loading devices from DB
DEVICE_USERNAME = os.getenv("DEVICE_USERNAME", "admin")
DEVICE_PASSWORD = os.getenv("DEVICE_PASSWORD", "")

TIMEZONE = os.getenv("TZ", "Asia/Ho_Chi_Minh")
MAX_RESULTS_PER_PAGE = 100
REQUEST_TIMEOUT = 30
SLEEP_BETWEEN_PAGES = 0.5
