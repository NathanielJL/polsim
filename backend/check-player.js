const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function checkPlayer() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    const player = await db.collection('players').findOne({ username: 'test' });

    if (player) {
      console.log('👤 Test Player Details:');
      console.log('='.repeat(50));
      console.log(`Username: ${player.username}`);
      console.log(`Email: ${player.email}`);
      console.log(`ID: ${player._id}`);
      console.log(`Session: ${player.currentSession}`);
      console.log(`Cash: £${player.cash}`);
      console.log(`Actions: ${player.actionsRemaining}`);
      console.log(`Has Password: ${player.password ? 'Yes' : 'No'}`);
      console.log(`Password Hash Length: ${player.password?.length || 0}`);
      console.log('\n✅ Player exists and should be able to login');
      console.log('\nCredentials:');
      console.log('  Username: test');
      console.log('  Password: test (if not changed)');
    } else {
      console.log('❌ No player found with username "test"');
      console.log('\nSearching for any players...');
      
      const allPlayers = await db.collection('players').find({}).toArray();
      console.log(`Found ${allPlayers.length} players:`);
      allPlayers.forEach(p => {
        console.log(`  - ${p.username} (${p.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkPlayer();
