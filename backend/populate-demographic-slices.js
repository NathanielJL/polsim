/**
 * Populate Database with Demographic Slices
 * Loads generated demographic slices and political positions into MongoDB
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load the data
const sliceData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'demographic-slices-with-positions.json'), 'utf8')
);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polsim';

// Define schemas (matching ReputationModels.ts)
const EconomicDemographicSchema = new mongoose.Schema({
  class: { type: String, enum: ['upper', 'middle', 'lower', 'other'], required: true },
  occupation: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  propertyOwnership: { type: String, enum: ['landowner', 'tenant', 'none'] }
}, { _id: false });

const CulturalDemographicSchema = new mongoose.Schema({
  ethnicity: { type: String, required: true },
  religion: { type: String, required: true },
  indigenous: { type: Boolean, default: false },
  mixed: { type: Boolean, default: false }
}, { _id: false });

const LocationalDemographicSchema = new mongoose.Schema({
  province: { type: String, required: true },
  settlement: { type: String, enum: ['urban', 'rural'], required: true },
  urbanCenter: { type: String }
}, { _id: false });

const SpecialInterestSchema = new mongoose.Schema({
  group: { type: String, required: true },
  salience: { type: Number, min: 0, max: 1, default: 0.5 }
}, { _id: false });

const PoliticalCubeSchema = new mongoose.Schema({
  economic: { type: Number, min: -10, max: 10, required: true },
  authority: { type: Number, min: -10, max: 10, required: true },
  social: { type: Number, min: -10, max: 10, required: true }
}, { _id: false });

// Define all 34 issue fields
const issueFields = {};
const issues = [
  'sovereignty', 'propertyRights', 'taxes', 'protectionism', 'landSales',
  'kingitanga', 'responsibleGovernment', 'centralization', 'propertySuffrage',
  'eminentDomain', 'workerRights', 'minimumWage', 'womensSuffrage', 'immigration',
  'economicIntervention', 'welfareState', 'healthcare', 'educationRights',
  'businessRegulation', 'deathPenalty', 'interventionism', 'indigenousRights',
  'environmentalRegulation', 'privatization', 'justice', 'animalRights',
  'productiveRights', 'globalism', 'privacyRights', 'policeReform',
  'waterRights', 'equity', 'universalIncome', 'gayRights', 'transRights'
];

issues.forEach(issue => {
  issueFields[issue] = { type: Number, min: -10, max: 10, default: 0 };
});

const IssuePositionsSchema = new mongoose.Schema(issueFields, { _id: false });
const IssueSalienceSchema = new mongoose.Schema(
  Object.fromEntries(issues.map(i => [i, { type: Number, min: 0, max: 1, default: 0.1 }])),
  { _id: false }
);

const PoliticalPositionSchema = new mongoose.Schema({
  cube: { type: PoliticalCubeSchema, required: true },
  issues: { type: IssuePositionsSchema, required: true },
  salience: { type: IssueSalienceSchema, required: true }
}, { _id: false });

const DemographicSliceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  economic: { type: EconomicDemographicSchema, required: true },
  cultural: { type: CulturalDemographicSchema, required: true },
  locational: { type: LocationalDemographicSchema, required: true },
  specialInterests: [SpecialInterestSchema],
  population: { type: Number, min: 0, required: true },
  canVote: { type: Boolean, default: false },
  defaultPosition: { type: PoliticalPositionSchema, required: true }
}, { timestamps: true });

DemographicSliceSchema.index({ id: 1 });
DemographicSliceSchema.index({ 'locational.province': 1 });
DemographicSliceSchema.index({ 'economic.class': 1 });
DemographicSliceSchema.index({ 'economic.occupation': 1 });
DemographicSliceSchema.index({ canVote: 1 });

const DemographicSlice = mongoose.model('DemographicSlice', DemographicSliceSchema);

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing existing demographic slices...');
    await DemographicSlice.deleteMany({});
    console.log('✅ Cleared existing data\n');

    console.log('📊 Inserting demographic slices...');
    console.log(`   Total slices to insert: ${sliceData.slices.length}`);

    // Insert in batches for better performance
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < sliceData.slices.length; i += BATCH_SIZE) {
      const batch = sliceData.slices.slice(i, i + BATCH_SIZE);
      await DemographicSlice.insertMany(batch, { ordered: false });
      inserted += batch.length;
      
      if (inserted % 500 === 0 || inserted === sliceData.slices.length) {
        console.log(`   Inserted ${inserted}/${sliceData.slices.length} slices...`);
      }
    }

    console.log('\n✅ All demographic slices inserted successfully!');

    // Verify insertion
    console.log('\n📋 Verification:');
    const totalCount = await DemographicSlice.countDocuments();
    const voterCount = await DemographicSlice.countDocuments({ canVote: true });
    const totalPop = await DemographicSlice.aggregate([
      { $group: { _id: null, total: { $sum: '$population' } } }
    ]);
    const voterPop = await DemographicSlice.aggregate([
      { $match: { canVote: true } },
      { $group: { _id: null, total: { $sum: '$population' } } }
    ]);

    console.log(`   Total slices in database: ${totalCount}`);
    console.log(`   Voting-eligible slices: ${voterCount}`);
    console.log(`   Total population: ${totalPop[0]?.total?.toLocaleString() || 0}`);
    console.log(`   Voting population: ${voterPop[0]?.total?.toLocaleString() || 0}`);

    // Sample query: Top 5 largest demographics
    console.log('\n📊 Top 5 Largest Demographics:');
    const topDemographics = await DemographicSlice.find()
      .sort({ population: -1 })
      .limit(5);

    topDemographics.forEach((demo, idx) => {
      console.log(`   ${idx + 1}. ${demo.economic.occupation} (${demo.economic.class}) in ${demo.locational.province}`);
      console.log(`      Population: ${demo.population.toLocaleString()}, Can Vote: ${demo.canVote}`);
      console.log(`      Political Cube: Econ ${demo.defaultPosition.cube.economic}, Auth ${demo.defaultPosition.cube.authority}, Social ${demo.defaultPosition.cube.social}`);
    });

    // Sample query: Voters by province
    console.log('\n🗳️  Voters by Province:');
    const votersByProvince = await DemographicSlice.aggregate([
      { $match: { canVote: true } },
      { $group: { 
        _id: '$locational.province', 
        voters: { $sum: '$population' },
        slices: { $sum: 1 }
      }},
      { $sort: { voters: -1 } }
    ]);

    votersByProvince.forEach(prov => {
      console.log(`   ${prov._id}: ${prov.voters.toLocaleString()} voters (${prov.slices} slices)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE POPULATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\nThe reputation system is now ready for use!');
    console.log('You can now:');
    console.log('  - Start campaigns targeting demographics');
    console.log('  - Create endorsements between players');
    console.log('  - Calculate policy impacts on reputation');
    console.log('  - Run voting simulations');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the population script
populateDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
