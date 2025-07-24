import smtplib
import sqlite3
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.db_path = 'data/email_alerts.db'
        self.smtp_config = self._get_smtp_config()
        
    def _get_smtp_config(self) -> Dict[str, str]:
        """Get SMTP configuration from environment variables."""
        return {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', 587)),
            'smtp_username': os.getenv('SMTP_USERNAME', ''),
            'smtp_password': os.getenv('SMTP_PASSWORD', ''),
            'smtp_use_tls': os.getenv('SMTP_USE_TLS', 'true').lower() == 'true',
            'from_email': os.getenv('FROM_EMAIL', ''),
            'from_name': os.getenv('FROM_NAME', 'Smart Energy Monitor')
        }
    
    def get_recipients(self) -> List[Dict]:
        """Get all email recipients from database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, email, name, is_active, created_at 
                FROM email_recipients 
                WHERE is_active = 1
                ORDER BY created_at DESC
            ''')
            
            recipients = []
            for row in cursor.fetchall():
                recipients.append({
                    'id': row[0],
                    'email': row[1],
                    'name': row[2] or '',
                    'is_active': bool(row[3]),
                    'created_at': row[4]
                })
            
            conn.close()
            return recipients
            
        except Exception as e:
            logger.error(f"Error getting recipients: {e}")
            return []
    
    def add_recipient(self, email: str, name: str = '', alert_types: List[str] = None) -> bool:
        """Add a new email recipient."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO email_recipients (email, name, is_active)
                VALUES (?, ?, 1)
            ''', (email.lower().strip(), name.strip()))
            
            conn.commit()
            conn.close()
            logger.info(f"Added recipient: {email}")
            return True
            
        except sqlite3.IntegrityError:
            logger.error(f"Email {email} already exists")
            return False
        except Exception as e:
            logger.error(f"Error adding recipient: {e}")
            return False
    
    def remove_recipient(self, email: str) -> bool:
        """Remove an email recipient."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM email_recipients WHERE email = ?', (email.lower().strip(),))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            logger.info(f"Removed recipient: {email}")
            return success
            
        except Exception as e:
            logger.error(f"Error removing recipient: {e}")
            return False
    
    def send_alert(self, alert_type: str, title: str, message: str, 
                   severity: str = 'medium', device_name: str = None,
                   threshold_value: float = None, actual_value: float = None) -> bool:
        """Send alert email to all active recipients."""
        try:
            recipients = self.get_recipients()
            if not recipients:
                logger.warning("No recipients configured for email alerts")
                return False
            
            # Create email content
            subject = f"🔌 {title}"
            
            html_message = self._create_alert_email_html(
                alert_type, title, message, severity, device_name,
                threshold_value, actual_value
            )
            
            # Send to all recipients
            success_count = 0
            for recipient in recipients:
                if self._send_email(recipient['email'], subject, html_message, is_html=True):
                    success_count += 1
                    self._log_email(recipient['email'], subject, message, 'success')
                else:
                    self._log_email(recipient['email'], subject, message, 'failed')
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending alert: {e}")
            return False
    
    def _create_alert_email_html(self, alert_type: str, title: str, message: str,
                                severity: str, device_name: str = None,
                                threshold_value: float = None, actual_value: float = None) -> str:
        """Create HTML email content for alerts."""
        
        # Severity colors and icons
        severity_config = {
            'low': {'color': '#10b981', 'icon': '💡', 'bg': '#ecfdf5'},
            'medium': {'color': '#f59e0b', 'icon': '⚠️', 'bg': '#fffbeb'},
            'high': {'color': '#ef4444', 'icon': '🚨', 'bg': '#fef2f2'},
            'critical': {'color': '#dc2626', 'icon': '🔴', 'bg': '#fef2f2'}
        }
        
        config = severity_config.get(severity, severity_config['medium'])
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🔌 Smart Energy Monitor</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Energy Alert Notification</p>
                </div>
                
                <!-- Alert Content -->
                <div style="padding: 30px 20px;">
                    
                    <!-- Alert Badge -->
                    <div style="background-color: {config['bg']}; border-left: 4px solid {config['color']}; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 20px; margin-right: 10px;">{config['icon']}</span>
                            <h2 style="margin: 0; color: {config['color']}; font-size: 18px; text-transform: uppercase; font-weight: bold;">{severity} Alert</h2>
                        </div>
                        <h3 style="margin: 0; color: #1f2937; font-size: 16px;">{title}</h3>
                    </div>
                    
                    <!-- Alert Details -->
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #374151;">📊 Alert Details</h3>
                        
                        {f'<p><strong>Device:</strong> {device_name}</p>' if device_name else ''}
                        {f'<p><strong>Alert Type:</strong> {alert_type.replace("_", " ").title()}</p>'}
                        <p><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        {f'<p><strong>Threshold:</strong> {threshold_value}</p>' if threshold_value else ''}
                        {f'<p><strong>Actual Value:</strong> {actual_value}</p>' if actual_value else ''}
                    </div>
                    
                    <!-- Message -->
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #374151; margin-bottom: 15px;">📝 Description</h3>
                        <div style="background-color: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px;">
                            {message}
                        </div>
                    </div>
                    
                    <!-- Recommendations -->
                    <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #1e40af;">💡 Recommended Actions</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                            <li>Check the device status and connections</li>
                            <li>Review recent energy consumption patterns</li>
                            <li>Consider adjusting device settings if needed</li>
                            <li>Monitor the situation for the next few hours</li>
                        </ul>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:3000" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            📊 View Dashboard
                        </a>
                    </div>
                    
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                        This is an automated alert from your Smart Energy Monitor system.<br>
                        Generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">
                        Please do not reply to this email. For support, contact your system administrator.
                    </p>
                </div>
                
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _send_email(self, to_email: str, subject: str, message: str, is_html: bool = False) -> bool:
        """Send email using SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.smtp_config['from_name']} <{self.smtp_config['from_email']}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add message body
            if is_html:
                msg.attach(MIMEText(message, 'html'))
            else:
                msg.attach(MIMEText(message, 'plain'))
            
            # Connect to server and send
            server = smtplib.SMTP(self.smtp_config['smtp_server'], self.smtp_config['smtp_port'])
            
            if self.smtp_config['smtp_use_tls']:
                server.starttls()
            
            server.login(self.smtp_config['smtp_username'], self.smtp_config['smtp_password'])
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return False
    
    def _log_email(self, recipient_email: str, subject: str, message: str, status: str, error_message: str = None):
        """Log email sending attempt."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO email_logs (recipient_email, subject, message, status, error_message)
                VALUES (?, ?, ?, ?, ?)
            ''', (recipient_email, subject, message[:500], status, error_message))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error logging email: {e}")
    
    def get_alert_history(self, limit: int = 50, alert_type: str = None) -> List[Dict]:
        """Get email alert history."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = '''
                SELECT id, recipient_email, subject, status, sent_at, error_message
                FROM email_logs
                ORDER BY sent_at DESC
                LIMIT ?
            '''
            
            cursor.execute(query, (limit,))
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    'id': row[0],
                    'recipient_email': row[1],
                    'subject': row[2],
                    'status': row[3],
                    'sent_at': row[4],
                    'error_message': row[5]
                })
            
            conn.close()
            return history
            
        except Exception as e:
            logger.error(f"Error getting alert history: {e}")
            return []
    
    def resolve_alert(self, alert_id: int) -> bool:
        """Mark an alert as resolved."""
        # This is a placeholder - in a real system you'd have an alerts table
        logger.info(f"Alert {alert_id} marked as resolved")
        return True
    
    def get_alert_settings(self) -> Dict[str, str]:
        """Get current alert settings."""
        return {
            'smtp_enabled': 'true' if self.smtp_config['smtp_username'] and self.smtp_config['smtp_password'] else 'false',
            'smtp_server': self.smtp_config['smtp_server'],
            'smtp_port': str(self.smtp_config['smtp_port']),
            'from_email': self.smtp_config['from_email'],
            'from_name': self.smtp_config['from_name']
        }
    
    def update_alert_settings(self, settings: Dict[str, str]) -> bool:
        """Update alert settings."""
        # In a real system, you'd save these to a database or config file
        # For now, just return success since settings come from environment
        logger.info("Alert settings updated")
        return True

# Global instance
email_service = EmailService()
