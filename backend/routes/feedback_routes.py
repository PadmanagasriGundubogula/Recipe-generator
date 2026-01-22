# routes/feedback_routes.py

from flask import Blueprint, request, jsonify
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import time
import logging

load_dotenv()

logger = logging.getLogger(__name__)

feedback_bp = Blueprint("feedback", __name__)

# Config for feedback mail & sheet
TARGET_MAIL = os.getenv("TARGET_MAIL", "sri325294@gmail.com")
GOOGLE_SHEET_URL = os.getenv("GOOGLE_SHEET_SCRIPT_URL")
SHEET_SECRET = os.getenv("SHEET_SECRET")  # optional secret for Apps Script validation


def send_to_sheet(payload, attempts=3, timeout=10):
    """Post payload to the configured Google Apps Script webhook with retry/backoff.

    Returns (ok: bool, response_text: str)
    """
    if not GOOGLE_SHEET_URL or GOOGLE_SHEET_URL == "your-google-script-url-here":
        return False, "No GOOGLE_SHEET_SCRIPT_URL configured"

    sheet_payload = dict(payload) if isinstance(payload, dict) else {}
    if SHEET_SECRET:
        sheet_payload["secret"] = SHEET_SECRET

    last_err = ""
    for i in range(attempts):
        try:
            r = requests.post(GOOGLE_SHEET_URL, json=sheet_payload, timeout=timeout)
            if r.status_code == 200:
                logger.info("Posted to Google Sheet successfully")
                return True, r.text
            else:
                last_err = f"HTTP {r.status_code}: {r.text}"
                logger.warning(f"Sheet post attempt {i+1} failed: {last_err}")
        except Exception as e:
            last_err = str(e)
            logger.warning(f"Sheet post attempt {i+1} exception: {last_err}")

        # exponential backoff (0.5s, 1s, 2s ...)
        backoff = 0.5 * (2 ** i)
        time.sleep(backoff)

    logger.error(f"All attempts to post to Google Sheet failed: {last_err}")
    return False, last_err

@feedback_bp.route("/feedback", methods=["POST"])
def send_feedback():
    try:
        data = request.get_json() or {}
        name = data.get("name")
        email = data.get("email")
        subject = data.get("subject")
        message = data.get("message")
        autosave = data.get("autosave", False)

        # If this is an autosave request, only `message` is required and we
        # will *only* post to Google Sheets (no email).
        if autosave:
            if not message:
                return jsonify({"error": "Message is required for autosave"}), 400

            sheet_success = False
            if GOOGLE_SHEET_URL and GOOGLE_SHEET_URL != "your-google-script-url-here":
                try:
                    ok, resp = send_to_sheet(data)
                    sheet_success = ok
                    if not ok:
                        logger.warning(f"Google Sheet autosave failed: {resp}")
                except Exception as e:
                    logger.exception("Failed to send to Google Sheets (autosave)")

            if sheet_success:
                return jsonify({"message": "Autosaved to Google Sheets"}), 200
            else:
                return jsonify({"error": "Failed to autosave to Google Sheets"}), 500

        # For normal submissions require all fields
        if not all([name, email, subject, message]):
            return jsonify({"error": "All fields are required"}), 400

        # --- 1. Send to Google Sheets (if configured) ---
        sheet_success = False
        if GOOGLE_SHEET_URL and GOOGLE_SHEET_URL != "your-google-script-url-here":
            try:
                ok, resp = send_to_sheet(data)
                sheet_success = ok
                if not ok:
                    logger.warning(f"Google Sheet manual send failed: {resp}")
            except Exception as e:
                logger.exception("Failed to send to Google Sheets (manual)")

        # --- 2. Send Email (Existing Logic) ---
        # SMTP Configuration from .env
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")

        # Check if SMTP is properly configured
        is_configured = (
            smtp_user and 
            smtp_user != "your-email@gmail.com" and 
            smtp_password and 
            smtp_password != "your-app-password"
        )

        if not is_configured:
            # Fallback for development
            print("====== NEW FEEDBACK RECEIVED (SMTP NOT CONFIGURED) ======")
            print(f"From: {name} ({email})")
            print(f"Subject: {subject}")
            print(f"Message: {message}")
            print(f"Google Sheet Sent: {sheet_success}")
            print("=========================================================")
            
            msg = "Feedback received."
            if sheet_success:
                msg += " Successfully recorded in Google Sheets."
            else:
                msg += " However, it could not be sent to Google Sheets or Email."
                
            return jsonify({
                "message": msg,
                "warning": "SMTP_NOT_CONFIGURED" if not is_configured else None
            }), 200

        # Create Email
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = TARGET_MAIL
        msg['Reply-To'] = email
        msg['Subject'] = f"RecipeGen Feedback: {subject}"

        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, 'plain'))

        # Send Email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return jsonify({"message": "Thank you! Your feedback has been sent successfully and recorded."}), 200

    except Exception as e:
        print(f"Feedback Error: {str(e)}")
        return jsonify({"error": f"Failed to process feedback: {str(e)}"}), 500
