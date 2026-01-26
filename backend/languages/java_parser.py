from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_java

class JavaParser:
    def __init__(self):
        self.language = Language(tree_sitter_java.language())
        self.parser = Parser()
        self.parser.language = self.language

    def parse(self, code_bytes):
        definitions = []
        file_imports = []
        
        query_def_scm = """
        (method_declaration
            name: (identifier) @function.name)
        """
        
        query_call_scm = """
        (method_invocation name: (identifier) @call.full)
        """
        
        query_complexity_scm = """
        (if_statement) @c
        (for_statement) @c
        (while_statement) @c
        (switch_expression) @c
        (try_statement) @c
        (catch_clause) @c
        (throw_statement) @c
        (binary_expression) @c
        """

        tree = self.parser.parse(code_bytes)
        
        try:
            query_def = Query(self.language, query_def_scm)
            cursor = QueryCursor(query_def)
            captures_def = cursor.captures(tree.root_node)
        except Exception as e:
            print(f"Error creating query for definitions: {e}")
            captures_def = {}

        query_complexity = None
        query_call = None
        try:
            query_complexity = Query(self.language, query_complexity_scm)
            query_call = Query(self.language, query_call_scm)
        except Exception as e:
            print(f"Error preparing queries: {e}")

        def_nodes = captures_def.get('function.name', [])
        
        for node in def_nodes:
            func_name = code_bytes[node.start_byte:node.end_byte].decode('utf-8')
            
            parent = node.parent
            while parent and parent.type != 'method_declaration':
                parent = parent.parent
            fn_node = parent if parent else node
            
            complexity = 0
            if query_complexity:
                cc_cursor = QueryCursor(query_complexity)
                cc_cursor.set_point_range(fn_node.start_point, fn_node.end_point)
                cc_captures = cc_cursor.captures(fn_node)
                complexity = len(cc_captures) + 1

            calls = []
            if query_call:
                call_cursor = QueryCursor(query_call)
                call_cursor.set_point_range(fn_node.start_point, fn_node.end_point)
                call_captures = call_cursor.captures(fn_node)
                
                if isinstance(call_captures, dict):
                     call_nodes = call_captures.get('call.full', [])
                     for c_node in call_nodes:
                        c_name = code_bytes[c_node.start_byte:c_node.end_byte].decode('utf-8')
                        calls.append(c_name)
                elif isinstance(call_captures, list):
                     for capture in call_captures:
                        c_node = capture[0]
                        c_name = code_bytes[c_node.start_byte:c_node.end_byte].decode('utf-8')
                        calls.append(c_name)
            
            definitions.append({
                'name': func_name,
                'type': 'method',
                'start_line': node.start_point.row,
                'end_line': node.end_point.row,
                'start_byte': fn_node.start_byte,
                'end_byte': fn_node.end_byte,
                'complexity': complexity,
                'calls': calls
            })
            
        return definitions
