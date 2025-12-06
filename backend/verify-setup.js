const mongoose = require('mongoose');
require('dotenv').config();

async function verifySetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all players
    const players = await db.collection('players').find({}).toArray();
    console.log(`📊 Total Players: ${players.length}\n`);

    for (const player of players) {
      console.log(`👤 Player: ${player.username}`);
      console.log(`   Email: ${player.email}`);
      console.log(`   ID: ${player._id}`);
      console.log(`   Session ID: ${player.sessionId || 'NONE - THIS IS THE PROBLEM!'}`);
      
      if (player.sessionId) {
        // Get the session
        const session = await db.collection('sessions').findOne({ _id: player.sessionId });
        if (session) {
          console.log(`   Session Name: ${session.name}`);
          console.log(`   Session Active: ${session.isActive !== false}`);
          console.log(`   Players in session: ${session.players ? session.players.length : 0}`);
        } else {
          console.log(`   ⚠️  Session ${player.sessionId} not found in database!`);
        }
      }
      console.log('');
    }

    // List all sessions
    const sessions = await db.collection('sessions').find({}).toArray();
    console.log(`\n🎮 Total Sessions: ${sessions.length}\n`);
    
    for (const session of sessions) {
      console.log(`📋 Session: ${session.name || session._id}`);
      console.log(`   ID: ${session._id}`);
      console.log(`   Players: ${session.players ? session.players.length : 0}`);
      console.log(`   Active: ${session.isActive !== false}`);
      console.log(`   Created: ${session.createdAt || 'N/A'}`);
      console.log('');
    }

    // Check if any player needs session assignment
    const playersWithoutSession = players.filter(p => !p.sessionId);
    if (playersWithoutSession.length > 0) {
      console.log(`\n⚠️  ${playersWithoutSession.length} player(s) without session assignment!`);
      console.log('Run this to fix:');
      console.log('   node backend/fix-player-sessions.js');
    } else {
      console.log('\n✅ All players are assigned to sessions!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySetup();
