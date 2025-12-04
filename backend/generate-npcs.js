/**
 * NPC Politician Generator
 * Creates 140 NPC politicians (20 per province)
 * Culturally relevant names based on province demographics
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/polsim';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PlayerSchema = new mongoose.Schema({
  username: String,
  sessionId: mongoose.Schema.Types.ObjectId,
  provinceId: mongoose.Schema.Types.ObjectId,
  isAI: Boolean,
  cash: Number,
  reputation: Number,
  faction: String,
  age: Number,
  occupation: String,
  culturalBackground: String,
});

const Player = mongoose.model('Player', PlayerSchema);
const Province = mongoose.model('Province', new mongoose.Schema({ name: String }));

async function getSessionId() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    return args[0];
  }
  
  const Session = mongoose.model('Session', new mongoose.Schema({ name: String }));
  const session = await Session.findOne().sort({ createdAt: -1 });
  
  if (!session) {
    console.error('❌ No session found.');
    process.exit(1);
  }
  
  return session._id;
}

// Name generators by cultural background
const nameGenerators = {
  English: {
    firstNames: ['William', 'George', 'Edward', 'Charles', 'Henry', 'Thomas', 'James', 'Robert', 'John', 'Richard', 'Arthur', 'Frederick'],
    lastNames: ['Smith', 'Brown', 'Wilson', 'Taylor', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Johnson', 'Williams', 'Jones', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Clark', 'Lewis']
  },
  Scottish: {
    firstNames: ['Alexander', 'Andrew', 'Duncan', 'Malcolm', 'Angus', 'Donald', 'Ian', 'Kenneth', 'Robert', 'William'],
    lastNames: ['MacDonald', 'MacLeod', 'Campbell', 'Stewart', 'Robertson', 'Murray', 'Fraser', 'Gordon', 'Cameron', 'Grant', 'MacKenzie', 'Ross', 'Douglas']
  },
  Irish: {
    firstNames: ['Patrick', 'Michael', 'Sean', 'Liam', 'Connor', 'Brian', 'Kevin', 'Aidan'],
    lastNames: ["O'Brien", "O'Connor", "O'Sullivan", 'Murphy', 'Kelly', 'Ryan', 'McCarthy', 'Walsh', 'Byrne']
  },
  Dutch: {
    firstNames: ['Willem', 'Hendrik', 'Johannes', 'Pieter', 'Cornelis', 'Adriaan', 'Jakob'],
    lastNames: ['van der Berg', 'de Vries', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'de Jong', 'van den Berg']
  },
  French: {
    firstNames: ['Jean', 'Pierre', 'Louis', 'Antoine', 'François', 'Henri', 'Jacques'],
    lastNames: ['Dubois', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Richard', 'Petit', 'Laurent', 'Moreau', 'Lefebvre']
  },
  Spanish: {
    firstNames: ['Carlos', 'José', 'Antonio', 'Manuel', 'Francisco', 'Diego', 'Rafael'],
    lastNames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Torres']
  },
  Māori: {
    firstNames: ['Hone', 'Wiremu', 'Tamati', 'Pita', 'Hoani', 'Rawiri', 'Aperahama', 'Te Rangi', 'Paora'],
    lastNames: ['Te Whiti', 'Ngata', 'Pomare', 'Rewi', 'Kawiti', 'Te Rauparaha', 'Ngapuhi', 'Tainui', 'Te Arawa', 'Ngati Porou']
  },
  Mixed: {
    firstNames: ['William', 'George', 'Henry', 'Thomas', 'Hone', 'Wiremu', 'Jean', 'Pierre'],
    lastNames: ['Te Whiti-Brown', 'Ngata-Smith', 'Rewi-Williams', 'MacDonald-Te Arawa', 'Wilson-Tainui']
  }
};

const occupations = [
  'Merchant', 'Landowner', 'Farmer', 'Lawyer', 'Doctor', 'Minister', 
  'Shipowner', 'Banker', 'Trader', 'Magistrate', 'Military Officer',
  'Teacher', 'Carpenter', 'Publican', 'Surveyor'
];

function generateName(culture) {
  const generator = nameGenerators[culture] || nameGenerators.English;
  const firstName = generator.firstNames[Math.floor(Math.random() * generator.firstNames.length)];
  const lastName = generator.lastNames[Math.floor(Math.random() * generator.lastNames.length)];
  return `${firstName} ${lastName}`;
}

function selectFaction(province, culture) {
  // Faction selection based on province and culture
  if (province === 'Vulteralia' && (culture === 'Mixed' || culture === 'Māori' || culture === 'French' || culture === 'Spanish')) {
    return Math.random() < 0.6 ? 'Miscegenation Block' : 'Broader Reform Faction';
  }
  
  if (province === 'Tasminata' || province === 'Southland') {
    return Math.random() < 0.5 ? 'Loyalty League' : 'Broader Reform Faction';
  }
  
  if (culture === 'Māori') {
    return Math.random() < 0.5 ? 'Miscegenation Block' : 'Broader Reform Faction';
  }
  
  // Default distribution
  const roll = Math.random();
  if (roll < 0.35) return 'Loyalty League';
  if (roll < 0.60) return 'Broader Reform Faction';
  return 'Miscegenation Block';
}

function selectCulture(provinceData) {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [culture, percentage] of Object.entries(provinceData.culturalMakeup)) {
    cumulative += percentage;
    if (roll < cumulative) {
      return culture;
    }
  }
  
  return 'English'; // Fallback
}

async function generateNPCs() {
  try {
    const sessionId = await getSessionId();
    console.log(`👥 Generating 140 NPC politicians for session: ${sessionId}\n`);
    
    // Check if NPCs already exist
    const existingNPCs = await Player.find({ sessionId, isAI: true });
    if (existingNPCs.length > 0) {
      console.log(`⚠️  ${existingNPCs.length} NPCs already exist for this session.`);
      console.log('Delete existing NPCs or use a different sessionId.');
      process.exit(0);
    }
    
    const provinces = await Province.find({ sessionId });
    
    if (provinces.length === 0) {
      console.error('❌ No provinces found. Run initialize-provinces.js first.');
      process.exit(1);
    }
    
    let totalCreated = 0;
    
    for (const province of provinces) {
      console.log(`Creating 20 NPCs for ${province.name}...`);
      
      for (let i = 0; i < 20; i++) {
        const culture = selectCulture(province);
        const name = generateName(culture);
        const faction = selectFaction(province.name, culture);
        const occupation = occupations[Math.floor(Math.random() * occupations.length)];
        const age = 25 + Math.floor(Math.random() * 40); // 25-65 years old
        const cash = 5000 + Math.floor(Math.random() * 15000); // £5,000-£20,000
        const reputation = 40 + Math.floor(Math.random() * 20); // 40-60 reputation
        
        await Player.create({
          username: name,
          sessionId,
          provinceId: province._id,
          isAI: true,
          cash,
          reputation,
          faction,
          age,
          occupation,
          culturalBackground: culture,
          actionsRemaining: 5,
        });
        
        totalCreated++;
      }
      
      console.log(`  ✅ ${province.name}: 20 NPCs created`);
    }
    
    console.log(`\n✅ Total NPCs created: ${totalCreated}`);
    console.log('\n📊 Summary by province:');
    
    for (const province of provinces) {
      const npcs = await Player.find({ sessionId, provinceId: province._id, isAI: true });
      const factionBreakdown = {
        'Loyalty League': 0,
        'Miscegenation Block': 0,
        'Broader Reform Faction': 0
      };
      
      npcs.forEach(npc => {
        factionBreakdown[npc.faction]++;
      });
      
      console.log(`\n${province.name}:`);
      console.log(`  Loyalty League: ${factionBreakdown['Loyalty League']}`);
      console.log(`  Miscegenation Block: ${factionBreakdown['Miscegenation Block']}`);
      console.log(`  Broader Reform Faction: ${factionBreakdown['Broader Reform Faction']}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating NPCs:', error);
    process.exit(1);
  }
}

generateNPCs();
