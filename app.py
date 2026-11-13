import json
import os
import secrets
import re
import time
from datetime import date, datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request, send_from_directory


def load_local_env():
    """Load local secrets from .env without adding another package."""
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_file):
        return
    with open(env_file, encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key in {"SUPABASE_URL", "SUPABASE_SECRET_KEY", "OWNER_PIN"} and key not in os.environ:
                os.environ[key] = value.strip().strip('"').strip("'")


load_local_env()
app = Flask(__name__)


def nepal_today():
    """Today's date in Nepal (UTC+5:45). Vercel servers run in UTC, so a plain 'today' can be a day behind."""
    return datetime.now(timezone(timedelta(hours=5, minutes=45))).date()

VENUES = [
    {"id": "jnl-futsal", "name": "JNL Futsal", "area": "Swagatam Marg", "address": "F73P+H9H, Swagatam Marg, Biratnagar, Koshi Province 56613", "phone": "986-2170872", "price": 0, "hours": "7:00 AM–10:00 PM", "facilities": ["Hourly slots", "Open daily"]},
    {"id": "birat-sports-zone", "name": "Birat Sports Zone", "area": "Puspa Marg", "address": "Between DDC and Pushpalal Chowk, Puspa Marg, Biratnagar, Koshi Province 56613", "phone": "+977 9761024501", "price": 0, "hours": "7:00 AM–10:00 PM", "facilities": ["Hourly slots", "Open daily"]},
    {"id": "sayash-futsal", "name": "Sayash Futsal", "area": "Airport side", "address": "Near the airport side, Biratnagar, Koshi Province", "phone": "9742838499", "price": 0, "hours": "7:00 AM–10:00 PM", "facilities": ["5-a-side", "Local tournaments", "Open daily"]},
    {"id": "sports-hub", "name": "The Sports Hub", "area": "Sanihat", "address": "Shiva Mandir, Sanihat, Gopi Nath Marg (Opposite Birateshwor), Biratnagar", "phone": "981-5384999", "price": 0, "hours": "7:00 AM–10:00 PM", "facilities": ["Hourly slots", "Open daily"]},
    {"id": "hit-and-hangout", "name": "Hit and Hangout Futsal", "area": "Krishi Marg", "address": "F77F+2QH, Krishi Marg, Biratnagar, Koshi Province 56613", "phone": "+977 985-2032240", "price": 0, "hours": "7:00 AM–10:00 PM", "facilities": ["Hourly slots", "Open daily"]},
]
VENUE_BY_ID = {venue["id"]: venue for venue in VENUES}
SLOTS = [{"start": f"{hour:02d}:00", "end": f"{hour + 1:02d}:00"} for hour in range(7, 22)]


def supabase_request(method, path, body=None, extra_headers=None):
    """Make a server-side request. The service key never reaches the browser."""
    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    # The current Supabase secret key stays on this Flask server only.
    # The legacy variable name is accepted temporarily for older projects.
    service_key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not service_key:
        raise RuntimeError("Database is not configured. Add Supabase environment variables.")

    headers = {
        "apikey": service_key,
        "Content-Type": "application/json",
    }
    # Legacy service_role keys are JWTs and still require Authorization.
    if service_key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {service_key}"
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    # Reads are safe to retry if the network hiccups. Writes are tried once, so a booking is never saved twice.
    attempts = 3 if method == "GET" else 1
    last_error = None
    for attempt in range(attempts):
        req = Request(f"{base_url}/rest/v1/{path}", data=data, headers=headers, method=method)
        try:
            with urlopen(req, timeout=12) as response:
                raw = response.read().decode("utf-8")
                try:
                    return response.status, json.loads(raw) if raw else None
                except json.JSONDecodeError:
                    return 502, {"message": "Supabase returned an unexpected response."}
        except HTTPError as error:
            raw = error.read().decode("utf-8")
            try:
                detail = json.loads(raw)
            except json.JSONDecodeError:
                detail = {"message": raw or "Database request failed"}
            return error.code, detail
        except URLError as error:
            last_error = error
            if attempt < attempts - 1:
                time.sleep(0.4 * (attempt + 1))
    return 502, {"message": f"Could not reach Supabase: {last_error.reason}"}


def owner_allowed():
    configured_pin = os.environ.get("OWNER_PIN", "")
    supplied_pin = request.headers.get("X-Owner-Pin", "")
    return bool(configured_pin) and secrets.compare_digest(configured_pin, supplied_pin)


@app.get("/")
def home():
    return send_from_directory(app.root_path, "index.html")


@app.get("/api/venues")
def venues():
    return jsonify({"venues": VENUES, "slots": SLOTS, "today": nepal_today().isoformat()})


@app.get("/style.css")
def styles():
    return send_from_directory(app.root_path, "style.css")


@app.get("/script.js")
def script():
    return send_from_directory(app.root_path, "script.js")


@app.get("/api/bookings")
def public_bookings():
    booking_date = request.args.get("date", nepal_today().isoformat())
    venue_id = request.args.get("venue_id", "")
    if venue_id and venue_id not in VENUE_BY_ID:
        return jsonify({"error": "Choose a valid futsal."}), 400
    filters = {"select": "venue_id,booking_date,start_time", "booking_date": f"eq.{booking_date}", "status": "in.(confirmed,held)"}
    if venue_id:  # no venue_id = all futsals for that date, in ONE database call
        filters["venue_id"] = f"eq.{venue_id}"
    query = urlencode(filters)
    try:
        status, data = supabase_request("GET", f"bookings?{query}")
    except RuntimeError as error:
        # Never pretend every slot is free when the database is not connected.
        return jsonify({"error": str(error)}), 503
    if status >= 400:
        message = data.get("message") if isinstance(data, dict) else None
        return jsonify({"error": message or "Could not load bookings."}), 502
    return jsonify(data)


@app.post("/api/bookings")
def create_booking():
    payload = request.get_json(silent=True) or {}
    venue = VENUE_BY_ID.get(payload.get("venue_id", ""))
    booking_date = str(payload.get("booking_date", ""))
    start_time = str(payload.get("start_time", ""))
    full_name = str(payload.get("full_name", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    valid_starts = {slot["start"]: slot["end"] for slot in SLOTS}

    if not venue or len(full_name) < 2 or start_time not in valid_starts:
        return jsonify({"error": "Please complete the booking form."}), 400
    phone_digits = re.sub(r"\D", "", phone)
    if len(phone_digits) < 10 or len(phone_digits) > 13:
        return jsonify({"error": "Enter a valid phone number."}), 400
    try:
        requested_date = date.fromisoformat(booking_date)
    except ValueError:
        return jsonify({"error": "Choose a valid booking date."}), 400
    if requested_date < nepal_today():
        return jsonify({"error": "Bookings cannot be made for a past date."}), 400

    record = {
        "booking_code": f"BNR-{secrets.token_hex(3).upper()}",
        "full_name": full_name[:80],
        "phone": phone[:30],
        "venue_id": venue["id"],
        "venue_name": venue["name"],
        "booking_date": booking_date,
        "start_time": start_time,
        "end_time": valid_starts[start_time],
        "amount": venue["price"],
        "status": "confirmed",
    }
    try:
        status, data = supabase_request("POST", "bookings", record, {"Prefer": "return=representation"})
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 503
    if status in (409,):
        return jsonify({"error": "That slot was just booked. Please choose another time."}), 409
    if status >= 400:
        return jsonify({"error": "Booking could not be saved. Please try again."}), 502
    return jsonify({"booking": data[0] if data else record}), 201


@app.get("/api/owner/bookings")
def owner_bookings():
    if not owner_allowed():
        return jsonify({"error": "Owner PIN required."}), 401
    query = urlencode({"select": "booking_code,full_name,phone,venue_name,booking_date,start_time,end_time,status,created_at", "order": "booking_date.asc,start_time.asc"})
    try:
        status, data = supabase_request("GET", f"bookings?{query}")
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 503
    if status >= 400:
        return jsonify({"error": "Could not load owner bookings."}), 502
    return jsonify(data)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
