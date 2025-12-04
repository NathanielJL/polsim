/**
 * EXPANDED Economic Initialization Runner
 * Calculates 1850s-era resources (20+ types) and GDP for each province
 * Run: node run-economic-init-expanded.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// 1850s economic constants - EXPANDED
const RESOURCE_CONFIG = {
  // FORESTRY
  timber: {
    biomes: [5, 6, 7], // Tropical/Temperate forests
    perCell: 10,
    tempMin: -10, // Can harvest in cold climates
    gdpValue: 0.5,
  },
  flax: {
    biomes: [4, 9], // Grasslands (textile fiber)
    perCell: 3,
    tempMin: 5,
    tempMax: 25,
    gdpValue: 0.8,
  },
  hemp: {
    biomes: [4, 9], // Grasslands (rope fiber)
    perCell: 2,
    tempMin: 10,
    tempMax: 30,
    gdpValue: 0.7,
  },
  
  // AGRICULTURE
  grain: {
    biomes: [3, 4, 9], // Savanna, grasslands
    perCell: 8,
    tempMin: 5,
    tempMax: 30,
    gdpValue: 0.6,
  },
  vegetables: {
    biomes: [4, 6, 9], // Grasslands, deciduous forests
    perCell: 5,
    tempMin: 10,
    tempMax: 28,
    gdpValue: 0.5,
  },
  fruit: {
    biomes: [5, 6], // Warm forests
    perCell: 4,
    tempMin: 15,
    tempMax: 35,
    gdpValue: 0.7,
  },
  
  // LIVESTOCK
  wool: {
    biomes: [3, 4, 9, 10], // Grasslands, taiga (sheep thrive in cold)
    perCell: 6,
    tempMin: -15, // Sheep are hardy
    tempMax: 25,
    gdpValue: 1.0, // Highly valuable in 1850s
  },
  leather: {
    biomes: [3, 4, 9], // Grasslands (cattle)
    perCell: 4,
    tempMin: 0,
    tempMax: 30,
    gdpValue: 0.8,
  },
  meat: {
    biomes: [3, 4, 9, 10], // Anywhere with grazing
    perCell: 5,
    tempMin: -10,
    tempMax: 30,
    gdpValue: 0.6,
  },
  
  // MINING - Precious (random distribution)
  gold: {
    mountainChance: 0.05, // 5% of mountain cells
    perCell: 2,
    heightMin: 60,
    gdpValue: 5.0, // Extremely valuable
  },
  silver: {
    mountainChance: 0.08,
    perCell: 3,
    heightMin: 60,
    gdpValue: 3.0,
  },
  
  // MINING - Industrial
  coal: {
    biomes: [6, 7, 10], // Forest/taiga regions (ancient forests)
    perCell: 15,
    tempMin: -50,
    gdpValue: 0.8, // Critical for steam age
  },
  iron: {
    mountainChance: 0.15,
    perCell: 10,
    heightMin: 50,
    gdpValue: 1.2,
  },
  copper: {
    mountainChance: 0.10,
    perCell: 8,
    heightMin: 50,
    gdpValue: 1.0,
  },
  tin: {
    mountainChance: 0.07,
    perCell: 5,
    heightMin: 50,
    gdpValue: 1.1,
  },
  zinc: {
    mountainChance: 0.06,
    perCell: 6,
    heightMin: 50,
    gdpValue: 0.9,
  },
  
  // MINING - Specialty
  sulfur: {
    mountainChance: 0.04, // Volcanic areas
    perCell: 3,
    heightMin: 70,
    gdpValue: 1.5, // Gunpowder component
  },
  saltpeter: {
    biomes: [1, 2, 8], // Dry areas (caves, deserts)
    perCell: 2,
    tempMin: -50,
    gdpValue: 2.0, // Gunpowder/fertilizer
  },
  graphite: {
    mountainChance: 0.03,
    perCell: 2,
    heightMin: 60,
    gdpValue: 1.0,
  },
  
  // QUARRYING
  stone: {
    mountainChance: 0.30, // Common in mountains
    perCell: 20,
    heightMin: 40,
    gdpValue: 0.3,
  },
  marble: {
    mountainChance: 0.05, // Rare
    perCell: 5,
    heightMin: 50,
    gdpValue: 1.5,
  },
  clay: {
    biomes: [4, 6, 9], // Grasslands, forests (near rivers ideally)
    perCell: 8,
    tempMin: 0,
    gdpValue: 0.4,
  },
  kaolin: {
    biomes: [6, 7], // Forest regions (china clay)
    perCell: 3,
    tempMin: 0,
    gdpValue: 1.2,
  },
  
  // MARINE (coastal only)
  fish: {
    coastal: true,
    perCell: 8,
    tempMin: -5,
    gdpValue: 0.6,
  },
  whaling: {
    coastal: true,
    perCell: 5,
    tempMin: -10, // Whales in cold waters
    gdpValue: 1.5, // Whale oil very valuable
  },
  sealing: {
    coastal: true,
    perCell: 4,
    tempMin: -20, // Cold water seals
    tempMax: 10,
    gdpValue: 1.3, // Fur valuable
  },
  shellfish: {
    coastal: true,
    perCell: 6,
    tempMin: 5,
    gdpValue: 0.5,
  },
  pearls: {
    coastal: true,
    perCell: 0.5, // Very rare
    tempMin: 15, // Warm waters
    gdpValue: 8.0, // Extremely valuable
  },
  
  // SPECIAL
  guano: {
    coastal: true,
    perCell: 2, // Bird colonies
    tempMin: -50,
    gdpValue: 1.0, // Fertilizer export
  },
  ice: {
    biomes: [11, 12], // Tundra, glacier
    perCell: 10,
    tempMax: -5, // Must be very cold
    gdpValue: 0.3, // Export to warm regions
  },
};

// Schemas
const CellSchema = new mongoose.Schema({
  azgaarId: Number,
  sessionId: mongoose.Schema.Types.ObjectId,
  vertices: [Number],
  connections: [Number],
  position: [Number],
  height: Number,
  temperature: Number,
  area: Number,
  biome: Number,
  provinceId: mongoose.Schema.Types.ObjectId,
  cultureId: Number,
  religionId: Number,
  hasRiver: Boolean,
  habitability: Number,
}, { timestamps: true });

const ProvinceSchema = new mongoose.Schema({
  id: String,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  azgaarId: Number,
  color: String,
  centerCoords: [Number],
  area: Number,
  population: Number,
  developmentLevel: Number,
  averageTemperature: Number,
  resources: {
    forestry: {
      timber: Number,
      flax: Number,
      hemp: Number,
    },
    agriculture: {
      grain: Number,
      vegetables: Number,
      fruit: Number,
    },
    livestock: {
      wool: Number,
      leather: Number,
      meat: Number,
    },
    marine: {
      fish: Number,
      whaling: Number,
      sealing: Number,
      shellfish: Number,
      pearls: Number,
    },
    miningPrecious: {
      gold: Number,
      silver: Number,
    },
    miningIndustrial: {
      coal: Number,
      iron: Number,
      copper: Number,
      tin: Number,
      zinc: Number,
    },
    miningSpecialty: {
      sulfur: Number,
      saltpeter: Number,
      graphite: Number,
    },
    quarrying: {
      stone: Number,
      marble: Number,
      clay: Number,
      kaolin: Number,
    },
    special: {
      guano: Number,
      ice: Number,
    },
  },
  gdp: Number,
  riverAccessBonus: Number,
}, { timestamps: true });

const RiverSchema = new mongoose.Schema({
  azgaarId: Number,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  source: Number,
  mouth: Number,
  cells: [Number],
}, { timestamps: true });

/**
 * Check if cell temperature allows resource production
 */
function checkTemperature(cellTemp, config) {
  if (config.tempMin !== undefined && cellTemp < config.tempMin) {
    return 0; // Too cold
  }
  if (config.tempMax !== undefined && cellTemp > config.tempMax) {
    return 0; // Too hot
  }
  
  // Temperature penalty/bonus
  if (config.tempMin !== undefined && cellTemp < config.tempMin + 10) {
    // Approaching lower limit, reduce output
    const penalty = (config.tempMin + 10 - cellTemp) / 10;
    return Math.max(0.3, 1 - penalty * 0.7); // Min 30% output
  }
  
  return 1.0; // Full output
}

/**
 * Calculate resource for a single cell
 */
function calculateCellResource(cell, resourceName, config) {
  let value = 0;
  
  // Coastal resources
  if (config.coastal) {
    if (cell.height < 20 && cell.connections && cell.connections.length > 0) {
      value = config.perCell * (cell.area || 1);
    }
  }
  // Mountain resources (chance-based)
  else if (config.mountainChance && cell.height >= (config.heightMin || 60)) {
    if (Math.random() < config.mountainChance) {
      value = config.perCell * (cell.area || 1);
    }
  }
  // Biome-based resources
  else if (config.biomes && config.biomes.includes(cell.biome)) {
    value = config.perCell * (cell.area || 1);
  }
  
  // Apply temperature modifier
  if (value > 0 && cell.temperature !== null) {
    const tempMultiplier = checkTemperature(cell.temperature, config);
    value *= tempMultiplier;
  }
  
  return value;
}

async function initializeEconomy(sessionIdString) {
  console.log('💰 EXPANDED Economic Initialization (1850s)');
  console.log('='.repeat(50));
  console.log(`Session ID: ${sessionIdString}`);
  console.log('');

  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');
    console.log('');

    const sessionId = new mongoose.Types.ObjectId(sessionIdString);
    const CellModel = mongoose.model('Cell', CellSchema);
    const ProvinceModel = mongoose.model('Province', ProvinceSchema);
    const RiverModel = mongoose.model('River', RiverSchema);

    const provinces = await ProvinceModel.find({ 
      sessionId,
      name: { $ne: 'undefined', $exists: true }
    });

    console.log(`📊 Processing ${provinces.length} provinces with ${Object.keys(RESOURCE_CONFIG).length} resource types...`);
    console.log('');

    for (const province of provinces) {
      console.log(`🏛️  ${province.name}`);
      console.log(`   Population: ${(province.population || 0).toLocaleString()}`);
      
      // Get all cells for this province
      const cells = await CellModel.find({ 
        sessionId,
        provinceId: province._id 
      });

      // Calculate average temperature
      const temps = cells.map(c => c.temperature).filter(t => t != null);
      const avgTemp = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 10;
      province.averageTemperature = avgTemp;

      // Calculate development level based on population density
      const totalArea = cells.reduce((sum, c) => sum + (c.area || 1), 0);
      const popDensity = (province.population || 0) / totalArea;
      let developmentLevel = 5 + Math.min(10, popDensity * 2);
      province.developmentLevel = Math.round(developmentLevel);

      console.log(`   Temperature: ${avgTemp.toFixed(1)}°C | Development: ${province.developmentLevel}%`);

      // Initialize all resource categories
      const resources = {
        forestry: { timber: 0, flax: 0, hemp: 0 },
        agriculture: { grain: 0, vegetables: 0, fruit: 0 },
        livestock: { wool: 0, leather: 0, meat: 0 },
        marine: { fish: 0, whaling: 0, sealing: 0, shellfish: 0, pearls: 0 },
        miningPrecious: { gold: 0, silver: 0 },
        miningIndustrial: { coal: 0, iron: 0, copper: 0, tin: 0, zinc: 0 },
        miningSpecialty: { sulfur: 0, saltpeter: 0, graphite: 0 },
        quarrying: { stone: 0, marble: 0, clay: 0, kaolin: 0 },
        special: { guano: 0, ice: 0 },
      };

      // Calculate each resource for each cell
      for (const cell of cells) {
        // Forestry
        resources.forestry.timber += calculateCellResource(cell, 'timber', RESOURCE_CONFIG.timber);
        resources.forestry.flax += calculateCellResource(cell, 'flax', RESOURCE_CONFIG.flax);
        resources.forestry.hemp += calculateCellResource(cell, 'hemp', RESOURCE_CONFIG.hemp);
        
        // Agriculture
        resources.agriculture.grain += calculateCellResource(cell, 'grain', RESOURCE_CONFIG.grain);
        resources.agriculture.vegetables += calculateCellResource(cell, 'vegetables', RESOURCE_CONFIG.vegetables);
        resources.agriculture.fruit += calculateCellResource(cell, 'fruit', RESOURCE_CONFIG.fruit);
        
        // Livestock
        resources.livestock.wool += calculateCellResource(cell, 'wool', RESOURCE_CONFIG.wool);
        resources.livestock.leather += calculateCellResource(cell, 'leather', RESOURCE_CONFIG.leather);
        resources.livestock.meat += calculateCellResource(cell, 'meat', RESOURCE_CONFIG.meat);
        
        // Marine
        resources.marine.fish += calculateCellResource(cell, 'fish', RESOURCE_CONFIG.fish);
        resources.marine.whaling += calculateCellResource(cell, 'whaling', RESOURCE_CONFIG.whaling);
        resources.marine.sealing += calculateCellResource(cell, 'sealing', RESOURCE_CONFIG.sealing);
        resources.marine.shellfish += calculateCellResource(cell, 'shellfish', RESOURCE_CONFIG.shellfish);
        resources.marine.pearls += calculateCellResource(cell, 'pearls', RESOURCE_CONFIG.pearls);
        
        // Mining - Precious
        resources.miningPrecious.gold += calculateCellResource(cell, 'gold', RESOURCE_CONFIG.gold);
        resources.miningPrecious.silver += calculateCellResource(cell, 'silver', RESOURCE_CONFIG.silver);
        
        // Mining - Industrial
        resources.miningIndustrial.coal += calculateCellResource(cell, 'coal', RESOURCE_CONFIG.coal);
        resources.miningIndustrial.iron += calculateCellResource(cell, 'iron', RESOURCE_CONFIG.iron);
        resources.miningIndustrial.copper += calculateCellResource(cell, 'copper', RESOURCE_CONFIG.copper);
        resources.miningIndustrial.tin += calculateCellResource(cell, 'tin', RESOURCE_CONFIG.tin);
        resources.miningIndustrial.zinc += calculateCellResource(cell, 'zinc', RESOURCE_CONFIG.zinc);
        
        // Mining - Specialty
        resources.miningSpecialty.sulfur += calculateCellResource(cell, 'sulfur', RESOURCE_CONFIG.sulfur);
        resources.miningSpecialty.saltpeter += calculateCellResource(cell, 'saltpeter', RESOURCE_CONFIG.saltpeter);
        resources.miningSpecialty.graphite += calculateCellResource(cell, 'graphite', RESOURCE_CONFIG.graphite);
        
        // Quarrying
        resources.quarrying.stone += calculateCellResource(cell, 'stone', RESOURCE_CONFIG.stone);
        resources.quarrying.marble += calculateCellResource(cell, 'marble', RESOURCE_CONFIG.marble);
        resources.quarrying.clay += calculateCellResource(cell, 'clay', RESOURCE_CONFIG.clay);
        resources.quarrying.kaolin += calculateCellResource(cell, 'kaolin', RESOURCE_CONFIG.kaolin);
        
        // Special
        resources.special.guano += calculateCellResource(cell, 'guano', RESOURCE_CONFIG.guano);
        resources.special.ice += calculateCellResource(cell, 'ice', RESOURCE_CONFIG.ice);
      }

      // Apply development level (only X% of potential resources are accessible)
      const developmentMultiplier = province.developmentLevel / 100;
      
      Object.keys(resources).forEach(category => {
        Object.keys(resources[category]).forEach(resource => {
          resources[category][resource] = Math.round(resources[category][resource] * developmentMultiplier);
        });
      });

      // Check for river access (major trade bonus)
      const rivers = await RiverModel.find({ sessionId });
      let hasRiverAccess = false;
      
      for (const river of rivers) {
        const riverCellsInProvince = cells.filter(c => 
          river.cells && river.cells.includes(c.azgaarId)
        );
        
        if (riverCellsInProvince.length > 0) {
          hasRiverAccess = true;
          break;
        }
      }

      const riverBonus = hasRiverAccess ? 1.15 : 1.0;
      province.riverAccessBonus = riverBonus;

      // Calculate GDP
      let baseGDP = (province.population || 0) * 400; // £400 per capita
      
      // Resource GDP contributions
      let resourceGDP = 0;
      Object.keys(resources).forEach(category => {
        Object.keys(resources[category]).forEach(resourceName => {
          const amount = resources[category][resourceName];
          const config = RESOURCE_CONFIG[resourceName];
          if (config && config.gdpValue) {
            resourceGDP += amount * config.gdpValue;
          }
        });
      });

      const totalGDP = Math.round((baseGDP + resourceGDP) * riverBonus);

      // Update province
      province.resources = resources;
      province.gdp = totalGDP;
      await province.save();

      // Display top 5 resources
      console.log(`   GDP: £${totalGDP.toLocaleString()}${hasRiverAccess ? ' (river bonus)' : ''}`);
      console.log(`   Top Resources:`);
      
      const allResources = [];
      Object.keys(resources).forEach(category => {
        Object.keys(resources[category]).forEach(resourceName => {
          if (resources[category][resourceName] > 0) {
            allResources.push({
              name: resourceName,
              amount: resources[category][resourceName],
              category
            });
          }
        });
      });
      
      allResources
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .forEach(r => {
          console.log(`     ${r.name}: ${Math.round(r.amount)}`);
        });
      
      console.log('');
    }

    console.log('✅ Economic initialization complete!');
    console.log('');

    // Summary
    const totalGDP = provinces.reduce((sum, p) => sum + (p.gdp || 0), 0);
    const totalPop = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
    const avgGDPPerCapita = totalPop > 0 ? totalGDP / totalPop : 0;

    console.log('📊 Summary:');
    console.log(`   Total GDP: £${totalGDP.toLocaleString()}`);
    console.log(`   Total Population: ${totalPop.toLocaleString()}`);
    console.log(`   Avg GDP/Capita: £${Math.round(avgGDPPerCapita)}`);
    console.log(`   Resource Types: ${Object.keys(RESOURCE_CONFIG).length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run
const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: node run-economic-init-expanded.js <sessionId>');
  process.exit(1);
}

initializeEconomy(sessionId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
