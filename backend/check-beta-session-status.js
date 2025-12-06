const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function checkStatus() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const sessionId = new ObjectId('69335e0db46cacf01f1bec3a');

    console.log('📋 ZEALANDIA BETA TEST SESSION STATUS');
    console.log('='.repeat(70));

    // Session info
    const session = await db.collection('sessions').findOne({ _id: sessionId });
    console.log('\n🎮 SESSION:');
    console.log(`   Name: ${session.name}`);
    console.log(`   Turn: ${session.currentTurn}`);
    console.log(`   Players: ${session.players.length}`);
    console.log(`   Status: ${session.status}`);

    // Provinces
    const provinces = await db.collection('provinces')
      .find({ sessionId })
      .sort({ name: 1 })
      .toArray();
    
    console.log('\n🗺️  PROVINCES:');
    console.log(`   Total: ${provinces.length}`);
    
    let totalPop = 0;
    let totalGDP = 0;
    
    provinces.forEach(p => {
      totalPop += p.population || 0;
      totalGDP += p.gdp || 0;
      console.log(`   • ${p.name.padEnd(20)} Pop: ${(p.population || 0).toLocaleString().padStart(8)}  GDP: $${(p.gdp || 0).toLocaleString().padStart(11)}  Area: ${(p.totalArea || 0).toLocaleString().padStart(8)}`);
    });
    
    console.log(`   ${'TOTALS'.padEnd(20)} Pop: ${totalPop.toLocaleString().padStart(8)}  GDP: $${totalGDP.toLocaleString().padStart(11)}`);

    // Cells
    const cellCount = await db.collection('cells').countDocuments({ sessionId });
    console.log(`\n🗺️  CELLS: ${cellCount.toLocaleString()}`);

    // Cities
    const cityCount = await db.collection('cities').countDocuments({ sessionId });
    console.log(`   CITIES: ${cityCount.toLocaleString()}`);

    // Demographic Slices
    const sliceCount = await db.collection('demographicslices').countDocuments({});
    console.log(`\n👥 DEMOGRAPHIC SLICES: ${sliceCount.toLocaleString()}`);
    
    // Sample a few slices by province
    const slicesByProvince = await db.collection('demographicslices').aggregate([
      { $group: { 
        _id: '$locational.province', 
        count: { $sum: 1 },
        population: { $sum: '$population' }
      }},
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n   Slices by Province:');
    slicesByProvince.forEach(s => {
      console.log(`   • ${s._id.padEnd(20)} ${s.count.toString().padStart(4)} slices, ${s.population.toLocaleString().padStart(8)} people`);
    });

    // Players
    const player = await db.collection('players').findOne({ username: 'test' });
    console.log(`\n👤 TEST PLAYER:`);
    console.log(`   Session: ${player.currentSession}`);
    console.log(`   Cash: £${(player.cash || 0).toLocaleString()}`);
    console.log(`   Actions: ${player.actionsRemaining || 0}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ IMPORT COMPLETE - READY FOR FRONTEND TESTING\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkStatus();
