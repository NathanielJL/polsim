const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function checkPopulations() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const sessionId = new ObjectId('69335e0db46cacf01f1bec3a');

    const provinces = await db.collection('provinces')
      .find({ sessionId })
      .sort({ name: 1 })
      .toArray();

    console.log('\n📊 Province Populations:');
    console.log('='.repeat(60));
    
    let total = 0;
    provinces.forEach(p => {
      const pop = p.population || 0;
      total += pop;
      console.log(`${p.name.padEnd(20)} ${pop.toLocaleString().padStart(10)}`);
    });
    
    console.log('='.repeat(60));
    console.log(`${'TOTAL'.padEnd(20)} ${total.toLocaleString().padStart(10)}`);
    console.log(`${'Expected'.padEnd(20)} ${'97,284'.padStart(10)}`);
    console.log(`Match: ${total === 97284 ? '✅' : '❌'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkPopulations();
