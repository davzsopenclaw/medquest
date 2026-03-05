import os
import json

data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
dirs = ['parsed-questions', 'generated-questions']

all_questions = []

for d in dirs:
    dir_path = os.path.join(data_dir, d)
    if not os.path.exists(dir_path):
        continue
    for f in os.listdir(dir_path):
        if f.endswith('.json'):
            file_path = os.path.join(dir_path, f)
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    data = json.load(file)
                    if isinstance(data, list):
                        all_questions.extend(data)
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")

output_path = os.path.join(data_dir, 'all_questions.json')
with open(output_path, 'w', encoding='utf-8') as out_file:
    json.dump(all_questions, out_file, indent=2)

print(f"Successfully merged {len(all_questions)} questions into {output_path}")
