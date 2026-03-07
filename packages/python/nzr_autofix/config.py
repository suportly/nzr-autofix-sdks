"""SDK configuration (T015)."""

from dataclasses import dataclass, field
from typing import Callable
import platform
import socket


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


@dataclass
class Config:
    dsn: str = ''
    environment: str = 'production'
    release: str | None = None
    server_name: str = field(default_factory=lambda: socket.gethostname())
    capture_locals: bool = True
    sanitize_patterns: list[str] = field(default_factory=lambda: list(DEFAULT_SANITIZE_PATTERNS))
    max_queue_size: int = 100
    send_timeout: float = 5.0
    before_send: Callable | None = None

    @property
    def endpoint_url(self) -> str:
        """Extract the ingest URL from the DSN."""
        # DSN format: https://<token>@<host>/autofix/<project_id>
        # or nzr://<token>@autofix/<project_id>
        return self.dsn

    @property
    def is_configured(self) -> bool:
        return bool(self.dsn)
