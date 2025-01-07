import requests
import os
from vision_agent.lmm import AnthropicLMM
import vision_agent.tools as T

config = {
    "name": "Vision evaluate",
    "subscribes": ["vision.evaluate"], 
    "emits": ["vision.result"],
    "input": None,  # No schema validation in Python version
    "workflow": "vision"
}

def download_image(image_url, save_path="image.png"):
    """Encodes an image from a URL to base64."""

    response = requests.get(image_url)
    if response.status_code == 200:
        # Save the image locally
        with open(save_path, "wb") as f:
            f.write(response.content)
        
        return save_path
    else:
        return None

async def executor(input, emit):
  print('[Vision Agent] Received vision-agent event', input);
  image = download_image(input[0].image_url)
  lmm = AnthropicLMM()
  prompt = input[0].get('prompt', "Describe this image")
  response = lmm(prompt, media=[image])
  print(response)