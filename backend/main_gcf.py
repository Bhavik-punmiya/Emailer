import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import base64
from datetime import datetime
import logging
from dotenv import load_dotenv
import functions_framework
from supabase import create_client, Client
import markdown
import json
from campaign_tracker import campaign_tracker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Email configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_DISPLAY_NAME = os.getenv("EMAIL_DISPLAY_NAME", "Bulk Email Sender")

# Authentication function
def get_current_user(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise Exception("No valid authorization header")
        token = auth_header.split(' ')[1]
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise Exception("Invalid authentication credentials")
        return user_response.user
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None

# Email sending function
def send_single_email(contact, template, smtp_server, attachments=[]):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = template["subject"]
        msg["From"] = f"{EMAIL_DISPLAY_NAME} <{EMAIL_USER}>"
        msg["To"] = contact["email"]
        personalized_body = template["body"].replace("{name}", contact["name"])
        personalized_body = personalized_body.replace("{email}", contact["email"])
        if contact.get("company"):
            personalized_body = personalized_body.replace("{company}", contact["company"])
        if contact.get("job_title"):
            personalized_body = personalized_body.replace("{jobTitle}", contact["job_title"])
        text = personalized_body
        if personalized_body.startswith("<") and personalized_body.endswith(">"):
            html = personalized_body
        else:
            html = markdown.markdown(personalized_body, extensions=['extra'])
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        msg.attach(part1)
        msg.attach(part2)
        for attachment in attachments:
            try:
                file_content = base64.b64decode(attachment["content"])
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file_content)
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename= {attachment["filename"]}')
                msg.attach(part)
            except Exception as e:
                logger.error(f"Failed to attach file {attachment['filename']}: {e}")
        smtp_server.sendmail(EMAIL_USER, contact["email"], msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {contact['email']}: {e}")
        return False

def send_bulk_emails_task(campaign_id, contacts, template, user_id, attachments=[]):
    try:
        logger.info(f"Starting email campaign {campaign_id} for {len(contacts)} contacts")
        is_temp_campaign = campaign_id.startswith("temp_")
        if is_temp_campaign:
            campaign_tracker.update_temp_campaign(campaign_id, status="running", progress=0.0)
        context = ssl.create_default_context()
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls(context=context)
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            sent_count = 0
            failed_count = 0
            for i, contact in enumerate(contacts):
                try:
                    success = send_single_email(contact, template, server, attachments)
                    if success:
                        sent_count += 1
                    else:
                        failed_count += 1
                    progress = (i + 1) / len(contacts) * 100
                    if is_temp_campaign:
                        campaign_tracker.update_temp_campaign(
                            campaign_id, status="running", progress=progress, sent=sent_count, failed=failed_count
                        )
                except Exception as e:
                    logger.error(f"Error sending to {contact['email']}: {e}")
                    failed_count += 1
            final_status = "completed" if failed_count == 0 else "completed_with_errors"
            if is_temp_campaign:
                campaign_tracker.update_temp_campaign(
                    campaign_id, status=final_status, progress=100.0, sent=sent_count, failed=failed_count
                )
            logger.info(f"Campaign {campaign_id} completed: {sent_count} sent, {failed_count} failed")
    except Exception as e:
        logger.error(f"Campaign {campaign_id} failed: {e}")
        if is_temp_campaign:
            campaign_tracker.update_temp_campaign(campaign_id, status="failed", progress=0.0)

@functions_framework.http
def email_api(request):
    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    try:
        path = request.path
        method = request.method
        if path == "/" and method == "GET":
            return json.dumps({"message": "Bulk Email Sender API", "version": "1.0.0"}), 200, headers
        elif path == "/api/test-auth" and method == "GET":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            return json.dumps({"message": "Authentication successful", "user_id": user.id}), 200, headers
        elif path == "/api/send-emails" and method == "POST":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            data = request.get_json()
            if not data:
                return json.dumps({"error": "No data provided"}), 400, headers
            campaign_id = f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user.id}"
            campaign_tracker.init_temp_campaign(campaign_id, len(data.get("contacts", [])))
            import threading
            thread = threading.Thread(
                target=send_bulk_emails_task,
                args=(campaign_id, data.get("contacts", []), data.get("template", {}), user.id, data.get("attachments", []))
            )
            thread.start()
            return json.dumps({
                "message": "Email campaign started",
                "campaign_id": campaign_id,
                "total_contacts": len(data.get("contacts", []))
            }), 200, headers
        elif path.startswith("/api/campaigns/") and path.endswith("/status") and method == "GET":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            campaign_id = path.split("/")[-2]
            status = campaign_tracker.get_temp_campaign(campaign_id)
            if not status:
                return json.dumps({"error": "Campaign not found"}), 404, headers
            return json.dumps(status), 200, headers
        elif path == "/api/templates" and method == "GET":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            try:
                response = supabase.table("email_templates").select("*").eq("user_id", user.id).execute()
                templates = response.data if response.data else []
                return json.dumps(templates), 200, headers
            except Exception as e:
                logger.error(f"Error fetching templates: {e}")
                return json.dumps({"error": "Failed to fetch templates"}), 500, headers
        elif path == "/api/templates" and method == "POST":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            data = request.get_json()
            if not data:
                return json.dumps({"error": "No data provided"}), 400, headers
            try:
                template_data = {
                    "user_id": user.id,
                    "name": data.get("name"),
                    "subject": data.get("subject"),
                    "body": data.get("body"),
                    "attachments": data.get("attachments", [])
                }
                response = supabase.table("email_templates").insert(template_data).execute()
                if response.data:
                    return json.dumps(response.data[0]), 201, headers
                else:
                    return json.dumps({"error": "Failed to create template"}), 500, headers
            except Exception as e:
                logger.error(f"Error creating template: {e}")
                return json.dumps({"error": "Failed to create template"}), 500, headers
        elif path == "/api/dashboard/stats" and method == "GET":
            user = get_current_user(request)
            if not user:
                return json.dumps({"error": "Invalid authentication"}), 401, headers
            try:
                templates_response = supabase.table("email_templates").select("id").eq("user_id", user.id).execute()
                templates_count = len(templates_response.data) if templates_response.data else 0
                total_campaigns = 0
                total_emails_sent = 0
                total_emails_failed = 0
                stats = {
                    "total_campaigns": total_campaigns,
                    "total_emails_sent": total_emails_sent,
                    "total_emails_failed": total_emails_failed,
                    "recent_campaigns": [],
                    "templates_count": templates_count
                }
                return json.dumps(stats), 200, headers
            except Exception as e:
                logger.error(f"Error fetching dashboard stats: {e}")
                return json.dumps({"error": "Failed to fetch dashboard stats"}), 500, headers
        else:
            return json.dumps({"error": "Endpoint not found"}), 404, headers
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return json.dumps({"error": "Internal server error"}), 500, headers 