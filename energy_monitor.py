import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnergyMonitor:
    def __init__(self, email_service=None):
        self.email_service = email_service
        self.is_monitoring = False
        self.monitoring_thread = None
        self.energy_data = []
        self.device_data = {}
        
        # Thresholds
        self.peak_power_threshold = float(os.getenv('PEAK_POWER_THRESHOLD', '2000'))  # Watts
        self.daily_energy_threshold = float(os.getenv('DAILY_ENERGY_THRESHOLD', '50'))  # kWh
        self.daily_cost_threshold = float(os.getenv('COST_THRESHOLD', '500'))   # Rupees
        
        # Alert management
        self.alert_history = []
        self.last_alert_times = {}
        self.cooldown_minutes = 15  # Minimum time between similar alerts
        
        # Current metrics
        self.current_power = 0
        self.daily_energy = 0
        self.daily_cost = 0
    
    def update_data(self, energy_data: List[Dict], device_data: Dict = None):
        """Update energy and device data"""
        self.energy_data = energy_data or []
        self.device_data = device_data or {}
        
        # Calculate current metrics
        if self.energy_data:
            latest_record = self.energy_data[-1]
            self.current_power = latest_record.get('power', 0)
            
            # Calculate daily totals
            today = datetime.now().date()
            daily_records = [
                record for record in self.energy_data
                if datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00')).date() == today
            ]
            
            self.daily_energy = sum(record.get('energy_kwh', 0) for record in daily_records)
            self.daily_cost = self.daily_energy * 6.0  # ₹6 per kWh
    
    def start_monitoring(self, energy_data: List[Dict] = None):
        """Start energy monitoring"""
        if self.is_monitoring:
            return {'success': False, 'message': 'Monitoring already active'}
        
        if not self.email_service or not self.email_service.is_configured():
            return {'success': False, 'message': 'Email service not configured'}
        
        if energy_data:
            self.update_data(energy_data)
        
        self.is_monitoring = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        
        logger.info("Energy monitoring started")
        return {'success': True, 'message': 'Monitoring started successfully'}
    
    def stop_monitoring(self):
        """Stop energy monitoring"""
        if not self.is_monitoring:
            return {'success': False, 'message': 'Monitoring not active'}
        
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        
        logger.info("Energy monitoring stopped")
        return {'success': True, 'message': 'Monitoring stopped successfully'}
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                self._check_thresholds()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(60)
    
    def _check_thresholds(self):
        """Check if any thresholds are exceeded"""
        current_time = datetime.now()
        
        # Check peak power threshold
        if self.current_power > self.peak_power_threshold:
            if self._should_send_alert('peak_power', current_time):
                self._send_peak_power_alert()
        
        # Check daily energy threshold
        if self.daily_energy > self.daily_energy_threshold:
            if self._should_send_alert('daily_energy', current_time):
                self._send_daily_energy_alert()
        
        # Check daily cost threshold
        if self.daily_cost > self.daily_cost_threshold:
            if self._should_send_alert('daily_cost', current_time):
                self._send_daily_cost_alert()
    
    def _should_send_alert(self, alert_type: str, current_time: datetime) -> bool:
        """Check if enough time has passed since last alert of this type"""
        last_alert = self.last_alert_times.get(alert_type)
        if not last_alert:
            return True
        
        time_diff = current_time - last_alert
        return time_diff.total_seconds() > (self.cooldown_minutes * 60)
    
    def _send_peak_power_alert(self):
        """Send peak power alert"""
        alert_data = {
            'current_power': self.current_power,
            'threshold': self.peak_power_threshold,
            'estimated_cost': self.current_power * 0.006,  # ₹0.006 per Wh
            'top_devices': self._get_top_devices()
        }
        
        success = self.email_service.send_email('peak_energy', alert_data)
        self._log_alert('peak_power', f'Peak power alert: {self.current_power}W', success, alert_data)
        
        if success:
            self.last_alert_times['peak_power'] = datetime.now()
    
    def _send_daily_energy_alert(self):
        """Send daily energy alert"""
        alert_data = {
            'daily_energy': self.daily_energy,
            'threshold': self.daily_energy_threshold,
            'estimated_cost': self.daily_cost,
            'device_summary': self._get_device_summary()
        }
        
        success = self.email_service.send_email('daily_summary', alert_data)
        self._log_alert('daily_energy', f'Daily energy alert: {self.daily_energy}kWh', success, alert_data)
        
        if success:
            self.last_alert_times['daily_energy'] = datetime.now()
    
    def _send_daily_cost_alert(self):
        """Send daily cost alert"""
        alert_data = {
            'daily_cost': self.daily_cost,
            'threshold': self.daily_cost_threshold,
            'daily_energy': self.daily_energy,
            'device_summary': self._get_device_summary()
        }
        
        success = self.email_service.send_email('daily_summary', alert_data)
        self._log_alert('daily_cost', f'Daily cost alert: ₹{self.daily_cost}', success, alert_data)
        
        if success:
            self.last_alert_times['daily_cost'] = datetime.now()
    
    def _get_top_devices(self) -> List[Dict]:
        """Get top power consuming devices"""
        devices = []
        for name, data in self.device_data.items():
            devices.append({
                'name': name,
                'power': data.get('currentPower', 0)
            })
        
        return sorted(devices, key=lambda x: x['power'], reverse=True)[:5]
    
    def _get_device_summary(self) -> Dict:
        """Get device energy summary"""
        summary = {}
        for name, data in self.device_data.items():
            summary[name] = {
                'energy': data.get('totalEnergy', 0),
                'cost': data.get('totalEnergy', 0) * 6.0
            }
        return summary
    
    def _log_alert(self, alert_type: str, message: str, success: bool, data: Dict):
        """Log alert to history"""
        alert_record = {
            'timestamp': datetime.now().isoformat(),
            'type': alert_type,
            'message': message,
            'status': 'sent' if success else 'failed',
            'data': data
        }
        
        self.alert_history.append(alert_record)
        
        # Keep only last 100 alerts
        if len(self.alert_history) > 100:
            self.alert_history = self.alert_history[-100:]
    
    def send_manual_alert(self, message: str = None) -> Dict[str, Any]:
        """Send manual alert"""
        if not self.email_service or not self.email_service.is_configured():
            return {'success': False, 'error': 'Email service not configured'}
        
        alert_data = {
            'message': message or 'Manual alert triggered from dashboard',
            'current_power': self.current_power,
            'daily_energy': self.daily_energy,
            'daily_cost': self.daily_cost,
            'timestamp': datetime.now().isoformat()
        }
        
        success = self.email_service.send_email('manual', alert_data)
        self._log_alert('manual', alert_data['message'], success, alert_data)
        
        return {
            'success': success,
            'message': 'Manual alert sent successfully' if success else 'Failed to send manual alert'
        }
    
    def get_alert_history(self, limit: int = 50) -> List[Dict]:
        """Get alert history"""
        return self.alert_history[-limit:] if self.alert_history else []
    
    def get_status(self) -> Dict[str, Any]:
        """Get monitoring status"""
        return {
            'is_monitoring': self.is_monitoring,
            'email_configured': self.email_service.is_configured() if self.email_service else False,
            'thresholds': {
                'peak_power': self.peak_power_threshold,
                'daily_energy': self.daily_energy_threshold,
                'daily_cost': self.daily_cost_threshold
            },
            'current_metrics': {
                'power': self.current_power,
                'daily_energy': self.daily_energy,
                'daily_cost': self.daily_cost
            },
            'alert_history_count': len(self.alert_history),
            'last_alert_times': self.last_alert_times,
            'cooldown_minutes': self.cooldown_minutes
        }

# Global energy monitor instance
energy_monitor = EnergyMonitor()
