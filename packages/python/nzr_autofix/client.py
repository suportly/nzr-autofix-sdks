"""SDK client — combines config, context, sanitizer, transport (T019)."""

import logging
import sys
import uuid
from datetime import datetime, timezone

from .config import Config
from .context import extract_exception_data, extract_from_exc_info, get_runtime_context
from .sanitizer import compile_patterns, sanitize_frames
from .transport import Transport

logger = logging.getLogger('nzr_autofix')

SDK_NAME = 'nzr-autofix'
SDK_VERSION = '0.1.0'


class Client:
    """Core SDK client."""

    def __init__(self, config: Config):
        self.config = config
        self._transport = Transport(
            endpoint_url=config.endpoint_url,
            dsn=config.dsn,
            timeout=config.send_timeout,
            max_queue_size=config.max_queue_size,
        )
        self._patterns = compile_patterns(config.sanitize_patterns)
        self._original_excepthook = sys.excepthook
        self._install_excepthook()

    def _install_excepthook(self):
        """Install global exception hook to capture unhandled exceptions."""
        original = self._original_excepthook

        def hook(exc_type, exc_value, exc_tb):
            self.capture_exception(exc_value)
            original(exc_type, exc_value, exc_tb)

        sys.excepthook = hook

    def capture_exception(self, exception: BaseException | None = None) -> str | None:
        """Capture an exception and send to the server.

        Returns event_id if sent, None if dropped.
        """
        if exception is None:
            exc_info = sys.exc_info()
            if exc_info[1] is None:
                return None
            exc_data = extract_from_exc_info(exc_info, self.config.capture_locals)
        else:
            exc_data = extract_exception_data(exception, self.config.capture_locals)

        return self._send_event(exc_data)

    def capture_message(self, message: str, level: str = 'error') -> str | None:
        """Capture a message (no exception) and send."""
        exc_data = {
            'type': 'Message',
            'value': message,
            'frames': [],
        }
        return self._send_event(exc_data, level=level)

    def _send_event(self, exc_data: dict, level: str = 'error') -> str | None:
        """Build and send event payload."""
        # Sanitize local vars
        if exc_data.get('frames'):
            exc_data['frames'] = sanitize_frames(exc_data['frames'], self._patterns)

        event_id = uuid.uuid4().hex

        payload = {
            'event_id': event_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'exception': exc_data,
            'environment': self.config.environment,
            'release': self.config.release or '',
            'server_name': self.config.server_name,
            'sdk': {'name': SDK_NAME, 'version': SDK_VERSION},
            'contexts': get_runtime_context(),
        }

        # before_send hook
        if self.config.before_send:
            payload = self.config.before_send(payload)
            if payload is None:
                return None

        if self._transport.send(payload):
            return event_id
        return None

    def close(self):
        """Restore original excepthook."""
        sys.excepthook = self._original_excepthook
