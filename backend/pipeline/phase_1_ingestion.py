import os

def run(archeologist, project_path):
    """
    Phase 1: Digital Excavation (Ingestion)
    - Crawl the file system.
    - Parse code into AST using tree-sitter.
    - Store code chunks and vectors in ChromaDB.
    """
    archeologist.log(f"Phase 1: Excavating {project_path}...")
    if not os.path.exists(project_path):
        archeologist.log(f"❌ Error: Path {project_path} does not exist.")
        return

    count = 0
    for root, dirs, files in os.walk(project_path):
        for file in files:
            if file.endswith(('.py', '.js', '.ts', '.java', '.php', '.cs')): 
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_path)
                with open(full_path, 'rb') as f:
                    code = f.read()
                
                lang = 'python' if file.endswith('.py') else 'javascript'
                if file.endswith('.ts'): lang = 'typescript'
                if file.endswith('.java'): lang = 'java'
                if file.endswith('.php'): lang = 'php'
                if file.endswith('.cs'): lang = 'csharp'
                
                defs = archeologist.parser_manager.parse(code, lang)
                
                # Store nodes in graph
                for func_def in defs:
                    count += 1
                    func_name = func_def['name']
                    node_id = f"{rel_path}::{func_name}"
                    
                    # Extract just the function code
                    s_byte = func_def['start_byte']
                    e_byte = func_def['end_byte']
                    func_code = code[s_byte:e_byte].decode('utf-8')
                    
                    archeologist.graph.add_node(
                        node_id, 
                        type="function", 
                        file=rel_path, 
                        code=func_code, 
                        calls=func_def.get('calls', []),
                        imports=func_def.get('imports', []),
                        start_byte=s_byte,
                        end_byte=e_byte,
                        complexity=func_def.get('complexity', 1)
                    )
                    
                    # Phase 1.5: Embed in Vector DB
                    if archeologist.has_memory:
                        try:
                            archeologist.collection.upsert(
                                ids=[node_id],
                                documents=[func_code],
                                metadatas=[{
                                    "file": rel_path,
                                    "name": func_name,
                                    "type": "function",
                                    "node_id": node_id
                                }]
                            )
                        except Exception as e:
                            print(f"   -> Error embedding {node_id}: {e}")

    if archeologist.has_memory:
        archeologist.log(f"   -> Ingested {archeologist.graph.number_of_nodes()} code artifacts into Vector Memory.")
