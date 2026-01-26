# Setup & Installation Guide

This guide will help you get **Code Archeologist** running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Docker Desktop** (Recommended): The easiest way to run the full stack (Database + Backend + Frontend). [Download Docker](https://www.docker.com/products/docker-desktop).
2.  **Git**: To clone the repository.
3.  **API Keys**: You need at least **one** valid API key for the AI features to work.
    *   **Google Gemini** (Recommended for speed/cost): [Get Key](https://aistudio.google.com/app/apikey)
    *   **OpenAI** (GPT-4/Turbo): [Get Key](https://platform.openai.com/)
    *   **Anthropic** (Claude): [Get Key](https://console.anthropic.com/)
    *   **Groq** (Llama 3/Mixtral): [Get Key](https://console.groq.com/)

---

## Quick Start (Docker)

The application is containerized. This is the preferred method.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/code-archeologist.git
cd code-archeologist
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory. You can copy the example configuration:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in your editor and add your API keys. You only need to fill in the one you plan to use.

```dotenv
# backend/.env

# --- Model Selection ---
# You can use: gemini-*, gpt-*, claude-*, llama-*, etc.
ARCHITECT_MODEL=gemini-2.0-flash
ENGINEER_MODEL=gemini-2.0-flash

# --- Provider Keys (Fill at least one) ---
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

### 3. Run the Application
From the root of the project:

```bash
docker-compose up --build
```

Wait until you see the log message: `Application startup complete`.

### 4. Access the Dashboard
Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## Manual Setup (Development)

If you want to run the services individually without Docker:

### Backend (Python/FastAPI)

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the server:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

### Frontend (Next.js)

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000).

---

## Testing with the Demo Codebase

The project comes with a `test_codebase/` folder pre-loaded with "messy" legacy code.

1.  On the Landing Page, the default path is set to `/workspace/test_codebase`.
2.  Click **"Start Analysis"**.
3.  Navigate through the 3D graph to find different functions.
4.  Click **Heal / Refactor** to test the AI capabilities.

## "Safe Mode" & Git Integration

By default, the system runs in **SAFE MODE**.
- When you apply a refactor, it **does not** overwrite your code directly.
- It creates a **new Git branch** (e.g., `ai-heal-orders-py-20240126`).
- You can inspect the changes in the UI or in your terminal before merging.

To disable Safe Mode (dangerous!):
1.  Go to the **Settings** page (Gear icon).
2.  Toggle "Safe Mode" **OFF**.
3.  Changes will now be committed directly to your current branch.
