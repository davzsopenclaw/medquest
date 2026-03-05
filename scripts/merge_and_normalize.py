import json
import glob
import os
from collections import Counter

gen_dir = '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/*.json'
parsed_dir = '/Users/davidzhang/.openclaw/workspace/medquest/data/parsed-questions/*.json'
output_file = '/Users/davidzhang/.openclaw/workspace/medquest/data/all_questions.json'

all_questions = []
seen_ids = set()

system_map = {
    'GIT': 'Gastrointestinal',
    'CVS': 'Cardiovascular',
    'renal': 'Renal',
    'FOUNDATION': 'Foundation',
    'General': 'Foundation'
}

for path in glob.glob(gen_dir) + glob.glob(parsed_dir):
    if 'all_questions.json' in path or 'renal_new.json' in path: continue
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            for q in data:
                if q.get('id') not in seen_ids:
                    # Normalize system
                    sys = q.get('system', '')
                    if sys in system_map:
                        q['system'] = system_map[sys]
                    elif isinstance(sys, str) and (sys.islower() or sys.isupper()):
                        q['system'] = sys.title()
                        
                    all_questions.append(q)
                    seen_ids.add(q.get('id'))
    except Exception as e:
        print(f"Error reading {path}: {e}")

with open(output_file, 'w') as f:
    json.dump(all_questions, f, indent=2)

print(f"Successfully merged and normalized {len(all_questions)} unique questions.")

counts = Counter(q.get('system', 'Unknown') for q in all_questions)
print('Current Question Bank Counts by System:')
for sys, count in sorted(counts.items()):
    print(f'- {sys}: {count}')
