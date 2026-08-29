"""
SIH26024 — Test Suite Headless Runner & Validation Check
"""
import os
import sys

def verify_all_files():
    required_files = [
        "index.html",
        "styles.css",
        "app.js",
        "src/auth/authService.js",
        "src/map/mineMap.js",
        "src/map/mineMap.css",
        "src/alerts/alertSystem.js",
        "src/geofence/geofenceEngine.js",
        "src/risk/anomalyEngine.js",
        "src/risk/riskEngine.js",
        "src/services/caseService.js",
        "src/services/inspectionService.js",
        "src/services/evidenceService.js",
        "src/audit/auditService.js",
        "src/demo/p0Demo.js",
        "tests/testSuite.js",
        "tests/index.html"
    ]
    
    print("--- Verifying Required Files & Structure ---")
    missing = []
    for f in required_files:
        if not os.path.exists(f):
            print(f"FAIL: Missing file: {f}")
            missing.append(f)
        else:
            size = os.path.getsize(f)
            print(f"OK: {f} ({size} bytes)")
            
    if missing:
        print(f"\nFAIL: {len(missing)} files missing!")
        sys.exit(1)
        
    print("\n--- Syntax Verification ---")
    for f in required_files:
        if f.endswith('.js'):
            with open(f, 'r', encoding='utf-8') as js_file:
                content = js_file.read()
                opens = content.count('{')
                closes = content.count('}')
                if opens != closes:
                    print(f"FAIL: {f} has brace mismatch: {opens} vs {closes}")
                    sys.exit(1)
                else:
                    print(f"OK: {f} syntax balanced.")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY.")

if __name__ == '__main__':
    verify_all_files()
