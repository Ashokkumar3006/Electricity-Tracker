import sqlite3
from datetime import datetime
import json

class DatabaseManager:
    def __init__(self, db_path='energy_alerts.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Alert settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_name TEXT UNIQUE NOT NULL,
                threshold_value REAL NOT NULL,
                threshold_type TEXT NOT NULL,
                is_enabled BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Email recipients table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                is_active BOOLEAN DEFAULT 1,
                alert_types TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Alert history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                device_name TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                actual_value REAL NOT NULL,
                message TEXT NOT NULL,
                recipients_sent TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'sent'
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_alert_setting(self, setting_name, threshold_value, threshold_type, is_enabled=True):
        """Add or update an alert setting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO alert_settings 
            (setting_name, threshold_value, threshold_type, is_enabled, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (setting_name, threshold_value, threshold_type, is_enabled, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def get_alert_settings(self):
        """Get all alert settings"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM alert_settings ORDER BY created_at DESC')
        settings = cursor.fetchall()
        
        conn.close()
        
        return [
            {
                'id': row[0],
                'setting_name': row[1],
                'threshold_value': row[2],
                'threshold_type': row[3],
                'is_enabled': bool(row[4]),
                'created_at': row[5],
                'updated_at': row[6]
            }
            for row in settings
        ]
    
    def delete_alert_setting(self, setting_id):
        """Delete an alert setting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM alert_settings WHERE id = ?', (setting_id,))
        
        conn.commit()
        conn.close()
    
    def add_email_recipient(self, email, name, alert_types):
        """Add an email recipient"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        alert_types_json = json.dumps(alert_types)
        
        cursor.execute('''
            INSERT OR REPLACE INTO email_recipients 
            (email, name, alert_types, is_active)
            VALUES (?, ?, ?, 1)
        ''', (email, name, alert_types_json))
        
        conn.commit()
        conn.close()
    
    def get_email_recipients(self):
        """Get all email recipients"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM email_recipients WHERE is_active = 1')
        recipients = cursor.fetchall()
        
        conn.close()
        
        return [
            {
                'id': row[0],
                'email': row[1],
                'name': row[2],
                'is_active': bool(row[3]),
                'alert_types': json.loads(row[4]),
                'created_at': row[5]
            }
            for row in recipients
        ]
    
    def delete_email_recipient(self, recipient_id):
        """Delete an email recipient"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM email_recipients WHERE id = ?', (recipient_id,))
        
        conn.commit()
        conn.close()
    
    def add_alert_history(self, alert_type, device_name, threshold_value, actual_value, message, recipients_sent, status='sent'):
        """Add alert to history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        recipients_json = json.dumps(recipients_sent)
        
        cursor.execute('''
            INSERT INTO alert_history 
            (alert_type, device_name, threshold_value, actual_value, message, recipients_sent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (alert_type, device_name, threshold_value, actual_value, message, recipients_json, status))
        
        conn.commit()
        conn.close()
    
    def get_alert_history(self, limit=50):
        """Get alert history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM alert_history ORDER BY sent_at DESC LIMIT ?', (limit,))
        history = cursor.fetchall()
        
        conn.close()
        
        return [
            {
                'id': row[0],
                'alert_type': row[1],
                'device_name': row[2],
                'threshold_value': row[3],
                'actual_value': row[4],
                'message': row[5],
                'recipients_sent': json.loads(row[6]),
                'sent_at': row[7],
                'status': row[8]
            }
            for row in history
        ]
