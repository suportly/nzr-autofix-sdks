"""Stack trace and context extraction (T016)."""

import linecache
import os
import platform
import sys
import traceback
from typing import Any


def extract_frames(exc: BaseException, capture_locals: bool = True) -> list[dict]:
    """Extract stack frames from an exception."""
    frames = []
    tb = exc.__traceback__
    while tb is not None:
        frame_obj = tb.tb_frame
        lineno = tb.tb_lineno
        filename = frame_obj.f_code.co_filename
        function = frame_obj.f_code.co_name

        # Get source context
        context_line = linecache.getline(filename, lineno).strip()
        pre_context = []
        post_context = []
        for i in range(max(1, lineno - 2), lineno):
            line = linecache.getline(filename, i).rstrip()
            if line:
                pre_context.append(line)
        for i in range(lineno + 1, lineno + 3):
            line = linecache.getline(filename, i).rstrip()
            if line:
                post_context.append(line)

        frame_data = {
            'filename': os.path.basename(filename),
            'abs_path': filename,
            'function': function,
            'lineno': lineno,
            'context_line': context_line,
            'pre_context': pre_context,
            'post_context': post_context,
        }

        if capture_locals:
            local_vars = {}
            for k, v in frame_obj.f_locals.items():
                if k.startswith('__'):
                    continue
                try:
                    local_vars[k] = repr(v)[:200]
                except Exception:
                    local_vars[k] = '<unrepresentable>'
            frame_data['vars'] = local_vars

        frames.append(frame_data)
        tb = tb.tb_next

    return frames


def extract_exception_data(exc: BaseException, capture_locals: bool = True) -> dict:
    """Build structured exception data from an exception."""
    return {
        'type': type(exc).__name__,
        'value': str(exc)[:2000],
        'frames': extract_frames(exc, capture_locals),
    }


def extract_from_exc_info(exc_info: tuple, capture_locals: bool = True) -> dict:
    """Build exception data from sys.exc_info() tuple."""
    exc_type, exc_value, exc_tb = exc_info
    if exc_value is None:
        return {
            'type': 'UnknownError',
            'value': 'No exception info available',
            'frames': [],
        }
    return extract_exception_data(exc_value, capture_locals)


def get_runtime_context() -> dict:
    """Collect runtime environment info."""
    return {
        'runtime': {
            'name': platform.python_implementation(),
            'version': platform.python_version(),
        },
        'os': {
            'name': platform.system(),
            'version': platform.release(),
        },
    }
