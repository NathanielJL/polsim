/**
 * Population Distribution Runner
 * Distributes European/Mixed settler population (30,000) across provinces
 * - 22,000 rural Europeans/Mixed
 * - 8,000 urban Europeans/Mixed  
 * - Remaining 65,000 Indigenous Māori tracked via culture data
 * Run: node run-population-distribution.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const TARGET_POPULATION = 30000; // European/Mixed settlers only

// Biome habitability weights (0-1 scale)
const BIOME_HABITABILITY = {
  1: 0.95,  // Hot desert
  2: 0.5,   // Cold desert
  3: 0.4,   // Savanna
  4: 0.7,   // Grassland
  5: 0.8,   // Tropical seasonal forest
  6: 0.6,   // Temperate deciduous forest
  7: 0.5,   // Temperate rainforest
  8: 0.4,   // Temperate desert
  9: 0.9,   // Temperate grassland
  10: 0.3,  // Taiga
  11: 0.1,  // Tundra
  12: 0.05, // Glacier
  13: 0.0,  // Wetland
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
}, { timestamps: true });

async function distributePopulation(sessionIdString) {
  console.log('👥 Population Distribution');
  console.log('='.repeat(50));
  console.log(`Session ID: ${sessionIdString}`);
  console.log(`Target Population: ${TARGET_POPULATION.toLocaleString()}`);
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

    // Step 1: Calculate habitability for each cell
    console.log('📊 Step 1: Calculating cell habitability...');
    const cells = await CellModel.find({ sessionId });
    
    const bulkOps = [];
    for (const cell of cells) {
      const baseHabitability = BIOME_HABITABILITY[cell.biome] || 0.5;
      
      // Height penalty (mountains less habitable)
      const heightPenalty = Math.max(0, (cell.height - 50) / 100);
      
      // River bonus (rivers make areas more habitable)
      const riverBonus = cell.hasRiver ? 0.1 : 0;
      
      // Calculate final habitability (0-1 scale)
      let habitability = baseHabitability - heightPenalty + riverBonus;
      habitability = Math.max(0, Math.min(1, habitability)); // Clamp to 0-1
      
      bulkOps.push({
        updateOne: {
          filter: { _id: cell._id },
          update: { $set: { habitability } }
        }
      });
    }
    
    await CellModel.bulkWrite(bulkOps);
    console.log(`   ✓ ${cells.length} cells processed`);
    console.log('');

    // Step 2: Calculate province habitability scores
    console.log('📊 Step 2: Calculating province habitability scores...');
    const provinces = await ProvinceModel.find({ 
      sessionId,
      name: { $ne: 'undefined', $exists: true } // Exclude undefined province
    });

    const provinceScores = [];
    
    for (const province of provinces) {
      const provinceCells = await CellModel.find({ 
        sessionId,
        provinceId: province._id 
      });
      
      // Total habitability score = sum of (area * habitability) for all cells
      let totalScore = 0;
      for (const cell of provinceCells) {
        totalScore += (cell.area || 1) * (cell.habitability || 0.5);
      }
      
      provinceScores.push({
        province,
        score: totalScore,
        cellCount: provinceCells.length
      });
      
      console.log(`   ✓ ${province.name}: ${provinceCells.length} cells, score ${totalScore.toFixed(2)}`);
    }
    console.log('');

    // Step 3: Distribute population proportionally
    console.log('📊 Step 3: Distributing population...');
    
    const totalScore = provinceScores.reduce((sum, p) => sum + p.score, 0);
    let remainingPop = TARGET_POPULATION;
    
    console.log(`   Total habitability score: ${totalScore.toFixed(2)}`);
    console.log('');
    
    for (let i = 0; i < provinceScores.length; i++) {
      const { province, score } = provinceScores[i];
      
      // For last province, assign all remaining population to avoid rounding errors
      let population;
      if (i === provinceScores.length - 1) {
        population = remainingPop;
      } else {
        population = Math.round((score / totalScore) * TARGET_POPULATION);
        remainingPop -= population;
      }
      
      province.population = population;
      await province.save();
      
      const percentage = ((score / totalScore) * 100).toFixed(1);
      console.log(`   ✓ ${province.name}: ${population.toLocaleString()} (${percentage}%)`);
    }
    
    console.log('');
    console.log('✅ Population distribution complete!');
    console.log('');
    
    // Summary
    const totalAssigned = provinceScores.reduce((sum, p) => sum + p.province.population, 0);
    console.log('📊 Summary:');
    console.log(`   European/Mixed Settlers: ${totalAssigned.toLocaleString()}`);
    console.log(`   Target: ${TARGET_POPULATION.toLocaleString()}`);
    console.log(`   Indigenous Māori: ~65,000 (tracked via culture)`);
    console.log(`   Total NZ Population: ~95,000`);
    console.log(`   Provinces: ${provinceScores.length}`);

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
  console.error('Usage: node run-population-distribution.js <sessionId>');
  process.exit(1);
}

distributePopulation(sessionId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
