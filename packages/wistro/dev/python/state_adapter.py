import json
from typing import Any

class StateAdapter:
    def __init__(self, trace_id: str, state_config: Any):
        self.trace_id = trace_id
        self.store = {}
        self.prefix = 'wistro:state:'
        self.ttl = getattr(state_config, 'ttl', None)

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}{self.trace_id}:{key}"

    async def get(self, key: str) -> Any:
        full_key = self._make_key(key)
        value = self.store.get(full_key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: Any) -> None:
        full_key = self._make_key(key)
        self.store[full_key] = json.dumps(value)

    async def delete(self, key: str) -> None:
        full_key = self._make_key(key)
        if full_key in self.store:
            del self.store[full_key]

    async def clear(self) -> None:
        keys_to_delete = [k for k in self.store.keys() if k.startswith(self._make_key(''))]
        for key in keys_to_delete:
            del self.store[key]

    async def cleanup(self) -> None:
        self.store.clear()
