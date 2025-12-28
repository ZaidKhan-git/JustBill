// Sample Government Price Data
// Source: NPPA (National Pharmaceutical Pricing Authority) - Essential Medicines
// Based on DPCO 2013 and NLEM 2022
// Published: March 2024 (Sample data for demonstration)

export const govtPricesData = [
    // ============================================================================
    // MEDICINES - NPPA Ceiling Prices (per unit)
    // ============================================================================
    // Analgesics / Pain Relief
    { category: "Medicine", itemName: "Paracetamol 500mg Tablet", itemCode: "NPPA-001", ceilingPrice: "1.83", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Paracetamol 650mg Tablet", itemCode: "NPPA-002", ceilingPrice: "2.10", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Ibuprofen 400mg Tablet", itemCode: "NPPA-003", ceilingPrice: "2.45", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Diclofenac 50mg Tablet", itemCode: "NPPA-004", ceilingPrice: "1.95", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Aspirin 75mg Tablet", itemCode: "NPPA-005", ceilingPrice: "0.85", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },

    // Antibiotics
    { category: "Medicine", itemName: "Amoxicillin 500mg Capsule", itemCode: "NPPA-010", ceilingPrice: "4.52", unit: "per capsule", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Amoxicillin 250mg Capsule", itemCode: "NPPA-011", ceilingPrice: "2.85", unit: "per capsule", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Azithromycin 500mg Tablet", itemCode: "NPPA-012", ceilingPrice: "25.40", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Ciprofloxacin 500mg Tablet", itemCode: "NPPA-013", ceilingPrice: "6.82", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Metronidazole 400mg Tablet", itemCode: "NPPA-014", ceilingPrice: "1.20", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Ceftriaxone 1g Injection", itemCode: "NPPA-015", ceilingPrice: "42.50", unit: "per vial", source: "NPPA", publishedDate: "2024-03-15" },

    // Antacids / GI
    { category: "Medicine", itemName: "Omeprazole 20mg Capsule", itemCode: "NPPA-020", ceilingPrice: "3.20", unit: "per capsule", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Pantoprazole 40mg Tablet", itemCode: "NPPA-021", ceilingPrice: "5.85", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Ranitidine 150mg Tablet", itemCode: "NPPA-022", ceilingPrice: "1.45", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },

    // Diabetes
    { category: "Medicine", itemName: "Metformin 500mg Tablet", itemCode: "NPPA-030", ceilingPrice: "1.67", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Metformin 850mg Tablet", itemCode: "NPPA-031", ceilingPrice: "2.85", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Glimepiride 2mg Tablet", itemCode: "NPPA-032", ceilingPrice: "2.10", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },

    // Cardiovascular
    { category: "Medicine", itemName: "Amlodipine 5mg Tablet", itemCode: "NPPA-040", ceilingPrice: "1.85", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Atenolol 50mg Tablet", itemCode: "NPPA-041", ceilingPrice: "2.45", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Losartan 50mg Tablet", itemCode: "NPPA-042", ceilingPrice: "4.20", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Atorvastatin 10mg Tablet", itemCode: "NPPA-043", ceilingPrice: "5.50", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Clopidogrel 75mg Tablet", itemCode: "NPPA-044", ceilingPrice: "4.85", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },

    // Others
    { category: "Medicine", itemName: "Cetirizine 10mg Tablet", itemCode: "NPPA-050", ceilingPrice: "1.50", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Multivitamin Tablet", itemCode: "NPPA-051", ceilingPrice: "2.80", unit: "per tablet", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Vitamin D3 60000IU Capsule", itemCode: "NPPA-052", ceilingPrice: "18.00", unit: "per capsule", source: "NPPA", publishedDate: "2024-03-15" },

    // IV Fluids
    { category: "Medicine", itemName: "Normal Saline 500ml", itemCode: "NPPA-060", ceilingPrice: "22.50", unit: "per bottle", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Dextrose 5% 500ml", itemCode: "NPPA-061", ceilingPrice: "25.00", unit: "per bottle", source: "NPPA", publishedDate: "2024-03-15" },
    { category: "Medicine", itemName: "Ringer Lactate 500ml", itemCode: "NPPA-062", ceilingPrice: "28.00", unit: "per bottle", source: "NPPA", publishedDate: "2024-03-15" },

    // ============================================================================
    // TESTS - CGHS Rates (Tier 1 cities, NABH accredited)
    // ============================================================================
    { category: "Test", itemName: "Complete Blood Count (CBC)", itemCode: "CGHS-T001", ceilingPrice: "150.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Hemoglobin (Hb)", itemCode: "CGHS-T002", ceilingPrice: "50.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Blood Sugar Fasting", itemCode: "CGHS-T003", ceilingPrice: "50.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Blood Sugar PP", itemCode: "CGHS-T004", ceilingPrice: "50.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "HbA1c", itemCode: "CGHS-T005", ceilingPrice: "350.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Lipid Profile", itemCode: "CGHS-T006", ceilingPrice: "300.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Liver Function Test (LFT)", itemCode: "CGHS-T007", ceilingPrice: "350.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Kidney Function Test (KFT)", itemCode: "CGHS-T008", ceilingPrice: "350.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Thyroid Profile (T3, T4, TSH)", itemCode: "CGHS-T009", ceilingPrice: "400.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "TSH", itemCode: "CGHS-T010", ceilingPrice: "150.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Urine Routine", itemCode: "CGHS-T011", ceilingPrice: "50.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Urine Culture", itemCode: "CGHS-T012", ceilingPrice: "250.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "Stool Routine", itemCode: "CGHS-T013", ceilingPrice: "50.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "X-Ray Chest PA View", itemCode: "CGHS-T020", ceilingPrice: "200.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "X-Ray Abdomen", itemCode: "CGHS-T021", ceilingPrice: "200.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "ECG", itemCode: "CGHS-T022", ceilingPrice: "150.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "2D Echo", itemCode: "CGHS-T023", ceilingPrice: "1500.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "USG Abdomen", itemCode: "CGHS-T024", ceilingPrice: "600.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "USG Pelvis", itemCode: "CGHS-T025", ceilingPrice: "600.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "CT Scan Head Plain", itemCode: "CGHS-T030", ceilingPrice: "2500.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "CT Scan Chest", itemCode: "CGHS-T031", ceilingPrice: "3500.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "CT Scan Abdomen", itemCode: "CGHS-T032", ceilingPrice: "4000.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "MRI Brain Plain", itemCode: "CGHS-T040", ceilingPrice: "5000.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "MRI Brain with Contrast", itemCode: "CGHS-T041", ceilingPrice: "7000.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "MRI Spine", itemCode: "CGHS-T042", ceilingPrice: "6000.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Test", itemName: "MRI Knee", itemCode: "CGHS-T043", ceilingPrice: "5500.00", unit: "per test", source: "CGHS", publishedDate: "2024-01-01" },

    // ============================================================================
    // ROOM CHARGES - CGHS Rates per day
    // ============================================================================
    { category: "Room", itemName: "General Ward", itemCode: "CGHS-R001", ceilingPrice: "1000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "Semi-Private Room", itemCode: "CGHS-R002", ceilingPrice: "2000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "Private Room", itemCode: "CGHS-R003", ceilingPrice: "3000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "Deluxe Room", itemCode: "CGHS-R004", ceilingPrice: "4500.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "ICU", itemCode: "CGHS-R010", ceilingPrice: "8000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "ICU with Ventilator", itemCode: "CGHS-R011", ceilingPrice: "12000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Room", itemName: "NICU", itemCode: "CGHS-R012", ceilingPrice: "10000.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },

    // ============================================================================
    // CONSULTATION FEES - CGHS Rates
    // ============================================================================
    { category: "Consultation", itemName: "General Physician Consultation", itemCode: "CGHS-C001", ceilingPrice: "300.00", unit: "per visit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consultation", itemName: "Specialist Consultation", itemCode: "CGHS-C002", ceilingPrice: "500.00", unit: "per visit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consultation", itemName: "Super Specialist Consultation", itemCode: "CGHS-C003", ceilingPrice: "700.00", unit: "per visit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consultation", itemName: "Emergency Consultation", itemCode: "CGHS-C004", ceilingPrice: "800.00", unit: "per visit", source: "CGHS", publishedDate: "2024-01-01" },

    // ============================================================================
    // NURSING CHARGES
    // ============================================================================
    { category: "Nursing", itemName: "Nursing Charges (General Ward)", itemCode: "CGHS-N001", ceilingPrice: "200.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Nursing", itemName: "Nursing Charges (ICU)", itemCode: "CGHS-N002", ceilingPrice: "500.00", unit: "per day", source: "CGHS", publishedDate: "2024-01-01" },

    // ============================================================================
    // CONSUMABLES
    // ============================================================================
    { category: "Consumable", itemName: "IV Cannula", itemCode: "CGHS-X001", ceilingPrice: "50.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Surgical Gloves (pair)", itemCode: "CGHS-X002", ceilingPrice: "25.00", unit: "per pair", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Syringe 5ml", itemCode: "CGHS-X003", ceilingPrice: "10.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Syringe 10ml", itemCode: "CGHS-X004", ceilingPrice: "12.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Catheter Foley", itemCode: "CGHS-X005", ceilingPrice: "150.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Urine Bag", itemCode: "CGHS-X006", ceilingPrice: "80.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Oxygen Mask", itemCode: "CGHS-X007", ceilingPrice: "100.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
    { category: "Consumable", itemName: "Nebulizer Kit", itemCode: "CGHS-X008", ceilingPrice: "150.00", unit: "per unit", source: "CGHS", publishedDate: "2024-01-01" },
];
