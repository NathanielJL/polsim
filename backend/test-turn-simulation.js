/**
 * Test Turn Simulation
 * Simulates 12 turns of turn processing to test reputation system integration
 */

const mongoose = require('mongoose');

// Database configuration
const config = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/polsim'
};

// Define simple schemas for testing
const SessionSchema = new mongoose.Schema({}, { strict: false });
const PlayerSchema = new mongoose.Schema({}, { strict: false });
const CampaignSchema = new mongoose.Schema({}, { strict: false });
const DemographicSliceSchema = new mongoose.Schema({}, { strict: false });
const ReputationScoreSchema = new mongoose.Schema({}, { strict: false });

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema);
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
const DemographicSlice = mongoose.models.DemographicSlice || mongoose.model('DemographicSlice', DemographicSliceSchema);
const ReputationScore = mongoose.models.ReputationScore || mongoose.model('ReputationScore', ReputationScoreSchema);

async function simulateTurns() {
  try {
    console.log('🎮 Starting Turn Simulation Test\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(config.uri);
    console.log('✅ Connected to database\n');
    
    // Check if demographic slices are populated
    const sliceCount = await DemographicSlice.countDocuments();
    console.log(`📊 Demographic slices in database: ${sliceCount}`);
    
    if (sliceCount === 0) {
      console.log('⚠️  No demographic slices found! Run populate-demographic-slices.js first.');
      process.exit(1);
    }
    
    // Find or create test session
    let session = await Session.findOne({ name: 'Turn Test Session' });
    
    if (!session) {
      console.log('🎲 Creating test session...');
      session = await Session.create({
        name: 'Turn Test Session',
        gmId: 'test-gm',
        currentTurn: 0,
        turnStartTime: new Date(),
        turnDuration: 24 * 60 * 60 * 1000, // 24 hours in ms
        status: 'active',
        startDate: new Date('1852-01-01')
      });
      console.log(`✅ Created session: ${session._id}\n`);
    } else {
      console.log(`✅ Found existing session: ${session._id}`);
      console.log(`   Current turn: ${session.currentTurn}\n`);
    }
    
    // Find or create test player
    let player = await Player.findOne({ username: 'TestPlayer' });
    
    if (!player) {
      console.log('👤 Creating test player...');
      player = await Player.create({
        username: 'TestPlayer',
        email: 'test@example.com',
        passwordHash: 'test',
        sessionId: session._id,
        characterName: 'Test Character',
        money: 10000,
        actionPoints: 3
      });
      console.log(`✅ Created player: ${player._id}\n`);
    } else {
      console.log(`✅ Found existing player: ${player._id}`);
      console.log(`   Money: £${player.money}`);
      console.log(`   Action Points: ${player.actionPoints}\n`);
    }
    
    // Create test campaigns
    console.log('🎯 Creating test campaigns...\n');
    
    const demographics = await DemographicSlice.find({ canVote: true })
      .sort({ population: -1 })
      .limit(3);
    
    const campaigns = [];
    for (let i = 0; i < 3; i++) {
      const demographic = demographics[i];
      const duration = (i % 3) + 1; // 1, 2, or 3 turns
      const boost = 2 + i; // 2%, 3%, 4%
      
      const campaign = await Campaign.create({
        playerId: player._id,
        sessionId: session._id,
        targetDemographicSliceId: demographic.id,
        startTurn: session.currentTurn,
        duration: duration,
        endTurn: session.currentTurn + duration,
        boost: boost,
        cost: 100,
        apCost: 1,
        status: 'active'
      });
      
      campaigns.push(campaign);
      
      console.log(`   Campaign ${i + 1}:`);
      console.log(`   - Target: ${demographic.economic.occupation} (${demographic.locational.province})`);
      console.log(`   - Duration: ${duration} turns`);
      console.log(`   - Boost: ${boost}%`);
      console.log(`   - Ends Turn: ${campaign.endTurn}`);
      console.log();
    }
    
    // Initialize reputation scores for test player
    console.log('💯 Initializing reputation scores...');
    const allDemographics = await DemographicSlice.find({});
    let initializedCount = 0;
    
    for (const demographic of allDemographics) {
      const existingScore = await ReputationScore.findOne({
        playerId: player._id,
        demographicSliceId: demographic.id
      });
      
      if (!existingScore) {
        await ReputationScore.create({
          playerId: player._id,
          sessionId: session._id,
          demographicSliceId: demographic.id,
          approval: 50, // Start neutral
          approvalHistory: [{ turn: session.currentTurn, approval: 50 }],
          lastUpdated: new Date()
        });
        initializedCount++;
      }
    }
    
    console.log(`✅ Initialized ${initializedCount} new reputation scores\n`);
    
    // Simulate 12 turns
    console.log('⏱️  STARTING 12-TURN SIMULATION\n');
    console.log('='.repeat(80));
    console.log();
    
    // Simple turn processing - just increment turn number and process campaigns
    for (let i = 1; i <= 12; i++) {
      console.log(`\n🔄 TURN ${i} / 12`);
      console.log('-'.repeat(80));
      
      const startTime = Date.now();
      
      try {
        // Increment turn number
        session.currentTurn += 1;
        const currentTurn = session.currentTurn;
        
        // Process campaign completions
        const completingCampaigns = await Campaign.find({
          sessionId: session._id,
          endTurn: currentTurn,
          status: 'active'
        });
        
        console.log(`   Processing ${completingCampaigns.length} completing campaigns...`);
        
        for (const campaign of completingCampaigns) {
          // Apply reputation boost
          const score = await ReputationScore.findOne({
            playerId: campaign.playerId,
            demographicSliceId: campaign.targetDemographicSliceId
          });
          
          if (score) {
            const oldApproval = score.approval;
            score.approval = Math.min(100, score.approval + campaign.boost);
            
            // Add to history
            if (!score.approvalHistory) score.approvalHistory = [];
            score.approvalHistory.push({
              turn: currentTurn,
              approval: score.approval
            });
            
            await score.save();
            
            const demographic = await DemographicSlice.findOne({ id: campaign.targetDemographicSliceId });
            console.log(`     ✅ ${demographic?.economic.occupation}: ${oldApproval.toFixed(1)}% → ${score.approval.toFixed(1)}% (+${campaign.boost}%)`);
          }
          
          campaign.status = 'completed';
          await campaign.save();
        }
        
        // Apply reputation decay (drift toward 50%)
        const allScores = await ReputationScore.find({
          sessionId: session._id
        });
        
        let decayCount = 0;
        const decayRate = 0.02; // 2% per turn toward neutral
        
        for (const score of allScores) {
          const oldApproval = score.approval;
          const diff = 50 - score.approval;
          score.approval += diff * decayRate;
          
          // Add to history every turn
          if (!score.approvalHistory) score.approvalHistory = [];
          score.approvalHistory.push({
            turn: currentTurn,
            approval: score.approval
          });
          
          await score.save();
          decayCount++;
        }
        
        console.log(`   Applied reputation decay (${decayCount} scores updated)`);
        
        // Update reputation metrics every 3 turns (trim history)
        if (currentTurn % 3 === 0) {
          console.log(`   🔍 Trimming reputation history (every 3 turns)...`);
          
          const scoresWithHistory = await ReputationScore.find({
            sessionId: session._id
          });
          
          let trimmedCount = 0;
          for (const score of scoresWithHistory) {
            if (score.approvalHistory && score.approvalHistory.length > 50) {
              score.approvalHistory = score.approvalHistory.slice(-50);
              await score.save();
              trimmedCount++;
            }
          }
          
          console.log(`   Trimmed ${trimmedCount} reputation histories to 50 entries`);
        }
        
        // Save session
        await session.save();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Turn ${i} completed in ${duration}ms`);
        console.log(`   Current turn number: ${session.currentTurn}`);
        
        // Check campaign status
        const activeCampaigns = await Campaign.countDocuments({
          sessionId: session._id,
          status: 'active'
        });
        const completedCampaigns = await Campaign.countDocuments({
          sessionId: session._id,
          status: 'completed'
        });
        
        console.log(`   Active campaigns: ${activeCampaigns}`);
        console.log(`   Completed campaigns: ${completedCampaigns}`);
        
        // Check reputation scores (sample 3 random demographics)
        const sampleScores = await ReputationScore.find({
          playerId: player._id
        }).limit(3);
        
        if (sampleScores.length > 0) {
          console.log(`   Sample reputation scores:`);
          for (const score of sampleScores) {
            const demographic = await DemographicSlice.findOne({ id: score.demographicSliceId });
            if (demographic) {
              console.log(`     - ${demographic.economic.occupation}: ${score.approval.toFixed(1)}%`);
            }
          }
        }
        
        // Every 3 turns, show metrics update
        if (session.currentTurn % 3 === 0) {
          console.log(`   🔍 Reputation metrics updated (every 3 turns)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing turn ${i}:`, error.message);
        if (error.stack) {
          console.error(error.stack);
        }
        break;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SIMULATION COMPLETE - FINAL STATISTICS\n');
    
    // Final statistics
    session = await Session.findById(session._id);
    console.log(`Final turn number: ${session.currentTurn}`);
    
    const totalCampaigns = await Campaign.countDocuments({ sessionId: session._id });
    const completedCampaigns = await Campaign.countDocuments({ 
      sessionId: session._id,
      status: 'completed' 
    });
    const activeCampaigns = await Campaign.countDocuments({ 
      sessionId: session._id,
      status: 'active' 
    });
    
    console.log(`\nCampaigns:`);
    console.log(`  Total: ${totalCampaigns}`);
    console.log(`  Completed: ${completedCampaigns}`);
    console.log(`  Active: ${activeCampaigns}`);
    
    // Show final reputation scores
    console.log(`\nReputation Scores (Top 10 by approval):`);
    const topScores = await ReputationScore.find({
      playerId: player._id
    }).sort({ approval: -1 }).limit(10);
    
    for (const score of topScores) {
      const demographic = await DemographicSlice.findOne({ id: score.demographicSliceId });
      if (demographic) {
        const historyLength = score.approvalHistory?.length || 0;
        console.log(`  ${demographic.economic.occupation} (${demographic.locational.province}): ${score.approval.toFixed(1)}% (${historyLength} history entries)`);
      }
    }
    
    console.log(`\nReputation Scores (Bottom 10 by approval):`);
    const bottomScores = await ReputationScore.find({
      playerId: player._id
    }).sort({ approval: 1 }).limit(10);
    
    for (const score of bottomScores) {
      const demographic = await DemographicSlice.findOne({ id: score.demographicSliceId });
      if (demographic) {
        const historyLength = score.approvalHistory?.length || 0;
        console.log(`  ${demographic.economic.occupation} (${demographic.locational.province}): ${score.approval.toFixed(1)}% (${historyLength} history entries)`);
      }
    }
    
    // Check if any campaigns completed
    console.log(`\nCompleted Campaigns:`);
    const completedCampaignsList = await Campaign.find({
      sessionId: session._id,
      status: 'completed'
    });
    
    for (const campaign of completedCampaignsList) {
      const demographic = await DemographicSlice.findOne({ id: campaign.targetDemographicSliceId });
      if (demographic) {
        console.log(`  ${demographic.economic.occupation} (${demographic.locational.province})`);
        console.log(`    - Boost: ${campaign.boost}%`);
        console.log(`    - Duration: ${campaign.duration} turns`);
        console.log(`    - Ended Turn: ${campaign.endTurn}`);
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from database');
  }
}

// Run simulation
simulateTurns();
