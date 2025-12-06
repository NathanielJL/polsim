const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function checkPlayerFields() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    const player = await db.collection('players').findOne({ username: 'test' });

    console.log('👤 Player Document Fields:');
    console.log('='.repeat(50));
    console.log('All fields in player document:');
    console.log(JSON.stringify(player, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkPlayerFields();
