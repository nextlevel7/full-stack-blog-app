from __future__ import annotations

import re
import unicodedata

_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    slug = _slug_re.sub("-", normalized).strip("-")
    return slug or "post"
