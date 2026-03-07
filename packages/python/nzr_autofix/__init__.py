"""
NZR Autofix SDK — capture errors and send to NZR Manager for AI-powered diagnosis and auto-fix.

Usage:
    import nzr_autofix
    nzr_autofix.init(dsn="nzr://token@host/autofix/project_id")

    # Automatic capture via sys.excepthook
    # Or manual capture:
    try:
        risky_operation()
    except Exception as e:
        nzr_autofix.capture_exception(e)
"""

__version__ = '0.1.0'

_client = None


def init(dsn: str, **options) -> None:
    """Initialize the SDK. Must be called once at application startup.

    Args:
        dsn: Data Source Name for the autofix project.
        **options: Additional config options (environment, release, server_name,
                   capture_locals, sanitize_patterns, max_queue_size, send_timeout,
                   before_send).
    """
    global _client

    if _client is not None:
        import warnings
        warnings.warn('nzr_autofix.init() called more than once. Ignoring.', stacklevel=2)
        return

    from .config import Config
    from .client import Client

    config = Config(dsn=dsn, **options)
    _client = Client(config)


def capture_exception(exception: BaseException | None = None) -> str | None:
    """Capture an exception and send to the server.

    Args:
        exception: The exception to capture. If None, uses sys.exc_info().

    Returns:
        Event ID string if sent, None if not initialized or dropped.
    """
    if _client is None:
        return None
    return _client.capture_exception(exception)


def capture_message(message: str, level: str = 'error') -> str | None:
    """Capture a message without an exception.

    Args:
        message: The error message.
        level: Severity level (debug, info, warning, error, fatal).

    Returns:
        Event ID string if sent, None if not initialized or dropped.
    """
    if _client is None:
        return None
    return _client.capture_message(message, level)
