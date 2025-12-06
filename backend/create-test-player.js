const mongoose = require('mongoose');
require('dotenv').config();

// Simple Player schema for manual creation
const PlayerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  cash: { type: Number, default: 100000 },
  reputation: { type: Number, default: 0 },
  reputationByGroup: { type: Map, of: Number, default: new Map() },
  portraitUrl: { type: String },
  ideologyPoint: {
    economic: { type: Number, min: -100, max: 100, default: 0 },
    social: { type: Number, min: -100, max: 100, default: 0 },
  },
  approval: { type: Number, min: 0, max: 100, default: 50 },
  currentProvinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  office: { 
    type: String, 
    enum: ['Governor', 'General Assembly Member', 'Superintendent', 'Provincial Counsel Member', 'Judge', null],
    default: null
  },
  createdAt: { type: Date, default: Date.now },
  isGameMaster: { type: Boolean, default: false },
  actionsRemaining: { type: Number, default: 5 },
});

const Player = mongoose.model('Player', PlayerSchema);
const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }));
const Province = mongoose.model('Province', new mongoose.Schema({}, { strict: false }));

async function createTestPlayer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a session and province
    const session = await Session.findOne();
    const province = await Province.findOne();

    if (!session) {
      console.log('❌ No session found. Run game initialization first.');
      await mongoose.disconnect();
      return;
    }

    if (!province) {
      console.log('❌ No province found. Run game initialization first.');
      await mongoose.disconnect();
      return;
    }

    // Create test player
    const testPlayer = new Player({
      id: new mongoose.Types.ObjectId().toString(),
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // Dummy hash
      sessionId: session._id,
      currentProvinceId: province._id,
      cash: 100000,
      reputation: 0,
      approval: 50,
      ideologyPoint: {
        economic: 0,
        social: 0
      }
    });

    await testPlayer.save();
    console.log('✅ Test player created successfully!');
    console.log(`   Username: ${testPlayer.username}`);
    console.log(`   Email: ${testPlayer.email}`);
    console.log(`   ID: ${testPlayer.id}`);
    console.log(`   Session: ${session._id}`);
    console.log(`   Province: ${province.name || province._id}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
}

createTestPlayer();
