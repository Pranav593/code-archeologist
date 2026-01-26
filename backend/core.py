"""
Code Archeologist - Core Engine
"""
import os
import networkx as nx
import warnings
# Suppress the noisy deprecation warning from the legacy library
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai
from dotenv import load_dotenv
import chromadb
from languages.manager import ParserManager
from ai_bridge import UnifiedAIClient

# Import Pipeline Stages
from pipeline import (
    phase_1_ingestion, 
    phase_2_analysis, 
    phase_3_strategy, 
    phase_4_execution, 
    phase_5_propagation
)

# Load environment variables
load_dotenv(override=True)

class CodeArcheologist:
    def __init__(self):
        # self.log_callback = log_callback # Deprecated: We now rely on stdout capture
        self.log("Initializing Code Archeologist Core...")
        
        # Configuration
        self.safe_mode = True

        # Initialize Dependency Graph (Directed)
        self.graph = nx.DiGraph()


        # Initialize Parser Manager
        self.parser_manager = ParserManager()

        # Initialize ChromaDB (Vector Search)
        chroma_host = os.getenv("CHROMA_HOST", "localhost")
        chroma_port = os.getenv("CHROMA_PORT", "8000")
        
        try:
            self.log(f"   -> Connecting to ChromaDB at {chroma_host}:{chroma_port}...")
            self.chroma_client = chromadb.HttpClient(host=chroma_host, port=int(chroma_port))
            self.collection = self.chroma_client.get_or_create_collection(name="code_knowledge")
            self.log("   -> Connected to ChromaDB 'code_knowledge' collection.")
            self.has_memory = True
        except Exception as e:
            self.log(f"⚠️  Warning: Could not connect to ChromaDB: {e}")
            self.has_memory = False

        # Initialize AI
        arch_model_name = os.getenv("ARCHITECT_MODEL", "gemini-1.5-pro")
        eng_model_name = os.getenv("ENGINEER_MODEL", "gemini-1.5-flash")
        
        try: 
            self.architect = UnifiedAIClient(arch_model_name)
            self.engineer = UnifiedAIClient(eng_model_name)
            
            # Legacy alias
            self.model = self.engineer
            self.model_name = eng_model_name
            
            self.has_ai = True
            
            self.log(f"   -> AI Architect: {arch_model_name} ({self.architect.provider})") 
            self.log(f"   -> AI Engineer: {eng_model_name} ({self.engineer.provider})")

        except Exception as e:
            self.log(f"⚠️  Warning: AI initialization failed. Check your API Keys. Error: {e}")
            self.has_ai = False

    def log(self, message):
        """Helper to log execution steps. Now simply prints to stdout, which server.py captures."""
        print(message)

    # --- Pipeline Delegation ---

    def phase_1_ingest(self, project_path: str):
        phase_1_ingestion.run(self, project_path)

    def phase_2_analyze(self):
        phase_2_analysis.run(self)

    def phase_3_strategy(self, project_path, specific_target=None):
        return phase_3_strategy.generate_heal_plan(self, project_path, specific_target)

    def phase_4_execution(self, plan_tuple, project_path):
        return phase_4_execution.run(self, plan_tuple, project_path)

    def phase_5_propagation(self, old_node_id, new_name, project_path):
        phase_5_propagation.run(self, old_node_id, new_name, project_path)

    # --- Utilities exposed via API ---
    
    def explain_function(self, node_id):
        return phase_3_strategy.explain_function(self, node_id)
        
    def rag_search(self, query):
        return phase_3_strategy.run_search(self, query)
        
    def get_diff(self, branch_name, project_path):
        return phase_4_execution.get_diff(branch_name, project_path)
        
    def merge_branch(self, branch_name, project_path):
        return phase_4_execution.merge_branch(branch_name, project_path)
        
    def discard_branch(self, branch_name, project_path):
        return phase_4_execution.discard_branch(branch_name, project_path)

    def reset(self):
        """Wipes the Vector Memory and clears the graph."""
        self.log("⚠️  RESET INITIATED: Wiping System Memory...")
        if self.has_memory:
            try:
                self.chroma_client.delete_collection("code_knowledge")
                self.collection = self.chroma_client.create_collection(name="code_knowledge")
                self.log("   -> ChromaDB Collection 'code_knowledge' recreated.")
            except Exception as e:
                self.log(f"   -> Error clearing ChromaDB: {e}")
        
        self.graph.clear()
        self.log("   -> Dependency Graph cleared.")
        self.log("✅ System Reset Complete.")
