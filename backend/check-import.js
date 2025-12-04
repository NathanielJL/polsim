/**
 * Query imported map data
 * Run: node check-import.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function checkImport(sessionIdString) {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const sessionId = new mongoose.Types.ObjectId(sessionIdString);
    
    const Province = mongoose.model('Province', new mongoose.Schema({}, { strict: false }));
    const Cell = mongoose.model('Cell', new mongoose.Schema({}, { strict: false }));
    const City = mongoose.model('City', new mongoose.Schema({}, { strict: false }));
    
    const provinces = await Province.find({ sessionId }).lean();
    const cellCount = await Cell.countDocuments({ sessionId });
    const cityCount = await City.countDocuments({ sessionId });
    
    console.log('');
    console.log('📊 Import Summary');
    console.log('='.repeat(50));
    console.log(`Session ID: ${sessionIdString}`);
    console.log('');
    console.log(`✓ Provinces: ${provinces.length}`);
    console.log(`✓ Cells: ${cellCount}`);
    console.log(`✓ Cities: ${cityCount}`);
    console.log('');
    console.log('Provinces:');
    provinces.forEach(p => {
      const pop = p.population ? p.population.toLocaleString() : '0';
      const gdp = p.gdp ? `£${p.gdp.toLocaleString()}` : '£0';
      console.log(`  - ${p.name} (${p.azgaarId})`);
      console.log(`    Pop: ${pop} | GDP: ${gdp}`);
    });
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node check-import.js <sessionId>');
  process.exit(1);
}

checkImport(args[0]);
