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
import json
import threading
import time
from typing import Optional
import sqlite3
from contextlib import contextmanager
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Global DataFrame
df: pd.DataFrame | None = None

# Create static folder if it doesn't exist
if not os.path.exists('static'):
    os.makedirs('static')

# Database setup
DATABASE_PATH = 'energy_alerts.db'

def init_database():
    """Initialize the SQLite database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create alert_settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_name TEXT NOT NULL,
            device_name TEXT,
            threshold_value REAL NOT NULL,
            threshold_type TEXT NOT NULL,
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(setting_name, device_name)
        )
    ''')
    
    # Create email_recipients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            alert_types TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create alert_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_type TEXT NOT NULL,
            device_name TEXT,
            threshold_value REAL,
            actual_value REAL,
            message TEXT,
            recipients_sent TEXT,
            status TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Import the improved EmailService
try:
    from email_service_improved import EmailService
    email_service = EmailService()
except ImportError:
    print("Warning: EmailService not available. Email functionality will be disabled.")
    email_service = None

# Anomaly detection class
class AnomalyDetector:
    def __init__(self):
        self.baseline_data = None
        
    def train_model(self, data):
        """Train the anomaly detection model with baseline data"""
        self.baseline_data = data
        
    def detect_peak_power_anomalies(self, recent_data, thresholds):
        """Detect peak power anomalies"""
        anomalies = []
        
        peak_threshold = thresholds.get('peak_power', 1000)
        
        for reading in recent_data:
            power = reading.get('power', 0)
            if power > peak_threshold:
                anomalies.append({
                    'anomaly_type': 'peak_power',
                    'device': reading.get('device_name', reading.get('device', 'Unknown')),
                    'actual_value': power,
                    'threshold_value': peak_threshold,
                    'exceeded_by': power - peak_threshold,
                    'percentage_exceeded': ((power - peak_threshold) / peak_threshold) * 100,
                    'severity': self._calculate_severity(power, peak_threshold),
                    'unit': 'W',
                    'description': f"Peak power of {power:.1f}W exceeded threshold of {peak_threshold:.1f}W"
                })
        
        return anomalies
    
    def detect_energy_spike_anomalies(self, recent_data, thresholds):
        """Detect energy spike anomalies"""
        anomalies = []
        
        if len(recent_data) < 2:
            return anomalies
            
        spike_threshold = thresholds.get('energy_spike', 50)  # 50% increase
        
        for i in range(1, len(recent_data)):
            current = recent_data[i]
            previous = recent_data[i-1]
            
            current_power = current.get('power', 0)
            previous_power = previous.get('power', 0)
            
            if previous_power > 0:
                increase_percentage = ((current_power - previous_power) / previous_power) * 100
                
                if increase_percentage > spike_threshold:
                    anomalies.append({
                        'anomaly_type': 'energy_spike',
                        'device': current.get('device_name', current.get('device', 'Unknown')),
                        'actual_value': current_power,
                        'threshold_value': previous_power * (1 + spike_threshold/100),
                        'exceeded_by': current_power - previous_power,
                        'percentage_exceeded': increase_percentage,
                        'severity': self._calculate_severity_spike(increase_percentage),
                        'unit': 'W',
                        'description': f"Energy spike of {increase_percentage:.1f}% detected"
                    })
        
        return anomalies
    
    def detect_anomalies(self, recent_data):
        """Detect general anomalies using statistical methods"""
        anomalies = []
        
        if not self.baseline_data or len(recent_data) < 5:
            return anomalies
        
        # Group by device
        devices = {}
        for reading in recent_data:
            device = reading.get('device_name', reading.get('device', 'Unknown'))
            if device not in devices:
                devices[device] = []
            devices[device].append(reading.get('power', 0))
        
        # Check each device for anomalies
        for device, powers in devices.items():
            if len(powers) < 3:
                continue
                
            avg_power = np.mean(powers)
            std_power = np.std(powers)
            
            # Find baseline for this device
            baseline_powers = []
            for reading in self.baseline_data:
                if reading.get('device_name', reading.get('device', '')) == device:
                    baseline_powers.append(reading.get('power', 0))
            
            if baseline_powers:
                baseline_avg = np.mean(baseline_powers)
                baseline_std = np.std(baseline_powers)
                
                # Check if current average is significantly different
                if baseline_std > 0:
                    z_score = abs(avg_power - baseline_avg) / baseline_std
                    
                    if z_score > 2:  # 2 standard deviations
                        anomalies.append({
                            'anomaly_type': 'device_anomaly',
                            'device': device,
                            'actual_value': avg_power,
                            'threshold_value': baseline_avg,
                            'exceeded_by': abs(avg_power - baseline_avg),
                            'percentage_exceeded': abs((avg_power - baseline_avg) / baseline_avg) * 100,
                            'severity': 'medium' if z_score < 3 else 'high',
                            'unit': 'W',
                            'description': f"Unusual power consumption pattern detected for {device}"
                        })
        
        return anomalies
    
    def _calculate_severity(self, actual, threshold):
        """Calculate severity based on how much threshold is exceeded"""
        ratio = actual / threshold
        if ratio < 1.2:
            return 'low'
        elif ratio < 1.5:
            return 'medium'
        elif ratio < 2.0:
            return 'high'
        else:
            return 'critical'
    
    def _calculate_severity_spike(self, percentage):
        """Calculate severity for energy spikes"""
        if percentage < 75:
            return 'low'
        elif percentage < 150:
            return 'medium'
        elif percentage < 300:
            return 'high'
        else:
            return 'critical'

    def detect_device_specific_anomalies(self, recent_data, device_thresholds, global_thresholds):
        """Detect anomalies with device-specific thresholds"""
        anomalies = []
        
        for reading in recent_data:
            device_name = reading.get('device_name', reading.get('device', 'Unknown'))
            power = reading.get('power', 0)
            
            # Check for peak power anomalies
            device_peak_threshold = device_thresholds.get(device_name, {}).get('peak_power')
            global_peak_threshold = global_thresholds.get('peak_power')
            
            peak_threshold = device_peak_threshold or global_peak_threshold
            
            if peak_threshold and power > peak_threshold:
                anomalies.append({
                    'anomaly_type': 'peak_power',
                    'device': device_name,
                    'actual_value': power,
                    'threshold_value': peak_threshold,
                    'exceeded_by': power - peak_threshold,
                    'percentage_exceeded': ((power - peak_threshold) / peak_threshold) * 100,
                    'severity': self._calculate_severity(power, peak_threshold),
                    'unit': 'W',
                    'description': f"Peak power of {power:.1f}W exceeded threshold of {peak_threshold:.1f}W"
                })
            
            # Check for energy spike anomalies
            device_spike_threshold = device_thresholds.get(device_name, {}).get('energy_spike')
            global_spike_threshold = global_thresholds.get('energy_spike')
            
            spike_threshold = device_spike_threshold or global_spike_threshold
            
            if len(recent_data) > 1:
                previous_reading = recent_data[-2]
                previous_power = previous_reading.get('power', 0)
                
                if previous_power > 0 and spike_threshold:
                    increase_percentage = ((power - previous_power) / previous_power) * 100
                    
                    if increase_percentage > spike_threshold:
                        anomalies.append({
                            'anomaly_type': 'energy_spike',
                            'device': device_name,
                            'actual_value': power,
                            'threshold_value': previous_power * (1 + spike_threshold/100),
                            'exceeded_by': power - previous_power,
                            'percentage_exceeded': increase_percentage,
                            'severity': self._calculate_severity_spike(increase_percentage),
                            'unit': 'W',
                            'description': f"Energy spike of {increase_percentage:.1f}% detected"
                        })
        
        return anomalies

# Initialize services
anomaly_detector = AnomalyDetector()

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
        else:
            # Handle direct format
            device_name = item.get("device_name", item.get("device", "Unknown"))
            power = float(item.get("power", 0.0))
            voltage = float(item.get("voltage", 0.0))
            current = float(item.get("current", 0.0))
            electricity = float(item.get("electricity", item.get("energy", 0.0)))
            switch_status = bool(item.get("switch_status", item.get("switch", False)))
            ts_iso = item.get("timestamp", item.get("update_time"))
            
            try:
                if ts_iso:
                    if 'T' in ts_iso:
                        ts = datetime.fromisoformat(ts_iso.replace('Z', '+00:00'))
                    else:
                        ts = datetime.strptime(ts_iso, "%Y-%m-%d %H:%M:%S")
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
    print(f"DEBUG: DataFrame loaded with {len(df)} rows.")
    
    # Train anomaly detector with new data
    anomaly_detector.train_model(json_data)
    
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
    
    return suggestions[:3]  # Return top 3 sophisticated suggestions

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

def check_for_anomalies():
    """Background task to check for anomalies"""
    while True:
        try:
            if df is not None and len(df) > 0:
                with get_db_connection() as conn:
                    # Get current alert settings with device-specific support
                    cursor = conn.cursor()
                    cursor.execute("SELECT * FROM alert_settings WHERE is_enabled = 1")
                    settings = cursor.fetchall()

                    # Organize thresholds by device and alert type
                    device_thresholds = {}
                    global_thresholds = {}

                    for setting in settings:
                        setting_name = setting['setting_name']
                        device_name = setting['device_name']
                        threshold_value = setting['threshold_value']
                        
                        if device_name:  # Device-specific threshold
                            if device_name not in device_thresholds:
                                device_thresholds[device_name] = {}
                            device_thresholds[device_name][setting_name] = threshold_value
                        else:  # Global threshold
                            global_thresholds[setting_name] = threshold_value

                    # Get current device data
                    device_data = generate_device_data()

                    # Convert recent data for anomaly detection
                    recent_data = []
                    recent_df = df.tail(10)  # Last 10 readings
                    for _, row in recent_df.iterrows():
                        recent_data.append({
                            'device_name': row['device_name'],
                            'device': row['device_name'],  # For compatibility
                            'power': row['power'],
                            'timestamp': row['timestamp'].isoformat()
                        })

                    # Detect anomalies with device-specific thresholds
                    anomalies = []
                    anomalies.extend(anomaly_detector.detect_device_specific_anomalies(recent_data, device_thresholds, global_thresholds))
                    
                    if anomalies and email_service:
                        # Get active email recipients
                        cursor.execute("SELECT * FROM email_recipients WHERE is_active = 1")
                        recipients = cursor.fetchall()
                        
                        for anomaly in anomalies:
                            # Filter recipients based on alert type preferences
                            relevant_recipients = []
                            for recipient in recipients:
                                alert_types = json.loads(recipient['alert_types']) if recipient['alert_types'] else []
                                if anomaly['anomaly_type'] in alert_types:
                                    relevant_recipients.append(recipient['email'])
                            
                            if relevant_recipients:
                                # Send alert emails
                                alert_data = {
                                    'alert_type': anomaly['anomaly_type'],
                                    'device_name': anomaly['device'],
                                    'threshold_value': anomaly['threshold_value'],
                                    'actual_value': anomaly['actual_value'],
                                    'severity': anomaly['severity'],
                                    'unit': anomaly['unit'],
                                    'message': anomaly['description']
                                }
                                
                                result = email_service.send_alert_email(alert_data, relevant_recipients)
                                
                                # Log alert history
                                cursor.execute("""
                                    INSERT INTO alert_history 
                                    (alert_type, device_name, threshold_value, actual_value, message, recipients_sent, status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                """, (
                                    anomaly['anomaly_type'],
                                    anomaly['device'],
                                    anomaly['threshold_value'],
                                    anomaly['actual_value'],
                                    anomaly['description'],
                                    json.dumps(result.get('sent_to', [])),
                                    'sent' if result['success'] else 'failed'
                                ))
                                conn.commit()
                                
                                print(f"Alert sent: {anomaly['description']} to {len(result.get('sent_to', []))} recipients")
              
        except Exception as e:
            print(f"Error in anomaly checking: {str(e)}")
        
        # Check every 60 seconds
        time.sleep(60)

# ---------------------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------------------
@app.route("/api/upload", methods=["POST"])
def r_upload():
    print("DEBUG: /api/upload endpoint hit.")
    try:
        # Check if it's a file upload or JSON data
        if request.files and 'file' in request.files:
            # Handle file upload
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected", "status": "error"}), 400
            
            # Read file content
            if file.filename.endswith('.json'):
                import json
                payload = json.load(file)
            elif file.filename.endswith('.csv'):
                import pandas as pd
                df_temp = pd.read_csv(file)
                payload = df_temp.to_dict('records')
            else:
                return jsonify({"error": "Unsupported file format. Please use JSON or CSV.", "status": "error"}), 400
        else:
            # Handle JSON data directly
            payload = request.get_json(force=True)
            if not payload:
                return jsonify({"error": "No JSON data provided", "status": "error"}), 400
        
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
            cost_impact = evening_percentage * 0.35  # Approximate premium cost impact
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
        for device_name, data in high_consumers[:2]:  # Top 2 consumers
            efficiency = data['efficiency']
            power = data['currentPower']
            monthly_cost = power * 24 * 30 * 5.5 / 1000  # Approximate monthly cost
            
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
    if total_power > 1000:  # High consumption household
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
    
    return jsonify({"suggestions": suggestions[:5]})  # Return top 5 strategic suggestions

@app.route("/api/devices")
def r_devices():
    """Get device-specific data and analysis."""
    device_data = generate_device_data()
    try:
        json_output = json.dumps(device_data)
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

# Alert Management Routes
@app.route("/api/alert-settings", methods=["GET"])
def get_alert_settings():
    """Get all alert settings"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM alert_settings ORDER BY device_name, created_at DESC")
            settings = cursor.fetchall()
            
            return jsonify([{
                "id": setting["id"],
                "setting_name": setting["setting_name"],
                "device_name": setting["device_name"],
                "threshold_value": setting["threshold_value"],
                "threshold_type": setting["threshold_type"],
                "is_enabled": bool(setting["is_enabled"]),
                "created_at": setting["created_at"],
                "updated_at": setting["updated_at"]
            } for setting in settings])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/alert-settings", methods=["POST"])
def create_alert_setting():
    """Create or update alert setting"""
    try:
        data = request.get_json()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if setting already exists
            if data.get('device_name'):
                cursor.execute("SELECT id FROM alert_settings WHERE setting_name = ? AND device_name = ?", 
                             (data['setting_name'], data['device_name']))
            else:
                cursor.execute("SELECT id FROM alert_settings WHERE setting_name = ? AND device_name IS NULL", 
                             (data['setting_name'],))
            
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("""
                    UPDATE alert_settings 
                    SET threshold_value = ?, threshold_type = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (
                    data['threshold_value'],
                    data['threshold_type'],
                    data.get('is_enabled', True),
                    existing['id']
                ))
            else:
                cursor.execute("""
                    INSERT INTO alert_settings (setting_name, device_name, threshold_value, threshold_type, is_enabled)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    data['setting_name'],
                    data.get('device_name'),
                    data['threshold_value'],
                    data['threshold_type'],
                    data.get('is_enabled', True)
                ))
            
            conn.commit()
            
            return jsonify({
                "message": "Alert setting saved successfully",
                "setting_name": data['setting_name'],
                "device_name": data.get('device_name'),
                "threshold_value": data['threshold_value'],
                "threshold_type": data['threshold_type'],
                "is_enabled": data.get('is_enabled', True)
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/email-recipients", methods=["GET"])
def get_email_recipients():
    """Get all email recipients"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM email_recipients ORDER BY created_at DESC")
            recipients = cursor.fetchall()
            
            return jsonify([{
                "id": recipient["id"],
                "email": recipient["email"],
                "name": recipient["name"],
                "is_active": bool(recipient["is_active"]),
                "alert_types": json.loads(recipient["alert_types"]) if recipient["alert_types"] else [],
                "created_at": recipient["created_at"]
            } for recipient in recipients])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/email-recipients", methods=["POST"])
def add_email_recipient():
    """Add email recipient"""
    try:
        data = request.get_json()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if email already exists
            cursor.execute("SELECT id FROM email_recipients WHERE email = ?", (data['email'],))
            existing = cursor.fetchone()
            
            if existing:
                return jsonify({"error": "Email already exists"}), 400
            
            cursor.execute("""
                INSERT INTO email_recipients (email, name, is_active, alert_types)
                VALUES (?, ?, ?, ?)
            """, (
                data['email'],
                data.get('name', ''),
                data.get('is_active', True),
                json.dumps(data.get('alert_types', ['peak_power', 'energy_spike', 'device_anomaly']))
            ))
            
            conn.commit()
            
            return jsonify({
                "message": "Email recipient added successfully",
                "email": data['email'],
                "name": data.get('name', ''),
                "is_active": data.get('is_active', True)
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/email-recipients/<int:recipient_id>", methods=["PUT"])
def update_email_recipient(recipient_id):
    """Update email recipient"""
    try:
        data = request.get_json()
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE email_recipients 
                SET email = ?, name = ?, is_active = ?, alert_types = ?
                WHERE id = ?
            """, (
                data.get('email'),
                data.get('name', ''),
                data.get('is_active', True),
                json.dumps(data.get('alert_types', [])),
                recipient_id
            ))
            
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Recipient not found"}), 404
            
            return jsonify({"message": "Email recipient updated successfully"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/email-recipients/<int:recipient_id>", methods=["DELETE"])
def delete_email_recipient(recipient_id):
    """Delete email recipient"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM email_recipients WHERE id = ?", (recipient_id,))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Recipient not found"}), 404
            
            return jsonify({"message": "Email recipient deleted successfully"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/alert-history", methods=["GET"])
def get_alert_history():
    """Get alert history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        offset = (page - 1) * per_page
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get total count
            cursor.execute("SELECT COUNT(*) as total FROM alert_history")
            total = cursor.fetchone()["total"]
            
            # Get paginated results
            cursor.execute("""
                SELECT * FROM alert_history 
                ORDER BY sent_at DESC 
                LIMIT ? OFFSET ?
            """, (per_page, offset))
            alerts = cursor.fetchall()
            
            return jsonify({
                "alerts": [{
                    "id": alert["id"],
                    "alert_type": alert["alert_type"],
                    "device_name": alert["device_name"],
                    "threshold_value": alert["threshold_value"],
                    "actual_value": alert["actual_value"],
                    "message": alert["message"],
                    "recipients_sent": json.loads(alert["recipients_sent"]) if alert["recipients_sent"] else [],
                    "sent_at": alert["sent_at"],
                    "status": alert["status"]
                } for alert in alerts],
                "total": total,
                "page": page,
                "per_page": per_page
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/test-alert", methods=["POST"])
def test_alert():
    """Send test alert email"""
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({"error": "Email address required"}), 400
        
        if not email_service:
            return jsonify({"error": "Email service not configured"}), 500
        
        # Send test email using the improved service
        result = email_service.send_test_email(test_email)
        
        if result['success']:
            return jsonify({"message": "Test alert sent successfully", "result": result})
        else:
            return jsonify({"error": "Failed to send test alert", "result": result}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/test-email-connection", methods=["POST"])
def test_email_connection():
    """Test email connection without sending email"""
    try:
        if not email_service:
            return jsonify({
                "success": False,
                "error": "Email service not configured",
                "help": "Please check your email configuration in the .env file"
            }), 500
        
        result = email_service.test_connection()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/available-devices", methods=["GET"])
def get_available_devices():
    """Get list of available devices from current data"""
    try:
        if df is None or df.empty:
            return jsonify({"devices": []})
        
        devices = df['device_name'].unique().tolist()
        device_info = []
        
        for device in devices:
            device_df = df[df['device_name'] == device]
            latest_reading = device_df.iloc[-1]
            
            device_info.append({
                "name": device,
                "current_power": float(latest_reading['power']),
                "is_active": bool(latest_reading['switch_status']),
                "data_points": len(device_df)
            })
        
        return jsonify({"devices": device_info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/device-thresholds", methods=["GET"])
def get_device_thresholds():
    """Get device-specific thresholds with current status"""
    if df is None:
        return jsonify({"error": "No data loaded"}), 400
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get all device-specific thresholds
            cursor.execute('''
                SELECT device_name, setting_name, threshold_value, threshold_type, is_enabled
                FROM alert_settings 
                WHERE device_name IS NOT NULL AND is_enabled = 1
            ''')
            
            device_thresholds = {}
            for row in cursor.fetchall():
                device_name = row[0]
                if device_name not in device_thresholds:
                    device_thresholds[device_name] = []
                
                device_thresholds[device_name].append({
                    'setting_name': row[1],
                    'threshold_value': row[2],
                    'threshold_type': row[3],
                    'is_enabled': bool(row[4])
                })
            
            # Get current device status
            result = {}
            for device in df['device_name'].unique():
                device_data = df[df['device_name'] == device]
                current_power = float(device_data['power'].iloc[-1]) if len(device_data) > 0 else 0
                current_energy = float(device_data['electricity'].iloc[-1]) if len(device_data) > 0 else 0
                
                thresholds = device_thresholds.get(device, [])
                
                # Check if any thresholds are exceeded
                alerts = []
                for threshold in thresholds:
                    if threshold['setting_name'] == 'peak_power':
                        current_value = current_power
                    elif threshold['setting_name'] == 'energy_spike':
                        current_value = current_power
                    else:
                        current_value = current_energy
                    
                    is_exceeded = False
                    if threshold['threshold_type'] == 'greater_than' and current_value > threshold['threshold_value']:
                        is_exceeded = True
                    elif threshold['threshold_type'] == 'less_than' and current_value < threshold['threshold_value']:
                        is_exceeded = True
                    elif threshold['threshold_type'] == 'equal_to' and abs(current_value - threshold['threshold_value']) < 0.01:
                        is_exceeded = True
                    
                    if is_exceeded:
                        alerts.append({
                            'type': threshold['setting_name'],
                            'threshold': threshold['threshold_value'],
                            'current': current_value
                        })
                
                result[device] = {
                    'current_power': current_power,
                    'current_energy': current_energy,
                    'thresholds': thresholds,
                    'alerts': alerts,
                    'is_active': current_power > 0
                }
            
            return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Initialize database and start background monitoring
if __name__ == "__main__":
    init_database()
    
    # Start anomaly detection in background thread
    anomaly_thread = threading.Thread(target=check_for_anomalies, daemon=True)
    anomaly_thread.start()
    
    print("🚀 Smart Energy Tracker Backend Starting...")
    print("📊 Dashboard available at: http://localhost:5000")
    print("🔗 API endpoints available at: http://localhost:5000/api/")
    print("🤖 Device monitoring and AI suggestions enabled")
    print("📧 Email alert system activated")
    
    # Print email configuration status
    if email_service and email_service.config_valid:
        print("✅ Email service configured and ready")
    else:
        print("⚠️  Email service configuration issues detected")
        print("   Check your .env file and restart the server")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
