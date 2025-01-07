import ultraimport
import os

ScriptAgent = ultraimport('__dir__/local_agents/code_agent.py', 'ScriptAgent')

config = {
    "name": "Wistro Generate Step",
    "subscribes": ["wistro.generate.step"], 
    "emits": ["wistro.generate.result"],
    "input": None,  # No schema validation in Python version
    "workflow": "wistro"
}

async def executor(input, emit):
    print('[Vision Agent] Received vision-agent event', input)
    
    # Example usage
    agent = ScriptAgent(llm_provider="anthropic", api_key=os.environ['ANTHROPIC_API_KEY'], verbosity=2)

    # Generate Python script
    python_script = agent(
        task_description="Write a function that calculates the factorial of a number using recursion.",
        language="python",
    )
    print("Generated Python Script:\n", python_script)

    # Generate TypeScript script
    typescript_script = agent(
        task_description="Write a function that filters an array of strings to only include items with more than 5 characters.",
        language="typescript",
    )
    print("\nGenerated TypeScript Script:\n", typescript_script)
