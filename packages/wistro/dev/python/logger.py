import json
import time
from typing import Any, Dict, Optional

class Logger:
    def __init__(self, trace_id: str, workflow_id: str, file_path: str):
        self.trace_id = trace_id
        self.workflow_id = workflow_id
        self.file_name = file_path.split('/')[-1]

    def _log(self, level: str, message: str, args: Optional[Dict[str, Any]] = None) -> None:
        log_entry = {
            "level": level,
            "time": int(time.time() * 1000),
            "traceId": self.trace_id,
            "workflowId": self.workflow_id,
            "file": self.file_name,
            "msg": message
        }

        if args:
            # Convert SimpleNamespace to dict if needed
            if hasattr(args, '__dict__'):
                args = vars(args)
            elif not isinstance(args, dict):
                args = {"data": args}
            log_entry.update(args)

        print(json.dumps(log_entry, separators=(',', ':')))

    def info(self, message: str, args: Optional[Any] = None) -> None:
        self._log("info", message, args)

    def error(self, message: str, args: Optional[Any] = None) -> None:
        self._log("error", message, args)

    def debug(self, message: str, args: Optional[Any] = None) -> None:
        self._log("debug", message, args)

    def warn(self, message: str, args: Optional[Any] = None) -> None:
        self._log("warn", message, args)
