/**
 * Create a new game session for map import
 * Run this first to get a session ID
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function createSession() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a simple session document
    const SessionModel = mongoose.model('Session', new mongoose.Schema({
      name: String,
      gamemaster: mongoose.Schema.Types.ObjectId,
      players: [mongoose.Schema.Types.ObjectId],
      status: { type: String, default: 'active' },
      currentTurn: { type: Number, default: 1 },
      startedAt: { type: Date, default: Date.now },
      world: { type: Object, default: {} },
    }));

    const session = await SessionModel.create({
      name: 'Zealandia 1853',
      status: 'active',
      currentTurn: 1,
      startedAt: new Date(),
      world: {},
    });

    console.log('');
    console.log('✅ Session created successfully!');
    console.log('');
    console.log('📋 Session Details:');
    console.log(`   ID: ${session._id}`);
    console.log(`   Name: ${session.name}`);
    console.log(`   Status: ${session.status}`);
    console.log('');
    console.log('📝 Copy this session ID for the import:');
    console.log(`   ${session._id}`);
    console.log('');
    console.log('🎯 Next step: Run the import');
    console.log(`   node test-import.js ${session._id}`);
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSession();
