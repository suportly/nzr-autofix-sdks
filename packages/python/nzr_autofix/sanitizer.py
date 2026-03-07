"""Client-side sensitive data scrubbing (T017)."""

import re

FILTERED = '[FILTERED]'


def sanitize_vars(data: dict, patterns: list[re.Pattern]) -> dict:
    """Recursively sanitize dict values whose keys match sensitive patterns."""
    result = {}
    for key, value in data.items():
        if any(p.search(str(key)) for p in patterns):
            result[key] = FILTERED
        elif isinstance(value, dict):
            result[key] = sanitize_vars(value, patterns)
        else:
            result[key] = value
    return result


def sanitize_frames(frames: list[dict], patterns: list[re.Pattern]) -> list[dict]:
    """Sanitize local vars in stack frames."""
    for frame in frames:
        if 'vars' in frame and isinstance(frame['vars'], dict):
            frame['vars'] = sanitize_vars(frame['vars'], patterns)
    return frames


def compile_patterns(raw_patterns: list[str]) -> list[re.Pattern]:
    """Compile regex patterns for reuse."""
    return [re.compile(p) for p in raw_patterns]
