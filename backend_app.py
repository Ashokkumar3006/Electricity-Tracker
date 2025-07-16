"""Enhanced backend_app.py with device-specific monitoring and AI suggestions"""
from __future__ import annotations
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import os
import random
import json # Import json module for direct dumping

app = Flask(__name__)
CORS(app)

# Global DataFrame
df: pd.DataFrame | None = None

# Create static folder if it doesn't exist
if not os.path.exists('static'):
  os.makedirs('static')

# Device categories and their typical power ranges
DEVICE_CATEGORIES = {
  'AC': {'min_power': 150, 'max_power': 2000, 'efficiency_range': (70, 90)},
  'Fridge': {'min_power': 80, 'max_power': 300, 'efficiency_range': (80, 95)},
  'Television': {'min_power': 50, 'max_power': 200, 'efficiency_range': (85, 95)},
  'Washing Machine': {'min_power': 300, 'max_power': 800, 'efficiency_range': (75, 90)},
  'Light': {'min_power': 5, 'max_power': 60, 'efficiency_range': (90, 98)},
  'Fan': {'min_power': 30, 'max_power': 100, 'efficiency_range': (85, 95)}
}

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
# DATA PROCESSING FUNCTIONS
# ---------------------------------------------------------------------------
def load_data_from_json(json_data: list[dict]):
  """Convert JSON data into DataFrame with device categorization."""
  global df
  rows = []
  
  print(f"DEBUG: load_data_from_json received {len(json_data)} items.") # DEBUG
  
  for item in json_data:
      # Handle the specific format with "result" key
      if "result" in item and item.get("success", False):
          res = item["result"]
          device_name = res.get("device_name", "Unknown")
          power = float(res.get("power", 0.0))
          voltage = float(res.get("voltage", 0.0))
          current = float(res.get("current", 0.0))
          electricity = float(res.get("electricity", 0.0))
          # Explicitly cast to Python bool here
          switch_status = bool(res.get("switch", False)) 
          ts_iso = res.get("update_time")
          
          try:
              if ts_iso:
                  ts = datetime.strptime(ts_iso, "%Y-%m-%dT%H:%M:%SZ")
              else:
                  ts = datetime.now()
          except (ValueError, TypeError):
              ts = datetime.now()
          
          rows.append({
              "timestamp": ts,
              "device_name": device_name,
              "power": power,
              "voltage": voltage,
              "current": current,
              "electricity": electricity,
              "switch_status": switch_status # This should now be a native Python bool
          })
  
  if not rows:
      print("DEBUG: No valid rows extracted from payload.") # DEBUG
      raise ValueError("No valid rows in payload")
  
  df = pd.DataFrame(rows)
  df["hour"] = df["timestamp"].dt.hour
  df["date"] = df["timestamp"].dt.date
  print(f"DEBUG: DataFrame loaded with {len(df)} rows. First 5 rows:\n{df.head()}") # DEBUG
  return df

def generate_device_data() -> dict:
  """Generate device-specific data and analysis."""
  if df is None or df.empty:
      return {}
  
  device_data = {}
  unique_devices = df['device_name'].unique()
  
  for device_name in unique_devices:
      device_df = df[df['device_name'] == device_name]
      
      if not device_df.empty:
          # Get latest reading
          latest_reading = device_df.iloc[-1]
          current_power = float(latest_reading['power'])
          print(f"DEBUG: Type of switch_status in DataFrame for {device_name} (before assignment): {type(latest_reading['switch_status'])}") # NEW DEBUG
          is_active = bool(latest_reading['switch_status']) # Should already be Python bool
          
          # Calculate totals
          total_energy = float(device_df['electricity'].sum())
          peak_usage = float(device_df['power'].max())
          avg_power = float(device_df['power'].mean())
          
          # Calculate efficiency based on usage patterns
          efficiency = calculate_device_efficiency(device_df, device_name)
          
          # Generate suggestions
          suggestions = generate_device_suggestions(device_name, current_power, efficiency, is_active)
          
          # Get hourly usage pattern
          hourly_usage = {int(k): float(v) for k, v in device_df.groupby('hour')['power'].mean().to_dict().items()} # Ensure int keys, float values
          
          device_data[device_name] = {
              'currentPower': current_power,
              'totalEnergy': total_energy,
              'peakUsage': peak_usage,
              'averagePower': avg_power,
              'isActive': is_active, # Reflect real device status
              'efficiency': efficiency,
              'suggestions': suggestions,
              'hourlyUsage': hourly_usage,
              'dataPoints': len(device_df)
          }
  
  return device_data

def calculate_device_efficiency(device_df: pd.DataFrame, device_name: str) -> float:
  """Calculate device efficiency based on usage patterns."""
  if device_df.empty:
      return 85.0
  
  # Calculate efficiency based on power consistency and switch usage
  power_values = device_df['power'].values
  switch_on_time = device_df['switch_status'].sum() / len(device_df)
  
  # Power efficiency (consistency when on)
  on_power_values = device_df[device_df['switch_status'] == True]['power']
  if len(on_power_values) > 1:
      power_std = on_power_values.std()
      power_mean = on_power_values.mean()
      power_consistency = max(0, 100 - (power_std / power_mean * 100)) if power_mean > 0 else 0
  else:
      power_consistency = 85
  
  # Base efficiency from device category
  device_info = DEVICE_CATEGORIES.get(device_name, {'efficiency_range': (80, 90)})
  base_efficiency = sum(device_info['efficiency_range']) / 2
  
  # Combine factors
  efficiency = (power_consistency * 0.4) + (base_efficiency * 0.6)
  
  return min(max(efficiency, 60), 98)

def generate_device_suggestions(device_name: str, current_power: float, efficiency: float, is_active: bool) -> list[str]:
  """Generate AI-powered suggestions for specific devices."""
  suggestions = []
  
  device_tips = {
      'AC': [
          "Set temperature to 24°C for optimal energy efficiency",
          "Use timer function to avoid unnecessary cooling",
          "Clean air filters monthly to maintain efficiency",
          "Use ceiling fans to circulate air and reduce AC load"
      ],
      'Fridge': [
          "Maintain temperature between 3-4°C for optimal efficiency",
          "Avoid overloading the refrigerator compartments",
          "Check and clean door seals regularly",
          "Allow hot food to cool before placing inside"
      ],
      'Television': [
          "Enable power-saving mode in display settings",
          "Adjust brightness according to room lighting",
          "Turn off completely instead of keeping on standby",
          "Use sleep timer to prevent overnight consumption"
      ],
      'Washing Machine': [
          "Use cold water for regular washing to save energy",
          "Run full loads to maximize efficiency",
          "Clean lint filters regularly",
          "Use eco-mode for normal washing cycles"
      ],
      'Light': [
          "Switch to LED bulbs for better efficiency",
          "Use natural light during daytime hours",
          "Install motion sensors for automatic control",
          "Use dimmer switches to adjust brightness"
      ],
      'Fan': [
          "Clean fan blades monthly for optimal airflow",
          "Use appropriate speed settings for comfort",
          "Turn off when room is unoccupied",
          "Use with AC to reduce cooling load"
      ]
  }
  
  # Add efficiency-based suggestions
  if efficiency < 70:
      suggestions.append(f"Low efficiency detected ({efficiency:.1f}%). Consider maintenance or replacement.")
  elif efficiency < 85:
      suggestions.append(f"Efficiency can be improved ({efficiency:.1f}%). Follow maintenance guidelines.")
  
  # Add power-based suggestions
  if not is_active and current_power > 5:
      suggestions.append("Device is consuming standby power. Consider unplugging when not in use.")
  
  # Get base suggestions for the device
  base_suggestions = device_tips.get(device_name, [
      "Monitor usage patterns regularly",
      "Use energy-efficient settings when available",
      "Perform regular maintenance"
  ])
  
  # Combine and return selection
  all_suggestions = suggestions + base_suggestions
  return all_suggestions[:3]  # Return top 3 suggestions

# Tariff slabs
SLABS_UPTO_500 = [
  (100, 0), (200, 2.35), (400, 4.7), (500, 6.3),
]

SLABS_ABOVE_500 = [
  (100, 0), (400, 4.7), (500, 6.3), (600, 8.4),
  (800, 9.45), (1000, 10.5), (float("inf"), 11.55)
]

def calculate_bill(units: float) -> dict:
  """Return slab-wise calculation dict for the given units."""
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
  
  tot = df.groupby(df["hour"].apply(_period))["electricity"].sum()
  if tot.empty:
      return {"error": "no_energy_column"}
  
  return {
      "peak_period": tot.idxmax(),
      "period_kwh": tot.round(2).to_dict()
  }

def _train_regressor(data_frame: pd.DataFrame):
  """Trains a linear regression model for energy prediction."""
  if data_frame.empty:
      return None, None

  # Ensure 'timestamp' is datetime and 'electricity' is numeric
  data_frame['timestamp'] = pd.to_datetime(data_frame['timestamp'])
  data_frame['electricity'] = pd.to_numeric(data_frame['electricity'])
  
  daily = data_frame.groupby(data_frame["timestamp"].dt.date)["electricity"].sum().reset_index()
  daily["day_num"] = np.arange(len(daily))
  
  if len(daily) < 2: # Need at least 2 points to train a linear model
      print("DEBUG: Not enough unique days for prediction model training.") # NEW DEBUG
      return None, None
      
  model = LinearRegression().fit(daily[["day_num"]], daily["electricity"])
  return model, daily

# ---------------------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------------------
@app.route("/api/upload", methods=["POST"])
def r_upload():
  print("DEBUG: /api/upload endpoint hit.") # DEBUG
  try:
      payload = request.get_json(force=True)
      print(f"DEBUG: Received payload with {len(payload)} items.") # DEBUG
      load_data_from_json(payload)
      print(f"DEBUG: Data loaded successfully. Total rows in df: {len(df) if df is not None else 0}") # DEBUG
      return jsonify({"rows_loaded": len(df), "status": "success"})
  except Exception as e:
      print(f"ERROR: Upload failed: {e}") # DEBUG
      return jsonify({"error": str(e), "status": "error"}), 400

@app.route("/api/peak")
def r_peak():
  return jsonify(compute_peak_period())

@app.route("/api/bill")
def r_bill():
  units = request.args.get("units", type=float)
  if units is None:
      return jsonify({"error": "units query-param missing"}), 400
  return jsonify(calculate_bill(units))

@app.route("/api/predict")
def r_predict():
  if df is None:
      return jsonify({"error": "data_not_loaded"}), 400
  
  model, daily = _train_regressor(df)
  if model is None:
      return jsonify({"error": "not_enough_data_for_prediction"}), 400
      
  last_day = daily["day_num"].max()
  future = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
  pred_kwh = float(model.predict(future).sum())
  bill = calculate_bill(pred_kwh)
  
  return jsonify({"predicted_kwh": round(pred_kwh, 2), "bill": bill})

@app.route("/api/suggestions")
def r_suggestions():
  if df is None or df.empty:
      return jsonify({"suggestions": ["Upload device data to get personalized suggestions"]})
  
  suggestions = []
  peak_data = compute_peak_period()
  if "peak_period" in peak_data:
      peak = peak_data["peak_period"]
      if peak == "evening":
          suggestions.append("High evening usage detected. Consider shifting some devices to off-peak hours.")
      if peak == "afternoon":
          suggestions.append("Peak afternoon usage. Optimize AC and other high-power devices.")
  
  # Device-specific suggestions
  device_data = generate_device_data()
  for device_name, data in device_data.items():
      if data['efficiency'] < 80:
          suggestions.append(f"{device_name} efficiency is low. Check maintenance requirements.")
  
  if not suggestions:
      suggestions.append("Your energy usage pattern looks optimized. Keep monitoring!")
  
  return jsonify({"suggestions": suggestions[:5]})  # Return top 5

@app.route("/api/devices")
def r_devices():
  """Get device-specific data and analysis."""
  device_data = generate_device_data()
  print(f"DEBUG: r_devices data before JSON serialization:") # DEBUG
  for device_name, details in device_data.items(): # DEBUG
      print(f"  Device: {device_name}") # DEBUG
      for key, value in details.items(): # DEBUG
          print(f"    Key: {key}, Type: {type(value)}, Value: {value}") # DEBUG
  try:
      json_output = json.dumps(device_data) # Use json.dumps directly for more control
      print(f"DEBUG: r_devices successfully serialized data.") # DEBUG
      return app.response_class(
          response=json_output,
          status=200,
          mimetype='application/json'
      )
  except TypeError as e:
      print(f"ERROR: JSON serialization failed in r_devices: {e}") # DEBUG
      return jsonify({"error": f"Serialization error: {e}", "status": "error"}), 500

@app.route("/api/device/<device_name>")
def r_device_details(device_name):
  """Get detailed analysis for a specific device."""
  if df is None:
      return jsonify({"error": "data_not_loaded"}), 400
  
  device_df = df[df['device_name'] == device_name]
  
  if device_df.empty:
      return jsonify({"error": f"No data found for device: {device_name}"}), 404
  
  # Calculate device metrics
  latest_reading = device_df.iloc[-1]
  current_power = float(latest_reading['power'])
  total_energy = float(device_df['electricity'].sum())
  peak_usage = float(device_df['power'].max())
  avg_power = float(device_df['power'].mean())
  efficiency = calculate_device_efficiency(device_df, device_name)
  print(f"DEBUG: Type of switch_status in DataFrame for {device_name} (details before assignment): {type(latest_reading['switch_status'])}") # NEW DEBUG
  is_active = bool(latest_reading['switch_status']) # Should already be Python bool
  
  # Usage patterns
  hourly_usage = {int(k): float(v) for k, v in device_df.groupby('hour')['power'].mean().to_dict().items()} # Ensure int keys, float values
  daily_usage = device_df.groupby(device_df["timestamp"].dt.date)['electricity'].sum().to_dict()
  
  # Convert date keys to strings for JSON serialization
  daily_usage_str = {str(k): float(v) for k, v in daily_usage.items()} # Ensure float values
  
  suggestions = generate_device_suggestions(device_name, current_power, efficiency, is_active)
  
  # Device-specific prediction
  predicted_kwh = 0.0
  predicted_bill = None
  model, daily_device_data = _train_regressor(device_df)
  if model is not None and daily_device_data is not None:
      last_day = daily_device_data["day_num"].max()
      future = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
      predicted_kwh = float(model.predict(future).sum())
      predicted_bill = calculate_bill(predicted_kwh)
  
  return jsonify({
      "device_name": device_name,
      "current_power": current_power,
      "total_energy": total_energy,
      "peak_usage": peak_usage,
      "average_power": avg_power,
      "efficiency": efficiency,
      "is_active": is_active,
      "hourly_usage": hourly_usage,
      "daily_usage": daily_usage_str,
      "suggestions": suggestions,
      "data_points": len(device_df),
      "predicted_kwh": round(predicted_kwh, 2),
      "predicted_bill": predicted_bill
  })

@app.route("/api/health")
def health_check():
  try:
      total_records = len(df) if df is not None else 0
      devices_detected = len(generate_device_data()) if df is not None else 0
      return jsonify({
          "status": "healthy",
          "data_loaded": df is not None,
          "total_records": total_records,
          "devices_detected": devices_detected
      })
  except Exception as e:
      app.logger.error(f"Error in health_check: {e}")
      return jsonify({
          "status": "unhealthy",
          "data_loaded": False,
          "error": str(e)
      }), 500

if __name__ == "__main__":
  print("🚀 Smart Energy Tracker Backend Starting...")
  print("📊 Dashboard available at: http://localhost:5000")
  print("🔗 API endpoints available at: http://localhost:5000/api/")
  print("🤖 Device monitoring and AI suggestions enabled")
  app.run(debug=True, port=5000, host='0.0.0.0')
