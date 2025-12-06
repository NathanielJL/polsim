const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function fixPlayerPassword() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    console.log('🔧 Setting password for test player...\n');

    // Hash the password 'test'
    const hashedPassword = await bcrypt.hash('test', 10);

    const result = await db.collection('players').updateOne(
      { username: 'test' },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Password set successfully!');
      console.log('\nLogin credentials:');
      console.log('  Username: test');
      console.log('  Password: test');
      console.log('\nYou can now login at http://localhost:3000\n');
    } else {
      console.log('❌ Failed to update password');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixPlayerPassword();
