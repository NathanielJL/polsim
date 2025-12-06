const mongoose = require('mongoose');
require('dotenv').config();

async function setupBetaSession() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const betaSessionId = new mongoose.Types.ObjectId('69335e0db46cacf01f1bec3a');
  const player = await db.collection('players').findOne({ username: 'test' });

  // Update session name
  await db.collection('sessions').updateOne(
    { _id: betaSessionId },
    { 
      $set: { 
        name: 'Zealandia Beta Test',
        description: 'Beta testing session - 1853 Zealandia',
        isActive: true
      }
    }
  );

  // Move player to beta session
  if (player) {
    await db.collection('players').updateOne(
      { _id: player._id },
      { $set: { sessionId: betaSessionId } }
    );
    
    // Add player to session players array
    await db.collection('sessions').updateOne(
      { _id: betaSessionId },
      { $addToSet: { players: player._id } }
    );
    
    console.log('✅ Player moved to Beta Test session');
  }

  console.log('✅ Beta session ready:', betaSessionId);
  await mongoose.disconnect();
}

setupBetaSession();
