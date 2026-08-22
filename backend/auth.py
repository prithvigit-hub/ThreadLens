import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional

import bcrypt as _bcrypt
from jose import JWTError, jwt

# Prefer the dedicated JWT secret, while allowing the managed session secret
# already present in this workspace to sign tokens without committing secrets.
JWT_SECRET = os.environ.get("JWT_SECRET") or os.environ.get("SESSION_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def send_verification_email(to_email: str, otp: str, name: str = "") -> bool:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP not configured — OTP:", otp)
        return False

    subject = "Thread Lens — Your Verification Code"
    display_name = name or to_email.split("@")[0]

    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #080a14; color: #e2e8f0; padding: 40px; max-width: 520px; margin: auto; border-radius: 16px; border: 1px solid #1e2942;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: rgba(124,58,237,0.15); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px;">
          <span style="font-size: 28px;">🔐</span>
        </div>
        <h1 style="color: #c4b5fd; font-size: 22px; margin: 0;">Thread Lens</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Security Dashboard</p>
      </div>
      <p style="color: #94a3b8; font-size: 15px; margin-bottom: 8px;">Hi <strong style="color: #e2e8f0;">{display_name}</strong>,</p>
      <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
      <div style="background: rgba(124,58,237,0.1); border: 2px solid rgba(124,58,237,0.4); border-radius: 12px; text-align: center; padding: 24px; margin-bottom: 24px;">
        <p style="color: #7c3aed; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px;">Verification Code</p>
        <p style="color: #c4b5fd; font-size: 42px; font-weight: 700; letter-spacing: 10px; margin: 0; font-family: monospace;">{otp}</p>
      </div>
      <p style="color: #475569; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Thread Lens <{SMTP_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
