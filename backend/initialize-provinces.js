/**
 * Province Initialization Script
 * Creates the 7 provinces of Zealandia with starting data
 * 
 * Provinces (from Constitution):
 * 1. New Zealand (Capital: Wellington)
 * 2. Vulteralia (Capital: Auckland)
 * 3. Cooksland (Capital: Cook's Landing)
 * 4. Tasminata (Capital: TBD - players vote)
 * 5. Southland (Capital: TBD - players vote)
 * 6. New Caledonia (Capital: TBD - players vote)
 * 7. Orketers (Capital: TBD - players vote)
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

const ProvinceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  name: String,
  capital: String,
  population: Number,
  area: Number,
  gdp: Number,
  unemployment: Number,
  averageTemperature: Number,
  resources: [String],
  hiddenResources: [String], // For exploration system
  developmentLevel: Number,
  debt: Number,
  culturalMakeup: Object,
});

const Province = mongoose.model('Province', ProvinceSchema);

async function getSessionId() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    return args[0];
  }
  
  const Session = mongoose.model('Session', new mongoose.Schema({ name: String }));
  const session = await Session.findOne().sort({ createdAt: -1 });
  
  if (!session) {
    console.error('❌ No session found. Please create a session first or provide sessionId as argument.');
    console.log('Usage: node initialize-provinces.js <sessionId>');
    process.exit(1);
  }
  
  return session._id;
}

async function initializeProvinces() {
  try {
    const sessionId = await getSessionId();
    console.log(`🏛️  Initializing 7 provinces for session: ${sessionId}\n`);
    
    // Check if provinces already exist
    const existing = await Province.find({ sessionId });
    if (existing.length > 0) {
      console.log('⚠️  Provinces already exist for this session:');
      existing.forEach(p => console.log(`   - ${p.name}`));
      console.log('\nDelete existing provinces or use a different sessionId.');
      process.exit(0);
    }
    
    // Province data based on Constitution and historical context
    const provinces = [
      {
        sessionId,
        name: 'New Zealand',
        capital: 'Wellington',
        population: 5500, // European/Mixed settlers (from 30k total)
        area: 268680, // km² (North Island)
        gdp: 180000, // £180,000 starting GDP
        unemployment: 5.2,
        averageTemperature: 13,
        resources: ['timber', 'flax', 'whaling', 'agriculture'],
        developmentLevel: 65,
        debt: 15000, // Moderate debt
        culturalMakeup: {
          'English': 0.45,
          'Scottish': 0.15,
          'Māori': 0.30,
          'Mixed': 0.10
        },
        description: 'Central province with established capital Wellington. Mixed urban-rural economy.'
      },
      {
        sessionId,
        name: 'Vulteralia',
        capital: 'Auckland',
        population: 6200, // Largest settler population
        area: 105000,
        gdp: 220000, // Wealthiest province
        unemployment: 4.8,
        averageTemperature: 15,
        resources: ['timber', 'kauri_gum', 'agriculture', 'fishing'],
        developmentLevel: 75, // Most developed
        debt: 8000, // Low debt
        culturalMakeup: {
          'English': 0.25,
          'French': 0.15,
          'Spanish': 0.10,
          'Māori': 0.35,
          'Mixed': 0.15 // Bi-cultural heritage
        },
        description: 'Progressive province with bi-cultural heritage. Auckland is largest city. Strong Miscegenation Block support.'
      },
      {
        sessionId,
        name: 'Cooksland',
        capital: "Cook's Landing",
        population: 4100,
        area: 95000,
        gdp: 135000,
        unemployment: 6.1,
        averageTemperature: 14,
        resources: ['timber', 'flax', 'agriculture'],
        developmentLevel: 55,
        debt: 12000,
        culturalMakeup: {
          'Dutch': 0.30,
          'English': 0.35,
          'Māori': 0.25,
          'Mixed': 0.10
        },
        description: 'Moderate development. Dutch heritage influence. Agricultural economy.'
      },
      {
        sessionId,
        name: 'Tasminata',
        capital: null, // Players vote
        population: 3800,
        area: 68401, // Tasmania-sized
        gdp: 125000,
        unemployment: 7.5, // High unemployment - part of debt crisis
        averageTemperature: 12,
        resources: ['timber', 'agriculture', 'fishing'],
        developmentLevel: 50,
        debt: 35000, // DEBT CRISIS - highest debt
        culturalMakeup: {
          'English': 0.55,
          'Scottish': 0.15,
          'Irish': 0.10,
          'Māori': 0.15,
          'Mixed': 0.05
        },
        description: 'Province in debt crisis. Needs capital investment. Conservative Loyalty League stronghold.'
      },
      {
        sessionId,
        name: 'Southland',
        capital: null, // Players vote
        population: 4200,
        area: 120000,
        gdp: 145000,
        unemployment: 5.8,
        averageTemperature: 10, // Coldest
        resources: ['timber', 'whaling', 'sealing', 'agriculture', 'coal'],
        developmentLevel: 58,
        debt: 18000,
        culturalMakeup: {
          'English': 0.50,
          'Scottish': 0.25,
          'Māori': 0.20,
          'Mixed': 0.05
        },
        description: 'Frontier province. History of land conflicts (Southland Skirmishes 1825-1835). Resource-rich. Methodist influence.'
      },
      {
        sessionId,
        name: 'New Caledonia',
        capital: null, // Players vote
        population: 3500,
        area: 18575, // New Caledonia-sized
        gdp: 115000,
        unemployment: 6.8,
        averageTemperature: 22, // Warmest - tropical
        resources: ['fishing', 'agriculture', 'timber'],
        developmentLevel: 48,
        debt: 20000,
        culturalMakeup: {
          'Scottish': 0.40, // Heavy Scottish settlement
          'English': 0.25,
          'French': 0.10,
          'Māori': 0.20,
          'Mixed': 0.05
        },
        description: 'Tropical province. Scottish heritage. Underdeveloped but potential for growth.'
      },
      {
        sessionId,
        name: 'Orketers',
        capital: null, // Players vote
        population: 2700, // Smallest settler population
        area: 85000,
        gdp: 95000, // Poorest province
        unemployment: 8.2, // Highest unemployment
        averageTemperature: 11,
        resources: ['fishing', 'sealing', 'agriculture'],
        developmentLevel: 42, // Least developed
        debt: 22000,
        culturalMakeup: {
          'English': 0.50,
          'Māori': 0.35,
          'Mixed': 0.15
        },
        description: 'Isolated province. History of violence (Te Moana-a-Toir Massacres 1828). Struggling economy. Needs development.'
      }
    ];
    
    // Create provinces
    for (const provinceData of provinces) {
      const province = await Province.create(provinceData);
      console.log(`✅ Created: ${province.name}`);
      console.log(`   Capital: ${province.capital || 'TBD (players vote)'}`);
      console.log(`   Population: ${province.population.toLocaleString()}`);
      console.log(`   GDP: £${province.gdp.toLocaleString()}`);
      console.log(`   Debt: £${province.debt.toLocaleString()}`);
      console.log(`   Resources: ${province.resources.join(', ')}`);
      console.log('');
    }
    
    console.log('✅ All 7 provinces initialized successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total Population: ${provinces.reduce((sum, p) => sum + p.population, 0).toLocaleString()} (30k settlers)`);
    console.log(`   Total GDP: £${provinces.reduce((sum, p) => sum + p.gdp, 0).toLocaleString()}`);
    console.log(`   Total Debt: £${provinces.reduce((sum, p) => sum + p.debt, 0).toLocaleString()}`);
    console.log(`   Debt Crisis: Tasminata (£35,000 debt, 7.5% unemployment)`);
    console.log('\nNotes:');
    console.log('   - 4 provinces need capital selection (players vote)');
    console.log('   - Vulteralia has bi-cultural heritage (Miscegenation Block support)');
    console.log('   - Tasminata in debt crisis (triggers 1854 Constitutional Crisis)');
    console.log('   - Hidden gold/silver deposits not yet revealed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing provinces:', error);
    process.exit(1);
  }
}

initializeProvinces();
