
import os
from dotenv import load_dotenv
load_dotenv()

try:
    from app import call_gemini, GEMINI_AVAILABLE, app
    import google.generativeai as genai
    print(f"Import successful. GEMINI_AVAILABLE={GEMINI_AVAILABLE}")
    
    if GEMINI_AVAILABLE:
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
        
        print("\nTesting Gemini API call with 'gemini-1.5-flash'...")
        res = call_gemini("Say 'Hello' in Amharic", "am")
        print("Result:", res)
    else:
        print("Gemini not available, skipping API test.")

    print("Flask app created successfully.")

except Exception as e:
    print(f"Test failed: {e}")
