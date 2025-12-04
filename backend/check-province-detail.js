/**
 * Check detailed province information
 * Run: node check-province-detail.js <sessionId> <provinceName>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const BIOME_NAMES = {
  1: 'Hot Desert',
  2: 'Cold Desert',
  3: 'Savanna',
  4: 'Grassland',
  5: 'Tropical Seasonal Forest',
  6: 'Temperate Deciduous Forest',
  7: 'Temperate Rainforest',
  8: 'Temperate Desert',
  9: 'Temperate Grassland',
  10: 'Taiga',
  11: 'Tundra',
  12: 'Glacier',
  13: 'Wetland',
};

async function checkProvinceDetail(sessionIdString, provinceName) {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const sessionId = new mongoose.Types.ObjectId(sessionIdString);
    
    const Province = mongoose.model('Province', new mongoose.Schema({}, { strict: false }));
    const Cell = mongoose.model('Cell', new mongoose.Schema({}, { strict: false }));
    
    const province = await Province.findOne({ sessionId, name: provinceName }).lean();
    
    if (!province) {
      console.log(`Province "${provinceName}" not found`);
      process.exit(1);
    }
    
    console.log('');
    console.log(`🏛️  ${province.name}`);
    console.log('='.repeat(50));
    console.log(`Population: ${(province.population || 0).toLocaleString()}`);
    console.log(`GDP: £${(province.gdp || 0).toLocaleString()}`);
    console.log('');
    
    // Get cells
    const cells = await Cell.find({ sessionId, provinceId: province._id }).lean();
    
    console.log(`📊 Terrain Analysis (${cells.length} cells):`);
    console.log('');
    
    // Temperature analysis
    const temps = cells.map(c => c.temperature).filter(t => t != null);
    const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    
    console.log(`🌡️  Temperature:`);
    console.log(`   Average: ${avgTemp.toFixed(1)}°C`);
    console.log(`   Range: ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C`);
    console.log('');
    
    // Biome distribution
    const biomes = {};
    cells.forEach(c => {
      const biomeName = BIOME_NAMES[c.biome] || `Unknown (${c.biome})`;
      biomes[biomeName] = (biomes[biomeName] || 0) + 1;
    });
    
    console.log(`🌍 Biome Distribution:`);
    Object.entries(biomes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([biome, count]) => {
        const pct = ((count / cells.length) * 100).toFixed(1);
        console.log(`   ${biome}: ${count} cells (${pct}%)`);
      });
    console.log('');
    
    // Height analysis
    const heights = cells.map(c => c.height);
    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const mountainCells = cells.filter(c => c.height > 60).length;
    
    console.log(`⛰️  Elevation:`);
    console.log(`   Average: ${avgHeight.toFixed(0)}m`);
    console.log(`   Mountainous cells: ${mountainCells} (${((mountainCells/cells.length)*100).toFixed(1)}%)`);
    console.log('');
    
    // Resources
    console.log(`💎 Resources:`);
    if (province.resources) {
      Object.entries(province.resources).forEach(([resource, value]) => {
        console.log(`   ${resource}: ${Math.round(value)}`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node check-province-detail.js <sessionId> <provinceName>');
  process.exit(1);
}

checkProvinceDetail(args[0], args[1]);
