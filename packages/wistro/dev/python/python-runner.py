import sys
import json
import importlib.util
import traceback
import inspect
import os
from logger import Logger
from state_adapter import StateAdapter
from typing import Any, Callable

def parse_args(arg: str) -> Any:
    from types import SimpleNamespace
    
    try:
        return json.loads(arg, object_hook=lambda d: SimpleNamespace(**d))
    except json.JSONDecodeError:
        print('Error parsing args:', arg)
        return arg

# get the FD from ENV
NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])

async def emit(text: Any):
  'sends a Node IPC message to parent proccess'
  # encode message as json string + newline in bytes
  bytesMessage = (json.dumps(text) + "\n").encode('utf-8')
  # send message
  os.write(NODEIPCFD, bytesMessage)

class Context:
    def __init__(self, args: Any, file_name: str):
        self.trace_id = args.traceId
        self.workflow_id = args.workflowId
        self.file_name = file_name
        self.state = StateAdapter(self.trace_id, args.stateConfig)
        self.logger = Logger(self.trace_id, self.workflow_id, self.file_name)

async def run_python_module(file_path: str, args: Any) -> None:
    try:
        # Construct path relative to flows directory
        flows_dir = os.path.join(os.getcwd(), 'flows')
        module_path = os.path.join(flows_dir, file_path)

        # Load the module dynamically
        spec = importlib.util.spec_from_file_location("dynamic_module", module_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {module_path}")
            
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Check if the executor function exists
        if not hasattr(module, 'executor'):
            raise AttributeError(f"Function 'executor' not found in module {module_path}")

        context = Context(args, file_path)

        # Call the executor function with arguments
        # Check number of parameters the executor function accepts
        sig = inspect.signature(module.executor)
        param_count = len(sig.parameters)
        
        if param_count == 2:
            result = await module.executor(args.data, emit)
        else:
            result = await module.executor(args.data, emit, context)
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