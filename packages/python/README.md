# NZR Autofix Python SDK

Capture Python exceptions and send them to NZR Manager for AI-powered diagnosis and auto-fix.

## Installation

```bash
pip install nzr-autofix
```

## Quick Start

```python
import nzr_autofix

nzr_autofix.init(dsn="https://your-server.com/api/autofix/ingest/")

# Unhandled exceptions are captured automatically via sys.excepthook
```

## Django Integration

Add the middleware to automatically capture all unhandled view exceptions and 500 errors:

```python
# settings.py
MIDDLEWARE = [
    'nzr_autofix.integrations.django.AutofixMiddleware',
    # ...other middleware
]
```

The middleware also connects to Django's `got_request_exception` signal to capture all 500 responses.

## Celery Integration

Capture Celery task failures:

```python
# celery.py
from nzr_autofix.integrations.django import setup_celery_hooks
setup_celery_hooks()
```

## Manual Capture

```python
try:
    risky_operation()
except Exception as e:
    nzr_autofix.capture_exception(e)

# Or capture a message
nzr_autofix.capture_message("Something unexpected happened")
```

## Configuration

```python
nzr_autofix.init(
    dsn="https://your-server.com/api/autofix/ingest/",
    environment="production",
    release="1.2.3",
    capture_locals=True,
    sanitize_patterns=["password", "secret", "token"],
    before_send=lambda event: event,  # return None to drop
)
```

## License

MIT
