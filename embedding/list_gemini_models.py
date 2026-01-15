#!/usr/bin/env python3
"""
Script to list available Gemini models
"""

import os
import warnings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings('ignore', category=FutureWarning)
import google.generativeai as genai

# Configure API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file")
    exit(1)

genai.configure(api_key=api_key)

# List available models
print("=" * 60)
print("Available Gemini Models")
print("=" * 60)
print()

try:
    models = genai.list_models()
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"Model: {model.name}")
            print(f"  Display Name: {model.display_name}")
            print(f"  Description: {model.description}")
            print(f"  Supported Methods: {model.supported_generation_methods}")
            print()
except Exception as e:
    print(f"Error listing models: {e}")
    print()
    print("Trying common model names...")
    
    # Try common model names
    common_models = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "models/gemini-pro",
        "models/gemini-1.5-pro",
        "models/gemini-1.5-flash",
    ]
    
    for model_name in common_models:
        try:
            model = genai.GenerativeModel(model_name)
            print(f"✓ {model_name} - Available")
        except Exception as err:
            print(f"✗ {model_name} - Not available: {str(err)[:50]}")
