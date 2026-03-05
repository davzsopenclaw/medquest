#!/usr/bin/env python3
"""
Direct question generator - runs in this session without sub-agents.
Generates questions for a given system and appends to the JSON file.
"""
import json, sys, os

SYSTEM_FILES = {
    'blood': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/blood.json',
    'cardiovascular': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/cardiovascular.json',
    'respiratory': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/respiratory.json',
    'foundation': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/foundation.json',
    'immunology': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/immunology.json',
    'metabolism': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/metabolism.json',
    'gastrointestinal': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/gastrointestinal.json',
    'renal': '/Users/davidzhang/.openclaw/workspace/medquest/data/generated-questions/renal.json',
}

def get_counts():
    for name, path in SYSTEM_FILES.items():
        try:
            with open(path) as f:
                data = json.load(f)
            print(f"  {name:20} {len(data):>3}/250  (need {max(0, 250-len(data))} more)")
        except:
            print(f"  {name:20} ERROR")

def append_questions(system, new_questions):
    path = SYSTEM_FILES[system]
    with open(path) as f:
        existing = json.load(f)
    existing.extend(new_questions)
    with open(path, 'w') as f:
        json.dump(existing, f, indent=2)
    print(f"  Saved {len(new_questions)} new questions → {path} (total: {len(existing)})")
    return len(existing)

if __name__ == '__main__':
    get_counts()
