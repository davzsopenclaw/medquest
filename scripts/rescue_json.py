import json
import re

def rescue_file(path):
    print(f"Rescuing {path}...")
    try:
        with open(path, 'r') as f:
            content = f.read()
        
        # Try to extract the first valid JSON array
        match = re.search(r'\[\s*\{.*?\}\s*\]', content, re.DOTALL)
        if match:
            try:
                batch = json.loads(match.group(0))
                with open(path, 'w') as f:
                    json.dump(batch, f, indent=2)
                print(f"  Success: {len(batch)} questions saved.")
                return
            except json.JSONDecodeError:
                pass
                
        # If it fails, try finding all individual JSON objects
        matches = re.findall(r'\{[^{}]*"id"[^{}]*"question_type"[^{}]*"options"[^{}]*\}', content, re.DOTALL)
        valid_objects = []
        for m in matches:
            try:
                obj = json.loads(m)
                valid_objects.append(obj)
            except:
                # Sometimes options or nested structures cause issues, try a more permissive regex or manual cleanup
                try:
                    # Fix common unescaped quotes inside strings
                    cleaned = re.sub(r'(?<!\\)"', r'\\"', m) 
                    # This is too complex, let's just use ast.literal_eval if it was Python dict, but it's JSON
                    pass
                except:
                    continue
                    
        if valid_objects:
            with open(path, 'w') as f:
                json.dump(valid_objects, f, indent=2)
            print(f"  Success: {len(valid_objects)} questions extracted.")
        else:
            print("  Failed: Could not parse JSON objects.")
            
    except Exception as e:
        print(f"  Error: {e}")

rescue_file('/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/immunology_051_075.json')
