const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function linkDemographics() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const sessionId = new ObjectId(process.argv[2]);

    console.log('📊 Linking Demographic Slices to Provinces...');
    console.log('='.repeat(50));

    // Get all demographic slices
    const slices = await db.collection('demographicslices').find({}).toArray();
    console.log(`\nFound ${slices.length} demographic slices`);

    // Get all provinces for this session
    const provinces = await db.collection('provinces').find({ sessionId }).toArray();
    console.log(`Found ${provinces.length} provinces in session\n`);

    // Create province name to ID map
    const provinceNameMap = new Map();
    provinces.forEach(p => {
      provinceNameMap.set(p.name, p._id);
      console.log(`  • ${p.name} → ${p._id}`);
    });

    // Aggregate populations by province
    const provincePopulations = {};
    const provinceSliceCounts = {};
    
    slices.forEach(slice => {
      const provinceName = slice.locational.province;
      
      if (!provincePopulations[provinceName]) {
        provincePopulations[provinceName] = 0;
        provinceSliceCounts[provinceName] = 0;
      }
      
      provincePopulations[provinceName] += slice.population;
      provinceSliceCounts[provinceName]++;
    });

    console.log('\n📈 Province Population Aggregates:');
    console.log('='.repeat(50));

    let totalPop = 0;
    for (const [name, pop] of Object.entries(provincePopulations)) {
      const provinceId = provinceNameMap.get(name);
      const sliceCount = provinceSliceCounts[name];
      
      console.log(`\n${name}:`);
      console.log(`  Population: ${pop.toLocaleString()}`);
      console.log(`  Slices: ${sliceCount}`);
      
      if (provinceId) {
        // Update province with actual population
        await db.collection('provinces').updateOne(
          { _id: provinceId },
          { $set: { population: pop } }
        );
        console.log(`  ✓ Updated province document`);
      } else {
        console.log(`  ⚠️  No matching province in session`);
      }
      
      totalPop += pop;
    }

    console.log('\n='.repeat(50));
    console.log(`\n✅ Total Population: ${totalPop.toLocaleString()}`);
    console.log(`   Expected: 97,284`);
    console.log(`   Match: ${totalPop === 97284 ? '✓' : '✗'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Run if session ID provided
if (process.argv.length < 3) {
  console.error('❌ Usage: node link-demographics-to-provinces.js <sessionId>');
  process.exit(1);
}

linkDemographics();
