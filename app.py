"""
Enhanced backend_app.py with CORS support and static file serving
"""

from __future__ import annotations
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# Enable CORS for all domains and routes
CORS(app)

# Alternative: Enable CORS for specific domain only
# CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:5500'])

# Global DataFrame
df: pd.DataFrame | None = None

# Create static folder if it doesn't exist
if not os.path.exists('static'):
    os.makedirs('static')

# ---------------------------------------------------------------------------
# SERVE STATIC FILES (HTML, CSS, JS)
# ---------------------------------------------------------------------------

@app.route('/')
def serve_frontend():
    """Serve the main HTML file"""
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def serve_static_files(filename):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory('static', filename)

# ---------------------------------------------------------------------------
# EXISTING API ROUTES WITH CORS HEADERS
# ---------------------------------------------------------------------------

def load_data_from_json(json_data: list[dict]):
    """Convert Tuya‑style JSON into DataFrame and pre‑compute helper columns."""
    global df
    rows = []
    for item in json_data:
        res = item.get("result", {})
        ts_iso = res.get("update_time")
        try:
            ts = datetime.strptime(ts_iso, "%Y-%m-%dT%H:%M:%SZ")
        except (ValueError, TypeError):
            continue
        rows.append({
            "timestamp": ts,
            "device": res.get("device_name", "device"),
            "power": res.get("power", 0.0),
            "voltage": res.get("voltage", 0.0),
            "current": res.get("current", 0.0),
            "energy_kwh": res.get("electricity", 0.0)
        })
    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("No valid rows in payload")
    df["hour"] = df["timestamp"].dt.hour
    df["date"] = df["timestamp"].dt.date

# Tariff slabs (same as before)
SLABS_UPTO_500 = [
    (100, 0), (200, 2.35), (400, 4.7), (500, 6.3),
]

SLABS_ABOVE_500 = [
    (100, 0), (400, 4.7), (500, 6.3), (600, 8.4),
    (800, 9.45), (1000, 10.5), (float("inf"), 11.55)
]

def calculate_bill(units: float) -> dict:
    """Return slab‑wise calculation dict for the given units."""
    units_int = int(np.ceil(units))
    slabs = SLABS_UPTO_500 if units_int <= 500 else SLABS_ABOVE_500
    
    prev_limit = 0
    details = []
    total = 0.0
    remaining = units_int
    
    for upper, rate in slabs:
        slab_units = min(remaining, upper - prev_limit)
        if slab_units <= 0:
            prev_limit = upper
            continue
        cost = slab_units * rate
        details.append({
            "from": prev_limit + 1,
            "to": upper if upper != float("inf") else "Above",
            "units": slab_units,
            "rate": rate,
            "amount": round(cost, 2)
        })
        total += cost
        remaining -= slab_units
        prev_limit = upper
        if remaining <= 0:
            break
    
    return {"units": units_int, "total_amount": round(total, 2), "breakup": details}

def _period(hour: int) -> str:
    if 5 <= hour <= 10:
        return "morning"
    if 11 <= hour <= 16:
        return "afternoon"
    if 17 <= hour <= 21:
        return "evening"
    return "night"

def compute_peak_period() -> dict[str, float | dict]:
    if df is None:
        return {"error": "data_not_loaded"}
    tot = df.groupby(df["hour"].apply(_period))["energy_kwh"].sum()
    if tot.empty:
        return {"error": "no_energy_column"}
    return {
        "peak_period": tot.idxmax(),
        "period_kwh": tot.round(2).to_dict()
    }

def _train_regressor():
    daily = df.groupby("date")["energy_kwh"].sum().reset_index()
    daily["day_num"] = np.arange(len(daily))
    model = LinearRegression().fit(daily[["day_num"]], daily["energy_kwh"])
    return model, daily

# API Routes
@app.route("/api/upload", methods=["POST"])
def r_upload():
    try:
        payload = request.get_json(force=True)
        load_data_from_json(payload)
        return jsonify({"rows_loaded": len(df), "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 400

@app.route("/api/peak")
def r_peak():
    return jsonify(compute_peak_period())

@app.route("/api/bill")
def r_bill():
    units = request.args.get("units", type=float)
    if units is None:
        return jsonify({"error": "units query‑param missing"}), 400
    return jsonify(calculate_bill(units))

@app.route("/api/predict")
def r_predict():
    if df is None:
        return jsonify({"error": "data_not_loaded"}), 400
    model, daily = _train_regressor()
    last_day = daily["day_num"].max()
    future = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
    pred_kwh = float(model.predict(future).sum())
    bill = calculate_bill(pred_kwh)
    return jsonify({"predicted_kwh": round(pred_kwh, 2), "bill": bill})

@app.route("/api/suggestions")
def r_suggestions():
    if df is None or df.empty:
        return jsonify({"suggestions": ["Load data first"]})
    
    suggestions = []
    peak = compute_peak_period().get("peak_period")
    if peak == "evening":
        suggestions.append("Shift heavy loads away from the high-tariff evening period to save on peak energy rates.")
    if peak == "afternoon":
        suggestions.append("Shift heavy loads away from the high-tariff period to save on peak energy rates.")
    
    daily_tot = df.groupby("date")["energy_kwh"].sum()
    if not daily_tot.empty and daily_tot.max() / daily_tot.min() > 1.5:
        suggestions.append("Large day‑to‑day fluctuations detected; try balancing load across days.")
    
    if df["voltage"].mean() > 240:
        suggestions.append("Average voltage >240 V; a stabiliser can improve appliance efficiency.")
    
    if not suggestions:
        suggestions.append("Usage pattern looks stable; keep monitoring.")
    
    return jsonify({"suggestions": suggestions})

@app.route("/api/health")
def health_check():
    return jsonify({"status": "healthy", "data_loaded": df is not None})

if __name__ == "__main__":
    print("🚀 Smart Energy Tracker Backend Starting...")
    print("📊 Dashboard available at: http://localhost:5000")
    print("🔗 API endpoints available at: http://localhost:5000/api/")
    app.run(debug=True, port=5000, host='0.0.0.0')