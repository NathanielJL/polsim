const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

// From Zealandia #1.txt
const TOTAL_GDP = 8971952;
const GDP_PER_CAPITA = 418;

async function distributeGDP() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const sessionId = new ObjectId(process.argv[2]);

    console.log('💰 Distributing GDP to Provinces...');
    console.log('='.repeat(60));

    const provinces = await db.collection('provinces')
      .find({ sessionId })
      .sort({ name: 1 })
      .toArray();

    const totalPopulation = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
    
    console.log(`\nTotal Population: ${totalPopulation.toLocaleString()}`);
    console.log(`Total GDP: $${TOTAL_GDP.toLocaleString()}`);
    console.log(`GDP per Capita: $${GDP_PER_CAPITA}\n`);
    console.log('='.repeat(60));

    let distributedGDP = 0;

    for (const province of provinces) {
      const population = province.population || 0;
      
      // Calculate GDP proportional to population
      const provinceGDP = Math.round((population / totalPopulation) * TOTAL_GDP);
      const perCapita = population > 0 ? Math.round(provinceGDP / population) : 0;

      console.log(`\n${province.name}:`);
      console.log(`  Population: ${population.toLocaleString()}`);
      console.log(`  GDP: $${provinceGDP.toLocaleString()}`);
      console.log(`  Per Capita: $${perCapita}`);

      // Update province with GDP
      await db.collection('provinces').updateOne(
        { _id: province._id },
        { 
          $set: { 
            gdp: provinceGDP,
            gdpPerCapita: perCapita
          } 
        }
      );

      distributedGDP += provinceGDP;
      console.log(`  ✓ Updated`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Total Distributed: $${distributedGDP.toLocaleString()}`);
    console.log(`   Target: $${TOTAL_GDP.toLocaleString()}`);
    console.log(`   Difference: $${Math.abs(distributedGDP - TOTAL_GDP).toLocaleString()}`);

    // Update session totals
    await db.collection('sessions').updateOne(
      { _id: sessionId },
      {
        $set: {
          'economy.totalGDP': distributedGDP,
          'economy.gdpPerCapita': Math.round(distributedGDP / totalPopulation)
        }
      }
    );

    console.log('\n✓ Session economy updated\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

if (process.argv.length < 3) {
  console.error('❌ Usage: node distribute-gdp-to-provinces.js <sessionId>');
  process.exit(1);
}

distributeGDP();
