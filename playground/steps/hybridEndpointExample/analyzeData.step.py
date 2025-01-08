import json

config = {
    "name": "Analyze Data",
    "subscribes": ["hybrid.enriched"],
    "emits": ["hybrid.analyzed"],
    "input": None,  # No schema validation in Python version
    "flows": ["hybrid-example"]
}

# Add a static counter at module level
instance_id = id(object())  # or random, e.g., random.randint(1, 10000)
invocation_count = 0

async def executor(input, emit):
    global invocation_count
    invocation_count += 1

    print(f"[Python:transform-data] instance_id={instance_id}, "
        f"invocation_count={invocation_count} | "
        f"Received input={input}")

    items = input.items
    
    # Calculate some statistics
    total_items = len(items)
    total = sum(getattr(item, "value", 0) for item in items if hasattr(item, "value"))
    average = total / total_items if items else 0
    
    analysis = {
        "total": total,
        "average": average,
        "count": total_items,
        "analyzed_by": "python"
    }
    
    # Convert items to a JSON serializable format
    serializable_items = [item.__dict__ for item in items]

    await emit({
        "type": "hybrid.analyzed",
        "data": {
            "items": serializable_items,
            "analysis": analysis,
            "timestamp": getattr(input, "timestamp")
        }
    })