from typing import Any


class RpcStateManager:
    def __init__(self, sender):
        self.sender = sender

    async def get(self, trace_id: str, key: str) -> Any:
        return await self.sender.send('state.get', {'traceId': trace_id, 'key': key})

    async def set(self, trace_id: str, key: str, value: Any) -> None:
        await self.sender.send('state.set', {'traceId': trace_id, 'key': key, 'value': value})

    async def delete(self, trace_id: str, key: str) -> None:
        await self.sender.send('state.delete', {'traceId': trace_id, 'key': key})

    async def clear(self, trace_id: str) -> None:
        await self.sender.send('state.clear', {'traceId': trace_id})
