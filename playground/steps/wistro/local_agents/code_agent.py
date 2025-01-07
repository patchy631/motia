import re
from typing import Optional
import openai  # Ensure you have installed the OpenAI Python library
import anthropic  # Ensure you have installed the Anthropic Python library


class ScriptAgent:
    def __init__(self, llm_provider: str, api_key: str, verbosity: int = 1):
        """
        Initialize the ScriptAgent with LLM integration.

        Args:
            llm_provider (str): The LLM provider ('openai' or 'anthropic').
            api_key (str): The API key for the LLM provider.
            verbosity (int): Level of logging.
        """
        self.llm_provider = llm_provider
        self.api_key = api_key
        self.verbosity = verbosity

        if llm_provider == "openai":
            openai.api_key = api_key
        elif llm_provider == "anthropic":
            self.client = anthropic.Client()
        else:
            raise ValueError(f"Unsupported LLM provider: {llm_provider}")

    @staticmethod
    def _sanitize_name(description: str) -> str:
        """Sanitizes task descriptions for use as script names."""
        return re.sub(r"[^a-zA-Z0-9_]", "_", description.lower().replace(" ", "_"))

    def _query_llm(self, task_description: str, language: str) -> str:
        """
        Queries the LLM to generate logic based on the task description.

        Args:
            task_description (str): Description of the task for the LLM.
            language (str): The target language ('python' or 'typescript').

        Returns:
            str: The LLM-generated script logic.
        """
        prompt_template = f"""
        You are a coding assistant. Generate a {language} function that fulfills the following requirements:
        {task_description}

        Only return the code for the function. Do not include explanations or comments.
        """
        if self.llm_provider == "openai":
            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt_template,
                max_tokens=500,
                temperature=0.7,
            )
            return response.choices[0].text.strip()
        elif self.llm_provider == "anthropic":
            response = self.client.completions.create(
                prompt=f"{anthropic.HUMAN_PROMPT}{prompt_template}{anthropic.AI_PROMPT}",
                # stop_sequences=[anthropic.HUMAN_PROMPT],
                model="claude-2.1",
                max_tokens_to_sample=1000,
                # temperature=0.7,
            )
            return response.completion.strip()
        else:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")

    def _calculate_complexity(self, logic: str) -> int:
        """
        Calculates the complexity score of the given logic.

        Args:
            logic (str): The logic to analyze.

        Returns:
            int: A complexity score from 0 to 100.
        """
        # Length-based complexity (20%)
        length_score = min(len(logic.splitlines()) / 50, 1.0) * 20

        # Cyclomatic complexity approximation (40%)
        keywords = ["if", "else", "elif", "for", "while", "case", "switch", "try", "except"]
        cyclomatic_complexity = sum(logic.count(keyword) for keyword in keywords)
        cyclomatic_score = min(cyclomatic_complexity / 10, 1.0) * 40

        # Nesting level complexity (20%)
        nesting_level = max(logic.count("{"), logic.count("("), logic.count(":")) - logic.count("def")
        nesting_score = min(nesting_level / 5, 1.0) * 20

        # Function calls complexity (20%)
        function_calls = len(re.findall(r"\b\w+\(", logic))
        function_score = min(function_calls / 15, 1.0) * 20

        # Total score
        complexity_score = length_score + cyclomatic_score + nesting_score + function_score
        return int(complexity_score)

    def __call__(self, task_description: str, language: str = "python", input_event: str = "input.event", output_event: str = "output.event", workflow: str = "default_workflow") -> str:
        """
        Generates a script based on the task description and language.

        Args:
            task_description (str): Description of the task for the LLM.
            language (str): The target language ('python' or 'typescript').
            input_event (str): The input event name.
            output_event (str): The output event name.
            workflow (str): The workflow key.

        Returns:
            str: The generated script with injected logic.
        """
        # Sanitize task name
        name = self._sanitize_name(task_description)

        # Generate core logic using the LLM
        logic = self._query_llm(task_description, language)

        # Calculate complexity
        complexity_score = self._calculate_complexity(logic)

        # Generate the complete script
        if language == "python":
            script = f"""
config = {{
    "name": "{name}",
    "subscribes": ["{input_event}"],
    "emits": ["{output_event}"],
    "input": None,  # No schema validation in Python version
    "workflow": "{workflow}"
}}

async def executor(input, emit):
    \"\"\"
    Implements the required functionality.

    Returns:
        Any: The result of the implementation
    \"\"\"
    print('[{name}] Received event', input)
    {logic}
"""
        elif language == "typescript":
            script = f"""
import {{ z }} from 'zod'
import {{ FlowConfig, FlowExecutor }} from 'wistro'

type Input = typeof inputSchema

const inputSchema = z.object({{
  // Define the input schema here
}})

export const config: FlowConfig<Input> = {{
  name: '{name}',
  subscribes: ['{input_event}'],
  emits: ['{output_event}'],
  input: inputSchema,
  workflow: '{workflow}',
}}

export const executor: FlowExecutor<Input> = async (input, emit) => {{
  console.log('[{name}] Received event:', input)
  {logic}
}}
"""
        else:
            raise ValueError(f"Unsupported language: {language}")

        print(f"Complexity Score: {complexity_score}/100")
        return script

