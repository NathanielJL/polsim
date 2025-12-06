const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Collections in database:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} documents`);
    }

    console.log('\n🔍 Detailed counts:');
    
    // Check specific collections
    const provinces = await db.collection('provinces').countDocuments();
    const sessions = await db.collection('sessions').countDocuments();
    const players = await db.collection('players').countDocuments();
    const demographicSlices = await db.collection('demographicslices').countDocuments();
    const rivers = await db.collection('rivers').countDocuments();
    const populationGroups = await db.collection('populationgroups').countDocuments();
    
    console.log(`  Provinces: ${provinces}`);
    console.log(`  Sessions: ${sessions}`);
    console.log(`  Players: ${players}`);
    console.log(`  Demographic Slices: ${demographicSlices}`);
    console.log(`  Rivers: ${rivers}`);
    console.log(`  Population Groups: ${populationGroups}`);

    // Sample one document from each collection if it exists
    if (provinces > 0) {
      const sampleProvince = await db.collection('provinces').findOne();
      console.log('\n📌 Sample Province:', sampleProvince?.name || 'N/A');
    }

    if (demographicSlices > 0) {
      const sampleSlice = await db.collection('demographicslices').findOne();
      console.log('📌 Sample Demographic Slice:', sampleSlice?.id || 'N/A');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
