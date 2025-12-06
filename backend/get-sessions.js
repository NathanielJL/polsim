const mongoose = require('mongoose');
require('dotenv').config();

async function getSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const sessions = await db.collection('sessions').find({}).toArray();
    
    console.log('\n📋 Available Sessions:\n');
    sessions.forEach((session, i) => {
      console.log(`${i + 1}. Session ID: ${session._id}`);
      console.log(`   Players: ${session.players ? session.players.length : 0}`);
      console.log(`   Created: ${session.createdAt || 'N/A'}`);
      console.log('');
    });

    if (sessions.length > 0) {
      console.log('💡 To initialize data, run:');
      console.log(`   node run-population-distribution.js ${sessions[0]._id}`);
      console.log(`   node run-economic-init-expanded.js ${sessions[0]._id}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getSessions();
