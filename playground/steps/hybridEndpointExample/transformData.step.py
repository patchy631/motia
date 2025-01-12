config = {
    "type": "event",
    "name": "Transform Data", 
    "subscribes": ["hybrid.validated"],
    "emits": ["hybrid.transformed"],
    "input": None,  # No schema validation in Python version
    "flows": ["hybrid-example"]
}

# Add a static counter at module level
instance_id = id(object())  # or random, e.g., random.randint(1, 10000)
invocation_count = 0

async def handler(input, ctx):
    global invocation_count
    invocation_count += 1

    print(f"[Python:transform-data] instance_id={instance_id}, "
        f"invocation_count={invocation_count} | "
        f"Received input={input}")    

    items = input.items
    # Transform each item
    transformed = [{
        "id": getattr(item, "id", None),
        "value": getattr(item, "value", None) * 2 if hasattr(item, "value") else None,
        "transformed_by": "python"
    } for item in items]
    
    await ctx.emit({
        "type": "hybrid.transformed",
        "data": {
            "items": transformed,
            "timestamp": getattr(input, "timestamp")
        }
    })