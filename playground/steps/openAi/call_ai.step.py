config = {
    "name": "Call OpenAI",
    "subscribes": ["call-openai"], 
    "emits": ["openai-response"],
    "input": None,  # No schema validation in Python version
    "flows": ["openai"]
}

async def executor(args, emit, ctx):
    ctx.logger.info('[Call Python OpenAI] Received call_ai event', args);

    await emit({
        "type": "openai-response",
        "data": { "message": args.message },
    });
