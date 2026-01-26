from .python_parser import PythonParser
from .javascript_parser import JavascriptParser
from .java_parser import JavaParser
from .php_parser import PhpParser
from .csharp_parser import CSharpParser

class ParserManager:
    def __init__(self):
        self.parsers = {
            'python': PythonParser(),
            'javascript': JavascriptParser(),
            'typescript': JavascriptParser(),
            'java': JavaParser(),
            'php': PhpParser(),
            'csharp': CSharpParser()
        }
    
    def parse(self, code_bytes, lang):
        if lang in self.parsers:
             return self.parsers[lang].parse(code_bytes)
        return []
