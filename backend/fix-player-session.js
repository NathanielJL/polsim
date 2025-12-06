const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function fixPlayerSession() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const sessionId = new ObjectId('69335e0db46cacf01f1bec3a');

    console.log('🔧 Fixing player session assignment...');

    const result = await db.collection('players').updateOne(
      { username: 'test' },
      { $set: { currentSession: sessionId } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Player "test" currentSession updated to beta session');
    } else {
      console.log('⚠️  No changes made (already set or player not found)');
    }

    // Verify
    const player = await db.collection('players').findOne({ username: 'test' });
    console.log(`\nPlayer session: ${player.currentSession}`);
    console.log(`Expected:       ${sessionId}`);
    console.log(`Match: ${player.currentSession?.toString() === sessionId.toString() ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixPlayerSession();
