def run_search(archeologist, query_text, n_results=3):
    """
    Performs a semantic search against the codebase using ChromaDB.
    Returns a list of matching nodes with their distance scores.
    """
    if not archeologist.has_memory:
        return []
        
    print(f"RAG Search: '{query_text}'")
    try:
        results = archeologist.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        # Format results into a cleaner list
        matches = []
        if results['ids']:
            ids = results['ids'][0]
            metadatas = results['metadatas'][0]
            distances = results['distances'][0]
            
            for i, node_id in enumerate(ids):
                matches.append({
                    "node_id": node_id,
                    "metadata": metadatas[i],
                    "score": 1 - distances[i] # Convert distance to similarity roughly
                })
        
        return matches
    except Exception as e:
        print(f"   ❌ Search failed: {e}")
        return []

def explain_function(archeologist, node_id):
    """
    Phase 4: The Rosetta Stone.
    Uses GenAI to explain a function's purpose.
    """
    if not archeologist.has_ai:
        return "AI features are disabled."
        
    node_data = archeologist.graph.nodes[node_id]
    code = node_data.get('code', '')
    
    prompt = f"""
    Explain the following Python/JS/TS function in 2-3 sentences. 
    Focus on WHAT it does and WHY it might be complex or risky.
    Do not explain syntax. Explain logic.
    
    Code:
    ```
    {code}
    ```
    """
    
    try:
        res = archeologist.model.generate_content(prompt)
        return res.text
    except Exception as e:
        return f"Error explaining code: {e}"

def build_healing_context(archeologist, node_id):
    """
    Gathers all 3 Ingredients for a robust prompt:
    1. Target Code (from Graph)
    2. Neighbors (Callers/Callees from Graph)
    3. Style/Similar Patterns (from ChromaDB)
    """
    if node_id not in archeologist.graph.nodes:
        return None
        
    context = {}
    
    # 1. Target Data
    node_data = archeologist.graph.nodes[node_id]
    context['target_code'] = node_data.get('code', '')
    context['file'] = node_data.get('file', '')
    try:
        context['name'] = node_id.split('::')[1]
    except:
        context['name'] = node_id
    
    # 2. Neighbors (The Reality Check)
    # Incoming (Who calls me? -> Do not break their contract)
    callers = []
    try:
        for u, v in archeologist.graph.in_edges(node_id):
             if u in archeologist.graph.nodes:
                 code = archeologist.graph.nodes[u].get('code', '')
                 # Just take the signature/first few lines to show usage
                 snippet = "\\n".join(code.split('\\n')[:5])
                 callers.append(f"Caller `{u}`:\n{snippet}...") 
    except:
        pass
    context['callers'] = callers
    
    # Outgoing (Who do I call? -> Do not hallucinate APIS)
    callees = []
    try:
        for u, v in archeologist.graph.out_edges(node_id):
             if v in archeologist.graph.nodes:
                 code = archeologist.graph.nodes[v].get('code', '')
                 sig = code.split('\\n')[0]
                 callees.append(f"Callee `{v}` defined as: {sig}")
    except:
        pass
    context['callees'] = callees
    
    # 3. Style/Patterns (The RAG)
    similar_snippets = []
    if archeologist.has_memory:
        try:
             # Search for functions with similar vector embeddings
             res = archeologist.collection.query(
                 query_texts=[node_data.get('code', '')],
                 n_results=3
             )
             if res['documents']:
                 for i, doc in enumerate(res['documents'][0]):
                     # Don't include self
                     if res['ids'][0][i] != node_id:
                         similar_snippets.append(doc)
        except Exception as e:
            print(f"   ⚠️ RAG context fetch failed: {e}")
            
    context['similar_code'] = similar_snippets
    return context

def generate_heal_plan(archeologist, project_path, specific_target=None):
    """
    Phase 3: The Heal Plan (Strategy)
    - Pick a target node.
    - Build Context (Graph + RAG).
    - Consult Architect Model to generate a heal plan.
    """
    print("Phase 3: Consulting the Architect...")
    
    if not archeologist.has_ai:
        print("   -> AI disabled. Skipping strategy generation.")
        return

    target_node = specific_target
    
    if not target_node:
        # Simple heuristic: Find 'login_user' or just pick the first node that clearly has a body
        for node in archeologist.graph.nodes:
            if "login_user" in node:
                target_node = node
                break
        
        if not target_node and len(archeologist.graph.nodes) > 0:
            target_node = list(archeologist.graph.nodes)[0]
    
    if not target_node:
        print("   -> No suitable target node found.")
        return None

    # --- Step 1: Build Context ---
    ctx = build_healing_context(archeologist, target_node)
    
    # Format Context Strings
    callers_text = "\n".join(ctx['callers']) if ctx['callers'] else "No known callers."
    callees_text = "\n".join(ctx['callees']) if ctx['callees'] else "No known internal dependencies."
    similar_text = "\n---\n".join(ctx['similar_code']) if ctx['similar_code'] else "No similar patterns found."

    prompt = f"""
    You are the "Code Archeologist", a Senior Refactoring Engineer.
    
    OBJECTIVE: Refactor the Legacy Function `{ctx['name']}` from file `{ctx['file']}`.
    
    === INGREDIENT 1: THE LEGACY CODE ===
    ```
    {ctx['target_code']}
    ```
    
    === INGREDIENT 2: THE REALITY CHECK (Graph Context) ===
    Do not break these callers:
    {callers_text}
    
    Do not hallucinate APIs. Only use these known functions if needed:
    {callees_text}
    
    === INGREDIENT 3: STYLE GUIDE (Similar Project Code) ===
    Mimic the style/patterns found here:
    {similar_text}
    
    === INSTRUCTIONS ===
    1. Analyze the legacy code for readability, performance, and security issues.
    2. Refactor it to be clean, modern, and robust.
    3. IMPROVE THE NAME: If the current function name is ambiguous or cryptic, rename it to something descriptive (snake_case).
    4. KEEP the arguments/signature compatible to avoid breaking callers.
    5. CRITICAL: Output ONLY the refactored function code. Do NOT include imports, helper functions, or the original dependencies in the code block.
    6. Output the REFACTORED code in a Markdown block like ```python ... ```.
    """

    print(f"   -> Context built. Sending to {archeologist.model_name}...")
    try:
        # Use the Architect (smarter model) for this task
        response = archeologist.architect.generate_content(prompt)
        print("   -> Architect's Report:\n")
        print("="*40)
        print(response.text)
        print("="*40)
        return (target_node, response.text) # Return tuple
    except Exception as e:
         print(f"   -> AI Error: {e}")
         return None
