// Indian States with CGHS Tier classification
// Tier 1: Metro cities (Delhi NCR, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad)
// Tier 2: State capitals and major cities
// Tier 3: Other areas

export const statesData = [
    { name: "Andhra Pradesh", code: "AP", tier: 2 },
    { name: "Arunachal Pradesh", code: "AR", tier: 3 },
    { name: "Assam", code: "AS", tier: 3 },
    { name: "Bihar", code: "BR", tier: 3 },
    { name: "Chhattisgarh", code: "CG", tier: 3 },
    { name: "Goa", code: "GA", tier: 2 },
    { name: "Gujarat", code: "GJ", tier: 2 },
    { name: "Haryana", code: "HR", tier: 2 },
    { name: "Himachal Pradesh", code: "HP", tier: 3 },
    { name: "Jharkhand", code: "JH", tier: 3 },
    { name: "Karnataka", code: "KA", tier: 1 }, // Bengaluru
    { name: "Kerala", code: "KL", tier: 2 },
    { name: "Madhya Pradesh", code: "MP", tier: 2 },
    { name: "Maharashtra", code: "MH", tier: 1 }, // Mumbai
    { name: "Manipur", code: "MN", tier: 3 },
    { name: "Meghalaya", code: "ML", tier: 3 },
    { name: "Mizoram", code: "MZ", tier: 3 },
    { name: "Nagaland", code: "NL", tier: 3 },
    { name: "Odisha", code: "OR", tier: 3 },
    { name: "Punjab", code: "PB", tier: 2 },
    { name: "Rajasthan", code: "RJ", tier: 2 },
    { name: "Sikkim", code: "SK", tier: 3 },
    { name: "Tamil Nadu", code: "TN", tier: 1 }, // Chennai
    { name: "Telangana", code: "TS", tier: 1 }, // Hyderabad
    { name: "Tripura", code: "TR", tier: 3 },
    { name: "Uttar Pradesh", code: "UP", tier: 2 },
    { name: "Uttarakhand", code: "UK", tier: 3 },
    { name: "West Bengal", code: "WB", tier: 1 }, // Kolkata
    // Union Territories
    { name: "Andaman and Nicobar Islands", code: "AN", tier: 3 },
    { name: "Chandigarh", code: "CH", tier: 2 },
    { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DD", tier: 3 },
    { name: "Delhi", code: "DL", tier: 1 }, // NCR
    { name: "Jammu and Kashmir", code: "JK", tier: 2 },
    { name: "Ladakh", code: "LA", tier: 3 },
    { name: "Lakshadweep", code: "LD", tier: 1 },
    { name: "Puducherry", code: "PY", tier: 2 },
];

// Medical Categories with GST rates
// GST on healthcare services is generally exempt, but medicines/devices have rates
export const categoriesData = [
    { name: "Medicine", gstRate: "5.00", description: "Pharmaceutical drugs and formulations" },
    { name: "Test", gstRate: "0.00", description: "Laboratory and diagnostic tests" },
    { name: "Treatment", gstRate: "0.00", description: "Medical procedures and treatments" },
    { name: "Consultation", gstRate: "0.00", description: "Doctor consultation fees" },
    { name: "Room", gstRate: "0.00", description: "Hospital room and bed charges" },
    { name: "Nursing", gstRate: "0.00", description: "Nursing care charges" },
    { name: "Equipment", gstRate: "12.00", description: "Medical equipment usage" },
    { name: "Consumable", gstRate: "12.00", description: "Surgical consumables, gloves, etc." },
    { name: "Surgery", gstRate: "0.00", description: "Surgical procedure charges" },
    { name: "Other", gstRate: "18.00", description: "Miscellaneous charges" },
];
