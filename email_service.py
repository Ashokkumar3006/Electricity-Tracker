import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
from typing import List, Dict, Any
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', '')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.recipient_emails = os.getenv('RECIPIENT_EMAILS', '').split(',')
        self.recipient_emails = [email.strip() for email in self.recipient_emails if email.strip()]
        
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return bool(self.sender_email and self.sender_password and self.recipient_emails)
    
    def get_config_status(self) -> Dict[str, Any]:
        """Get email configuration status"""
        return {
            'configured': self.is_configured(),
            'sender_email': self.sender_email,
            'recipient_count': len(self.recipient_emails),
            'smtp_server': self.smtp_server,
            'smtp_port': self.smtp_port
        }
    
    def create_alert_email(self, alert_type: str, data: Dict[str, Any]) -> str:
        """Create HTML email content for alerts"""
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if alert_type == "peak_energy":
            subject = "⚡ Peak Energy Alert - High Power Consumption Detected"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #dc2626; margin: 0; font-size: 28px;">⚡ Peak Energy Alert</h1>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">High power consumption detected</p>
                    </div>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #dc2626; margin: 0 0 10px 0;">Alert Details</h3>
                        <p style="margin: 5px 0; color: #333;"><strong>Current Power:</strong> {data.get('current_power', 'N/A')} W</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Threshold:</strong> {data.get('threshold', 'N/A')} W</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Time:</strong> {current_time}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Estimated Cost:</strong> ₹{data.get('estimated_cost', 'N/A')}/hour</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">Top Consuming Devices</h3>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                            {self._format_device_list(data.get('top_devices', []))}
                        </div>
                    </div>
                    
                    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #0ea5e9; margin: 0 0 10px 0;">💡 Recommendations</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #333;">
                            <li>Turn off non-essential devices immediately</li>
                            <li>Check for devices running unnecessarily</li>
                            <li>Consider shifting high-power activities to off-peak hours</li>
                            <li>Monitor usage for the next hour to prevent bill spikes</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px; margin: 0;">Smart Energy Monitor - Automated Alert System</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        elif alert_type == "daily_summary":
            subject = "📊 Daily Energy Summary"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #059669; margin: 0; font-size: 28px;">📊 Daily Energy Summary</h1>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">{current_time}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 10px; text-align: center;">
                            <h3 style="color: #0ea5e9; margin: 0 0 10px 0;">Total Energy</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">{data.get('total_energy', 'N/A')} kWh</p>
                        </div>
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px; text-align: center;">
                            <h3 style="color: #059669; margin: 0 0 10px 0;">Estimated Cost</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">₹{data.get('total_cost', 'N/A')}</p>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">Device Breakdown</h3>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                            {self._format_device_summary(data.get('device_summary', {}))}
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px; margin: 0;">Smart Energy Monitor - Daily Report</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        else:  # manual or test alert
            subject = "🔔 Smart Energy Monitor - Manual Alert"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🔔 Manual Alert</h1>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Smart Energy Monitor</p>
                    </div>
                    
                    <div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #7c3aed; margin: 0 0 10px 0;">Current Status</h3>
                        <p style="margin: 5px 0; color: #333;"><strong>Time:</strong> {current_time}</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Message:</strong> {data.get('message', 'Manual alert triggered from dashboard')}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px; margin: 0;">This is a test/manual alert from your Smart Energy Monitor</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        return subject, html_content
    
    def _format_device_list(self, devices: List[Dict]) -> str:
        """Format device list for email"""
        if not devices:
            return "<p style='color: #666; margin: 0;'>No device data available</p>"
        
        html = ""
        for device in devices[:5]:  # Top 5 devices
            html += f"""
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="font-weight: bold; color: #333;">{device.get('name', 'Unknown')}</span>
                <span style="color: #666;">{device.get('power', 0)} W</span>
            </div>
            """
        return html
    
    def _format_device_summary(self, devices: Dict) -> str:
        """Format device summary for email"""
        if not devices:
            return "<p style='color: #666; margin: 0;'>No device data available</p>"
        
        html = ""
        for device_name, data in devices.items():
            html += f"""
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="font-weight: bold; color: #333;">{device_name}</span>
                <span style="color: #666;">{data.get('energy', 0)} kWh (₹{data.get('cost', 0)})</span>
            </div>
            """
        return html
    
    def send_email(self, alert_type: str, data: Dict[str, Any]) -> bool:
        """Send email alert"""
        if not self.is_configured():
            print("Email service not configured")
            return False
        
        try:
            subject, html_content = self.create_alert_email(alert_type, data)
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = ", ".join(self.recipient_emails)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, self.recipient_emails, message.as_string())
            
            print(f"Email sent successfully: {subject}")
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    def send_test_email(self) -> bool:
        """Send a test email"""
        test_data = {
            'message': 'This is a test email from your Smart Energy Monitor system.',
            'current_power': 1500,
            'threshold': 2000,
            'estimated_cost': 45
        }
        return self.send_email("test", test_data)

# Global email service instance
email_service = EmailService()

if __name__ == "__main__":
    # Test the email service
    print("Testing Energy Alert Email Service...")
    
    # Test data
    test_alert_data = {
        'current_power': 2500.5,
        'threshold': 3000,
        'estimated_cost': 50,
        'top_devices': [
            {'name': 'Air Conditioner', 'power': 1500.0},
            {'name': 'Water Heater', 'power': 800.0},
            {'name': 'Refrigerator', 'power': 200.5}
        ]
    }
    
    if email_service.is_configured():
        result = email_service.send_email("peak_energy", test_alert_data)
        print(result)
    else:
        config_status = email_service.get_config_status()
        print("Email configuration not valid. Please set environment variables:")
        print(f"- Sender Email: {config_status['sender_email']}")
        print(f"- Recipient Count: {config_status['recipient_count']}")
        print(f"- SMTP Server: {config_status['smtp_server']}")
        print(f"- SMTP Port: {config_status['smtp_port']}")
