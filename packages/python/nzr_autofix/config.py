"""SDK configuration (T015)."""

import logging
import os
from dataclasses import dataclass, field
from typing import Callable
import platform
import socket

logger = logging.getLogger('nzr_autofix')

DEFAULT_SANITIZE_PATTERNS = [
    r'(?i)password',
    r'(?i)secret',
    r'(?i)token',
    r'(?i)api_?key',
    r'(?i)authorization',
    r'(?i)session',
    r'(?i)cookie',
    r'(?i)credit.?card',
    r'(?i)private.?key',
]


def _env(key: str, default: str = '') -> str:
    """Read from environment variable."""
    return os.environ.get(key, default)


@dataclass
class Config:
    dsn: str = ''
    endpoint_url: str = ''
    environment: str = ''
    release: str | None = None
    server_name: str = field(default_factory=lambda: socket.gethostname())
    capture_locals: bool = True
    sanitize_patterns: list[str] = field(default_factory=lambda: list(DEFAULT_SANITIZE_PATTERNS))
    max_queue_size: int = 100
    send_timeout: float = 5.0
    before_send: Callable | None = None
    debug: bool = False

    def __post_init__(self):
        # Auto-load from environment variables when not explicitly set
        if not self.dsn:
            self.dsn = _env('NZR_AUTOFIX_DSN')
        if not self.endpoint_url:
            self.endpoint_url = _env('NZR_AUTOFIX_ENDPOINT_URL')
        if not self.environment:
            self.environment = _env('NZR_AUTOFIX_ENVIRONMENT', 'production')
        if self.release is None:
            env_release = _env('NZR_AUTOFIX_RELEASE')
            if env_release:
                self.release = env_release
        if not self.debug:
            self.debug = _env('NZR_AUTOFIX_DEBUG', '').lower() in ('1', 'true', 'yes')

        # Backwards compat: if dsn is an HTTP URL and no endpoint_url, use dsn as both
        if not self.endpoint_url and self.dsn and self.dsn.startswith(('http://', 'https://')):
            self.endpoint_url = self.dsn

        if self.debug and self.dsn:
            dsn_preview = self.dsn[:30] + '...' if len(self.dsn) > 30 else self.dsn
            logger.info('NZR Autofix initialized (DSN: %s, endpoint: %s)', dsn_preview, self.endpoint_url)
        elif self.debug and not self.dsn:
            logger.warning('NZR Autofix: no DSN configured, running in no-op mode')

    @property
    def is_configured(self) -> bool:
        return bool(self.dsn) and bool(self.endpoint_url)
