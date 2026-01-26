"""
Code Archeologist - Backend API
Exposes endpoints for code graph analysis, visualization data, and AI-driven code restoration.
Powered by FastAPI, NetworkX, and Google Gemini.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx
import os
import sys
import importlib
import asyncio
from typing import List

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Core (Refactored)
import core

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket & Logging Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()
GLOBAL_LOOP = None

class StreamToLogger:
    def __init__(self, original_stream):
        self.original_stream = original_stream

    def write(self, buf):
        # 1. Write to original stream (so it shows in Docker logs)
        self.original_stream.write(buf)
        self.original_stream.flush()
        
        # 2. Broadcast to WebSocket
        if buf and GLOBAL_LOOP and manager.active_connections:
             try:
                 asyncio.run_coroutine_threadsafe(manager.broadcast(buf), GLOBAL_LOOP)
             except Exception:
                 pass

    def flush(self):
        self.original_stream.flush()

@app.on_event("startup")
async def startup_event():
    global GLOBAL_LOOP
    try:
        GLOBAL_LOOP = asyncio.get_running_loop()
    except RuntimeError:
        GLOBAL_LOOP = asyncio.new_event_loop()
        asyncio.set_event_loop(GLOBAL_LOOP)
    
    # Redirect stdout and stderr to capture 3rd party logs (tqdm, etc)
    sys.stdout = StreamToLogger(sys.stdout)
    sys.stderr = StreamToLogger(sys.stderr)

def backend_logger(msg):
    """
    Callback passed to CodeArcheologist. 
    Now just prints, because print() is intercepted by StreamToLogger!
    """
    print(msg) 


# Global Archaeologist Instance
archeologist = None
CURRENT_REPO = "/workspace/test_codebase"

class HealRequest(BaseModel):
    node_id: str

class SearchRequest(BaseModel):
    query: str

class ExplainRequest(BaseModel):
    node_id: str

class GitOperationRequest(BaseModel):
    branch_name: str

@app.get("/")
def read_root():
    return {"status": "Code Archeologist API Ready"}

@app.get("/status")
def get_status():
    """
    Returns the current state of the analysis.
    User for frontend persistence check.
    """
    if archeologist is None:
        return {
            "analyzed": False, 
            "node_count": 0,
            "vector_db_connected": False,
            "ai_connected": False,
            "repo_path": CURRENT_REPO
        }

    node_count = archeologist.graph.number_of_nodes()
    return {
        "analyzed": node_count > 0,
        "node_count": node_count,
        "vector_db_connected": getattr(archeologist, 'has_memory', False),
        "ai_connected": getattr(archeologist, 'has_ai', False),
        "repo_path": CURRENT_REPO
    }

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't really expect input, just keeping connection alive
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/analyze")
def trigger_analysis(repo_path: str = None):
    global CURRENT_REPO, archeologist
    
    if repo_path:
        CURRENT_REPO = repo_path
    
    # Use CURRENT_REPO which might have been set by /settings
    target_repo = CURRENT_REPO
    
    print(f"Re-initiating Analysis on {target_repo}")
    
    try:
        # Instantiate Core (Lazy Loading happens here now!)
        # This will trigger the 'Initializing...' logs via print -> StreamToLogger -> WS
        archeologist = core.CodeArcheologist()
        
        # Execute Analysis Pipeline
        archeologist.phase_1_ingest(target_repo)
        archeologist.phase_2_analyze()
        
        node_count = archeologist.graph.number_of_nodes()
        print(f"✅ Analysis complete. Nodes: {node_count}")
        print("ANALYSIS_COMPLETE") # Signal for frontend to switch view

        return {
            "message": "Analysis complete", 
            "node_count": node_count,
            "edge_count": archeologist.graph.number_of_edges()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        err_msg = f"❌ Analysis failed: {e}"
        print(err_msg)
        raise HTTPException(status_code=500, detail=str(e))

class ExplainRequest(BaseModel):
    node_id: str

@app.post("/explain")
def explain_node(request: ExplainRequest):
    """
    GenAI Endpoint: Explains what a specific function does in plain English.
    """
    node_id = request.node_id
    if node_id not in archeologist.graph.nodes:
         raise HTTPException(status_code=404, detail="Node not found")
    
    explanation = archeologist.explain_function(node_id)
    return {"explanation": explanation}

@app.get("/graph")
def get_graph():
    # If empty, just return empty. Do NOT auto-trigger. 
    if archeologist is None or archeologist.graph.number_of_nodes() == 0:
        return {"nodes": [], "links": []}
        
    # Convert NetworkX graph to JSON-compatible format for visualization
    data = nx.node_link_data(archeologist.graph)
    return data

@app.post("/search")
def run_search(request: SearchRequest):
    if archeologist is None:
        return {"results": []}
    """
    RAG Endpoint: Search the codebase for natural language queries.
    Returns: List of matching nodes to highlight in the UI.
    """
    print(f"Received Search Query: {request.query}")
    results = archeologist.rag_search(request.query)
    return {"results": results}

@app.post("/heal")
def heal_node(request: HealRequest):
    if archeologist is None:
        raise HTTPException(status_code=400, detail="System not initialized.")

    node_id = request.node_id
    
    if node_id not in archeologist.graph.nodes:
         raise HTTPException(status_code=404, detail="Node not found")
         
    try:
        # Phase 3: Strategy
        plan = archeologist.phase_3_strategy(CURRENT_REPO, specific_target=node_id)
        
        if not plan:
            return {"status": "skipped", "message": "AI could not generate a plan"}
            
        target_node, ai_response = plan
        
        # Phase 4: Execution
        new_name, branch_name = archeologist.phase_4_execution(plan, CURRENT_REPO)
        
        # Phase 5: Propagation
        updated_callers = []
        if new_name:
             # Capture stdout or modify phase_5 to return info, 
             # but for now we just run it.
             archeologist.phase_5_propagation(target_node, new_name, CURRENT_REPO)
             updated_callers = list(archeologist.graph.predecessors(target_node))

        return {
            "status": "success",
            "old_node": target_node,
            "new_name": new_name,
            "branch": branch_name, 
            "ai_report": ai_response,
            "propagated_to": updated_callers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/git/diff")
def get_diff(request: GitOperationRequest):
    diff = archeologist.get_diff(request.branch_name, CURRENT_REPO)
    return {"diff": diff}

@app.post("/git/merge")
def merge_branch(request: GitOperationRequest):
    success, msg = archeologist.merge_branch(request.branch_name, CURRENT_REPO)
    if success:
        # Re-analyze to refresh graph state
        # We trigger analysis in bg so we don't block, but for merge we might want to block?
        # Let's just block for now as it's fast on small updates usually
        # Actually, let's call the phase_1/2 directly on archeologist instance to skip the socket noise or keep it
        archeologist.phase_1_ingest(CURRENT_REPO)
        archeologist.phase_2_analyze()
        return {"status": "success", "message": msg}
    else:
        raise HTTPException(status_code=500, detail=msg)

@app.post("/git/discard")
def discard_branch(request: GitOperationRequest):
    success, msg = archeologist.discard_branch(request.branch_name, CURRENT_REPO)
    if success:
        # Re-analyze to refresh graph state
        archeologist.phase_1_ingest(CURRENT_REPO)
        archeologist.phase_2_analyze()
        return {"status": "success", "message": msg}
    else:
        raise HTTPException(status_code=500, detail=msg)

class SettingsRequest(BaseModel):
    safe_mode: bool
    # repo_path is optional because sometimes we just want to toggle safe mode
    repo_path: str | None = None

@app.get("/settings")
def get_settings():
    safe_mode = True
    if archeologist:
        safe_mode = archeologist.safe_mode
    
    return {
        "safe_mode": safe_mode,
        "repo_path": CURRENT_REPO
    }

@app.post("/settings")
async def update_settings(request: SettingsRequest, background_tasks: BackgroundTasks):
    global CURRENT_REPO, archeologist
    
    print(f"⚙️ Updating Settings: {request}")
    
    # 1. Update Safe Mode
    if archeologist:
        archeologist.safe_mode = request.safe_mode
        print(f"   -> Safe Mode set to: {request.safe_mode}")
        
    # 2. Update Repo Path (if changed)
    if request.repo_path and request.repo_path != CURRENT_REPO:
        print(f"   -> Switching repository to: {request.repo_path}")
        if not os.path.exists(request.repo_path):
             raise HTTPException(status_code=400, detail="Repository path does not exist on server.")
             
        CURRENT_REPO = request.repo_path
        
        # STOP: Do NOT auto-trigger analysis. 
        # Just reset the archeologist so old state is gone.
        # The frontend will now redirect to LandingPage, where user manually starts.
        if archeologist:
            archeologist.reset()
            archeologist = None 

    return {"status": "updated", "safe_mode": True if not archeologist else archeologist.safe_mode, "repo_path": CURRENT_REPO}

@app.post("/reset")
def reset_system():
    global archeologist
    print("⚠️  Use requested SYSTEM RESET.")
    
    if archeologist:
        archeologist.reset()
    
    # We detach the instance so next /analyze starts fresh-fresh
    archeologist = None
    
    return {"status": "success", "message": "System Reset Complete"}
