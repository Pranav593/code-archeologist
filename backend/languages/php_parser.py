from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_php

class PhpParser:
    def __init__(self):
        self.language = Language(tree_sitter_php.language_php())
        self.parser = Parser()
        self.parser.language = self.language

    def parse(self, code_bytes):
        definitions = []
        file_imports = []
        
        # PHP Queries
        
        # Match standard functions and class methods
        query_def_scm = """
        (function_definition name: (name) @function.name)
        (method_declaration name: (name) @function.name)
        """
        
        # Match function calls, method calls ($obj->method()), and static calls (Class::method())
        query_call_scm = """
        (function_call_expression function: (name) @call.full)
        (function_call_expression function: (qualified_name) @call.full)
        (member_call_expression name: (name) @call.full)
        (scoped_call_expression name: (name) @call.full)
        """
        
        query_complexity_scm = """
        (if_statement) @c
        (else_clause) @c
        (else_if_clause) @c
        (for_statement) @c
        (foreach_statement) @c
        (while_statement) @c
        (do_statement) @c
        (switch_statement) @c
        (case_statement) @c
        (try_statement) @c
        (catch_clause) @c
        (binary_expression operator: "||") @c
        (binary_expression operator: "&&") @c
        """

        try:
            tree = self.parser.parse(code_bytes)
        except Exception as e:
            print(f"Error parsing PHP code: {e}")
            return [], []
            
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
            print(f"Error preparing queries: {e}")

        # Process Definitions
        # Handle captures dict or list
        if isinstance(captures_def, dict):
             def_nodes = captures_def.get('function.name', [])
        elif isinstance(captures_def, list):
             def_nodes = [c[0] for c in captures_def if c[1] == 'function.name']
        else:
             def_nodes = []
        
        for node in def_nodes:
            func_name = code_bytes[node.start_byte:node.end_byte].decode('utf-8')
            
            # Find the full function body/declaration node
            parent = node.parent
            while parent and parent.type not in ('function_definition', 'method_declaration'):
                parent = parent.parent
            fn_node = parent if parent else node
            
            # Local complexity
            complexity = 0
            if query_complexity:
                cc_cursor = QueryCursor(query_complexity)
                cc_cursor.set_point_range(fn_node.start_point, fn_node.end_point)
                cc_captures = cc_cursor.captures(fn_node)
                complexity = len(cc_captures) + 1

            # Local Calls
            calls = []
            if query_call:
                call_cursor = QueryCursor(query_call)
                call_cursor.set_point_range(fn_node.start_point, fn_node.end_point)
                call_captures = call_cursor.captures(fn_node)
                
                iter_captures = []
                if isinstance(call_captures, dict):
                    # Flatten dict values
                    for _, nodes in call_captures.items():
                        iter_captures.extend(nodes)
                elif isinstance(call_captures, list):
                    # Extract nodes from tuples
                    iter_captures = [c[0] for c in call_captures]
                
                for c_node in iter_captures:
                    c_name = code_bytes[c_node.start_byte:c_node.end_byte].decode('utf-8')
                    calls.append(c_name)
            
            definitions.append({
                'name': func_name,
                'type': 'function',
                'start_line': node.start_point.row,
                'end_line': node.end_point.row,
                'start_byte': fn_node.start_byte,
                'end_byte': fn_node.end_byte,
                'complexity': complexity,
                'calls': calls
            })
            
        return definitions
