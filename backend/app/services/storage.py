from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any, Callable, Iterable, Tuple, TypeVar

T = TypeVar("T")
R = TypeVar("R")


class JSONStorage:
    """Simple thread-safe JSON file wrapper."""

    def __init__(self, file_path: Path) -> None:
        self.file_path = file_path
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def _load(self) -> list[Any]:
        try:
            raw = self.file_path.read_text(encoding="utf-8")
            data = json.loads(raw or "[]")
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []

    def _dump(self, payload: Iterable[Any]) -> None:
        self.file_path.write_text(json.dumps(list(payload), indent=2), encoding="utf-8")

    def read(self) -> list[Any]:
        with self._lock:
            return self._load()

    def write(self, payload: Iterable[Any]) -> None:
        with self._lock:
            self._dump(payload)

    def mutate(self, mutator: Callable[[list[Any]], Tuple[bool, R]]) -> R:
        with self._lock:
            data = self._load()
            changed, result = mutator(data)
            if changed:
                self._dump(data)
            return result
