# Lucy AI — Prototype

Lightweight prototype of Lucy AI: a multilingual customer support assistant using Google Gemini, specialized in low-resource African languages (Amharic, Oromo, Tigrinya, Somali).

## Features
- **Multilingual Support**: specialized for Amharic, Oromo, Tigrinya, and Somali.
- **Sector Context**: tailored responses for Banking, Telecom, Gov, and E-commerce.
- **Multi-turn Conversation**: remembers chat history using localStorage.
- **Voice Integration**: supports voice input and text-to-speech output.
- **Admin Dashboard**: monitor usage logs and token counts.

## Quick Start

1. **Setup**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate # Linux/macOS
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   A `.env` file has been pre-configured with the Gemini API key.

3. **Run**:
   ```bash
   python app.py
   ```

4. **Access**:
   - **Demo Widget**: [http://localhost:5000](http://localhost:5000)
   - **Admin Dashboard**: [http://localhost:5000/admin](http://localhost:5000/admin) (Default Key: `admin-secret`)

## Project Structure
- `app.py`: Flask backend and Gemini integration (using `gemini-flash-latest`).
- `static/widget.js`: Lightweight JS chat widget with voice and history.
- `templates/index.html`: Demo landing page.
- `templates/admin.html`: Usage monitoring dashboard.
- `progress_agents.txt`: Development log.

## Notes
- Rate limiting is implemented in-memory (100 requests/hour per key).
- Token usage is logged for future billing simulation.