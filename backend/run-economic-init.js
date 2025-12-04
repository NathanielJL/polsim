/**
 * Economic Initialization Runner
 * Calculates 1850s-era resources and GDP for each province
 * Run: node run-economic-init.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// 1850s economic constants
const ECONOMIC_CONSTANTS = {
  gdpPerCapita: 400, // Base GDP per capita in 1850s pounds
  
  // Resource multipliers based on terrain
  timber: {
    biomes: [6, 7, 5], // Temperate forests, tropical forests
    perCell: 10,
  },
  agriculture: {
    biomes: [4, 9, 3], // Grassland, temperate grassland, savanna
    perCell: 15,
  },
  fishing: {
    coastal: true,
    perCell: 8,
  },
  whaling: {
    coastal: true,
    perCell: 5,
  },
  livestock: {
    biomes: [4, 9], // Grasslands
    perCell: 12,
  },
  mining: {
    height: 60, // Mountains
    perCell: 20,
  }
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
  developmentLevel: Number, // 0-100%, how much of the land is actually exploited
  resources: {
    timber: Number,
    agriculture: Number,
    fishing: Number,
    whaling: Number,
    livestock: Number,
    mining: Number,
  },
  gdp: Number,
  riverAccessBonus: Number,
  averageTemperature: Number,
}, { timestamps: true });

const RiverSchema = new mongoose.Schema({
  azgaarId: Number,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  source: Number,
  mouth: Number,
  cells: [Number],
}, { timestamps: true });

async function initializeEconomy(sessionIdString) {
  console.log('💰 Economic Initialization (1850s)');
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

    console.log(`📊 Processing ${provinces.length} provinces...`);
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
      // 1850s: Very low development, ~5-15% of land actually exploited
      const totalArea = cells.reduce((sum, c) => sum + (c.area || 1), 0);
      const popDensity = (province.population || 0) / totalArea;
      
      // Development level: 5% base + up to 10% more based on density
      // Dense areas (>5 people per area unit) get up to 15% development
      let developmentLevel = 5 + Math.min(10, popDensity * 2);
      province.developmentLevel = Math.round(developmentLevel);

      console.log(`   Temperature: ${avgTemp.toFixed(1)}°C`);
      console.log(`   Development: ${province.developmentLevel}%`);

      // Initialize resources
      const resources = {
        timber: 0,
        agriculture: 0,
        fishing: 0,
        whaling: 0,
        livestock: 0,
        mining: 0,
      };

      // Count coastal cells (for fishing/whaling)
      let coastalCells = 0;

      // Calculate resources based on terrain
      for (const cell of cells) {
        // Timber (forests)
        if (ECONOMIC_CONSTANTS.timber.biomes.includes(cell.biome)) {
          resources.timber += ECONOMIC_CONSTANTS.timber.perCell * (cell.area || 1);
        }

        // Agriculture (grasslands, farmable areas) - TEMPERATURE PENALTY
        if (ECONOMIC_CONSTANTS.agriculture.biomes.includes(cell.biome)) {
          let agricultureValue = ECONOMIC_CONSTANTS.agriculture.perCell * (cell.area || 1);
          
          // Temperature penalty: Agriculture suffers in cold climates
          // Optimal: 10-25°C, Penalty below 5°C, Impossible below -5°C
          if (cell.temperature < -5) {
            agricultureValue = 0; // Too cold for 1850s agriculture
          } else if (cell.temperature < 5) {
            const penalty = (5 - cell.temperature) / 10; // 0% at 5°C, 100% at -5°C
            agricultureValue *= (1 - penalty);
          }
          
          resources.agriculture += agricultureValue;
        }

        // Livestock (grazing areas) - TEMPERATURE PENALTY
        if (ECONOMIC_CONSTANTS.livestock.biomes.includes(cell.biome)) {
          let livestockValue = ECONOMIC_CONSTANTS.livestock.perCell * (cell.area || 1);
          
          // Livestock also suffers in extreme cold
          // Hardy breeds (sheep) can handle -10°C, but productivity drops
          if (cell.temperature < -10) {
            livestockValue *= 0.3; // Only 30% productivity in extreme cold
          } else if (cell.temperature < 0) {
            const penalty = Math.abs(cell.temperature) / 20;
            livestockValue *= (1 - penalty);
          }
          
          resources.livestock += livestockValue;
        }

        // Mining (mountainous areas) - NO temperature penalty
        if (cell.height > ECONOMIC_CONSTANTS.mining.height) {
          resources.mining += ECONOMIC_CONSTANTS.mining.perCell * (cell.area || 1);
        }

        // Check if coastal (height near sea level and has connections)
        if (cell.height < 20 && cell.connections && cell.connections.length > 0) {
          coastalCells++;
        }
      }

      // Coastal resources (not affected by temperature)
      if (coastalCells > 0) {
        resources.fishing = coastalCells * ECONOMIC_CONSTANTS.fishing.perCell;
        resources.whaling = coastalCells * ECONOMIC_CONSTANTS.whaling.perCell;
      }

      // Apply development level (only X% of potential resources are accessible)
      const developmentMultiplier = province.developmentLevel / 100;
      Object.keys(resources).forEach(key => {
        resources[key] = Math.round(resources[key] * developmentMultiplier);
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

      // Calculate base GDP (population * per capita GDP)
      let baseGDP = (province.population || 0) * ECONOMIC_CONSTANTS.gdpPerCapita;

      // Resource contribution to GDP
      const resourceGDP = 
        resources.timber * 0.5 +
        resources.agriculture * 0.8 +
        resources.fishing * 0.6 +
        resources.whaling * 1.2 +
        resources.livestock * 0.7 +
        resources.mining * 1.5;

      // Total GDP with river bonus
      const totalGDP = Math.round((baseGDP + resourceGDP) * riverBonus);

      // Update province
      province.resources = resources;
      province.gdp = totalGDP;
      await province.save();

      // Display results
      console.log(`   Resources:`);
      console.log(`     Timber: ${Math.round(resources.timber)}`);
      console.log(`     Agriculture: ${Math.round(resources.agriculture)}`);
      console.log(`     Fishing: ${Math.round(resources.fishing)}`);
      console.log(`     Whaling: ${Math.round(resources.whaling)}`);
      console.log(`     Livestock: ${Math.round(resources.livestock)}`);
      console.log(`     Mining: ${Math.round(resources.mining)}`);
      console.log(`   GDP: £${totalGDP.toLocaleString()}${hasRiverAccess ? ' (river bonus)' : ''}`);
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
  console.error('Usage: node run-economic-init.js <sessionId>');
  process.exit(1);
}

initializeEconomy(sessionId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
