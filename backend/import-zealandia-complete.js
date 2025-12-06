/**
 * Complete Zealandia Import
 * - Map data from Aotearoa JSON (provinces, cells, cities geometry ONLY)
 * - All stats from Zealandia #1.txt
 * - Uses existing demographic slices
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Province stats from Zealandia #1.txt
const PROVINCE_DATA = {
  'Tasminata': {
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Porttown. One Fort/Port/Town. English Anglican. No Mixing.',
    crownLand: 'majority',
    mixing: false,
    religion: 'Anglican',
    culture: 'British'
  },
  'New Caledonia': {
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Manufacturing Commune town. Scottish Presbyterian. No Mixing.',
    crownLand: 'majority',
    mixing: false,
    religion: 'Presbyterian',
    culture: 'Scottish'
  },
  'New Zealand': {
    description: 'Some Crown-Owned Land. Congregations of Maori Tribes. One City. Three Towns. English Methodists Missionaries. Trails. No Mixing.',
    crownLand: 'some',
    mixing: false,
    religion: 'Methodist',
    culture: 'British'
  },
  'Vulteralia': {
    description: 'Little Crown-Owned Land. Congregation of Maori Tribes. European-Indigenous Mixes. Spanish & French Roman Catholics. One port city. Two Farming Towns. Two Porttowns. One Mining Town.',
    crownLand: 'little',
    mixing: true,
    religion: 'Roman Catholic',
    culture: 'Spanish/French'
  },
  'Cooksland': {
    description: 'Half Crown-Owned Land. Maori Tribes to East. One City. One MarketTown. English Anglicanism. Dutch Catholicism, Protestantism, Atheism. No Mixing.',
    crownLand: 'half',
    mixing: false,
    religion: 'Anglican/Catholic/Protestant',
    culture: 'British/Dutch'
  },
  'Southland': {
    description: 'No Crown-Owned Land. Majority Maori Tribes. English Methodist Missionaries. One FarmTown. No Mixing. The Frontier.',
    crownLand: 'none',
    mixing: false,
    religion: 'Methodist',
    culture: 'Māori'
  },
  'Te Moana-a-Toir': {
    description: 'No Crown-Owned Land. Majority Maori Tribes. Pockets of English Settlement. The Frontier. No Mixing.',
    crownLand: 'none',
    mixing: false,
    religion: 'Traditional Māori',
    culture: 'Māori'
  }
};

// Overall stats from Zealandia #1.txt
const TOTAL_STATS = {
  population: 97284,
  indigenous: 75820,
  europeanSettler: 20600,
  europeanIndigenous: 863,
  totalGDP: 8971952,
  gdpPerCapita: 418,
  federalDebt: 0,
  provincialDebt: 0,
  numProvinces: 7
};

async function importZealandia(sessionId) {
  console.log('🗺️  COMPLETE ZEALANDIA IMPORT');
  console.log('=====================================\n');
  console.log(`Session: ${sessionId}\n`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Load Aotearoa JSON for map geometry only
    console.log('📖 Loading Aotearoa map data...');
    const aotearoaPath = path.join(__dirname, '..', 'Aotearoa Full 2025-12-03-19-27.json');
    const aotearoaData = JSON.parse(fs.readFileSync(aotearoaPath, 'utf8'));
    console.log('   ✓ Map loaded\n');

    // Get session ObjectId
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);

    // Clear existing data
    console.log('🧹 Clearing existing map data...');
    await db.collection('provinces').deleteMany({ sessionId: sessionObjId });
    await db.collection('cells').deleteMany({ sessionId: sessionObjId });
    await db.collection('cities').deleteMany({ sessionId: sessionObjId });
    console.log('   ✓ Cleared\n');

    // Import provinces with Zealandia #1 stats
    console.log('📍 Importing provinces...');
    const provinceMap = new Map(); // azgaarId -> mongoId
    
    const pack = aotearoaData.pack;
    const provinces = pack.provinces || []; // Use provinces, not states
    
    let provinceCount = 0;
    for (const prov of provinces) {
      if (!prov.name || prov.removed) continue;
      
      const provData = PROVINCE_DATA[prov.name];
      if (!provData) {
        console.log(`   ⚠️  Skipping unknown province: ${prov.name}`);
        continue;
      }

      const province = {
        id: new mongoose.Types.ObjectId().toString(),
        sessionId: sessionObjId,
        name: prov.name,
        azgaarId: prov.i,
        color: prov.color || '#cccccc',
        centerCoords: prov.pole || [0, 0],
        area: 0, // Will calculate from cells
        population: 0, // Will set from demographic slices
        gdp: 0, // Will calculate
        description: provData.description,
        crownLand: provData.crownLand,
        mixing: provData.mixing,
        religion: provData.religion,
        culture: provData.culture,
        resources: {
          forestry: { timber: 0, flax: 0, hemp: 0 },
          agriculture: { grain: 0, vegetables: 0, fruit: 0 },
          livestock: { wool: 0, leather: 0, meat: 0 },
          marine: { fish: 0, whaling: 0, sealing: 0, shellfish: 0, pearls: 0 },
          miningPrecious: { gold: 0, silver: 0 },
          miningIndustrial: { coal: 0, iron: 0, copper: 0, tin: 0, zinc: 0 },
          miningSpecialty: { sulfur: 0, saltpeter: 0, graphite: 0 },
          quarrying: { stone: 0, marble: 0, clay: 0, kaolin: 0 },
          special: { guano: 0, ice: 0 }
        },
        riverAccessBonus: 0,
        defaultIdeology: { economic: 0, social: 0, personal: 0 },
        culturalComposition: [],
        religiousComposition: [],
        createdAt: new Date()
      };

      const result = await db.collection('provinces').insertOne(province);
      provinceMap.set(prov.i, result.insertedId);
      provinceCount++;
      console.log(`   ✓ ${prov.name}`);
    }
    console.log(`\n   Total: ${provinceCount} provinces\n`);

    // Import cells (geometry only, NO populations)
    console.log('🗺️  Importing cells...');
    const cells = pack.cells;
    const cellsToImport = [];
    
    // Cells are stored as object with numeric string keys
    const cellKeys = Object.keys(cells).filter(key => !isNaN(key));
    
    for (const key of cellKeys) {
      const cell = cells[key];
      const provinceAzgaarId = cell.province;
      if (!provinceAzgaarId) continue;

      const provinceMongo = provinceMap.get(provinceAzgaarId);
      if (!provinceMongo) continue;

      cellsToImport.push({
        azgaarId: cell.i,
        sessionId: sessionObjId,
        vertices: cell.v || [],
        position: cell.p || [0, 0],
        height: cell.h || 0,
        temperature: cell.t || 0,
        area: cell.area || 0,
        biome: cell.biome || 0,
        provinceId: provinceMongo,
        cultureId: cell.culture || 0,
        religionId: cell.religion || 0,
        hasRiver: cell.r > 0,
        // NO population - will come from demographic slices
      });
    }

    if (cellsToImport.length > 0) {
      await db.collection('cells').insertMany(cellsToImport);
      console.log(`   ✓ ${cellsToImport.length} cells imported\n`);
    }

    // Import cities (geometry only, NO populations)
    console.log('🏙️  Importing cities...');
    const burgs = pack.burgs || [];
    const citiesToImport = [];

    for (const burg of burgs) {
      if (!burg.name || burg.removed) continue;
      
      const provinceAzgaarId = burg.state;
      const provinceMongo = provinceMap.get(provinceAzgaarId);
      if (!provinceMongo) continue;

      const cellAzgaarId = burg.cell;
      const cell = await db.collection('cells').findOne({ 
        azgaarId: cellAzgaarId,
        sessionId: sessionObjId 
      });

      citiesToImport.push({
        azgaarId: burg.i,
        sessionId: sessionObjId,
        name: burg.name,
        position: [burg.x || 0, burg.y || 0],
        cellId: cell ? cell._id : null,
        provinceId: provinceMongo,
        // NO population - cities are just markers
        isCapital: burg.capital === 1,
        economicType: burg.type || 'town',
        createdAt: new Date()
      });
    }

    if (citiesToImport.length > 0) {
      await db.collection('cities').insertMany(citiesToImport);
      console.log(`   ✓ ${citiesToImport.length} cities imported\n`);
    }

    // Calculate province areas and update
    console.log('📊 Calculating province areas...');
    for (const [azgaarId, mongoId] of provinceMap.entries()) {
      const provinceCells = await db.collection('cells').find({
        provinceId: mongoId,
        sessionId: sessionObjId
      }).toArray();

      const totalArea = provinceCells.reduce((sum, cell) => sum + (cell.area || 0), 0);
      
      await db.collection('provinces').updateOne(
        { _id: mongoId },
        { $set: { area: totalArea } }
      );
    }
    console.log('   ✓ Areas calculated\n');

    // Update session with world data
    console.log('🎮 Updating session...');
    await db.collection('sessions').updateOne(
      { _id: sessionObjId },
      {
        $set: {
          'world.provinces': Array.from(provinceMap.values()),
          'world.numProvinces': provinceCount,
          'world.totalPopulation': TOTAL_STATS.population,
          'world.totalGDP': TOTAL_STATS.totalGDP,
          updatedAt: new Date()
        }
      }
    );
    console.log('   ✓ Session updated\n');

    console.log('=====================================');
    console.log('✅ IMPORT COMPLETE!\n');
    console.log('Summary:');
    console.log(`  • ${provinceCount} provinces`);
    console.log(`  • ${cellsToImport.length} cells`);
    console.log(`  • ${citiesToImport.length} cities`);
    console.log(`  • Total Population: ${TOTAL_STATS.population.toLocaleString()}`);
    console.log(`  • Total GDP: ${TOTAL_STATS.totalGDP.toLocaleString()}`);
    console.log(`  • GDP per capita: ${TOTAL_STATS.gdpPerCapita}`);
    console.log('\n⚠️  Next steps:');
    console.log('  1. Population data comes from existing demographic slices');
    console.log('  2. Run economy initialization for resources/GDP per province');
    console.log('  3. Frontend will now show correct Zealandia data!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get session ID from command line
const sessionId = process.argv[2];
if (!sessionId) {
  console.log('Usage: node import-zealandia-complete.js <sessionId>');
  console.log('\nTo get session ID, run: node get-sessions.js');
  process.exit(1);
}

importZealandia(sessionId);
