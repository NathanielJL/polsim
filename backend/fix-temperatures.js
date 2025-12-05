/**
 * Fix Temperature Data for Realistic New Zealand Climate
 * 
 * Real NZ Climate:
 * - North Island: 15-20°C average (subtropical to temperate)
 * - South Island: 10-15°C average (temperate)
 * - Alpine areas: Down to -10°C in winter
 * - Coastal areas: Moderated by ocean (mild)
 * 
 * Run: node fix-temperatures.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Province temperature profiles (based on real NZ climate)
const PROVINCE_TEMPS = {
  'New Caledonia': { base: 20, range: 4 },      // Subtropical north (15-24°C)
  'Tasminata': { base: 17, range: 5 },          // North Island temperate (12-22°C)
  'Vulteralia': { base: 16, range: 5 },         // North Island temperate (11-21°C)
  'New Zealand': { base: 15, range: 6 },        // Central (9-21°C)
  'Cooksland': { base: 14, range: 6 },          // South Island north (8-20°C)
  'Te Moana-a-Toir': { base: 13, range: 7 },    // South Island (6-20°C)
  'Southland': { base: 12, range: 8 },          // Far south (4-20°C, alpine down to -10°C)
};

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
}, { timestamps: true });

async function fixTemperatures(sessionIdString) {
  console.log('🌡️  Fixing Temperature Data for Realistic NZ Climate');
  console.log('='.repeat(50));
  console.log(`Session ID: ${sessionIdString}`);
  console.log('');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    const sessionId = new mongoose.Types.ObjectId(sessionIdString);
    const CellModel = mongoose.model('Cell', CellSchema);
    const ProvinceModel = mongoose.model('Province', ProvinceSchema);

    const provinces = await ProvinceModel.find({ 
      sessionId,
      name: { $ne: 'undefined', $exists: true }
    });

    for (const province of provinces) {
      console.log(`🏛️  ${province.name}`);
      
      const tempProfile = PROVINCE_TEMPS[province.name];
      if (!tempProfile) {
        console.log(`   ⚠️  No temperature profile defined, skipping`);
        continue;
      }

      const cells = await CellModel.find({ 
        sessionId,
        provinceId: province._id 
      });

      console.log(`   Processing ${cells.length} cells...`);
      
      const bulkOps = [];
      
      for (const cell of cells) {
        // Base temperature for province
        let temp = tempProfile.base;
        
        // Elevation adjustment (realistic lapse rate: -0.65°C per 100m)
        // But Azgaar "height" is on 0-100 scale, approximate to 0-3000m
        const estimatedMeters = cell.height * 30; // 100 height = 3000m
        const elevationPenalty = (estimatedMeters / 100) * 0.65;
        temp -= elevationPenalty;
        
        // Coastal modifier (ocean moderates temperature)
        const isCoastal = cell.height < 20 && cell.connections && cell.connections.length > 0;
        if (isCoastal) {
          temp += 2; // Warmer due to ocean influence
        }
        
        // Add some natural variation
        const variation = (Math.random() - 0.5) * tempProfile.range;
        temp += variation;
        
        // Ensure alpine areas can still be cold
        if (cell.height > 70) {
          temp = Math.min(temp, 5); // High mountains max 5°C
        }
        if (cell.height > 85) {
          temp = Math.min(temp, -5); // Very high peaks below freezing
        }
        
        bulkOps.push({
          updateOne: {
            filter: { _id: cell._id },
            update: { $set: { temperature: Math.round(temp * 10) / 10 } }
          }
        });
      }
      
      if (bulkOps.length > 0) {
        await CellModel.bulkWrite(bulkOps);
      }
      
      // Calculate new average
      const updatedCells = await CellModel.find({ 
        sessionId,
        provinceId: province._id 
      });
      
      const temps = updatedCells.map(c => c.temperature).filter(t => t != null);
      const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      console.log(`   ✓ Average: ${avgTemp.toFixed(1)}°C (range: ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C)`);
    }

    console.log('');
    console.log('✅ Temperature fix complete!');
    console.log('');
    console.log('🌍 Climate Summary:');
    console.log('   North provinces: Subtropical/Temperate (15-20°C)');
    console.log('   South provinces: Temperate/Cool (10-15°C)');
    console.log('   Alpine areas: Cold (-10°C to 5°C)');
    console.log('   Coastal areas: Moderated by ocean (+2°C bonus)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: node fix-temperatures.js <sessionId>');
  process.exit(1);
}

fixTemperatures(sessionId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
