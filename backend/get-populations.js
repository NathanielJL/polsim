/**
 * Get province populations
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ProvinceSchema = new mongoose.Schema({
  id: String,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  population: Number,
}, { strict: false });

async function getPopulations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const Province = mongoose.model('Province', ProvinceSchema);
    
    const sessionId = new mongoose.Types.ObjectId('6930f0aefcc517aa45d6da5d');
    const provinces = await Province.find({ sessionId })
      .select('name population')
      .sort({ population: -1 });
    
    console.log('\n=== PROVINCE POPULATIONS (European/Mixed Settlers) ===');
    console.log('(Total: 30,000 settlers | Remaining 65,000 Indigenous Māori tracked via culture)\n');
    
    let total = 0;
    provinces.forEach(p => {
      const name = p.name || 'Unknown';
      const pop = p.population || 0;
      console.log(`${name.padEnd(25)} ${pop.toLocaleString().padStart(10)}`);
      total += pop;
    });
    
    console.log(`${''.padEnd(25)} ${'-'.repeat(10)}`);
    console.log(`${'TOTAL SETTLERS'.padEnd(25)} ${total.toLocaleString().padStart(10)}`);
    console.log(`${'MĀORI (via culture)'.padEnd(25)} ${(65000).toLocaleString().padStart(10)}`);
    console.log(`${'TOTAL NZ POPULATION'.padEnd(25)} ${(total + 65000).toLocaleString().padStart(10)}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getPopulations();
