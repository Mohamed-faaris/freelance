# Argus Mailing Service

A simple SMTP-based mailing service using FastAPI-Mail for the Argus backend.

## Features

- ✅ SMTP email sending
- ✅ HTML and plain text support
- ✅ Simple test email functionality
- ✅ Environment-based configuration
- ✅ Async/await support

## Configuration

Add these environment variables to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
USER=your-email@gmail.com
PASS=your-app-password
SMTP_USE_TLS=false
SMTP_USE_SSL=true

# Email Configuration
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Argus System

# Service Configuration
ENABLE_MAILING=true
```

## Usage

### Basic Test Email

```python
from services.mailService import send_test_email

# Send a test email
success = await send_test_email("recipient@example.com")
```

### Custom Email

```python
from services.mailService import mail_service, EmailData

email_data = EmailData(
    subject="Hello from Argus",
    recipients=["user@example.com"],
    body="This is a test message",
    html_body="<h1>Hello!</h1><p>This is a test message.</p>"
)

success = await mail_service.send_email(email_data)
```

### Test the Service

Run the test script:

```bash
python test_mail.py
```

## Dependencies

- `fastapi-mail==1.4.1` - FastAPI email integration
- Other dependencies are already in `requirements.txt`

## Gmail Setup

For Gmail SMTP:

1. Enable 2-factor authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password as `PASS`
4. Use port 465 (SSL) instead of 587 (TLS)

## Security Notes

- Never commit SMTP credentials to version control
- Use environment variables for all sensitive data
- Consider using dedicated email services (SendGrid, Mailgun) for production
- The service can be disabled by setting `ENABLE_MAILING=false`