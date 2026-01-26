import os
import subprocess

def run(archeologist, old_node_id, new_name, project_path):
    """
    Phase 5: Healing the Web (Propagation)
    - Update all callers to use the new name.
    """
    print(f"🕸️  Phase 5: Propagating changes for {old_node_id} -> {new_name}...")
    
    old_name = old_node_id.split('::')[1]
    
    # Find callers using the graph
    callers = list(archeologist.graph.predecessors(old_node_id))
    
    for caller_id in callers:
        caller_data = archeologist.graph.nodes[caller_id]
        print(f"   -> Updating caller: {caller_id}")
        
        file_rel_path = caller_data['file']
        full_path = os.path.join(project_path, file_rel_path)
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            # Very naive replacement: replace `old_name(` with `new_name(`
            # In a real tool, we would use AST-based replacement
            new_content = content.replace(f"{old_name}(", f"{new_name}(")
            
            with open(full_path, 'w') as f:
                f.write(new_content)
                
            # Stage the change so it's included in the merge
            subprocess.run(["git", "add", file_rel_path], cwd=project_path, check=True)
            
        except Exception as e:
            print(f"      -> Error updating caller: {e}")
