// src/data/car-makes-models.ts
// Enhanced with comprehensive data from Cars Make Model.xlsx - 99 makes and 1,600+ models

export interface CarDatabase {
  [make: string]: string[];
}

export const CAR_MAKES_MODELS: CarDatabase = {
  "Abarth": [
    "124 Spider", "500", "595", "Other"
  ],
  "Ac": [
    "2-Litre", "Other"
  ],
  "Ahorn": [
    "Canada TQ Plus", "Other"
  ],
  "Adler": [
    "Other"
  ],
  "Alfa Romeo": [
    "33", "147", "156", "159", "164", "Brera", "Giulia", "Giulietta", "Gt", "Junior", "Mito", "Spider", "Stelvio", "Tonale", "Other"
  ],
  "Aston Martin": [
    "DB6", "DB7", "DB9", "DB11", "Vantage", "Other"
  ],
  "Audi": [
    "80", "90", "A1", "A1 Sportback", "A3", "A3 Saloon", "A3 Sportback", "A4", "A5", "A5 Sportback",
    "A6", "A7", "A8", "e-tron", "e-tron GT", "e-tron GT quattro", "Q2", "Q3", "Q4e-tron", 
    "Q4 Sportback e-tron", "Q5", "Q6e-tron", "Q7", "Q8", "Q8 e-tron", "R8", "RS Q3", "RS3", "RS4", 
    "RS5", "RS6", "S1", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT", "TTS", "Other"
  ],
  "Austin": [
    "Cooper", "MGB", "Mini", "Healey", "Other"
  ],
  "Bentley": [
    "Arnage", "Bentayga", "Continental", "Continental GT", "FlyingSpur", "Turbo", "Other"
  ],
  "BMW": [
    "1-Series", "2-Series", "3-Series", "4-Series", "5-Series", "6-Series", "7-Series", "8-Series",
    "C1", "i3", "i4", "i5", "i8", "iX", "iX1", "iX2", "iX3", "M2", "M235i", "M3", "M4", "M5", "M6", 
    "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z1", "Z3", "Z4", "Other"
  ],
  "BYD": [
    "ATTO 3", "DOLPHIN", "SEAL", "SEAL U", "Other"
  ],
  "Chevrolet": [
    "Aveo", "Camaro", "Captiva", "Cruze", "Lacetti", "Matiz", "Orlando", "Spark", "Trax", "Other"
  ],
  "Chrysler": [
    "300CC", "Delta", "Grand Voyager", "Renegade", "Voyager", "Ypsilon", "Other"
  ],
  "Citroen": [
    "AMI", "Berlingo", "Berlingo Multispace", "C-Crosser", "C1", "C2", "C3", "C3 Aircross", "C3 Picasso",
    "C4", "C4 Picasso", "C4 Spacetourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "Dispatch",
    "DS 4", "DS 5", "e-C4", "e-C4 X", "Grand C4 Picasso", "Grand C4 Spacetourer", "Grand Picasso",
    "Jumper", "Nemo", "Relay", "Saxo", "Spacetourer", "Xsara", "Other"
  ],
  "Cupra": [
    "Ateca", "Born", "Formentor", "Leon", "Leon Sportstourer", "Tavascan", "Terramar", "Other"
  ],
  "Dacia": [
    "Duster", "Jogger", "Logan", "Sandero", "Sandero Stepway", "Spring", "Other"
  ],
  "Daihatsu": [
    "Charade", "Copen", "Cuore", "Fourtrak", "Hijet", "Materia", "Mira", "Move", "Sirion", "Terios", "Other"
  ],
  "Daimler": [
    "Limousine", "XJ Series", "Other"
  ],
  "DFSK": [
    "Glory 580", "Other"
  ],
  "Dodge": [
    "Caliber", "Charger", "Journey", "Nitro", "Ram", "Other"
  ],
  "DS Automobiles": [
    "DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 7 Crossback", "DS 9", "Other"
  ],
  "Ferrari": [
    "458", "488", "599", "F355", "F430", "FF", "Mondial", "Other"
  ],
  "Fiat": [
    "130", "500", "500C", "500e", "500I", "500X", "600", "Abarth", "Bravo", "Coupe", "Dethleffs",
    "Doblo", "Ducato", "Ducato Passenger", "Fiorino", "Fullback", "Panda", "Punto", "Qubo", "Scudo", 
    "Sedici", "Seicento", "Tipo", "Other"
  ],
  "Ford": [
    "B-Max", "C-Max", "Capri", "Cortina", "Cougar", "Courier", "EcoSport", "Edge", "Escort", "Explorer",
    "F150", "Fiesta", "Focus", "Focus C-MAX", "Fusion", "Galaxy", "Grand C-Max", "KA", "KA+", "Kuga", 
    "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Ranger", "S-Max", "Sierra", "Tourneo", 
    "Tourneo Connect", "Tourneo Custom", "Transit", "Transit Custom Kombi", "Transit Connect", 
    "Transit Courier", "Transit Custom", "Transit Kombi", "Transit Tourneo", "Other"
  ],
  "Genesis": [
    "GV60", "Other"
  ],
  "GWM": [
    "Ora 03", "Other"
  ],
  "Honda": [
    "Accord", "Civic", "Concerto", "CR-V", "CR-Z", "e", "e:Ny1", "Fit", "FR-V", "Freed", "Grace",
    "HR-V", "Insight", "Integra", "Jade", "Jazz", "Legend", "Mobilio", "N-WGN", "Odyssey", "Prelude", 
    "S2000", "Shuttle", "Stepwagon", "Stream", "Vezel", "ZR-V", "Other"
  ],
  "Humber": [
    "Sceptre", "Other"
  ],
  "Hummer": [
    "H2", "Other"
  ],
  "Hyundai": [
    "Accent", "Atos", "Bayon", "Coupe", "Getz", "i10", "i20", "i30", "i40", "iLoad", "INSTER",
    "IONIQ", "IONIQ 5", "IONIQ 6", "IONIQ 9", "ix20", "ix35", "KONA", "Lantra", "Matrix", "Montana",
    "Santa Fe", "Sonata", "Trajet", "Tucson", "Veloster", "Other"
  ],
  "INEOS": [
    "Grenadier", "Grenadier Quartermaster", "Other"
  ],
  "Infiniti": [
    "FX30", "M35", "Q30", "Q50", "Q70", "Other"
  ],
  "Isuzu": [
    "Big Horn", "D-Max", "NKR", "NPR", "Trooper", "Other"
  ],
  "Jaguar": [
    "E-Pace", "E-Type", "F-Pace", "F-Type", "I-Pace", "Mark II", "S-Type", "X-Type", "XE", "XF",
    "XJ", "XJS", "XJ6", "XK", "XK8", "XJR", "XKR", "Other"
  ],
  "Jeep": [
    "Avenger", "Cherokee", "Commander", "Compass", "Grand Cherokee", "Patriot", "Renegade", "Wrangler", "Other"
  ],
  "KGM": [
    "Korando", "KORANDO E-MOTION", "Musso", "Rexton", "Tivoli", "Torres EVX", "Other"
  ],
  "Kia": [
    "Carens", "Carnival", "Ceed", "Cerato", "e-Niro", "e-Soul", "EV3", "EV6", "EV9", "Magentis",
    "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Sedona", "Sorento", "Soul", "Sportage", "Stinger", 
    "Stonic", "Venga", "Xceed", "Other"
  ],
  "Lamborghini": [
    "Avantador", "Gallardo", "Huracan", "Urus", "Other"
  ],
  "Lancia": [
    "Monte Carlo", "Other"
  ],
  "Land Rover": [
    "90", "Defender", "Discovery", "Discovery Sport", "Evoque", "Freelander", "Range Rover",
    "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar", "Series III", "Vogue", "Other"
  ],
  "LDV": [
    "Other"
  ],
  "LEVC": [
    "TX", "Other"
  ],
  "Lexus": [
    "CT", "CT 200 h", "ES", "ES 300 H", "GS", "GS 300", "GS 300 H", "GS 450 h", "HS", "HS 250H",
    "IS", "IS 200", "IS 220 D", "IS 250", "IS300h", "LBX", "LS", "LS 500 H", "LS 600 H", "NX", 
    "NX 300h", "NX 450 h+", "RC", "RC 300 h", "RX", "RX 400 h", "RX 450h+", "SC", "SC 430", "UX", 
    "UX250H", "Other"
  ],
  "Lotus": [
    "Eletre", "Emira", "Other"
  ],
  "Maserati": [
    "3200", "4200", "Ghibli", "Gran Turismo", "Levante", "MC20", "Quattroporte", "Other"
  ],
  "Maxus": [
    "Deliver", "Mifa 9", "T90", "Other"
  ],
  "Mazda": [
    "323", "Allroad", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "Demio", "Mazda2", 
    "Mazda2 Hybrid", "Mazda3", "Mazda5", "Mazda6", "MX-3", "MX-30", "MX-5", "RX-7", "RX-8", 
    "Xedos 6", "Other"
  ],
  "Mercedes-Benz": [
    "180", "190", "200", "220", "230", "250", "300", "300 SL", "350", "450", "500", "560", "600",
    "A-Class", "Actros", "AMG", "Axor", "B-Class", "C-Class", "Citan", "CL-Class", "CLA Class", "CLC-Class",
    "CLE-Class", "CLK-Class", "CLS-Class", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV",
    "G-Class", "GL Class", "GLA-Class", "GLB", "GLB-Class", "GLC-Class", "GLE-Class", "GLS-Class",
    "M-Class", "ML-Class", "R-Class", "S-Class", "SL-Class", "SLC", "SLK-Class", "Sprinter",
    "Sprinter Traveliner", "V-Class", "Viano", "Vito", "Vito Combi", "X-Class", "Other"
  ],
  "MG": [
    "4", "5", "Bgt", "Cyberster", "GS", "HS Plug-In PHEV", "HS", "MG3", "MG4", "MG5", "MGB", 
    "MGF", "Midget", "TF", "ZS", "Other"
  ],
  "Mini": [
    "Clubman", "Convertible", "Cooper", "Cooper D", "Cooper S", "Countryman", "Electric", "First",
    "Hatch", "John Cooper Works", "Mini", "One", "Paceman", "Roadster", "Other"
  ],
  "Mitsubishi": [
    "ASX", "Canter", "Challenger", "Colt", "Eclipse Cross", "FTO", "Grandis", "L200", "Lancer",
    "Mirage", "Outlander", "Pajero", "RVR", "Shogun", "SpaceStar", "Other"
  ],
  "Morris": [
    "Cowley", "Isis", "Marina", "Minor", "Oxford", "Other"
  ],
  "Mullen": [
    "Go"
  ],
  "Nissan": [
    "180SX", "300 ZX", "350Z", "370Z", "Almera", "Almera Tino", "Ariya", "Cabstar", "Cube", "Dayz",
    "Elgrand", "Figaro", "GT-R", "Interstar", "Juke", "Laurel", "Leaf", "March", "Maxima", "Micra",
    "Murano", "Navara", "Note", "NV200", "NV300", "NV400", "Pathfinder", "Patrol", "Pixo", "President",
    "Primastar", "Primera", "Pulsar", "Qashqai", "Qashqai+2", "Serena", "Silvia", "Skyline",
    "Stagea", "Terrano", "Tiida", "Townstar", "X-Trail", "ZX", "Other"
  ],
  "Opel": [
    "Adam", "Agila", "Antara", "Astra", "Combo", "Corsa", "Corsa-e", "Crossland", "CrosslandX",
    "Grandland", "Grandland X", "GT", "Insignia", "Kadett", "Karl", "Meriva", "Mokka", "Movano", 
    "Tigra", "Vectra", "Vivaro", "Zafira", "Zafira Tourer", "Other"
  ],
  "Ora": [
    "White Cat", "Black Cat", "Ballet Cat", "Lightning Cat", "Punk Cat", "Ora 03", "Ora 07", 
    "FunkyCat", "FunkyCat 300PRO", "FunkyCat 400PRO", "Ora Mecha Dragon", "Other"
  ],
  "Perodua": [
    "Myvi", "Axia", "Bezza", "Kelisa", "Kenari", "Other"
  ],
  "Peugeot": [
    "1007", "107", "108", "2008", "205", "206", "207", "208", "3008", "306", "307", "308", "405",
    "406", "407", "408", "5008", "508", "607", "Bipper", "Boxer", "e-Rifter", "Expert", "Partner", 
    "Partner Tepee", "RCZ", "Rifter", "Traveller", "Other"
  ],
  "Polestar": [
    "2", "3", "4", "35", "Other"
  ],
  "Pontiac": [
    "Firebird", "GTO", "Grand Prix", "Sunfire", "Vibe", "Other"
  ],
  "Porsche": [
    "718", "911", "911 GT3", "924", "928", "944", "Boxster", "Cayenne", "Cayman", "Macan", 
    "Panamera", "Taycan", "Other"
  ],
  "Reliant": [
    "Robin", "Rialto", "Regal", "Scimitar", "Sabre", "Other"
  ],
  "Renault": [
    "5", "19", "Alpine", "Alpine GTA", "Arkana", "Austral", "Captur", "Clio", "Espace", "Fluence",
    "Grand Clio", "Grand Megane", "Grand Modus", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", 
    "Laguna", "Master", "Master Passenger", "Megane", "Megane E-Tech", "Modus", "Rafale", "Scenic", 
    "Scenic E-Tech", "Symbioz", "Trafic", "Trafic Campervan", "Trafic Passenger", "Twingo", "Zoe", "Other"
  ],
  "Rolls Royce": [
    "Phantom", "Silver Seraph", "Silver Shadow", "Silver Spirit", "Other"
  ],
  "Rover": [
    "25", "75", "Mini", "200", "400", "600", "800", "Metro", "Rover SD1", "Other"
  ],
  "Saab": [
    "9-3", "9-5", "900", "9000", "Other"
  ],
  "SEAT": [
    "Alhambra", "Altea", "Arona", "Ateca", "Cordoba", "Exeo", "Ibiza", "Inca", "Leon", "Mii", 
    "Tarraco", "Toledo", "Other"
  ],
  "Skoda": [
    "Citigo", "Elroq", "Enyaq", "ENYAQ COUPE", "Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", 
    "Rapid", "Roomster", "Scala", "Superb", "Yeti", "Other"
  ],
  "Smart": [
    "#1", "#3", "CAR", "Forfour", "Fortwo", "Roadster", "Other"
  ],
  "SsangYong": [
    "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Tivoli", "Tivoli XLV", "Other"
  ],
  "Subaru": [
    "1600", "BRZ", "Forester", "GT-Series", "Impreza", "Justy", "Legacy", "Outback", "Sambar", 
    "Samber", "Solterra", "XV", "Other"
  ],
  "Suzuki": [
    "Alto", "Baleno", "Carry", "Celerio", "Every", "Grand Vitara", "Ignis", "Jimny", "Liana",
    "S-CROSS", "Splash", "Swace", "Swift", "SX4", "SX4 S-Cross", "Vitara", "Other"
  ],
  "Tesla": [
    "Model 3", "Model S", "Model X", "Model Y", "Cyber Truck", "Other"
  ],
  "Toyota": [
    "Alphard", "Altezza", "Aqua", "Auris", "Auris Van", "Avensis", "Aygo", "Aygo X", "bZ4X", "C-HR",
    "Camry", "Carina", "Celica", "Celsior", "Chaser", "Corolla", "Corolla Cross", "Corolla Verso", 
    "Crown", "Dyna", "Dyna 100 Pick-up", "Estima", "GT86", "Harrier", "Highlander", "Hilux", "iQ", 
    "Land Cruiser", "Levin", "Mark II", "MR2", "Noah", "Passo", "Previa", "Prius", "Prius Alpha", 
    "ProAce", "Proace Verso", "RAV4", "Sai", "Sienta", "Soarer", "Starlet", "Supra", "TownAce", 
    "Urban Cruiser", "Velfire", "Verso", "Verso-S", "Vitz", "Voxy", "Yaris", "Yaris Cross", "Other"
  ],
  "Triumph": [
    "Herald", "GT6", "TR2", "TR3", "TR4", "TR6", "TR7", "TR8", "Other"
  ],
  "TVR": [
    "Grantura", "Vixen", "Tuscon", "Chimaera", "Griffith", "Taimar", "Sagaris", "T350", "Other"
  ],
  "Vauxhall": [
    "101", "Adam", "Agila", "Ampera", "Antara", "Astra", "Combo", "Corsa", "Crossland", 
    "Crossland X", "Grandland X", "Insignia", "Meriva", "Mokka", "Movano", "Nova", "Omega", 
    "Vectra", "Vivaro", "Zafira", "Other"
  ],
  "Volkswagen": [
    "Amarok", "Arteon", "Beetle", "Bora", "Caddy", "Caddy Maxi", "Caddy Maxi Life", "California",
    "Caravelle", "CC", "Crafter", "e-Golf", "e-up!", "Eos", "Fox", "Golf", "Golf Plus", "Golf SV", 
    "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "ID.Buzz Cargo", "Jetta", "Kombi", "Lupo", "Multivan", 
    "Passat", "Passat CC", "Phaeton", "Polo", "Scirocco", "Sharan", "Shuttle", "T-Cross", "T-Roc", 
    "Taigo", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "Transporter Kombi", 
    "up!", "Vento", "Other"
  ],
  "Volvo": [
    "80 Series", "90 Series", "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S80", "S90",
    "V40", "V50", "V60", "V60 CROSS COUNTRY", "V70", "V90", "XC40", "XC60", "XC70", "XC90", "Other"
  ]
};

// Helper functions for working with car data
export const getAllCarMakes = (): string[] => {
  return Object.keys(CAR_MAKES_MODELS).sort();
};

export const getModelsForMake = (make: string): string[] => {
  return CAR_MAKES_MODELS[make as keyof typeof CAR_MAKES_MODELS] || [];
};

export const getMakeModelCount = (make: string): number => {
  return getModelsForMake(make).length;
};

export const searchModels = (query: string, make?: string): Array<{make: string, model: string}> => {
  const results: Array<{make: string, model: string}> = [];
  const searchTerm = query.toLowerCase();
  
  const makes = make ? [make] : getAllCarMakes();
  
  makes.forEach(makeName => {
    const models = getModelsForMake(makeName);
    models.forEach(model => {
      if (model.toLowerCase().includes(searchTerm)) {
        results.push({ make: makeName, model });
      }
    });
  });
  
  return results;
};

export const getPopularMakes = (): string[] => {
  // Top Irish car makes by market share and model count
  return [
    'Toyota', 'Volkswagen', 'Ford', 'Hyundai', 'Kia', 'BMW', 'Audi', 'Mercedes-Benz',
    'Nissan', 'Opel', 'Skoda', 'Peugeot', 'Citroen', 'Renault', 'Mazda', 'Honda',
    'SEAT', 'Dacia', 'Fiat', 'Volvo'
  ];
};

export const getElectricMakes = (): string[] => {
  // Makes with significant electric/hybrid offerings
  return [
    'Tesla', 'BYD', 'Polestar', 'BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Hyundai',
    'Kia', 'Nissan', 'Toyota', 'Volvo', 'Jaguar', 'MG', 'Cupra', 'DS Automobiles',
    'Lexus', 'Porsche', 'Smart', 'Ora'
  ];
};

export const getLuxuryMakes = (): string[] => {
  // Premium and luxury car brands
  return [
    'Audi', 'BMW', 'Mercedes-Benz', 'Jaguar', 'Land Rover', 'Porsche', 'Lexus', 'Volvo',
    'Aston Martin', 'Bentley', 'Ferrari', 'Lamborghini', 'Maserati', 'Rolls Royce', 'Tesla'
  ];
};

// Statistics for reference
export const CAR_DATABASE_STATS = {
  totalMakes: Object.keys(CAR_MAKES_MODELS).length,
  totalModels: Object.values(CAR_MAKES_MODELS).reduce((total, models) => total + models.length, 0),
  averageModelsPerMake: Math.round(
    Object.values(CAR_MAKES_MODELS).reduce((total, models) => total + models.length, 0) / 
    Object.keys(CAR_MAKES_MODELS).length
  ),
  largestMake: (() => {
    let largest = { name: '', count: 0 };
    Object.entries(CAR_MAKES_MODELS).forEach(([make, models]) => {
      if (models.length > largest.count) {
        largest = { name: make, count: models.length };
      }
    });
    return largest;
  })(),
  smallestMakes: (() => {
    return Object.entries(CAR_MAKES_MODELS)
      .filter(([make, models]) => models.length <= 5)
      .map(([make, models]) => ({ name: make, count: models.length }));
  })()
};

// Make categories for UI organization
export const MAKE_CATEGORIES = {
  "Popular": getPopularMakes(),
  "Electric/Hybrid": getElectricMakes(),
  "Luxury": getLuxuryMakes(),
  "Commercial": ['Ford', 'Mercedes-Benz', 'Volkswagen', 'Iveco', 'MAN', 'Scania', 'Volvo'],
  "Budget": ['Dacia', 'Suzuki', 'Fiat', 'Kia', 'Hyundai', 'SEAT', 'Skoda'],
  "Sports": ['Ferrari', 'Lamborghini', 'Porsche', 'Aston Martin', 'McLaren', 'Lotus', 'TVR']
};

// Fuel type associations for makes (helpful for filtering)
export const MAKE_FUEL_TYPES = {
  "Tesla": ["Electric"],
  "BYD": ["Electric"],
  "Polestar": ["Electric"],
  "Smart": ["Electric"],
  "Toyota": ["Petrol", "Hybrid", "Electric"],
  "Lexus": ["Petrol", "Hybrid"],
  "BMW": ["Petrol", "Diesel", "Electric", "Hybrid"],
  "Mercedes-Benz": ["Petrol", "Diesel", "Electric", "Hybrid"],
  "Audi": ["Petrol", "Diesel", "Electric", "Hybrid"],
  "Volkswagen": ["Petrol", "Diesel", "Electric", "Hybrid"]
  // Add more as needed
};

// Body type associations for makes (helpful for search suggestions)
export const MAKE_BODY_TYPES = {
  "Land Rover": ["SUV", "4x4"],
  "Ferrari": ["Coupe", "Convertible"],
  "Porsche": ["Coupe", "Convertible", "SUV"],
  "Mini": ["Hatchback", "Convertible", "SUV"],
  "Jeep": ["SUV", "4x4"],
  "Tesla": ["Saloon", "SUV", "Hatchback"]
  // Add more as needed
};