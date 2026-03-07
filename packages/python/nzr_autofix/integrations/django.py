"""Django integration for nzr_autofix SDK.

Provides:
    - AutofixMiddleware: catches unhandled view exceptions
    - got_request_exception signal handler: catches ALL 500s (even swallowed by other middleware)
    - setup_celery_hooks(): captures Celery task failures
"""

import logging
import sys

logger = logging.getLogger('nzr_autofix')


# ---------------------------------------------------------------------------
# Middleware — catches exceptions in the view layer
# ---------------------------------------------------------------------------

class AutofixMiddleware:
    """Django middleware that captures unhandled exceptions and 500 responses.

    Usage in settings.py:
        MIDDLEWARE = [
            ...
            'nzr_autofix.integrations.django.AutofixMiddleware',
        ]

    Requires nzr_autofix.init(dsn=...) to be called first.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Connect the signal once on startup
        _connect_signal()

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        """Capture unhandled exceptions and send to NZR Autofix."""
        _capture(exception)
        return None  # let Django handle normally


# ---------------------------------------------------------------------------
# Signal handler — catches everything that generates a 500
# ---------------------------------------------------------------------------

_signal_connected = False


def _connect_signal():
    """Connect to Django's got_request_exception signal (idempotent)."""
    global _signal_connected
    if _signal_connected:
        return
    try:
        from django.core.signals import got_request_exception
        got_request_exception.connect(_on_request_exception)
        _signal_connected = True
        logger.debug('nzr_autofix: connected got_request_exception signal')
    except Exception:
        logger.debug('nzr_autofix: failed to connect signal', exc_info=True)


def _on_request_exception(sender, request=None, **kwargs):
    """Signal handler for got_request_exception."""
    exc_info = sys.exc_info()
    if exc_info[1] is not None:
        _capture(exc_info[1])


# ---------------------------------------------------------------------------
# Celery integration
# ---------------------------------------------------------------------------

def setup_celery_hooks():
    """Connect to Celery failure signals to auto-capture task exceptions.

    Usage in your celery.py or __init__.py:
        from nzr_autofix.integrations.django import setup_celery_hooks
        setup_celery_hooks()
    """
    try:
        from celery.signals import task_failure
    except ImportError:
        logger.debug('nzr_autofix: celery not installed, skipping hooks')
        return

    @task_failure.connect
    def _on_task_failure(sender=None, exception=None, traceback=None,
                         task_id=None, args=None, kwargs=None, **kw):
        if exception is not None:
            _capture(exception)
            logger.debug('nzr_autofix: captured celery task failure task=%s', task_id)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _capture(exception):
    """Safely capture an exception via the SDK."""
    try:
        import nzr_autofix
        nzr_autofix.capture_exception(exception)
    except Exception:
        logger.debug('nzr_autofix: failed to capture exception', exc_info=True)
