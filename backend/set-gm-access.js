const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function setGMAccess() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    console.log('🔧 Setting GM access for user: test (test@test.com)...\n');

    const result = await db.collection('players').updateOne(
      { 
        $or: [
          { username: 'test' },
          { email: 'test@test.com' }
        ]
      },
      { $set: { isGameMaster: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ GM access granted successfully!');
      console.log('\nUser details:');
      console.log('  Username: test');
      console.log('  Email: test@test.com');
      console.log('  GM Access: ✅ TRUE');
      console.log('\nThe user can now access the GM Panel.\n');
    } else if (result.matchedCount > 0) {
      console.log('ℹ️  User already has GM access');
    } else {
      console.log('❌ User not found. Please create the account first.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

setGMAccess();
