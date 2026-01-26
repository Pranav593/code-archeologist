# Code Archeologist
### Autonomous Legacy Code Restoration & Refactoring Agent

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-experimental-orange.svg) ![AI](https://img.shields.io/badge/AI-Powered-purple.svg)

**Code Archeologist** is an intelligent tool designed to explore, map, and heal messy legacy codebases. It combines **3D Visualization**, **Graph Algorithms**, and **Multi-Agent AI** to understand complex dependencies and automatically refactor technical debt.

---

## Demo: From Chaos to Clarity

https://github.com/user-attachments/assets/82cf0281-3565-4dad-a140-64391e730416

> *Watch the system ingest a messy codebase, map it in 3D, and autonomously refactor a complex function.*

---

## The Mission

Legacy code is terrifying. Functions are thousands of lines long, variables are named `x` and `temp`, and touching one file breaks three others.

**Code Archeologist** solves this by treating code as a **Knowledge Graph**, not just text. It:
1.  **Ingests** your entire project to build a dependency map.
2.  **Visualizes** the spaghetti code so you can see the complexity.
3.  **Embeds** the logic into a Vector Database for semantic understanding.
4.  **Refactors** specific nodes using AI Agents, ensuring the change propagates safely to callers.

---

## Key Features

*   **3D Dependency Visualization**: Interactive Force-Directed Graph (using `react-force-graph`) allows you to physically see the clusters and tangles in your architecture.
*   **Multi-Provider AI**: Pluggable architecture supporting **Google Gemini**, **OpenAI (GPT-4/Turbo)**, **Anthropic (Claude)**, and **Groq (Llama 3)**.
*   **Git Safety Net**: "Safe Mode" automatically creates a dedicated Git branch for every refactor. Never destroys code destructively.
*   **Semantic Code Search (RAG)**: Search your codebase using natural language (e.g., *"Where is payment validation handled?"*) via ChromaDB vector embeddings.
*   **Tree-Sitter Parsing**: Accurate, robust AST parsing for Python, JavaScript, TypeScript, Java, and more.

---

## Architecture

The system operates as a unified pipeline:

```mermaid
graph LR
    User[Frontend UI] -->|API| Server[FastAPI Server]
    Server -->|Graph| NX[NetworkX Graph]
    Server -->|Memory| Chroma[ChromaDB Vector]
    Server -->|Logic| Agents[AI Agents]
    
    subgraph "AI Agents"
    Architect["Architect Agent<br/>(Plans Refactor)"]
    Engineer["Engineer Agent<br/>(Writes Code)"]
    end
    
    Agents -->|Git Ops| Codebase[Target Repo]
```

### The Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API**: Python FastAPI, WebSockets (for real-time Matrix-style logs).
- **Core Engine**: NetworkX (Graph Algo), ChromaDB (Vector Search), Tree-Sitter (Parsing).
- **Infrastructure**: Docker Compose (Full stack containerization).

---

## How It Works: The 5-Phase Pipeline

The backend processes code in 5 distinct phases:

### Phase 1: Ingestion & Excavation
The system walks the file tree, using **Tree-Sitter** to parse every file into an Abstract Syntax Tree (AST). It identifies functions, classes, and global variables, creating "Nodes" in the graph.

### Phase 2: Mapping The Invisible Strings
It analyzes imports and function calls to draw "Edges" between nodes. It resolves relative imports (e.g., `from .utils import helper`) to their actual physical file locations.

### Phase 3: The Architect Agent
When you request a "Heal" operation, the **Architect Agent** (a high-reasoning LLM) reads the function code, its dependencies, and its callers. It drafts a high-level Refactoring Plan focused on readability and SOLID principles.

### Phase 4: The Execution Agent
The **Engineer Agent** takes the plan and writes the actual code. The system creates a new Git branch and surgically replaces the old function in the file using byte-level replacement.

### Phase 5: Propagation
If a function was renamed, the system identifies all **Callers** (files that use this function) using the Graph. It updates those files to use the new name automatically.

### Feature Highlight: Propagation in Action

https://github.com/user-attachments/assets/b47a5ab0-3670-4f68-953c-c030fbfda472

---

## Getting Started

Setting up the Archeologist is simple. You can run the entire stack with Docker.

### [Click here for the detailed SETUP GUIDE](SETUP.md)

**Quick Start (Docker):**
1.  Clone the repo.
2.  Add your API Key to `backend/.env`.
3.  Run `docker-compose up --build`.
4.  Visit `http://localhost:3000`.

---

## Contribution
This project was built as a demonstration of autonomous coding agents. Feel free to fork it and add support for more languages (currently optimized for Python/JS).

## License
MIT License.
