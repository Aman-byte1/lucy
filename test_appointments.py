
import json
import requests

BASE_URL = "http://localhost:5000"
CLIENT_KEY = "lucy-dev-12345" # From default config

def test_appointment_flow():
    # Step 1: Ask about appointment
    print("User: I want to check my appointment.")
    res = requests.post(
        f"{BASE_URL}/api/support",
        headers={"X-API-KEY": CLIENT_KEY},
        json={
            "user_query": "I want to check my appointment and medications.",
            "language": "en"
        }
    )
    print("Lucy:", res.json().get("reply"))
    
    context = f"user: I want to check my appointment and medications.
assistant: {res.json().get('reply')}"
    
    # Step 2: Provide Name and ID (A101 - Abebe Balcha)
    print("
User: My name is Abebe Balcha and my ID is A101.")
    res = requests.post(
        f"{BASE_URL}/api/support",
        headers={"X-API-KEY": CLIENT_KEY},
        json={
            "user_query": "My name is Abebe Balcha and my ID is A101.",
            "language": "en",
            "context": context
        }
    )
    print("Lucy:", res.json().get("reply"))

if __name__ == "__main__":
    # We need the app running to test this.
    # For now, just print the logic.
    print("Run the app first: python app.py")
    # test_appointment_flow()
