import asyncio
import time
from typing import Dict, Any

# Python equivalent of zod schema validation would need to be implemented
# For now using simple dict for config

config: Dict[str, Any] = {
    "type": "event",
    "name": "stepB", 
    "description": "Hello from Step B",
    "subscribes": ["pms.start"],
    "emits": ["pms.stepB.done"],
    "flows": ["parallel-merge"]
}

async def handler(_, context):
    context.logger.info("[stepB] received pms.start")

    #await asyncio.sleep(0.1)  # 100ms delay

    partial_result_b = {
        "msg": "Hello from Step B",
        "timestamp": int(time.time() * 1000)  # Current timestamp in ms
    }

    context.logger.info("[stepB] setting state")
    await context.state.set(context.trace_id, "stepB", partial_result_b)
    context.logger.info("[stepB] state set")

    await context.emit({
        "type": "pms.stepB.done",
        "data": partial_result_b
    })
