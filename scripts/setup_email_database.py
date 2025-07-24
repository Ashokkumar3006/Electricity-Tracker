import sqlite3
import os

def setup_email_database():
    """Create and initialize the email alerts database."""
    try:
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Connect to database
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
        
        # Create alert_settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default settings
        default_settings = [
            ('smtp_enabled', 'true'),
            ('alert_frequency', 'immediate'),
            ('max_alerts_per_hour', '10'),
            ('quiet_hours_start', '22:00'),
            ('quiet_hours_end', '06:00')
        ]
        
        for key, value in default_settings:
            cursor.execute('''
                INSERT OR IGNORE INTO alert_settings (setting_key, setting_value)
                VALUES (?, ?)
            ''', (key, value))
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("✅ Email database setup completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error setting up email database: {e}")
        return False

if __name__ == "__main__":
    setup_email_database()
