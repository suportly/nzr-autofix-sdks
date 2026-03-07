"""Background thread transport for sending events (T018)."""

import json
import logging
import queue
import threading
import time
import urllib.request
import urllib.error

logger = logging.getLogger('nzr_autofix')


class Transport:
    """Non-blocking HTTP transport using a background daemon thread."""

    def __init__(self, dsn: str, timeout: float = 5.0, max_queue_size: int = 100):
        self._dsn = dsn
        self._timeout = timeout
        self._queue: queue.Queue = queue.Queue(maxsize=max_queue_size)
        self._worker = threading.Thread(target=self._run, daemon=True)
        self._worker.start()

    def send(self, payload: dict) -> bool:
        """Enqueue a payload for async sending. Returns False if queue is full."""
        try:
            self._queue.put_nowait(payload)
            return True
        except queue.Full:
            logger.warning('nzr_autofix: event queue full, dropping event')
            return False

    def _run(self):
        """Worker loop — drains queue and sends events."""
        while True:
            try:
                payload = self._queue.get(block=True)
                self._send_with_retry(payload)
            except Exception:
                logger.exception('nzr_autofix: transport worker error')

    def _send_with_retry(self, payload: dict, max_retries: int = 3):
        """Send payload with exponential backoff retry."""
        body = json.dumps(payload, default=str).encode('utf-8')

        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(
                    self._dsn,
                    data=body,
                    headers={
                        'Content-Type': 'application/json',
                        'X-Autofix-DSN': self._dsn,
                    },
                    method='POST',
                )
                urllib.request.urlopen(req, timeout=self._timeout)
                return  # success
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    retry_after = int(e.headers.get('Retry-After', 5))
                    time.sleep(retry_after)
                elif e.code >= 500:
                    time.sleep(2 ** attempt)
                else:
                    logger.warning('nzr_autofix: HTTP %d sending event', e.code)
                    return  # don't retry 4xx (except 429)
            except (urllib.error.URLError, OSError):
                time.sleep(2 ** attempt)

        logger.warning('nzr_autofix: failed to send event after %d retries', max_retries)
