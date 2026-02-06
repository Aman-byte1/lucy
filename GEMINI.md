You are an expert full-stack developer building a prototype for a startup called Lucy AI, which provides multilingual customer support powered by an LLM specialized in low-resource African languages like Amharic, Oromo, Tigrinya, and Somali. For this MVP, use Google's Gemini API (key: AIzaSyDcoUKbbOwjcGI5KyJN6HcGiCPGKA1NwDw) as the backend LLM instead of a custom model. The system should handle customer support scenarios such as handling inquiries, complaints, FAQs, onboarding, and basic navigation help for complex websites (e.g., government portals).
Key features:

API Endpoints: Create a RESTful API using Python Flask. Include:
POST /api/support: Takes input like user_query (string), language (e.g., 'am' for Amharic), context (optional string for conversation history), and sector (e.g., 'banking', 'telecom' for domain-specific responses). Use Gemini to generate a culturally relevant, accurate response in the specified language. Prompt Gemini with few-shot examples to improve accuracy for low-resource languages (e.g., include 2-3 sample support dialogues in Amharic/Oromo).
GET /api/languages: Returns a list of supported languages.
Authentication: Simple API key auth for clients.
Rate limiting: Basic limit to 100 requests/hour per key.
Pricing simulation: Log usage (e.g., tokens) for future billing.

Chatbot Widget: Build a simple embeddable JavaScript widget (like a chat bubble) that integrates with websites. It should:
Pop up on the site, detect user language (or allow selection).
Send queries to your /api/support endpoint.
Handle multi-turn conversations (store session in localStorage).
Support text input/output; bonus for voice if easy (using Web Speech API).
Customizable for sectors (e.g., pre-load FAQs for e-commerce).

Gemini Integration: Use the google-generativeai Python library. In prompts to Gemini:
Instruct it to respond only in the target language.
Add cultural nuance: 'Respond empathetically, using local idioms/slang where appropriate, and avoid hallucinations by sticking to provided context.'
Handle edge cases: If query is about complex gov websites, guide navigation step-by-step.
Fallback: If language not supported well, suggest switching to Amharic/English.

Tech Stack: Python 3.10+ with Flask, google-generativeai, CORS for API. For the widget: Vanilla JS or React (keep it lightweight). Deployable to Vercel/Heroku for free tier. Include error handling, logging, and a simple admin dashboard (e.g., to view usage logs).
Security/Best Practices: Secure the API key in env vars (don't hardcode). Anonymize user data. Ensure responses are safe and non-biased.

Output the full code structure: requirements.txt, app.py for backend, index.html/js for widget demo, and setup instructions. Make it runnable locally with 'python app.py'. Test with sample queries like 'How do I reset my bank password in Oromo?' or 'Navigate tax portal in Amharic.

in the progress_Agent file you can put where you get and also you can ask the other agent to do some task or tell the other agent what you did and also name eachother as agents