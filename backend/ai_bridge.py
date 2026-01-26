import os
import google.generativeai as genai
from openai import OpenAI
from anthropic import Anthropic
from groq import Groq

class UnifiedAIClient:
    def __init__(self, model_name, provider=None):
        self.model_name = model_name
        self.provider = provider or self._identify_provider(model_name)
        self.client = self._init_client()
        
    def _identify_provider(self, model_name):
        model_name_lower = model_name.lower()
        if model_name_lower.startswith("gemini"):
            return "google"
        elif model_name_lower.startswith("gpt") or model_name_lower.startswith("o1"):
            return "openai"
        elif "claude" in model_name_lower:
            return "anthropic"
        elif "llama" in model_name_lower or "mixtral" in model_name_lower or "groq" in model_name_lower:
            return "groq"
        elif "deepseek" in model_name_lower:
            return "deepseek"
        else:
            # Default fallback or try to guess based on keys present
            if os.getenv("OPENAI_API_KEY"): return "openai"
            if os.getenv("GEMINI_API_KEY"): return "google"
            return "unknown"

    def _init_client(self):
        if self.provider == "google":
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            return genai.GenerativeModel(self.model_name)
            
        elif self.provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
        elif self.provider == "deepseek":
            return OpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY"), 
                base_url="https://api.deepseek.com"
            )
            
        elif self.provider == "anthropic":
            return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            
        elif self.provider == "groq":
            return Groq(api_key=os.getenv("GROQ_API_KEY"))
            
        return None

    def generate_content(self, prompt):
        """
        Unified interface for generating text content.
        Returns an object with a .text property to match Gemini's interface,
        or we adapt the result to be a simple string wrapper.
        """
        if self.provider == "google":
            # Gemini returns a response object with .text property
            return self.client.generate_content(prompt)
            
        elif self.provider in ["openai", "deepseek"]:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            return TextWrapper(response.choices[0].message.content)
            
        elif self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )
            return TextWrapper(response.content[0].text)
            
        elif self.provider == "groq":
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
            )
            return TextWrapper(response.choices[0].message.content)
            
        return TextWrapper("Error: Unknown AI Provider or initialization failed.")

class TextWrapper:
    """Mimics the Gemini response object which accesses .text"""
    def __init__(self, content):
        self.text = content
