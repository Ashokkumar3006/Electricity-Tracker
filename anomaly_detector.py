import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime, timedelta

class AnomalyDetector:
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,  # Expected proportion of outliers
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = ['power', 'voltage', 'current', 'energy_kwh']
        
    def prepare_features(self, data: List[Dict]) -> pd.DataFrame:
        """Prepare features for anomaly detection"""
        if not data:
            return pd.DataFrame()
        
        df = pd.DataFrame(data)
        
        # Convert timestamp to datetime if it's a string
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Create time-based features
        if 'timestamp' in df.columns:
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Create rolling statistics for each device
        device_features = []
        for device in df['device'].unique():
            device_data = df[df['device'] == device].copy()
            device_data = device_data.sort_values('timestamp')
            
            # Rolling statistics (window of 10 readings)
            window = min(10, len(device_data))
            if window > 1:
                device_data['power_rolling_mean'] = device_data['power'].rolling(window=window, min_periods=1).mean()
                device_data['power_rolling_std'] = device_data['power'].rolling(window=window, min_periods=1).std().fillna(0)
                device_data['power_rolling_max'] = device_data['power'].rolling(window=window, min_periods=1).max()
                device_data['power_rolling_min'] = device_data['power'].rolling(window=window, min_periods=1).min()
            else:
                device_data['power_rolling_mean'] = device_data['power']
                device_data['power_rolling_std'] = 0
                device_data['power_rolling_max'] = device_data['power']
                device_data['power_rolling_min'] = device_data['power']
            
            # Power change rate
            device_data['power_change'] = device_data['power'].diff().fillna(0)
            device_data['power_change_rate'] = device_data['power_change'] / device_data['power_rolling_mean']
            device_data['power_change_rate'] = device_data['power_change_rate'].fillna(0)
            
            device_features.append(device_data)
        
        if device_features:
            result_df = pd.concat(device_features, ignore_index=True)
        else:
            result_df = df
        
        # Fill any remaining NaN values
        numeric_columns = result_df.select_dtypes(include=[np.number]).columns
        result_df[numeric_columns] = result_df[numeric_columns].fillna(0)
        
        return result_df
    
    def train_model(self, data: List[Dict]) -> bool:
        """Train the anomaly detection model"""
        try:
            df = self.prepare_features(data)
            
            if df.empty or len(df) < 10:
                print("Insufficient data for training anomaly detection model")
                return False
            
            # Select features for training
            feature_cols = []
            for col in ['power', 'voltage', 'current', 'energy_kwh', 'hour', 'day_of_week', 
                       'power_rolling_mean', 'power_rolling_std', 'power_change_rate']:
                if col in df.columns:
                    feature_cols.append(col)
            
            if not feature_cols:
                print("No suitable features found for training")
                return False
            
            X = df[feature_cols].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train isolation forest
            self.isolation_forest.fit(X_scaled)
            self.is_trained = True
            self.feature_columns = feature_cols
            
            print(f"Anomaly detection model trained with {len(df)} samples and {len(feature_cols)} features")
            return True
            
        except Exception as e:
            print(f"Error training anomaly detection model: {e}")
            return False
    
    def detect_anomalies(self, data: List[Dict]) -> List[Dict]:
        """Detect anomalies in the data"""
        if not self.is_trained:
            print("Model not trained. Training with provided data...")
            if not self.train_model(data):
                return []
        
        try:
            df = self.prepare_features(data)
            
            if df.empty:
                return []
            
            # Prepare features
            available_features = [col for col in self.feature_columns if col in df.columns]
            if not available_features:
                return []
            
            X = df[available_features].values
            X_scaled = self.scaler.transform(X)
            
            # Predict anomalies
            anomaly_scores = self.isolation_forest.decision_function(X_scaled)
            is_anomaly = self.isolation_forest.predict(X_scaled) == -1
            
            anomalies = []
            for i, (idx, row) in enumerate(df.iterrows()):
                if is_anomaly[i]:
                    anomaly = {
                        'timestamp': row.get('timestamp', datetime.now()).isoformat() if pd.notna(row.get('timestamp')) else datetime.now().isoformat(),
                        'device': row.get('device', 'Unknown'),
                        'anomaly_score': float(anomaly_scores[i]),
                        'power': float(row.get('power', 0)),
                        'voltage': float(row.get('voltage', 0)),
                        'current': float(row.get('current', 0)),
                        'energy_kwh': float(row.get('energy_kwh', 0)),
                        'anomaly_type': 'device_anomaly',
                        'severity': self._calculate_severity(anomaly_scores[i]),
                        'description': f"Unusual behavior detected in {row.get('device', 'device')}"
                    }
                    anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            print(f"Error detecting anomalies: {e}")
            return []
    
    def detect_peak_power_anomalies(self, data: List[Dict], thresholds: Dict[str, float]) -> List[Dict]:
        """Detect peak power anomalies based on thresholds"""
        anomalies = []
        
        for reading in data:
            device = reading.get('device', 'Unknown')
            power = reading.get('power', 0)
            
            # Check device-specific threshold
            device_threshold_key = f"peak_power_{device.lower()}"
            system_threshold_key = "peak_power_system"
            
            threshold = thresholds.get(device_threshold_key) or thresholds.get(system_threshold_key)
            
            if threshold and power > threshold:
                exceeded_by = power - threshold
                percentage_exceeded = (exceeded_by / threshold) * 100
                
                anomaly = {
                    'timestamp': reading.get('timestamp', datetime.now().isoformat()),
                    'device': device,
                    'anomaly_type': 'peak_power',
                    'threshold_value': threshold,
                    'actual_value': power,
                    'exceeded_by': exceeded_by,
                    'percentage_exceeded': percentage_exceeded,
                    'severity': self._calculate_peak_severity(percentage_exceeded),
                    'description': f"Peak power threshold exceeded for {device}",
                    'unit': 'W'
                }
                anomalies.append(anomaly)
        
        return anomalies
    
    def detect_energy_spike_anomalies(self, data: List[Dict], thresholds: Dict[str, float]) -> List[Dict]:
        """Detect energy spike anomalies"""
        anomalies = []
        
        # Group data by device
        device_data = {}
        for reading in data:
            device = reading.get('device', 'Unknown')
            if device not in device_data:
                device_data[device] = []
            device_data[device].append(reading)
        
        for device, readings in device_data.items():
            if len(readings) < 2:
                continue
            
            # Sort by timestamp
            readings.sort(key=lambda x: x.get('timestamp', ''))
            
            # Calculate energy consumption rate
            for i in range(1, len(readings)):
                current_reading = readings[i]
                previous_reading = readings[i-1]
                
                current_energy = current_reading.get('energy_kwh', 0)
                previous_energy = previous_reading.get('energy_kwh', 0)
                
                energy_increase = current_energy - previous_energy
                
                # Check thresholds
                device_threshold_key = f"energy_spike_{device.lower()}"
                system_threshold_key = "energy_spike_system"
                
                threshold = thresholds.get(device_threshold_key) or thresholds.get(system_threshold_key)
                
                if threshold and energy_increase > threshold:
                    exceeded_by = energy_increase - threshold
                    percentage_exceeded = (exceeded_by / threshold) * 100
                    
                    anomaly = {
                        'timestamp': current_reading.get('timestamp', datetime.now().isoformat()),
                        'device': device,
                        'anomaly_type': 'energy_spike',
                        'threshold_value': threshold,
                        'actual_value': energy_increase,
                        'exceeded_by': exceeded_by,
                        'percentage_exceeded': percentage_exceeded,
                        'severity': self._calculate_spike_severity(percentage_exceeded),
                        'description': f"Energy consumption spike detected for {device}",
                        'unit': 'kWh'
                    }
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _calculate_severity(self, anomaly_score: float) -> str:
        """Calculate severity based on anomaly score"""
        if anomaly_score < -0.5:
            return 'critical'
        elif anomaly_score < -0.3:
            return 'high'
        elif anomaly_score < -0.1:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_peak_severity(self, percentage_exceeded: float) -> str:
        """Calculate severity based on percentage exceeded for peak power"""
        if percentage_exceeded > 100:
            return 'critical'
        elif percentage_exceeded > 50:
            return 'high'
        elif percentage_exceeded > 25:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_spike_severity(self, percentage_exceeded: float) -> str:
        """Calculate severity based on percentage exceeded for energy spikes"""
        if percentage_exceeded > 200:
            return 'critical'
        elif percentage_exceeded > 100:
            return 'high'
        elif percentage_exceeded > 50:
            return 'medium'
        else:
            return 'low'
    
    def get_model_info(self) -> Dict:
        """Get information about the trained model"""
        return {
            'is_trained': self.is_trained,
            'feature_columns': self.feature_columns,
            'contamination_rate': self.isolation_forest.contamination if self.is_trained else None,
            'n_estimators': self.isolation_forest.n_estimators if self.is_trained else None
        }
