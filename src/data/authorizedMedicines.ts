import { Medicine } from '../types';

export interface AuthorizedMedicineSeed {
  qr_code: string;
  name: string;
  properName: string;
  companyId: string;
  companyName: string;
  manufacturerAddress: string;
  batchNumber: string;
  licenseNumber: string;
  excipients: string[];
  ingredients: string[];
  dosage: string;
  sideEffects: string;
  mfgDate: string;
  expiryDate: string;
  medicalUses: string;
  otherUses: string;
  allergyWarnings: string;
  alternatives: string[];
}

const COMPANY_PROFILES: Record<string, { address: string; licenseNumber: string }> = {
  scanurmed_pharma_1: {
    address: 'Plot No. B-14, M.I.D.C. Industrial Area, Taloja, Navi Mumbai - 410208',
    licenseNumber: '25A/MH/1024',
  },
  scanurmed_pharma_2: {
    address: 'Survey No. 48, Genome Valley, Shameerpet, Hyderabad - 500078',
    licenseNumber: '28D/TS/441B',
  },
  scanurmed_pharma_3: {
    address: 'Plot No. 72, Phase-II, Industrial Area, Baddi, Solan - 173205',
    licenseNumber: '25A/HP/819C',
  },
  scanurmed_pharma_4: {
    address: 'Block C-19, Changodar Industrial Estate, Ahmedabad - 382213',
    licenseNumber: 'G/25/2140',
  },
};

export const AUTHORIZED_MEDICINES_DATA: AuthorizedMedicineSeed[] = [
  {
    qr_code: '8901212121212',
    name: 'Cough Syrup DX',
    properName: 'Dextromethorphan Hydrobromide, Chlorpheniramine Maleate & Phenylephrine Hydrochloride Syrup IP',
    companyId: 'scanurmed_pharma_1',
    companyName: 'Apex Pharma Labs',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_1.address,
    batchNumber: 'AP25021',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_1.licenseNumber,
    excipients: ['Sucrose', 'Sorbitol Solution (70%)', 'Glycerin', 'Propylene Glycol', 'Sodium Benzoate', 'Citric Acid Monohydrate', 'Menthol', 'Purified Water'],
    ingredients: ['Dextromethorphan Hydrobromide 10mg', 'Chlorpheniramine Maleate 2mg', 'Phenylephrine 5mg'],
    dosage: 'Adults: 10 ml every 6–8 hours (max 40 ml/day). Consult a physician for pediatric dosing.',
    sideEffects: 'Mild drowsiness, dizziness, dry mouth, or slight nausea.',
    mfgDate: '2025-02-10',
    expiryDate: '2027-02-09',
    medicalUses: 'Relief of dry cough, throat irritation, and upper respiratory congestion.',
    otherUses: 'Nighttime cough suppression associated with common cold.',
    allergyWarnings: 'Avoid if allergic to dextromethorphan or antihistamines; do not combine with MAO inhibitors.',
    alternatives: ['Benadryl Syrup', 'Grilinctus-DX', 'Ascoril D Plus']
  },
  {
    qr_code: '8901313131313',
    name: 'Benadryl Syrup',
    properName: 'Diphenhydramine Hydrochloride, Ammonium Chloride & Sodium Citrate Oral Solution IP',
    companyId: 'scanurmed_pharma_1',
    companyName: 'Apex Pharma Labs',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_1.address,
    batchNumber: 'AP25014',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_1.licenseNumber,
    excipients: ['Liquid Glucose', 'Sucrose', 'Glycerin', 'Sodium Saccharin', 'Caramel Colour', 'Menthol', 'Purified Water'],
    ingredients: ['Diphenhydramine Hydrochloride 14.08mg', 'Ammonium Chloride 138mg', 'Sodium Citrate 57.03mg'],
    dosage: 'Adults: 10 ml 3–4 times daily after meals or as directed by a physician.',
    sideEffects: 'Sedation, drowsiness, blurred vision, dry mouth.',
    mfgDate: '2025-01-25',
    expiryDate: '2027-01-24',
    medicalUses: 'Productive and allergic cough, sneezing, runny nose, and throat irritation.',
    otherUses: 'Temporary relief of allergy-induced upper airway symptoms.',
    allergyWarnings: 'Diphenhydramine hypersensitivity; caution when driving or operating machinery.',
    alternatives: ['Cough Syrup DX', 'Corex-T', 'Chericof Syrup']
  },
  {
    qr_code: '8901414141414',
    name: 'Digene Tablets',
    properName: 'Dried Aluminium Hydroxide, Magnesium Hydroxide & Simethicone Chewable Tablets IP',
    companyId: 'scanurmed_pharma_1',
    companyName: 'Apex Pharma Labs',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_1.address,
    batchNumber: 'AP25038',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_1.licenseNumber,
    excipients: ['Mannitol', 'Sorbitol', 'Peppermint Flavour', 'Magnesium Stearate', 'Sodium Saccharin', 'Colloidal Silicon Dioxide', 'Talc'],
    ingredients: ['Dried Aluminium Hydroxide 300mg', 'Magnesium Hydroxide 25mg', 'Simethicone 25mg', 'Sodium Carboxymethylcellulose 100mg'],
    dosage: 'Chew 1–2 tablets 30–60 minutes after meals and at bedtime.',
    sideEffects: 'Mild constipation or chalky taste; diarrhea in high doses.',
    mfgDate: '2025-03-05',
    expiryDate: '2027-03-04',
    medicalUses: 'Rapid relief from acidity, heartburn, indigestion, and trapped gas.',
    otherUses: 'Adjunct relief in gastritis and acid peptic discomfort.',
    allergyWarnings: 'Avoid in severe renal impairment or known hypersensitivity to aluminium/magnesium salts.',
    alternatives: ['Gelusil MPS', 'Mucaine Gel', 'Rabeprazole 20mg']
  },
  {
    qr_code: '8901515151515',
    name: 'ORS Liquid',
    properName: 'Oral Rehydration Salts Ready-To-Drink Electrolyte Solution IP (WHO Formula)',
    companyId: 'scanurmed_pharma_1',
    companyName: 'Apex Pharma Labs',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_1.address,
    batchNumber: 'AP25027',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_1.licenseNumber,
    excipients: ['Citric Acid', 'Natural Orange Flavour', 'Sucralose', 'Purified Water (Sterile Processed)'],
    ingredients: ['Sodium Chloride 2.6g/L', 'Potassium Chloride 1.5g/L', 'Sodium Citrate 2.9g/L', 'Dextrose Anhydrous 13.5g/L'],
    dosage: 'Sip 200–400 ml after each loose stool or as advised for dehydration.',
    sideEffects: 'Generally well tolerated; rare mild nausea if consumed too rapidly.',
    mfgDate: '2025-02-18',
    expiryDate: '2026-08-17',
    medicalUses: 'Oral rehydration therapy to restore fluids and electrolytes during diarrhea or vomiting.',
    otherUses: 'Heat exhaustion and mild exercise-induced electrolyte loss.',
    allergyWarnings: 'Caution in patients with severe renal failure, intractable vomiting, or intestinal obstruction.',
    alternatives: ['Electral Powder', 'WHO-ORS Sachet', 'Prolyte ORS']
  },
  {
    qr_code: '8901616161616',
    name: 'Insulin Injection',
    properName: 'Human Soluble Insulin Injection IP 40 IU/ml (Recombinant DNA Origin)',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25041',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Metacresol', 'Glycerol', 'Hydrochloric Acid / Sodium Hydroxide (pH adjustment)', 'Water for Injections IP'],
    ingredients: ['Human Soluble Insulin (r-DNA origin) 40 IU/ml'],
    dosage: 'Subcutaneous injection 30 minutes before meals, strictly individualized by physician.',
    sideEffects: 'Hypoglycemia (low blood sugar), mild injection-site redness or lipodystrophy.',
    mfgDate: '2025-04-01',
    expiryDate: '2027-03-31',
    medicalUses: 'Glycemic control in Type 1 and insulin-requiring Type 2 diabetes mellitus.',
    otherUses: 'In-hospital management of diabetic ketoacidosis and perioperative hyperglycemia.',
    allergyWarnings: 'Contraindicated during active hypoglycemia; monitor blood glucose closely.',
    alternatives: ['Actrapid HM', 'Humulin R', 'Glimepiride 2mg']
  },
  {
    qr_code: '8901717171717',
    name: 'Salbutamol Inhaler',
    properName: 'Salbutamol Sulphate Pressurized Inhalation IP 100 mcg/actuation',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25019',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Norflurane (HFA-134a Propellant)', 'Anhydrous Ethanol', 'Oleic Acid'],
    ingredients: ['Salbutamol Sulphate 100 mcg per actuation'],
    dosage: '1–2 puffs as needed for acute bronchospasm (max 8 puffs in 24 hours).',
    sideEffects: 'Mild hand tremor, palpitations, throat irritation, or headache.',
    mfgDate: '2025-01-15',
    expiryDate: '2027-01-14',
    medicalUses: 'Fast-acting bronchodilator for relief of asthma attacks and bronchospasm.',
    otherUses: 'Prevention of exercise-induced bronchospasm; COPD symptom relief.',
    allergyWarnings: 'Beta-agonist hypersensitivity; use with caution in severe tachycardia or cardiac arrhythmia.',
    alternatives: ['Asthalin HFA', 'Levolin Inhaler', 'Ventolin Evohaler']
  },
  {
    qr_code: '8901818181818',
    name: 'Hydroxychloroquine 200mg',
    properName: 'Hydroxychloroquine Sulphate Film-Coated Tablets IP 200 mg',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25023',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Dibasic Calcium Phosphate', 'Maize Starch', 'Povidone (K30)', 'Magnesium Stearate', 'Hypromellose', 'Titanium Dioxide', 'Macrogol 400'],
    ingredients: ['Hydroxychloroquine Sulphate 200mg'],
    dosage: '200–400 mg daily with food or milk as prescribed by specialist.',
    sideEffects: 'Nausea, stomach cramps, headache, or skin rash; rare retinal changes on long-term therapy.',
    mfgDate: '2025-02-02',
    expiryDate: '2027-02-01',
    medicalUses: 'Management of rheumatoid arthritis, systemic lupus erythematosus (SLE), and malaria prophylaxis.',
    otherUses: 'Chronic inflammatory autoimmune joint conditions under rheumatology supervision.',
    allergyWarnings: '4-aminoquinoline hypersensitivity, preexisting retinopathy, or G6PD deficiency caution.',
    alternatives: ['HCQS 200', 'Zy-Q 200', 'Oxychloroquine']
  },
  {
    qr_code: '8901919191919',
    name: 'Dexamethasone 0.5mg',
    properName: 'Dexamethasone Uncoated Tablets IP 0.5 mg',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25034',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Lactose Monohydrate', 'Pregelatinized Starch', 'Colloidal Silicon Dioxide', 'Magnesium Stearate', 'Purified Water (evaporates during processing)'],
    ingredients: ['Dexamethasone 0.5mg'],
    dosage: '0.5 mg to 4 mg daily in divided doses after food; taper gradually as directed.',
    sideEffects: 'Increased appetite, insomnia, mood changes, elevated blood glucose, gastric irritation.',
    mfgDate: '2025-03-14',
    expiryDate: '2027-03-13',
    medicalUses: 'Potent corticosteroid for severe inflammation, allergic reactions, and autoimmune flare-ups.',
    otherUses: 'Cerebral edema and endocrine suppression testing.',
    allergyWarnings: 'Avoid in systemic fungal infections or live-virus vaccinations; never stop abruptly after prolonged use.',
    alternatives: ['Decdan 0.5mg', 'Dexona', 'Prednisolone 5mg']
  },
  {
    qr_code: '8902021222324',
    name: 'Betadine Antiseptic',
    properName: 'Povidone-Iodine Standardized Topical Antiseptic Solution IP 5% w/v',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25012',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Glycerol', 'Nonoxynol-9', 'Disodium Hydrogen Phosphate', 'Citric Acid', 'Sodium Hydroxide', 'Purified Water'],
    ingredients: ['Povidone-Iodine 5% w/v (0.5% available iodine)'],
    dosage: 'External use only: apply undiluted to minor cuts, wounds, or skin prep 1–3 times daily.',
    sideEffects: 'Local skin irritation, mild stinging, or temporary brown skin staining.',
    mfgDate: '2025-01-20',
    expiryDate: '2027-01-19',
    medicalUses: 'Topical broad-spectrum antiseptic for preventing infection in minor wounds, burns, and abrasions.',
    otherUses: 'Pre-operative skin disinfection and minor dermatological procedures.',
    allergyWarnings: 'Iodine hypersensitivity; caution in thyroid disorders and neonates.',
    alternatives: ['Cipladine Solution', 'Wokadine', 'Chlorhexidine Antiseptic']
  },
  {
    qr_code: '8902526272829',
    name: 'Zinc Tablets',
    properName: 'Zinc Sulphate Dispersible Tablets IP (20 mg Elemental Zinc)',
    companyId: 'scanurmed_pharma_2',
    companyName: 'MedCore Biologics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_2.address,
    batchNumber: 'MC25039',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_2.licenseNumber,
    excipients: ['Microcrystalline Cellulose', 'Crospovidone', 'Aspartame', 'Vanilla Flavour', 'Colloidal Silicon Dioxide', 'Magnesium Stearate'],
    ingredients: ['Zinc Sulphate Monohydrate equivalent to Elemental Zinc 20mg'],
    dosage: '1 tablet once daily after a meal with water, or 10–14 days during acute diarrhea recovery.',
    sideEffects: 'Mild metallic taste or stomach upset if taken on an empty stomach.',
    mfgDate: '2025-03-22',
    expiryDate: '2027-03-21',
    medicalUses: 'Zinc deficiency supplementation, immune support, and pediatric/adult diarrhea recovery.',
    otherUses: 'Wound healing support and nutritional recovery.',
    allergyWarnings: 'Avoid exceeding recommended daily upper limits; separate by 2 hours from certain antibiotics.',
    alternatives: ['Zincovit', 'Zinconia 20mg', 'B-Complex Capsules']
  },
  {
    qr_code: '8903031323334',
    name: 'Diclofenac 50mg',
    properName: 'Diclofenac Sodium Gastro-Resistant Tablets IP 50 mg',
    companyId: 'scanurmed_pharma_3',
    companyName: 'Vanguard Therapeutics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_3.address,
    batchNumber: 'VT25026',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_3.licenseNumber,
    excipients: ['Lactose', 'Maize Starch', 'Povidone (K25)', 'Sodium Starch Glycolate', 'Methacrylic Acid Copolymer', 'Talc', 'Iron Oxide Yellow'],
    ingredients: ['Diclofenac Sodium 50mg (Enteric Coated)'],
    dosage: '50 mg 2–3 times daily after meals; use lowest effective dose for shortest duration.',
    sideEffects: 'Acidity, abdominal discomfort, nausea, dizziness.',
    mfgDate: '2025-02-26',
    expiryDate: '2027-02-25',
    medicalUses: 'Pain and inflammation relief in osteoarthritis, rheumatoid arthritis, sprains, and post-operative pain.',
    otherUses: 'Acute musculoskeletal pain and dental pain.',
    allergyWarnings: 'NSAID or aspirin allergy; avoid in active peptic ulcer, severe heart failure, or advanced kidney disease.',
    alternatives: ['Voveran 50', 'Nimesulide 100mg', 'Ibuprofen 400mg']
  },
  {
    qr_code: '8903132333435',
    name: 'Nimesulide 100mg',
    properName: 'Nimesulide Tablets IP 100 mg',
    companyId: 'scanurmed_pharma_3',
    companyName: 'Vanguard Therapeutics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_3.address,
    batchNumber: 'VT25011',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_3.licenseNumber,
    excipients: ['Microcrystalline Cellulose', 'Lactose Monohydrate', 'Sodium Starch Glycolate', 'Hydrogenated Castor Oil', 'Magnesium Stearate', 'Purified Water'],
    ingredients: ['Nimesulide 100mg'],
    dosage: 'Adults: 100 mg twice daily after meals (short-term use only, max 15 days).',
    sideEffects: 'Nausea, epigastric discomfort, elevated liver enzymes in rare cases.',
    mfgDate: '2025-01-11',
    expiryDate: '2027-01-10',
    medicalUses: 'Short-term management of acute pain and primary dysmenorrhea.',
    otherUses: 'Acute soft-tissue and dental pain when first-line analgesics are unsuitable.',
    allergyWarnings: 'Contraindicated in hepatic impairment, children under 12 years, and NSAID hypersensitivity.',
    alternatives: ['Nise 100mg', 'Diclofenac 50mg', 'Paracetamol 650mg']
  },
  {
    qr_code: '8903233343536',
    name: 'Loperamide 2mg',
    properName: 'Loperamide Hydrochloride Capsules IP 2 mg',
    companyId: 'scanurmed_pharma_3',
    companyName: 'Vanguard Therapeutics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_3.address,
    batchNumber: 'VT25031',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_3.licenseNumber,
    excipients: ['Lactose Monohydrate', 'Maize Starch', 'Talc', 'Magnesium Stearate', 'Hard Gelatin Capsule Shell'],
    ingredients: ['Loperamide Hydrochloride 2mg'],
    dosage: 'Initial 4 mg (2 capsules), followed by 2 mg after each unformed stool (max 16 mg/day).',
    sideEffects: 'Constipation, mild abdominal cramping, drowsiness.',
    mfgDate: '2025-03-01',
    expiryDate: '2027-02-28',
    medicalUses: 'Symptomatic control of acute nonspecific diarrhea and chronic diarrhea associated with IBS.',
    otherUses: 'Reduction of ileostomy output volume under medical guidance.',
    allergyWarnings: 'Do not use in bloody diarrhea, high fever, or suspected bacterial dysentery.',
    alternatives: ['Imodium', 'Eldoper', 'ORS Liquid']
  },
  {
    qr_code: '8903334353637',
    name: 'B-Complex Capsules',
    properName: 'Vitamin B-Complex with Vitamin C Hard Gelatin Capsules IP',
    companyId: 'scanurmed_pharma_3',
    companyName: 'Vanguard Therapeutics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_3.address,
    batchNumber: 'VT25024',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_3.licenseNumber,
    excipients: ['Dibasic Calcium Phosphate', 'Lactose', 'Talc', 'Magnesium Stearate', 'Colloidal Silicon Dioxide', 'Approved Capsule Colours'],
    ingredients: ['Vitamin B1 10mg', 'Vitamin B2 10mg', 'Vitamin B3 45mg', 'Vitamin B6 3mg', 'Vitamin B12 15mcg', 'Vitamin C 150mg'],
    dosage: '1 capsule daily after breakfast or lunch with water.',
    sideEffects: 'Harmless bright yellow discoloration of urine (due to riboflavin/B2).',
    mfgDate: '2025-02-14',
    expiryDate: '2026-08-13',
    medicalUses: 'Prevention and treatment of Vitamin B-complex deficiencies, mouth ulcers, and fatigue.',
    otherUses: 'Nutritional support during antibiotic therapy and convalescence.',
    allergyWarnings: 'Hypersensitivity to any B-vitamin component or capsule excipients.',
    alternatives: ['Becosules Capsules', 'Neurobion Forte', 'Multivitamin Syrup']
  },
  {
    qr_code: '8903435363738',
    name: 'Iron Folic Acid Tablets',
    properName: 'Ferrous Sulphate & Folic Acid Film-Coated Tablets IP (100 mg / 500 mcg)',
    companyId: 'scanurmed_pharma_3',
    companyName: 'Vanguard Therapeutics',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_3.address,
    batchNumber: 'VT25018',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_3.licenseNumber,
    excipients: ['Microcrystalline Cellulose', 'Pregelatinized Starch', 'Povidone', 'Magnesium Stearate', 'Hypromellose', 'Red Iron Oxide'],
    ingredients: ['Ferrous Sulphate (Elemental Iron 100mg)', 'Folic Acid 500mcg'],
    dosage: '1 tablet daily 1 hour before or 2 hours after meals with water or citrus juice.',
    sideEffects: 'Dark-colored stools (normal), mild constipation, or nausea.',
    mfgDate: '2025-01-30',
    expiryDate: '2027-01-29',
    medicalUses: 'Treatment and prophylaxis of iron-deficiency and megaloblastic anemia, including antenatal supplementation.',
    otherUses: 'Replenishment of iron stores after blood loss.',
    allergyWarnings: 'Avoid in hemochromatosis, hemolytic anemia, or iron overload disorders.',
    alternatives: ['Autrin', 'Livogen-Z', 'Dexorange']
  },
  {
    qr_code: '8903536373839',
    name: 'Rabeprazole 20mg',
    properName: 'Rabeprazole Sodium Gastro-Resistant Tablets IP 20 mg',
    companyId: 'scanurmed_pharma_4',
    companyName: 'NovaCare Pharmaceuticals',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_4.address,
    batchNumber: 'NC25035',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_4.licenseNumber,
    excipients: ['Mannitol', 'Magnesium Oxide', 'Low-Substituted Hydroxypropyl Cellulose', 'Hypromellose Phthalate', 'Talc', 'Titanium Dioxide'],
    ingredients: ['Rabeprazole Sodium 20mg (Gastro-resistant)'],
    dosage: '20 mg once daily 30–60 minutes before breakfast; swallow whole without crushing.',
    sideEffects: 'Mild headache, abdominal bloating, or constipation.',
    mfgDate: '2025-03-18',
    expiryDate: '2027-03-17',
    medicalUses: 'Gastroesophageal reflux disease (GERD), peptic ulcer disease, and erosive esophagitis.',
    otherUses: 'Gastric protection alongside long-term NSAID or antiplatelet therapy.',
    allergyWarnings: 'Proton pump inhibitor (PPI) hypersensitivity; avoid co-administration with rilpivirine.',
    alternatives: ['Razo 20', 'Pantoprazole 40mg', 'Digene Tablets']
  },
  {
    qr_code: '8903637383940',
    name: 'Glimepiride 2mg',
    properName: 'Glimepiride Uncoated Tablets IP 2 mg',
    companyId: 'scanurmed_pharma_4',
    companyName: 'NovaCare Pharmaceuticals',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_4.address,
    batchNumber: 'NC25020',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_4.licenseNumber,
    excipients: ['Lactose Monohydrate', 'Sodium Starch Glycolate', 'Povidone (K30)', 'Microcrystalline Cellulose', 'Magnesium Stearate', 'Indigo Carmine Lake'],
    ingredients: ['Glimepiride 2mg'],
    dosage: '1–2 mg once daily immediately before or with the first main meal.',
    sideEffects: 'Hypoglycemia if meals are skipped, mild dizziness, slight weight gain.',
    mfgDate: '2025-02-08',
    expiryDate: '2027-02-07',
    medicalUses: 'Oral sulfonylurea for blood glucose control in Type 2 diabetes mellitus.',
    otherUses: 'Combination glycemic therapy alongside metformin or insulin.',
    allergyWarnings: 'Sulfonamide/sulfonylurea allergy; contraindicated in Type 1 diabetes and diabetic ketoacidosis.',
    alternatives: ['Amaryl 2mg', 'Glimestar-2', 'Metformin 500mg']
  },
  {
    qr_code: '8903738394041',
    name: 'Telmisartan 40mg',
    properName: 'Telmisartan Uncoated Tablets IP 40 mg',
    companyId: 'scanurmed_pharma_4',
    companyName: 'NovaCare Pharmaceuticals',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_4.address,
    batchNumber: 'NC25044',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_4.licenseNumber,
    excipients: ['Mannitol', 'Meglumine', 'Sodium Hydroxide', 'Povidone (K25)', 'Crospovidone', 'Magnesium Stearate'],
    ingredients: ['Telmisartan 40mg'],
    dosage: '40 mg once daily at the same time each day, with or without food.',
    sideEffects: 'Mild dizziness on standing, fatigue, occasional hyperkalemia.',
    mfgDate: '2025-04-04',
    expiryDate: '2027-04-03',
    medicalUses: 'Hypertension (high blood pressure) management and cardiovascular risk reduction.',
    otherUses: 'Renal protection in hypertensive patients with diabetic nephropathy.',
    allergyWarnings: 'Strictly contraindicated in pregnancy; caution in severe biliary obstruction or bilateral renal artery stenosis.',
    alternatives: ['Telma 40', 'Tazloc 40', 'Losartan 50mg']
  },
  {
    qr_code: '8903839404142',
    name: 'Ecosprin 75mg',
    properName: 'Aspirin (Acetylsalicylic Acid) Gastro-Resistant Tablets IP 75 mg',
    companyId: 'scanurmed_pharma_4',
    companyName: 'NovaCare Pharmaceuticals',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_4.address,
    batchNumber: 'NC25029',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_4.licenseNumber,
    excipients: ['Pregelatinized Starch', 'Microcrystalline Cellulose', 'Colloidal Silicon Dioxide', 'Methacrylic Acid Copolymer', 'Triethyl Citrate', 'Talc'],
    ingredients: ['Acetylsalicylic Acid (Aspirin) 75mg (Enteric Coated)'],
    dosage: '75 mg once daily after a meal; swallow tablet whole.',
    sideEffects: 'Gastric irritation, easy bruising, prolonged minor bleeding.',
    mfgDate: '2025-02-21',
    expiryDate: '2027-02-20',
    medicalUses: 'Low-dose antiplatelet therapy for secondary prevention of heart attack and ischemic stroke.',
    otherUses: 'Post-angioplasty / coronary stent maintenance under cardiology care.',
    allergyWarnings: 'Aspirin/NSAID allergy, active GI bleeding, hemophilia, or children with viral fever (Reye syndrome risk).',
    alternatives: ['Loprin 75', 'Delisprin 75', 'Clopidogrel 75mg']
  },
  {
    qr_code: '8903940414243',
    name: 'Multivitamin Syrup',
    properName: 'Multivitamin & L-Lysine Oral Nutritional Supplement Syrup IP',
    companyId: 'scanurmed_pharma_4',
    companyName: 'NovaCare Pharmaceuticals',
    manufacturerAddress: COMPANY_PROFILES.scanurmed_pharma_4.address,
    batchNumber: 'NC25033',
    licenseNumber: COMPANY_PROFILES.scanurmed_pharma_4.licenseNumber,
    excipients: ['Sucrose', 'Sorbitol Solution', 'Glycerin', 'Polysorbate 80', 'Sodium Methylparaben', 'Mixed Fruit Flavour', 'Purified Water'],
    ingredients: ['Vitamin A 2500 IU', 'Vitamin D3 200 IU', 'Vitamin E 5mg', 'Vitamin C 40mg', 'B-Vitamins & L-Lysine'],
    dosage: 'Adults & children over 4 yrs: 5–10 ml once daily after food; shake bottle well.',
    sideEffects: 'Generally well tolerated; occasional mild gastrointestinal upset.',
    mfgDate: '2025-03-10',
    expiryDate: '2026-09-09',
    medicalUses: 'General nutritional supplementation, appetite support, and recovery after illness.',
    otherUses: 'Addressing dietary vitamin gaps during growth or convalescence.',
    allergyWarnings: 'Do not exceed recommended dose to avoid fat-soluble vitamin accumulation; check sugar content in diabetics.',
    alternatives: ['Zincovit Syrup', 'A to Z NS Syrup', 'B-Complex Capsules']
  }
];

export const AUTHORIZED_BARCODES = new Set<string>(
  AUTHORIZED_MEDICINES_DATA.map((item) => item.qr_code)
);

export const AUTHORIZED_MEDICINES: Medicine[] = AUTHORIZED_MEDICINES_DATA.map((item) => ({
  id: item.qr_code,
  companyId: item.companyId,
  companyName: item.companyName,
  name: item.name,
  properName: item.properName,
  manufacturerAddress: item.manufacturerAddress,
  batchNumber: item.batchNumber,
  licenseNumber: item.licenseNumber,
  excipients: item.excipients,
  ingredients: item.ingredients,
  dosage: item.dosage,
  sideEffects: item.sideEffects,
  barcode: item.qr_code,
  qr_code: item.qr_code,
  mfgDate: item.mfgDate,
  expiryDate: item.expiryDate,
  medicalUses: item.medicalUses,
  otherUses: item.otherUses,
  allergyWarnings: item.allergyWarnings,
  alternatives: item.alternatives,
  scanCount: 0,
}));

export function normalizeScannedCode(rawCode: string): string {
  let code = rawCode.trim();
  if (code.includes('/') && (code.startsWith('http://') || code.startsWith('https://'))) {
    const parts = code.split('/').filter(Boolean);
    code = parts[parts.length - 1] || code;
  }
  return code.trim();
}

export function isAuthorizedBarcode(rawCode: string): boolean {
  const normalized = normalizeScannedCode(rawCode);
  return AUTHORIZED_BARCODES.has(normalized);
}

export function getAuthorizedMedicineByCode(rawCode: string): Medicine | null {
  const normalized = normalizeScannedCode(rawCode);
  if (!AUTHORIZED_BARCODES.has(normalized)) {
    return null;
  }
  return AUTHORIZED_MEDICINES.find((m) => m.barcode === normalized) || null;
}
