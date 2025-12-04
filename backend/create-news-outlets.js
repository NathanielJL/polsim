/**
 * Initialize 3 AI National News Outlets
 * Run this once per game session to create the baseline news infrastructure
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/polsim';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define NewsOutlet schema (must match mongoose.ts)
const NewsOutletSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["national", "provincial"], 
    default: "provincial" 
  },
  politicalStance: { type: String },
  provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  bias: { type: Number, min: -100, max: 100, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const NewsOutlet = mongoose.model('NewsOutlet', NewsOutletSchema);

// Get sessionId from command line or use first available session
async function getSessionId() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    return args[0];
  }
  
  // Try to find first session
  const Session = mongoose.model('Session', new mongoose.Schema({ name: String }));
  const session = await Session.findOne().sort({ createdAt: -1 });
  
  if (!session) {
    console.error('❌ No session found. Please create a session first or provide sessionId as argument.');
    console.log('Usage: node create-news-outlets.js <sessionId>');
    process.exit(1);
  }
  
  return session._id;
}

async function createNewsOutlets() {
  try {
    const sessionId = await getSessionId();
    console.log(`📰 Creating AI National News Outlets for session: ${sessionId}\n`);
    
    // Check if outlets already exist
    const existing = await NewsOutlet.find({ sessionId, type: 'national' });
    if (existing.length > 0) {
      console.log('⚠️  National news outlets already exist for this session:');
      existing.forEach(o => console.log(`   - ${o.name}`));
      console.log('\nDelete existing outlets or use a different sessionId.');
      process.exit(0);
    }
    
    // Define the 3 AI National Newspapers
    const outlets = [
      {
        id: 'the-zealandia-gazette',
        sessionId,
        name: 'The Zealandia Gazette',
        type: 'national',
        politicalStance: 'moderate',
        bias: 0,
        description: 'Government-aligned populist newspaper. Middle-class readership. Supports status quo and gradual reform.',
      },
      {
        id: 'the-progressive-herald',
        sessionId,
        name: 'The Progressive Herald',
        type: 'national',
        politicalStance: 'progressive',
        bias: -30, // Left-leaning
        description: 'Reformist newspaper. Advocates for bi-cultural rights, expanded suffrage, and social progress.',
      },
      {
        id: 'the-frontier-economist',
        sessionId,
        name: 'The Frontier Economist',
        type: 'national',
        politicalStance: 'conservative',
        bias: 30, // Right-leaning
        description: 'Business-focused newspaper. Frontier interests, economic expansion, laissez-faire policies.',
      },
    ];
    
    // Create outlets
    for (const outlet of outlets) {
      const created = await NewsOutlet.create(outlet);
      console.log(`✅ Created: ${created.name}`);
      console.log(`   ID: ${created.id}`);
      console.log(`   Stance: ${created.politicalStance}`);
      console.log(`   Bias: ${created.bias > 0 ? 'Right' : created.bias < 0 ? 'Left' : 'Center'}\n`);
    }
    
    console.log('✅ All AI National News Outlets created successfully!');
    console.log('\nThese outlets will auto-generate articles when GM creates events.');
    console.log('Players can create provincial newspapers and write their own articles.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating news outlets:', error);
    process.exit(1);
  }
}

createNewsOutlets();
