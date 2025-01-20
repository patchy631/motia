import sys
import json
import importlib.util
import traceback
import os
from logger import Logger
from rpc import RpcSender
from rpc_state_manager import RpcStateManager

from typing import Any

def parse_args(arg: str) -> Any:
    from types import SimpleNamespace
    
    try:
        return json.loads(arg, object_hook=lambda d: SimpleNamespace(**d))
    except json.JSONDecodeError:
        print('Error parsing args:', arg)
        return arg

class Context:
    def __init__(self, args: Any, file_name: str):
        self.trace_id = args.traceId
        self.flows = args.flows
        self.file_name = file_name
        self.sender = RpcSender()
        self.state = RpcStateManager(self.sender)
        self.logger = Logger(self.trace_id, self.flows, self.file_name, self.sender)

    async def emit(self, event: Any):
        await self.sender.send('emit', event)

async def run_python_module(file_path: str, args: Any) -> None:
    try:
        # Construct path relative to steps directory
        flows_dir = os.path.join(os.getcwd(), 'steps')
        module_path = os.path.join(flows_dir, file_path)

        # Load the module dynamically
        spec = importlib.util.spec_from_file_location("dynamic_module", module_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {module_path}")
            
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Check if the handler function exists
        if not hasattr(module, 'handler'):
            raise AttributeError(f"Function 'handler' not found in module {module_path}")

        context = Context(args, file_path)
        context.sender.init()
        
        await module.handler(args.data, context)
        
        # exit with 0 to indicate success
        sys.exit(0)
    except Exception as error:
        print('Error running Python module:', file=sys.stderr)

        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python pythonRunner.py <file-path> <arg>', file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    arg = sys.argv[2] if len(sys.argv) > 2 else None

    import asyncio
    asyncio.run(run_python_module(file_path, parse_args(arg)))