"""Anomaly detection system for energy consumption patterns."""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        self.sensitivity_threshold = 2.0  # Standard deviations for anomaly detection
        self.min_data_points = 10  # Minimum data points needed for analysis
        
    def detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect various types of anomalies in energy consumption data."""
        if df is None or df.empty:
            return {"anomalies": [], "summary": {"total_anomalies": 0}}
        
        if len(df) < self.min_data_points:
            return {"anomalies": [], "summary": {"total_anomalies": 0, "insufficient_data": True}}
        
        all_anomalies = []
        
        try:
            # Detect different types of anomalies
            power_anomalies = self._detect_power_anomalies(df)
            all_anomalies.extend(power_anomalies)
            
            pattern_anomalies = self._detect_pattern_anomalies(df)
            all_anomalies.extend(pattern_anomalies)
            
            device_failures = self._detect_device_failures(df)
            all_anomalies.extend(device_failures)
            
            consumption_spikes = self._detect_consumption_spikes(df)
            all_anomalies.extend(consumption_spikes)
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
        
        return {
            "anomalies": all_anomalies,
            "summary": {
                "total_anomalies": len(all_anomalies),
                "power_anomalies": len(power_anomalies) if 'power_anomalies' in locals() else 0,
                "pattern_anomalies": len(pattern_anomalies) if 'pattern_anomalies' in locals() else 0,
                "device_failures": len(device_failures) if 'device_failures' in locals() else 0,
                "consumption_spikes": len(consumption_spikes) if 'consumption_spikes' in locals() else 0
            }
        }
    
    def _detect_power_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in power consumption using statistical methods."""
        anomalies = []
        
        try:
            for device_name in df['device_name'].unique():
                device_df = df[df['device_name'] == device_name].copy()
                
                if len(device_df) < self.min_data_points:
                    continue
                
                # Calculate statistical thresholds
                power_values = device_df['power'].values
                mean_power = np.mean(power_values)
                std_power = np.std(power_values)
                
                if std_power == 0:  # No variation in power
                    continue
                
                # Define anomaly thresholds
                upper_threshold = mean_power + (self.sensitivity_threshold * std_power)
                lower_threshold = max(0, mean_power - (self.sensitivity_threshold * std_power))
                
                # Find anomalous readings
                for _, row in device_df.iterrows():
                    power = row['power']
                    
                    if power > upper_threshold or power < lower_threshold:
                        severity = self._calculate_severity(power, mean_power, std_power)
                        
                        anomalies.append({
                            "type": "power_anomaly",
                            "device_name": device_name,
                            "timestamp": row['timestamp'].isoformat() if pd.notna(row['timestamp']) else datetime.now().isoformat(),
                            "actual_value": float(power),
                            "expected_range": f"{lower_threshold:.1f} - {upper_threshold:.1f}W",
                            "severity": severity,
                            "description": f"Power consumption of {power:.1f}W is outside normal range for {device_name}",
                            "z_score": abs(power - mean_power) / std_power if std_power > 0 else 0
                        })
        
        except Exception as e:
            logger.error(f"Error detecting power anomalies: {e}")
        
        return anomalies
    
    def _detect_pattern_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in usage patterns (time-based)."""
        anomalies = []
        
        try:
            for device_name in df['device_name'].unique():
                device_df = df[df['device_name'] == device_name].copy()
                
                if len(device_df) < self.min_data_points:
                    continue
                
                # Analyze hourly usage patterns
                if 'hour' not in device_df.columns:
                    device_df['hour'] = pd.to_datetime(device_df['timestamp']).dt.hour
                
                hourly_usage = device_df.groupby('hour')['power'].mean()
                
                if len(hourly_usage) < 3:  # Need at least 3 different hours
                    continue
                
                # Find unusual usage times
                usage_std = hourly_usage.std()
                usage_mean = hourly_usage.mean()
                
                if usage_std == 0:
                    continue
                
                for hour, avg_power in hourly_usage.items():
                    if avg_power > usage_mean + (2 * usage_std):
                        # Find specific instances of this anomaly
                        hour_data = device_df[device_df['hour'] == hour]
                        
                        for _, row in hour_data.iterrows():
                            if row['power'] > usage_mean + (2 * usage_std):
                                anomalies.append({
                                    "type": "pattern_anomaly",
                                    "device_name": device_name,
                                    "timestamp": row['timestamp'].isoformat() if pd.notna(row['timestamp']) else datetime.now().isoformat(),
                                    "actual_value": float(row['power']),
                                    "expected_value": float(usage_mean),
                                    "severity": "medium",
                                    "description": f"Unusual usage pattern: {device_name} consuming {row['power']:.1f}W at {hour}:00",
                                    "hour": int(hour)
                                })
        
        except Exception as e:
            logger.error(f"Error detecting pattern anomalies: {e}")
        
        return anomalies
    
    def _detect_device_failures(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect potential device failures or malfunctions."""
        anomalies = []
        
        try:
            current_time = datetime.now()
            
            for device_name in df['device_name'].unique():
                device_df = df[df['device_name'] == device_name].copy().sort_values('timestamp')
                
                if len(device_df) < 5:  # Need sufficient data
                    continue
                
                # Check for sudden drops to zero (potential failure)
                for i in range(1, len(device_df)):
                    current_row = device_df.iloc[i]
                    previous_row = device_df.iloc[i-1]
                    
                    # Device suddenly stopped working
                    if (previous_row['power'] > 10 and current_row['power'] == 0 and 
                        current_row['switch_status'] == True):
                        
                        anomalies.append({
                            "type": "device_failure",
                            "device_name": device_name,
                            "timestamp": current_row['timestamp'].isoformat() if pd.notna(current_row['timestamp']) else current_time.isoformat(),
                            "actual_value": float(current_row['power']),
                            "previous_value": float(previous_row['power']),
                            "severity": "high",
                            "description": f"Potential device failure: {device_name} suddenly stopped consuming power while switched on"
                        })
                    
                    # Device consuming power while switched off
                    elif current_row['power'] > 5 and current_row['switch_status'] == False:
                        anomalies.append({
                            "type": "device_malfunction",
                            "device_name": device_name,
                            "timestamp": current_row['timestamp'].isoformat() if pd.notna(current_row['timestamp']) else current_time.isoformat(),
                            "actual_value": float(current_row['power']),
                            "expected_value": 0,
                            "severity": "medium",
                            "description": f"Device malfunction: {device_name} consuming {current_row['power']:.1f}W while switched off"
                        })
        
        except Exception as e:
            logger.error(f"Error detecting device failures: {e}")
        
        return anomalies
    
    def _detect_consumption_spikes(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect sudden spikes in energy consumption."""
        anomalies = []
        
        try:
            for device_name in df['device_name'].unique():
                device_df = df[df['device_name'] == device_name].copy().sort_values('timestamp')
                
                if len(device_df) < 3:
                    continue
                
                # Calculate rolling average and detect spikes
                device_df['rolling_avg'] = device_df['power'].rolling(window=3, center=True).mean()
                
                for i in range(1, len(device_df) - 1):
                    current_power = device_df.iloc[i]['power']
                    rolling_avg = device_df.iloc[i]['rolling_avg']
                    
                    if pd.isna(rolling_avg):
                        continue
                    
                    # Spike detection: current power is significantly higher than rolling average
                    if current_power > rolling_avg * 2 and current_power > 50:  # At least 50W spike
                        severity = "high" if current_power > rolling_avg * 3 else "medium"
                        
                        anomalies.append({
                            "type": "consumption_spike",
                            "device_name": device_name,
                            "timestamp": device_df.iloc[i]['timestamp'].isoformat() if pd.notna(device_df.iloc[i]['timestamp']) else datetime.now().isoformat(),
                            "actual_value": float(current_power),
                            "expected_value": float(rolling_avg),
                            "spike_ratio": float(current_power / rolling_avg),
                            "severity": severity,
                            "description": f"Consumption spike: {device_name} power jumped to {current_power:.1f}W (expected ~{rolling_avg:.1f}W)"
                        })
        
        except Exception as e:
            logger.error(f"Error detecting consumption spikes: {e}")
        
        return anomalies
    
    def _calculate_severity(self, actual_value: float, mean_value: float, std_value: float) -> str:
        """Calculate severity based on how far the value deviates from normal."""
        if std_value == 0:
            return "low"
        
        deviation = abs(actual_value - mean_value) / std_value
        
        if deviation > 4:
            return "critical"
        elif deviation > 3:
            return "high"
        elif deviation > 2:
            return "medium"
        else:
            return "low"
    
    def get_anomaly_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get a comprehensive summary of all anomalies."""
        if df is None or df.empty:
            return {"total_anomalies": 0, "by_device": {}, "by_type": {}, "by_severity": {}}
        
        anomaly_results = self.detect_anomalies(df)
        all_anomalies = anomaly_results.get("anomalies", [])
        
        # Group by device
        by_device = {}
        for anomaly in all_anomalies:
            device = anomaly["device_name"]
            if device not in by_device:
                by_device[device] = []
            by_device[device].append(anomaly)
        
        # Group by type
        by_type = {}
        for anomaly in all_anomalies:
            anomaly_type = anomaly["type"]
            if anomaly_type not in by_type:
                by_type[anomaly_type] = 0
            by_type[anomaly_type] += 1
        
        # Group by severity
        by_severity = {}
        for anomaly in all_anomalies:
            severity = anomaly["severity"]
            if severity not in by_severity:
                by_severity[severity] = 0
            by_severity[severity] += 1
        
        return {
            "total_anomalies": len(all_anomalies),
            "by_device": {device: len(anomalies) for device, anomalies in by_device.items()},
            "by_type": by_type,
            "by_severity": by_severity,
            "recent_anomalies": all_anomalies[-5:] if all_anomalies else [],  # Last 5 anomalies
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def should_trigger_alert(self, anomaly: Dict[str, Any]) -> bool:
        """Determine if an anomaly should trigger an email alert."""
        # Always alert for high and critical severity
        if anomaly["severity"] in ["high", "critical"]:
            return True
        
        # Alert for device failures regardless of severity
        if anomaly["type"] in ["device_failure", "device_malfunction"]:
            return True
        
        # Alert for significant consumption spikes
        if (anomaly["type"] == "consumption_spike" and 
            anomaly.get("spike_ratio", 1) > 2.5):
            return True
        
        return False

# Global instance
anomaly_detector = AnomalyDetector()
