import os

def run(archeologist):
    """
    Phase 2: The Invisible String Map (Analysis)
    - Analyze imports and calls.
    - Build a directional graph of dependencies.
    """
    archeologist.log("🗺️  Phase 2: Building the Dependency Map...")

    # 1. Build Index: { filename : { func_name : node_id } }
    file_map = {} 
    for node, data in archeologist.graph.nodes(data=True):
        if data.get('type') == 'function':
            fpath = data.get('file')
            fname = node.split('::')[1]
            if fpath not in file_map:
                file_map[fpath] = {}
            file_map[fpath][fname] = node
    
    edges_added = 0
    for node_id, data in archeologist.graph.nodes(data=True):
        calls = data.get('calls', [])
        imports = data.get('imports', [])
        current_file = data.get('file')
        
        # Helper to find target node
        def find_target(target_module, target_func):
            candidates = []
            for fpath in file_map:
                # Resolve Target Module Name
                base = os.path.basename(fpath)
                name_only = os.path.splitext(base)[0] # utils.js -> utils
                
                # Check strict match
                is_match = False
                if target_module.startswith('.'):
                    # Relative Import Logic
                    # Heuristic: Check if target_module ends with the filename
                    target_clean = os.path.basename(target_module)
                    if target_clean == name_only:
                         is_match = True
                else:
                    # Absolute/Package Import Logic
                    if target_module == name_only:
                        is_match = True
                        
                if is_match:
                    if target_func in file_map[fpath]:
                        candidates.append(file_map[fpath][target_func])
            return candidates

        for call_text in calls:
            # Case 1: Qualified Call (e.g. inventory.process_item)
            if '.' in call_text:
                parts = call_text.split('.')
                obj = parts[0]
                method = parts[-1] 
                
                # Resolve 'obj'. Is it an import alias?
                real_module = None
                for imp in imports:
                    if imp.get('alias') == obj:
                        real_module = imp.get('module')
                        break
                
                if real_module:
                     targets = find_target(real_module, method)
                     for t in targets:
                         archeologist.graph.add_edge(node_id, t)
                         edges_added += 1
                else:
                    # Try explicit match (implicit relative or just matching name)
                    targets = find_target(obj, method)
                    for t in targets:
                         archeologist.graph.add_edge(node_id, t)
                         edges_added += 1

            # Case 2: Unqualified Call (e.g. process_item)
            else:
                # Check if it is 'from M import func' (aliased as call_text)
                imported_target = None
                for imp in imports:
                    if imp.get('alias') == call_text:
                        mod = imp.get('module')
                        orig_name = imp.get('name')
                        if orig_name:
                            imported_target = (mod, orig_name)
                        break
                
                if imported_target:
                    targets = find_target(imported_target[0], imported_target[1])
                    for t in targets:
                        archeologist.graph.add_edge(node_id, t)
                        edges_added += 1
                else:
                    # Assume internal call (same file)
                    if current_file in file_map and call_text in file_map[current_file]:
                         target = file_map[current_file][call_text]
                         if target != node_id:
                             archeologist.graph.add_edge(node_id, target)
                             edges_added += 1
                        
    archeologist.log(f"   -> Graph built with {archeologist.graph.number_of_nodes()} nodes and {edges_added} dependencies.")
