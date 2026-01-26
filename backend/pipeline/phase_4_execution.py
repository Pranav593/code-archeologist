import os
import re
import subprocess
import datetime

def run(archeologist, plan_tuple, project_path):
    """
    Phase 4: The Worker Bees (Execution)
    - Parse the Refactored Code from the report.
    - Creates a Git Branch for safety.
    - Surgically replace the old function in the file.
    """
    print("Phase 4: Dispatching Agents...")
    
    if not plan_tuple:
        print("   -> No plan to execute.")
        return None, None

    target_node, response_text = plan_tuple
    if not target_node or not response_text:
        return None, None

    # 1. Parse the new code from the Markdown
    code_match = re.search(r"```(?:python|javascript|typescript)\s*(.*?)\s*```", response_text, re.DOTALL)
    if not code_match:
         # Fallback for unspecified language block
         code_match = re.search(r"```\s*(.*?)\s*```", response_text, re.DOTALL)
         
    if not code_match:
        print("   -> Could not find code block in AI response.")
        return None, None
    
    new_code = code_match.group(1).strip()
    new_code += "\n"
    
    # Extract new function name - simplistic regex
    name_match = re.search(r"def\s+([a-zA-Z_]\w*)\s*\(", new_code)
    if not name_match:
        name_match = re.search(r"function\s+([a-zA-Z_]\w*)\s*\(", new_code) # JS style
        
    if name_match:
        new_func_name = name_match.group(1)
    else:
        print("   -> Could not determine new function name.")
        new_func_name = None

    # 2. Get location of the old code
    node_data = archeologist.graph.nodes[target_node]
    file_rel_path = node_data['file']
    full_file_path = os.path.join(project_path, file_rel_path)
    
    start_byte = node_data['start_byte']
    end_byte = node_data['end_byte']

    print(f"   -> Surgically replacing {target_node} in {file_rel_path}...")

    # --- PHASE 5: GIT SAFETY NET ---
    branch_name = None
    try:
        # Check if git repo exists, if not init
        if not os.path.exists(os.path.join(project_path, ".git")):
            print("   -> Initializing Git repository for safety...")
            subprocess.run(["git", "init"], cwd=project_path, check=True)
            subprocess.run(["git", "config", "user.email", "archeologist@system.local"], cwd=project_path, check=True)
            subprocess.run(["git", "config", "user.name", "Code Archeologist"], cwd=project_path, check=True)
            
            subprocess.run(["git", "branch", "-M", "main"], cwd=project_path, check=True) # Enforce main
            subprocess.run(["git", "add", "."], cwd=project_path, check=True)
            subprocess.run(["git", "commit", "-m", "Initial Baseline"], cwd=project_path, check=True)
        
        # ALWAYS ensure config is set
        subprocess.run(["git", "config", "--global", "user.email", "archeologist@system.local"], cwd=project_path, check=True)
        subprocess.run(["git", "config", "--global", "user.name", "Code Archeologist"], cwd=project_path, check=True)

        # ENSURE MAIN BRANCH EXISTS
        try:
            branches_out = subprocess.check_output(["git", "branch"], cwd=project_path).decode()
            if "master" in branches_out and "main" not in branches_out:
                 print("   -> Renaming 'master' to 'main' for consistency...")
                 subprocess.run(["git", "branch", "-m", "master", "main"], cwd=project_path, check=True)
        except Exception as e:
             pass

        if archeologist.safe_mode:
            # Create Branch
            timestamp = datetime.datetime.now().strftime("%H%M%S")
            clean_node = target_node.split("::")[-1].replace("_", "-")
            branch_name = f"ai-heal-{clean_node}-{timestamp}"
            
            print(f"   -> Creating safety branch: {branch_name}")
            subprocess.run(["git", "checkout", "-b", branch_name], cwd=project_path, check=True)
        else:
             print("   -> ⚠️ Safe Mode OFF: Applying changes directly to current branch.")
             # Get current branch name just for reporting
             try:
                branch_name = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=project_path).decode().strip()
             except:
                branch_name = "HEAD"
        
    except Exception as e:
        print(f"   -> Git Ops Failed: {e}. Proceeding carefully...")

    try:
        # 3. Read the original file as BYTES
        with open(full_file_path, 'rb') as f:
            content_bytes = f.read()
        
        # 4. Splice in new code
        # We need to encode the new code to bytes
        new_code_bytes = new_code.encode('utf-8')
        
        pre_content = content_bytes[:start_byte]
        post_content = content_bytes[end_byte:]
        
        final_content = pre_content + new_code_bytes + post_content
        
        with open(full_file_path, 'wb') as f:
            f.write(final_content)
            
        print("   -> Surgery complete.")
        
        # Stage but DO NOT COMMIT so VS Code sees the pending changes
        try:
            subprocess.run(["git", "add", file_rel_path], cwd=project_path, check=True)
            # subprocess.run(["git", "commit", "-m", f"Healed {target_node}"], cwd=project_path, check=True)
        except:
            pass
            
        return new_func_name, branch_name
        
    except Exception as e:
        print(f"   -> Surgery Failed: {e}")
        return None, None

def get_diff(branch_name, project_path):
    try:
        # Compare Staged changes (cached) against HEAD (which is the baseline before commit)
        cmd = ["git", "diff", "--cached"]
        result = subprocess.run(cmd, cwd=project_path, capture_output=True, text=True)
        diff = result.stdout
        if not diff:
            return "No textual differences found (or branches are identical)."
        return diff
    except Exception as e:
        return f"Error getting diff: {e}"

def merge_branch(branch_name, project_path):
    try:
        # Determine current branch
        current_branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], 
            cwd=project_path
        ).decode().strip()

        # CASE A: Safe Mode OFF (Direct Commit)
        # If the branch_name passed in IS the current branch (e.g., 'main' or 'HEAD'),
        # or if they are the same actual ref, we just commit.
        if branch_name == "HEAD" or branch_name == current_branch:
            print(f"   -> Direct commit on {current_branch} (Safe Mode OFF)")
            subprocess.run(["git", "commit", "-m", "AI Refactor: Direct Apply"], cwd=project_path, check=True)
            return True, "Changes committed successfully."

        # CASE B: Safe Mode ON (Merge feature branch)
        # 1. Commit the pending staged changes on the feature branch.
        subprocess.run(["git", "commit", "-m", f"AI Refactor: {branch_name}"], cwd=project_path, check=True)
        
        # 2. Merge into main
        subprocess.run(["git", "checkout", "-f", "main"], cwd=project_path, check=True)
        subprocess.run(["git", "merge", branch_name], cwd=project_path, check=True)
        subprocess.run(["git", "branch", "-d", branch_name], cwd=project_path, check=True)
        return True, "Merged successfully"
    except Exception as e:
        return False, str(e)

def discard_branch(branch_name, project_path):
    try:
         # 1. Reset any staged/uncommitted changes on the current branch
         subprocess.run(["git", "reset", "--hard"], cwd=project_path, check=True)
         
         # 2. Return to main and delete the temp branch
         subprocess.run(["git", "checkout", "-f", "main"], cwd=project_path, check=True)
         subprocess.run(["git", "branch", "-D", branch_name], cwd=project_path, check=True)
         return True, "Discarded successfully"
    except Exception as e:
         return False, str(e)
