"""Enhanced backend_app.py with email alerts and anomaly detection"""
from __future__ import annotations
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import os
import random
import json
import sqlite3
from dotenv import load_dotenv
from lib.email_service import email_service
from lib.anomaly_detector import anomaly_detector

# Load environment variables
load_dotenv()

# Add this import at the top after other imports
import traceback

app = Flask(__name__)
CORS(app)

# Global DataFrame
df: pd.DataFrame | None = None

# Create static folder if it doesn't exist
if not os.path.exists('static'):
  os.makedirs('static')

# Database setup
def init_db():
    """Initialize the database"""
    try:
        os.makedirs('data', exist_ok=True)
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        # Create email_recipients table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create email_logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                error_message TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        return False

def get_smtp_config():
    """Get SMTP configuration from environment variables"""
    return {
        'server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('SMTP_PORT', 587)),
        'username': os.getenv('SMTP_USERNAME'),
        'password': os.getenv('SMTP_PASSWORD'),
        'use_tls': os.getenv('SMTP_USE_TLS', 'true').lower() == 'true',
        'from_email': os.getenv('FROM_EMAIL'),
        'from_name': os.getenv('FROM_NAME', 'Smart Energy Monitor')
    }

def send_email(to_email, subject, message, is_html=False):
    """Send email using SMTP configuration from environment"""
    try:
        config = get_smtp_config()
        
        # Validate configuration
        if not config['username'] or not config['password']:
            return False, "SMTP credentials not configured in environment variables"
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{config['from_name']} <{config['from_email']}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add message body
        if is_html:
            msg.attach(MIMEText(message, 'html'))
        else:
            msg.attach(MIMEText(message, 'plain'))
        
        # Connect to server and send email
        server = smtplib.SMTP(config['server'], config['port'])
        if config['use_tls']:
            server.starttls()
        
        server.login(config['username'], config['password'])
        server.send_message(msg)
        server.quit()
        
        return True, "Email sent successfully"
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Email sending error: {error_msg}")
        return False, error_msg

def log_email(recipient_email, subject, message, status, error_message=None):
    """Log email sending attempt to database"""
    try:
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO email_logs (recipient_email, subject, message, status, error_message)
            VALUES (?, ?, ?, ?, ?)
        ''', (recipient_email, subject, message, status, error_message))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"❌ Error logging email: {e}")

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
  
  print(f"DEBUG: load_data_from_json received {len(json_data)} items.")
  
  for item in json_data:
      # Handle the specific format with "result" key
      if "result" in item and item.get("success", False):
          res = item["result"]
          device_name = res.get("device_name", "Unknown")
          power = float(res.get("power", 0.0))
          voltage = float(res.get("voltage", 0.0))
          current = float(res.get("current", 0.0))
          electricity = float(res.get("electricity", 0.0))
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
              "switch_status": switch_status
          })
  
  if not rows:
      print("DEBUG: No valid rows extracted from payload.")
      raise ValueError("No valid rows in payload")
  
  df = pd.DataFrame(rows)
  df["hour"] = df["timestamp"].dt.hour
  df["date"] = df["timestamp"].dt.date
  
  # Run anomaly detection after loading new data
  try:
      anomaly_summary = anomaly_detector.get_anomaly_summary(df)
      print(f"🔍 Anomaly Detection: Found {anomaly_summary['total_anomalies']} anomalies")
  except Exception as e:
      print(f"⚠️ Anomaly detection failed: {e}")
  
  print(f"DEBUG: DataFrame loaded with {len(df)} rows.")
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
          is_active = bool(latest_reading['switch_status'])
          
          # Calculate totals
          total_energy = float(device_df['electricity'].sum())
          peak_usage = float(device_df['power'].max())
          avg_power = float(device_df['power'].mean())
          
          # Calculate efficiency based on usage patterns
          efficiency = calculate_device_efficiency(device_df, device_name)
          
          # Generate suggestions based on data analysis only
          suggestions = generate_device_suggestions(device_name, current_power, efficiency, is_active)
          
          # Get hourly usage pattern
          hourly_usage = {int(k): float(v) for k, v in device_df.groupby('hour')['power'].mean().to_dict().items()}
          
          device_data[device_name] = {
              'currentPower': current_power,
              'totalEnergy': total_energy,
              'peakUsage': peak_usage,
              'averagePower': avg_power,
              'isActive': is_active,
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
  """Generate sophisticated AI-powered suggestions with financial impact and technical depth."""
  suggestions = []
  
  # Device-specific optimization strategies with ROI calculations
  device_strategies = {
      'AC': {
          'low_efficiency': [
              f"AC efficiency at {efficiency:.1f}% indicates potential 35-40% cost savings through inverter upgrade. ROI: 4.2 years with ₹800/month savings.",
              "Implement smart scheduling: Pre-cool during off-peak hours (2-5PM) and raise thermostat 2°C during peak hours. Immediate 25% cost reduction.",
              "Install programmable thermostat with occupancy sensors. Reduces runtime by 30% through zone-based cooling optimization."
          ],
          'standby_power': [
              f"AC consuming {current_power:.1f}W in standby mode costs ₹{(current_power * 24 * 30 * 5.5 / 1000):.0f}/month. Install smart switch for 100% elimination.",
              "Phantom load detected. Smart power management can eliminate this ₹200+/month waste through automated standby control."
          ],
          'optimization': [
              "Consider variable refrigerant flow (VRF) system for 40% efficiency improvement and precise temperature control.",
              "Implement demand response automation: Shift 60% of cooling load to off-peak hours for 30% cost reduction."
          ]
      },
      'Fridge': {
          'low_efficiency': [
              f"Fridge efficiency at {efficiency:.1f}% suggests compressor optimization needed. Professional maintenance can improve efficiency by 15-20%.",
              "Consider upgrading to 5-star BEE rated model. Investment: ₹35,000, Annual savings: ₹4,200, Payback: 8.3 years.",
              "Implement smart temperature monitoring: Optimal 3-4°C reduces energy consumption by 12% while maintaining food safety."
          ],
          'optimization': [
              "Install door seal sensors and temperature alerts for 8-10% efficiency improvement through proactive maintenance.",
              "Optimize placement: Ensure 6-inch clearance from walls and away from heat sources for 15% efficiency gain."
          ]
      },
      'Television': {
          'standby_power': [
              f"TV standby consumption of {current_power:.1f}W costs ₹{(current_power * 24 * 30 * 5.5 / 1000):.0f}/month. Smart power strips eliminate 100% of phantom load.",
              "Entertainment center phantom loads typically waste ₹300-500/month. Automated power management ROI: 3-4 months."
          ],
          'optimization': [
              "Implement viewing time automation: Auto-shutdown after 2 hours of inactivity saves 20-25% on entertainment energy costs.",
              "Optimize display settings: Reduce brightness by 20% for 15% power reduction with minimal visual impact."
          ]
      },
      'Light': {
          'optimization': [
              f"LED upgrade opportunity: Current lighting efficiency at {efficiency:.1f}% vs 95%+ for premium LEDs. 60-70% energy reduction possible.",
              "Smart lighting automation: Occupancy sensors and daylight harvesting can reduce lighting costs by 40-50%.",
              "Implement circadian lighting: Automated dimming schedules reduce energy by 25% while improving sleep quality."
          ],
          'low_efficiency': [
              "Incandescent/CFL detected. LED conversion: ₹2,000 investment, ₹400/month savings, 5-month payback period.",
              "Smart dimming systems can extend LED life by 3x while reducing energy consumption by 30-40%."
          ]
      },
      'Fan': {
          'optimization': [
              f"Fan efficiency at {efficiency:.1f}% indicates BLDC motor upgrade opportunity. 50% energy savings with variable speed control.",
              "Smart fan automation: Temperature-based speed control reduces energy by 35% while maintaining comfort.",
              "Ceiling fan optimization: Proper blade angle and regular cleaning improves efficiency by 15-20%."
          ],
          'low_efficiency': [
              "Consider BLDC fan upgrade: ₹8,000 investment, ₹200/month savings, 3.3-year payback with superior performance.",
              "Variable speed drives can optimize fan performance for 25-30% energy reduction through demand-based operation."
          ]
      },
      'Washing Machine': {
          'optimization': [
              f"Washing machine efficiency at {efficiency:.1f}% suggests load optimization needed. Full loads reduce per-kg energy cost by 40%.",
              "Cold water washing: 90% of energy goes to heating. Cold wash reduces energy by 85% with modern detergents.",
              "Time-of-use optimization: Shift washing to off-peak hours for 35% cost reduction on heating elements."
          ],
          'low_efficiency': [
              "Front-loading upgrade opportunity: 40% less water, 25% less energy, ₹300/month savings with ₹45,000 investment.",
              "Smart load sensing technology can optimize water and energy usage for 20-25% efficiency improvement."
          ]
      }
  }
  
  # Get device-specific strategies
  device_tips = device_strategies.get(device_name, {})
  
  # Add efficiency-based suggestions with financial impact
  if efficiency < 70:
      suggestions.extend(device_tips.get('low_efficiency', [
          f"Critical efficiency alert: {device_name} at {efficiency:.1f}% requires immediate attention. Professional audit recommended for 20-30% improvement."
      ]))
  elif efficiency < 85:
      suggestions.extend(device_tips.get('optimization', [
          f"{device_name} efficiency at {efficiency:.1f}% has 15-20% improvement potential through smart optimization strategies."
      ]))
  
  # Add standby power suggestions with cost impact
  if not is_active and current_power > 5:
      suggestions.extend(device_tips.get('standby_power', [
          f"{device_name} phantom load: {current_power:.1f}W costs ₹{(current_power * 24 * 30 * 5.5 / 1000):.0f}/month. Smart automation eliminates 100% waste."
      ]))
  
  # Add general optimization if no specific issues
  if not suggestions:
      suggestions.extend(device_tips.get('optimization', [
          f"{device_name} performing well at {efficiency:.1f}% efficiency. Consider smart automation for 10-15% additional optimization."
      ]))
  
  # Add strategic insights
  strategic_insights = [
      f"IoT integration opportunity: Smart sensors can optimize {device_name} performance through predictive maintenance and usage analytics.",
      f"Energy storage synergy: Battery backup system can shift {device_name} usage to stored solar energy, reducing grid dependency by 60-80%.",
      f"Demand response potential: {device_name} automation can participate in utility programs for ₹500-1000/month additional savings."
  ]
  
  # Add one strategic insight
  if len(suggestions) < 3:
      suggestions.append(strategic_insights[hash(device_name) % len(strategic_insights)])
  
  return suggestions[:3]

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
  
  if len(daily) < 2:
      print("DEBUG: Not enough unique days for prediction model training.")
      return None, None
      
  model = LinearRegression().fit(daily[["day_num"]], daily["electricity"])
  return model, daily

# ---------------------------------------------------------------------------
# EMAIL ALERTS API ROUTES
# ---------------------------------------------------------------------------
@app.route('/api/email/recipients', methods=['GET'])
def get_recipients():
    """Get all email recipients"""
    try:
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, name, is_active, created_at FROM email_recipients ORDER BY created_at DESC')
        recipients = cursor.fetchall()
        conn.close()
        
        result = []
        for recipient in recipients:
            result.append({
                'id': recipient[0],
                'email': recipient[1],
                'name': recipient[2],
                'is_active': bool(recipient[3]),
                'created_at': recipient[4]
            })
        
        return jsonify({'success': True, 'recipients': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/email/recipients', methods=['POST'])
def add_recipient():
    """Add new email recipient"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        email = data['email'].strip().lower()
        name = data.get('name', '').strip()
        
        # Basic email validation
        if '@' not in email or '.' not in email:
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO email_recipients (email, name, is_active)
                VALUES (?, ?, 1)
            ''', (email, name))
            
            conn.commit()
            recipient_id = cursor.lastrowid
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': 'Email recipient added successfully',
                'recipient': {
                    'id': recipient_id,
                    'email': email,
                    'name': name,
                    'is_active': True
                }
            })
            
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'success': False, 'error': 'Email already exists'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/email/recipients/<int:recipient_id>', methods=['DELETE'])
def delete_recipient(recipient_id):
    """Delete email recipient"""
    try:
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM email_recipients WHERE id = ?', (recipient_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Recipient not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Recipient deleted successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/email/test', methods=['POST'])
def send_test_email():
    """Send test email"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        test_email = data['email'].strip()
        
        # Basic email validation
        if '@' not in test_email or '.' not in test_email:
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        # Create test email content
        subject = "Smart Energy Monitor - Test Email"
        message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🔌 Smart Energy Monitor Test Email</h2>
                
                <p>Hello!</p>
                
                <p>This is a test email from your Smart Energy Monitor system to verify that email notifications are working correctly.</p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">✅ Test Successful</h3>
                    <p style="margin-bottom: 0;">If you're reading this, your email configuration is working properly!</p>
                </div>
                
                <h3>📊 What you can expect:</h3>
                <ul>
                    <li><strong>Energy Alerts:</strong> Notifications when consumption exceeds thresholds</li>
                    <li><strong>Anomaly Detection:</strong> Alerts for unusual consumption patterns</li>
                    <li><strong>Daily Reports:</strong> Summary of your energy usage</li>
                    <li><strong>Device Notifications:</strong> Alerts for device malfunctions</li>
                </ul>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Test Details:</strong></p>
                    <ul style="margin: 10px 0;">
                        <li>Sent to: {test_email}</li>
                        <li>Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                        <li>System: Smart Energy Monitor</li>
                    </ul>
                </div>
                
                <p>If you have any questions or need assistance, please contact your system administrator.</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="font-size: 12px; color: #6b7280;">
                    This is an automated message from Smart Energy Monitor.<br>
                    Please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Send the email
        success, result = send_email(test_email, subject, message, is_html=True)
        
        # Log the attempt
        log_email(test_email, subject, message, 'success' if success else 'failed', None if success else result)
        
        if success:
            return jsonify({
                'success': True, 
                'message': f'Test email sent successfully to {test_email}'
            })
        else:
            return jsonify({
                'success': False, 
                'error': f'Failed to send test email: {result}'
            }), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/email/logs', methods=['GET'])
def get_email_logs():
    """Get email sending logs"""
    try:
        conn = sqlite3.connect('data/email_alerts.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, recipient_email, subject, status, sent_at, error_message
            FROM email_logs 
            ORDER BY sent_at DESC 
            LIMIT 50
        ''')
        
        logs = cursor.fetchall()
        conn.close()
        
        result = []
        for log in logs:
            result.append({
                'id': log[0],
                'recipient_email': log[1],
                'subject': log[2],
                'status': log[3],
                'sent_at': log[4],
                'error_message': log[5]
            })
        
        return jsonify({'success': True, 'logs': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/anomalies')
def get_anomalies():
    """Get current anomaly detection results."""
    try:
        if df is None or df.empty:
            return jsonify({"anomalies": {}, "summary": {"total_anomalies": 0}, "status": "no_data"})
        
        anomaly_summary = anomaly_detector.get_anomaly_summary(df)
        return jsonify({"anomalies": anomaly_summary, "status": "success"})
        
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500

# ---------------------------------------------------------------------------
# EXISTING API ROUTES
# ---------------------------------------------------------------------------
@app.route("/api/upload", methods=["POST"])
def r_upload():
  print("DEBUG: /api/upload endpoint hit.")
  try:
      payload = request.get_json(force=True)
      print(f"DEBUG: Received payload with {len(payload)} items.")
      load_data_from_json(payload)
      print(f"DEBUG: Data loaded successfully. Total rows in df: {len(df) if df is not None else 0}")
      return jsonify({"rows_loaded": len(df), "status": "success"})
  except Exception as e:
      print(f"ERROR: Upload failed: {e}")
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
      return jsonify({"suggestions": [
          "🚀 Upload device data to unlock AI-powered energy optimization with ROI analysis and strategic recommendations.",
          "💡 Smart energy management can typically reduce costs by 25-40% through data-driven optimization strategies.",
          "⚡ Professional energy audit available: Identify ₹500-2000/month savings opportunities through advanced analytics."
      ]})
  
  suggestions = []
  
  # Strategic peak usage analysis
  peak_data = compute_peak_period()
  if "peak_period" in peak_data:
      peak = peak_data["peak_period"]
      period_kwh = peak_data.get("period_kwh", {})
      total_kwh = sum(period_kwh.values())
      
      if peak == "evening":
          evening_percentage = (period_kwh.get("evening", 0) / total_kwh * 100) if total_kwh > 0 else 0
          cost_impact = evening_percentage * 0.35
          suggestions.append(f"🎯 Peak Evening Usage Alert: {evening_percentage:.1f}% consumption during premium hours. Load shifting strategy can reduce costs by ₹{cost_impact*10:.0f}/month through smart scheduling automation.")
      elif peak == "afternoon":
          afternoon_percentage = (period_kwh.get("afternoon", 0) / total_kwh * 100) if total_kwh > 0 else 0
          suggestions.append(f"☀️ Afternoon Peak Optimization: {afternoon_percentage:.1f}% usage during solar peak hours. Smart grid integration and demand response can reduce costs by 30-35% through strategic load management.")
      elif peak == "morning":
          suggestions.append("🌅 Morning Peak Detected: Implement smart water heating schedules and delayed appliance starts for 20-25% cost reduction during high-demand periods.")
  
  # Advanced device analytics
  device_data = generate_device_data()
  total_power = sum(data['currentPower'] for data in device_data.values())
  high_consumers = [(name, data) for name, data in device_data.items() if data['currentPower'] > total_power * 0.2]
  
  if high_consumers:
      for device_name, data in high_consumers[:2]:
          efficiency = data['efficiency']
          power = data['currentPower']
          monthly_cost = power * 24 * 30 * 5.5 / 1000
          
          if efficiency < 80:
              potential_savings = monthly_cost * (85 - efficiency) / 100
              suggestions.append(f"⚡ {device_name} Optimization Priority: {power:.0f}W consumption with {efficiency:.1f}% efficiency. Smart upgrade strategy can save ₹{potential_savings:.0f}/month through advanced control systems.")
  
  # System-wide optimization insights
  total_devices = len(device_data)
  active_devices = sum(1 for data in device_data.values() if data['isActive'])
  avg_efficiency = sum(data['efficiency'] for data in device_data.values()) / total_devices if total_devices > 0 else 0
  
  if avg_efficiency < 85:
      system_improvement = (85 - avg_efficiency) * total_power * 0.01
      suggestions.append(f"🏠 Smart Home Optimization: System efficiency at {avg_efficiency:.1f}% with {system_improvement:.0f}W improvement potential. IoT integration and AI automation can achieve 15-25% overall cost reduction.")
  
  # Strategic technology recommendations
  if total_power > 1000:
      suggestions.append("🔋 Energy Storage Opportunity: High consumption profile ideal for battery + solar system. ROI analysis shows 6-8 year payback with 60-80% grid independence achievable.")
  
  # Add predictive maintenance insight
  low_efficiency_devices = [name for name, data in device_data.items() if data['efficiency'] < 75]
  if low_efficiency_devices:
      suggestions.append(f"🔧 Predictive Maintenance Alert: {len(low_efficiency_devices)} devices showing efficiency degradation. Proactive maintenance program can prevent 20-30% performance loss and extend equipment life by 3-5 years.")
  
  # Ensure we have quality suggestions
  if not suggestions:
      suggestions.extend([
          "✅ Excellent Energy Management: Your system is well-optimized! Consider advanced automation for 5-10% additional efficiency gains.",
          "🚀 Next-Level Optimization: Implement machine learning-based demand prediction for dynamic load balancing and cost optimization.",
          "💡 Strategic Upgrade Path: Energy monitoring analytics suggest smart grid integration opportunities for enhanced performance."
      ])
  
  return jsonify({"suggestions": suggestions[:5]})

@app.route("/api/devices")
def r_devices():
  """Get device-specific data and analysis."""
  device_data = generate_device_data()
  print(f"DEBUG: r_devices data before JSON serialization:")
  for device_name, details in device_data.items():
      print(f"  Device: {device_name}")
      for key, value in details.items():
          print(f"    Key: {key}, Type: {type(value)}, Value: {value}")
  try:
      json_output = json.dumps(device_data)
      print(f"DEBUG: r_devices successfully serialized data.")
      return app.response_class(
          response=json_output,
          status=200,
          mimetype='application/json'
      )
  except TypeError as e:
      print(f"ERROR: JSON serialization failed in r_devices: {e}")
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
  print(f"DEBUG: Type of switch_status in DataFrame for {device_name} (details before assignment): {type(latest_reading['switch_status'])}")
  is_active = bool(latest_reading['switch_status'])
  
  # Usage patterns
  hourly_usage = {int(k): float(v) for k, v in device_df.groupby('hour')['power'].mean().to_dict().items()}
  daily_usage = device_df.groupby(device_df["timestamp"].dt.date)['electricity'].sum().to_dict()
  
  # Convert date keys to strings for JSON serialization
  daily_usage_str = {str(k): float(v) for k, v in daily_usage.items()}
  
  # Get data-driven suggestions for this specific device
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

@app.route("/api/weather")
def r_weather():
    """Simulate fetching current weather data for a given city."""
    city = request.args.get("city", "Chennai")
    
    # Simulate weather conditions
    temperatures = {
        "Chennai": random.uniform(28, 35),
        "Delhi": random.uniform(25, 32),
        "Mumbai": random.uniform(27, 33),
        "Bangalore": random.uniform(22, 28),
        "Default": random.uniform(20, 30)
    }
    
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Humid"]
    
    temp = round(temperatures.get(city, temperatures["Default"]), 1)
    condition = random.choice(conditions)
    humidity = random.randint(60, 95)
    
    return jsonify({
        "city": city,
        "temperature_celsius": temp,
        "condition": condition,
        "humidity_percent": humidity,
        "message": f"Simulated weather for {city}"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🚀 Starting Smart Energy Monitor Backend...")
    
    # Initialize database
    if init_db():
        print("📧 Email system ready")
        print("🌐 Starting server on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to initialize database. Exiting.")
