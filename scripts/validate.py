import os
import sys

def check_syntax(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        opens = content.count('{')
        closes = content.count('}')
        
        if opens != closes:
            print(f"FAIL: Syntax Error in {filepath}: Brace mismatch! ({{:{opens}, }}:{closes})")
            return False
            
        return True
    except Exception as e:
        print(f"FAIL: Error reading {filepath}: {e}")
        return False

def main():
    print("=== SIH26024 Production Validation ===")
    
    js_files = []
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith('.js'):
                js_files.append(os.path.join(root, file))
    
    js_files.append('app.js')
    
    failed = False
    for file in js_files:
        if not check_syntax(file):
            failed = True
            
    if failed:
        print("\nVALIDATION FAILED")
        sys.exit(1)
    else:
        print("\nVALIDATION PASSED: All JS files checked for syntax errors.")
        sys.exit(0)

if __name__ == '__main__':
    main()
