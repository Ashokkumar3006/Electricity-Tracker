import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL')
        self.sender_password = os.getenv('SENDER_PASSWORD')
        self.sender_name = os.getenv('SENDER_NAME', 'Smart Energy Monitor')
        
        if not self.sender_email or not self.sender_password:
            print("Warning: Email credentials not configured. Set SENDER_EMAIL and SENDER_PASSWORD environment variables.")
    
    def create_alert_email_template(self, alert_data: Dict) -> str:
        """Create a professional HTML email template for alerts"""
        severity_colors = {
            'low': '#10B981',      # Green
            'medium': '#F59E0B',   # Yellow
            'high': '#EF4444',     # Red
            'critical': '#DC2626'  # Dark Red
        }
        
        severity = alert_data.get('severity', 'medium')
        color = severity_colors.get(severity, '#F59E0B')
        
        html_template = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Energy Alert - {alert_data.get('alert_type', 'Unknown').title()}</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8fafc;
                }}
                .container {{
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, {color}, {color}dd);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }}
                .severity-badge {{
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    margin-top: 8px;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .alert-details {{
                    background: #f8fafc;
                    border-left: 4px solid {color};
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                }}
                .detail-label {{
                    font-weight: 600;
                    color: #4a5568;
                }}
                .detail-value {{
                    color: #2d3748;
                }}
                .recommendations {{
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .recommendations h3 {{
                    color: #0369a1;
                    margin-top: 0;
                }}
                .recommendations ul {{
                    margin: 10px 0;
                    padding-left: 20px;
                }}
                .recommendations li {{
                    margin: 5px 0;
                    color: #0c4a6e;
                }}
                .footer {{
                    background: #f8fafc;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 14px;
                }}
                .timestamp {{
                    color: #64748b;
                    font-size: 14px;
                    margin-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚡ Energy Alert</h1>
                    <div class="severity-badge">{severity.upper()} PRIORITY</div>
                </div>
                
                <div class="content">
                    <p>An energy anomaly has been detected in your smart energy monitoring system.</p>
                    
                    <div class="alert-details">
                        <div class="detail-row">
                            <span class="detail-label">Alert Type:</span>
                            <span class="detail-value">{alert_data.get('alert_type', 'Unknown').replace('_', ' ').title()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Device:</span>
                            <span class="detail-value">{alert_data.get('device_name', 'Unknown Device')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Threshold:</span>
                            <span class="detail-value">{alert_data.get('threshold_value', 0)} {alert_data.get('unit', 'W')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Actual Value:</span>
                            <span class="detail-value">{alert_data.get('actual_value', 0)} {alert_data.get('unit', 'W')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Exceeded By:</span>
                            <span class="detail-value">{alert_data.get('exceeded_by', 0)} {alert_data.get('unit', 'W')} ({alert_data.get('percentage_exceeded', 0):.1f}%)</span>
                        </div>
                    </div>
                    
                    <p><strong>Message:</strong> {alert_data.get('message', 'Energy consumption anomaly detected.')}</p>
                    
                    {self._get_recommendations_html(alert_data)}
                    
                    <div class="timestamp">
                        <strong>Detected at:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </div>
                </div>
                
                <div class="footer">
                    <p>This alert was generated by your Smart Energy Monitoring System.</p>
                    <p>For support, please contact your system administrator.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def _get_recommendations_html(self, alert_data: Dict) -> str:
        """Generate recommendations based on alert type"""
        alert_type = alert_data.get('alert_type', '')
        device_name = alert_data.get('device_name', 'device')
        
        recommendations = []
        
        if alert_type == 'peak_power':
            recommendations = [
                f"Check if the {device_name} is operating normally",
                "Consider reducing the load on this device",
                "Verify that the device is not malfunctioning",
                "Monitor the device for the next few hours"
            ]
        elif alert_type == 'energy_spike':
            recommendations = [
                f"Investigate sudden increase in {device_name} energy consumption",
                "Check for any recent changes in device usage patterns",
                "Consider scheduling high-energy tasks during off-peak hours",
                "Review device settings for energy efficiency"
            ]
        elif alert_type == 'device_anomaly':
            recommendations = [
                f"Inspect {device_name} for unusual behavior",
                "Check device connections and power supply",
                "Consider professional maintenance if issues persist",
                "Monitor device performance closely"
            ]
        
        if recommendations:
            recommendations_html = """
            <div class="recommendations">
                <h3>💡 Recommended Actions</h3>
                <ul>
            """
            for rec in recommendations:
                recommendations_html += f"<li>{rec}</li>"
            recommendations_html += """
                </ul>
            </div>
            """
            return recommendations_html
        
        return ""
    
    def send_alert_email(self, recipients: List[str], alert_data: Dict) -> Dict:
        """Send alert email to recipients"""
        if not self.sender_email or not self.sender_password:
            return {
                'success': False,
                'error': 'Email credentials not configured',
                'sent_to': []
            }
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['Subject'] = f"🚨 Energy Alert: {alert_data.get('alert_type', 'Unknown').replace('_', ' ').title()} - {alert_data.get('device_name', 'Device')}"
            
            # Create HTML content
            html_content = self.create_alert_email_template(alert_data)
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Create plain text version
            text_content = self._create_text_version(alert_data)
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            
            sent_to = []
            failed_recipients = []
            
            for recipient in recipients:
                try:
                    msg['To'] = recipient
                    server.send_message(msg)
                    sent_to.append(recipient)
                    del msg['To']  # Remove To header for next recipient
                except Exception as e:
                    failed_recipients.append({'email': recipient, 'error': str(e)})
            
            server.quit()
            
            return {
                'success': True,
                'sent_to': sent_to,
                'failed': failed_recipients,
                'total_sent': len(sent_to)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'sent_to': []
            }
    
    def _create_text_version(self, alert_data: Dict) -> str:
        """Create plain text version of the alert email"""
        return f"""
ENERGY ALERT - {alert_data.get('severity', 'MEDIUM').upper()} PRIORITY

An energy anomaly has been detected in your smart energy monitoring system.

Alert Details:
- Alert Type: {alert_data.get('alert_type', 'Unknown').replace('_', ' ').title()}
- Device: {alert_data.get('device_name', 'Unknown Device')}
- Threshold: {alert_data.get('threshold_value', 0)} {alert_data.get('unit', 'W')}
- Actual Value: {alert_data.get('actual_value', 0)} {alert_data.get('unit', 'W')}
- Exceeded By: {alert_data.get('exceeded_by', 0)} {alert_data.get('unit', 'W')} ({alert_data.get('percentage_exceeded', 0):.1f}%)

Message: {alert_data.get('message', 'Energy consumption anomaly detected.')}

Detected at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This alert was generated by your Smart Energy Monitoring System.
For support, please contact your system administrator.
        """
    
    def send_test_email(self, recipient: str) -> Dict:
        """Send a test email"""
        test_alert_data = {
            'alert_type': 'peak_power',
            'device_name': 'Test Device',
            'threshold_value': 1000,
            'actual_value': 1500,
            'exceeded_by': 500,
            'percentage_exceeded': 50.0,
            'unit': 'W',
            'severity': 'medium',
            'message': 'This is a test alert to verify your email configuration.'
        }
        
        return self.send_alert_email([recipient], test_alert_data)
