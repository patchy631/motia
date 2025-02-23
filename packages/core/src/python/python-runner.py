import sys
import json
import importlib.util
import os
import asyncio
import traceback
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
    def __init__(self, args: Any, rpc: RpcSender):
        self.trace_id = args.traceId
        self.traceId = args.traceId
        self.flows = args.flows
        self.rpc = rpc
        self.state = RpcStateManager(rpc)
        self.logger = Logger(self.trace_id, self.flows, rpc)

    async def emit(self, event: Any):
        return await self.rpc.send('emit', event)

async def run_python_module(file_path: str, rpc: RpcSender, args: Any) -> None:
    try:
        # Get the directory containing the module file
        module_dir = os.path.dirname(os.path.abspath(file_path))
        
        # Add module directory to Python path
        if module_dir not in sys.path:
            sys.path.insert(0, module_dir)
            
        # Get the flows directory (parent of steps)
        flows_dir = os.path.dirname(module_dir)
        if flows_dir not in sys.path:
            sys.path.insert(0, flows_dir)

        contextInFirstArg = args.contextInFirstArg

        # Load the module dynamically
        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")
            
        module = importlib.util.module_from_spec(spec)
        # Add module's directory as its __package__
        module.__package__ = os.path.basename(module_dir)
        spec.loader.exec_module(module)

        # Check if the handler function exists
        if not hasattr(module, 'handler'):
            raise AttributeError(f"Function 'handler' not found in module {file_path}")

        context = Context(args, rpc)

        if contextInFirstArg:
            result = await module.handler(context)
        else:
            result = await module.handler(args.data, context)

        if result:
            await rpc.send('result', result)

        rpc.close()
        rpc.send_no_wait('close', None)
        
    except Exception as error:
        print(f'Error running Python module: {error}', file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python pythonRunner.py <file-path> <arg>', file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    arg = sys.argv[2] if len(sys.argv) > 2 else None

    rpc = RpcSender()
    loop = asyncio.get_event_loop()
    tasks = asyncio.gather(rpc.init(), run_python_module(file_path, rpc, parse_args(arg)))
    loop.run_until_complete(tasks)