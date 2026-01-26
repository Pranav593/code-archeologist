from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_python
import re

class PythonParser:
    def __init__(self):
        self.language = Language(tree_sitter_python.language())
        self.parser = Parser()
        self.parser.language = self.language

    def parse(self, code_bytes):
        definitions = []
        file_imports = []
        
        # Queries
        query_def_scm = """
        (function_definition
            name: (identifier) @function.name)
        """
        query_call_scm = """
        (call function: (_) @call.full)
        """
        query_complexity_scm = """
        (if_statement) @c
        (elif_clause) @c
        (for_statement) @c
        (while_statement) @c
        (try_statement) @c
        (except_clause) @c
        (boolean_operator) @c
        (binary_operator) @c
        (comparison_operator) @c
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
            # Fallback
            try:
                safe_query = """ (if_statement) @c (for_statement) @c (while_statement) @c """
                query_complexity = Query(self.language, safe_query)
            except:
                pass

        # 3. Extract Imports (Manual Parse)
        code_str = code_bytes.decode('utf-8')
        for line in code_str.split('\n'):
            line = line.strip()
            if line.startswith('import '):
                parts = line[7:].split(',')
                for p in parts:
                    p = p.strip()
                    if ' as ' in p:
                        raw, alias = p.split(' as ')
                        file_imports.append({'module': raw.strip(), 'alias': alias.strip()})
                    else:
                        file_imports.append({'module': p.strip(), 'alias': p.strip()})
            elif line.startswith('from '):
                # from X import Y, Z
                try:
                    mod_part, rest = line[5:].split(' import ')
                    mod = mod_part.strip()
                    names = rest.split(',')
                    for n in names:
                        n = n.strip()
                        if ' as ' in n:
                            raw, alias = n.split(' as ')
                            file_imports.append({'module': mod, 'name': raw.strip(), 'alias': alias.strip()})
                        else:
                            file_imports.append({'module': mod, 'name': n.strip(), 'alias': n.strip()})
                except:
                    pass

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
                    elif 'call.name' in captures_calls: 
                         for call_node in captures_calls['call.name']:
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
