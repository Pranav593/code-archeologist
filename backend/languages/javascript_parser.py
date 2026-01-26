from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_javascript
import re

class JavascriptParser:
    def __init__(self):
        self.language = Language(tree_sitter_javascript.language())
        self.parser = Parser()
        self.parser.language = self.language

    def parse(self, code_bytes):
        definitions = []
        file_imports = []
        
        # Queries
        query_def_scm = """
        (function_declaration
            name: (identifier) @function.name)
        """
        query_call_scm = """
        (call_expression function: (_) @call.full)
        """
        query_complexity_scm = """
        (if_statement) @c
        (for_statement) @c
        (while_statement) @c
        (catch_clause) @c
        (ternary_expression) @c
        (binary_expression) @c
        """

        tree = self.parser.parse(code_bytes)
        
        # 1. Extract Definitions
        try:
            query_def = Query(self.language, query_def_scm)
            cursor = QueryCursor(query_def)
            captures_def = cursor.captures(tree.root_node)
        except Exception as e:
            print(f"Error creating query for definitions: {e}")
            captures_def = {}

        # 2. Prepare Complexity & Call Queries
        query_complexity = None
        query_call = None
        try:
            query_complexity = Query(self.language, query_complexity_scm)
            query_call = Query(self.language, query_call_scm)
        except Exception as e:
            pass

        # 3. Extract Imports (Manual Parse - Robust)
        code_str = code_bytes.decode('utf-8')
        clean_code = code_str.replace('\n', ' ') 
        
        # Regex for literal string path
        path_pattern = r"['\"]([^'\"]+)['\"]"
        
        # Case A: import { x, y as z } from 'path'
        matches_named = re.finditer(r"import\s*\{([^}]+)\}\s*from\s*" + path_pattern, clean_code)
        for m in matches_named:
            inner = m.group(1)
            mod_path = m.group(2)
            for part in inner.split(','):
                part = part.strip()
                if not part: continue
                if ' as ' in part:
                    raw, alias = part.split(' as ')
                    file_imports.append({'module': mod_path, 'name': raw.strip(), 'alias': alias.strip()})
                else:
                    file_imports.append({'module': mod_path, 'name': part, 'alias': part})
        
        # Case B: import Default from 'path'
        matches_default = re.finditer(r"import\s+([a-zA-Z0-9_$]+)\s+from\s*" + path_pattern, clean_code)
        for m in matches_default:
            alias = m.group(1)
            mod_path = m.group(2)
            # In ES6 default import, 'name' is conceptually 'default'
            file_imports.append({'module': mod_path, 'name': 'default', 'alias': alias})


        # 4. Extract Functions
        if 'function.name' in captures_def:
            for node in captures_def['function.name']:
                func_def_node = node.parent
                
                # Complexity
                complexity = 1
                if query_complexity:
                    cursor_c = QueryCursor(query_complexity)
                    captures_c = cursor_c.captures(func_def_node)
                    if 'c' in captures_c:
                         complexity += len(captures_c['c'])
                
                # Calls
                local_calls = []
                if query_call:
                    cursor_calls = QueryCursor(query_call)
                    captures_calls = cursor_calls.captures(func_def_node)
                    
                    if 'call.full' in captures_calls:
                         for call_node in captures_calls['call.full']:
                             local_calls.append(call_node.text.decode('utf-8'))

                definitions.append({
                    'name': node.text.decode('utf-8'),
                    'start_byte': func_def_node.start_byte,
                    'end_byte': func_def_node.end_byte,
                    'complexity': complexity,
                    'calls': local_calls,
                    'imports': file_imports
                })

        return definitions
