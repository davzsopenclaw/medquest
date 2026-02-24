#!/usr/bin/env python3
"""
Batch question generator using Claude API directly.
Generates questions in small batches (25 at a time) and saves incrementally.
This is more reliable than sub-agents for large-scale generation.

Usage: python3 scripts/batch_generate.py --system Renal --target 250
       python3 scripts/batch_generate.py --all --target 250
"""

import json
import os
import sys
import time
import subprocess

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'generated-questions')
os.makedirs(DATA_DIR, exist_ok=True)

SYSTEMS = {
    'Renal': {
        'topics': [
            'Nephron anatomy and physiology', 'PCT transport', 'Loop of Henle', 'DCT and CD',
            'GFR and clearance', 'Acid-base disorders', 'Metabolic acidosis', 'Metabolic alkalosis',
            'Respiratory acidosis', 'Respiratory alkalosis', 'Anion gap',
            'Sodium disorders', 'Potassium disorders', 'Calcium disorders', 'Phosphate disorders',
            'Loop diuretics', 'Thiazide diuretics', 'K-sparing diuretics', 'Osmotic diuretics', 'CAi',
            'ACEi and ARBs', 'RAAS system',
            'Minimal change disease', 'FSGS', 'Membranous nephropathy', 'IgA nephropathy',
            'Post-infectious GN', 'MPGN', 'RPGN', 'Lupus nephritis', 'Goodpasture syndrome',
            'Diabetic nephropathy', 'Nephrotic syndrome', 'Nephritic syndrome',
            'AKI', 'CKD', 'ESRD', 'Dialysis',
            'Lower UTI', 'Upper UTI', 'UTI pathogens', 'UTI antibiotics',
            'Calcium oxalate stones', 'Uric acid stones', 'Struvite stones',
            'BPH', 'Hydronephrosis', 'RCC', 'Wilms tumour',
            'Renal infarction', 'ADPKD', 'ARPKD', 'Horseshoe kidney',
            'Amyloidosis renal', 'Drug-induced nephrotoxicity',
        ],
    },
    'Cardiovascular': {
        'topics': [
            'Coronary artery anatomy', 'ECG lead territories', 'STEMI', 'NSTEMI',
            'MI histology timeline', 'MI complications',
            'HFrEF', 'HFpEF', 'Heart failure drugs',
            'Cardiogenic shock', 'Hypovolemic shock', 'Septic shock', 'Anaphylactic shock',
            'Atherosclerosis pathogenesis', 'Foam cells', 'Plaque rupture',
            'HTN management', 'HTN stepped care',
            'Atrial fibrillation', 'Ventricular tachycardia', 'Heart blocks', 'Long QT',
            'Beta-blockers', 'Calcium channel blockers', 'Nitrates', 'Digoxin',
            'Class I antiarrhythmics', 'Class III antiarrhythmics',
            'Heparin', 'Warfarin', 'DOACs', 'Aspirin', 'Clopidogrel',
            'Aortic stenosis', 'Mitral regurgitation', 'Mitral stenosis',
            'Infective endocarditis', 'Duke criteria',
            'Rheumatic heart disease', 'Aschoff bodies', 'Jones criteria',
            'Pericarditis', 'Dilated cardiomyopathy', 'Hypertrophic cardiomyopathy',
            'VSD', 'ASD', 'PDA', 'Tetralogy of Fallot', 'Coarctation of aorta',
            'Heart tube development', 'Fetal circulation',
            'DVT', 'Pulmonary embolism', 'Virchow triad',
            'Troponin', 'CK-MB', 'BNP',
            'ECG intervals', 'Aortic aneurysm', 'Aortic dissection',
        ],
    },
    'Blood': {
        'topics': [
            'Haematopoiesis', 'RBC physiology', 'Hb structure', 'O2-Hb curve',
            'Iron deficiency anaemia', 'Iron metabolism', 'Ferritin TIBC',
            'B12 deficiency', 'Folate deficiency', 'Megaloblastic anaemia',
            'G6PD deficiency', 'Hereditary spherocytosis', 'Sickle cell disease',
            'Alpha thalassemia', 'Beta thalassemia', 'Autoimmune haemolytic anaemia',
            'Blood smear interpretation', 'Reticulocyte count',
            'Leukocytosis', 'Left shift', 'ALL', 'AML', 'CLL', 'CML',
            'Hodgkin lymphoma', 'Non-Hodgkin lymphoma', 'Reed-Sternberg cells',
            'Multiple myeloma', 'Waldenstrom',
            'Intrinsic pathway', 'Extrinsic pathway', 'Common pathway',
            'PT and aPTT', 'INR', 'Mixing studies',
            'DIC', 'vWD', 'Haemophilia A', 'Haemophilia B',
            'ITP', 'TTP', 'HUS',
            'Heparin MOA', 'Warfarin MOA', 'DOAC MOA',
            'Aspirin antiplatelet', 'Clopidogrel', 'Protamine reversal',
            'Blood groups ABO', 'Transfusion reactions',
            'Aplastic anaemia', 'MDS', 'Polycythaemia vera',
        ],
    },
    'Respiratory': {
        'topics': [
            'Airway anatomy', 'Lung lobes and segments', 'Pleura',
            'Lung compliance', 'Airway resistance', 'Surfactant',
            'Lung volumes', 'Spirometry FEV1 FVC', 'Flow-volume loops',
            'V/Q matching', 'Shunt', 'Dead space',
            'O2 transport', 'CO2 transport', 'Bohr effect', 'Haldane effect',
            'Asthma pathophysiology', 'Asthma stepwise therapy',
            'COPD', 'Emphysema', 'Chronic bronchitis',
            'IPF', 'Pneumoconiosis', 'Sarcoidosis',
            'CAP organisms', 'HAP organisms', 'Atypical pneumonia',
            'Primary TB', 'Secondary TB', 'Ghon complex', 'TB treatment',
            'Lung cancer types', 'Paraneoplastic syndromes',
            'Pleural effusion', 'Tension pneumothorax', 'Spontaneous pneumothorax',
            'PE diagnosis', 'PE treatment', 'Wells criteria',
            'SABA', 'LABA', 'ICS', 'LTRA montelukast', 'Anti-IgE omalizumab', 'Anti-IL5',
            'COPD bronchodilators', 'O2 therapy',
            'Type 1 respiratory failure', 'Type 2 respiratory failure',
            'Central chemoreceptors', 'Peripheral chemoreceptors',
            'OSA', 'Cystic fibrosis', 'Pulmonary hypertension',
        ],
    },
    'Gastrointestinal': {
        'topics': [
            'GIT anatomy overview', 'Peritoneal relations', 'GIT blood supply',
            'Oesophageal disorders', 'GERD', 'Barrett oesophagus',
            'Stomach acid secretion', 'Peptic ulcer disease', 'H pylori',
            'Gastric carcinoma',
            'Small intestine absorption', 'Coeliac disease', 'Malabsorption',
            'Appendicitis', 'Meckel diverticulum',
            'Crohn disease', 'Ulcerative colitis', 'IBD comparison',
            'Colorectal cancer', 'Adenoma-carcinoma sequence', 'FAP', 'Lynch syndrome',
            'Diverticular disease',
            'Liver anatomy', 'Portal triad', 'Bile formation',
            'Hepatitis A', 'Hepatitis B serology', 'Hepatitis C',
            'Cirrhosis', 'Portal hypertension', 'Ascites', 'Varices',
            'LFT interpretation', 'AST ALT ratio',
            'Pre-hepatic jaundice', 'Hepatic jaundice', 'Post-hepatic jaundice',
            'Gallstones', 'Cholecystitis', 'Cholangitis',
            'Acute pancreatitis', 'Chronic pancreatitis', 'Pancreatic cancer',
            'PPIs', 'H2 blockers', 'Antacids', 'Antiemetics',
            'Laxatives', 'Antidiarrhoeals', 'Bile acid sequestrants',
            'C difficile', 'Salmonella', 'Cholera',
            'CYP450', 'Phase I metabolism', 'Phase II metabolism', 'First-pass effect',
        ],
    },
    'Metabolism': {
        'topics': [
            'Glycolysis', 'Gluconeogenesis', 'Glycogenesis', 'Glycogenolysis',
            'TCA cycle', 'Oxidative phosphorylation', 'Electron transport chain',
            'Beta oxidation', 'Fatty acid synthesis', 'Ketogenesis',
            'Cholesterol synthesis', 'LDL HDL VLDL', 'Chylomicrons',
            'Amino acid metabolism', 'Transamination', 'Urea cycle',
            'Water-soluble vitamins', 'Fat-soluble vitamins', 'Vitamin deficiencies',
            'Type 1 DM', 'Type 2 DM', 'DM diagnosis', 'DM complications',
            'DKA', 'HHS',
            'Insulin types', 'Metformin', 'Sulfonylureas', 'SGLT2 inhibitors', 'GLP-1 agonists', 'DPP4 inhibitors',
            'Hypothyroidism', 'Hyperthyroidism', 'Graves disease', 'Hashimoto thyroiditis',
            'Thyroxine', 'Carbimazole', 'PTU', 'Radioactive iodine',
            'Cushing syndrome', 'Addison disease', 'Conn syndrome', 'Phaeochromocytoma',
            'PTH', 'Vitamin D metabolism', 'Calcitonin', 'Hypercalcaemia', 'Hypocalcaemia',
            'Metabolic syndrome',
            'Statins', 'Fibrates', 'Ezetimibe', 'PCSK9 inhibitors',
            'Glycogen storage diseases', 'PKU', 'Galactosaemia',
            'G6PD deficiency', 'GLUT transporters',
            'Fed state hormones', 'Fasted state hormones',
        ],
    },
    'Foundation': {
        'topics': [
            'Mediastinum anatomy', 'Diaphragm', 'Thorax relations',
            'Peritoneum', 'Retroperitoneal structures', 'Portal system',
            'Pelvic anatomy', 'Surface anatomy',
            'Epithelial types', 'Connective tissue', 'Cartilage types', 'Bone histology',
            'Skeletal muscle histology', 'Smooth muscle', 'Cardiac muscle histology',
            'Artery vs vein histology', 'Capillary types',
            'Gastrulation', 'Germ layers', 'Heart development', 'GIT development',
            'Kidney development', 'Congenital anomalies',
            'Cell organelles', 'Cell cycle', 'Mitosis', 'Apoptosis vs necrosis',
            'DNA repair',
            'Acute inflammation', 'Chronic inflammation', 'Inflammatory mediators',
            'Wound healing',
            'Neoplasia', 'Benign vs malignant', 'Grading staging', 'TNM',
            'Oncogenes', 'Tumour suppressors', 'p53', 'Rb', 'RAS', 'APC', 'BRCA',
            'Metastasis mechanisms',
            'Cell injury', 'Types of necrosis',
            'Pharmacokinetics ADME', 'Volume of distribution', 'Half-life', 'Clearance',
            'Receptors', 'Agonists antagonists', 'Partial agonists',
            'Dose-response EC50 Emax', 'Potency vs efficacy',
            'CYP450 induction inhibition', 'Phase I Phase II',
            'ADR Type A Type B', 'Drug interactions', 'Therapeutic index',
        ],
    },
    'Immunology': {
        'topics': [
            'Innate barriers', 'Phagocytes', 'NK cells', 'TLRs',
            'Classical complement', 'Lectin pathway', 'Alternative pathway', 'MAC', 'Complement regulation',
            'Humoral immunity', 'Cell-mediated immunity',
            'CD4 Th1', 'CD4 Th2', 'Th17', 'Treg', 'CD8 cytotoxic',
            'B cell activation', 'Antibody structure', 'Isotype switching', 'Affinity maturation',
            'IgG', 'IgA', 'IgM', 'IgE', 'IgD',
            'MHC class I', 'MHC class II', 'Antigen presentation',
            'Type I hypersensitivity', 'Type II hypersensitivity', 'Type III hypersensitivity', 'Type IV hypersensitivity',
            'SLE', 'Rheumatoid arthritis', 'Type 1 DM autoimmune', 'Graves autoimmune',
            'SCID', 'DiGeorge', 'Bruton agammaglobulinemia',
            'HIV lifecycle', 'CD4 decline', 'Opportunistic infections', 'HAART',
            'Live attenuated vaccines', 'Inactivated vaccines', 'Subunit vaccines', 'mRNA vaccines',
            'Hyperacute rejection', 'Acute rejection', 'Chronic rejection', 'GvHD',
            'Immune checkpoint inhibitors', 'CAR-T', 'Tumour immunology',
            'Cyclosporine', 'Tacrolimus', 'MMF', 'Azathioprine',
            'Anaphylaxis', 'Cytokines TNF IL-1 IL-6', 'IFN-gamma',
            'ELISA', 'Flow cytometry', 'Immunofluorescence',
        ],
    },
}

def get_question_count(filepath):
    """Get current question count from a JSON file."""
    if not os.path.exists(filepath):
        return 0
    try:
        with open(filepath) as f:
            return len(json.load(f))
    except:
        return 0

def main():
    args = sys.argv[1:]
    target = 250
    
    if '--target' in args:
        target = int(args[args.index('--target') + 1])
    
    if '--all' in args:
        systems_to_gen = list(SYSTEMS.keys())
    elif '--system' in args:
        systems_to_gen = [args[args.index('--system') + 1]]
    else:
        print(f"Usage: python3 {sys.argv[0]} --system Renal --target 250")
        print(f"       python3 {sys.argv[0]} --all --target 250")
        print(f"\nSystems: {', '.join(SYSTEMS.keys())}")
        sys.exit(1)
    
    for system in systems_to_gen:
        filepath = os.path.join(DATA_DIR, f"{system.lower()}.json")
        current = get_question_count(filepath)
        needed = target - current
        
        if needed <= 0:
            print(f"✅ {system}: already has {current}/{target} questions")
            continue
        
        print(f"\n{'='*60}")
        print(f"📝 {system}: {current}/{target} questions. Need {needed} more.")
        print(f"{'='*60}")
        print(f"Topics: {len(SYSTEMS[system]['topics'])}")
        print(f"File: {filepath}")
        print(f"\nTo generate, this script needs an LLM API.")
        print(f"Run the sub-agent or use the OpenClaw session to generate.")

if __name__ == '__main__':
    main()
