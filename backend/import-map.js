/**
 * Test Script: Import Azgaar Map
 * Simplified version for quick testing
 * Run from backend folder: node import-map.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Simple schemas
const CellSchema = new mongoose.Schema({
  azgaarId: Number,
  sessionId: mongoose.Schema.Types.ObjectId,
  vertices: [Number],
  connections: [Number],
  position: [Number],
  height: Number,
  temperature: Number,
  area: Number,
  biome: Number,
  provinceId: mongoose.Schema.Types.ObjectId,
  cultureId: Number,
  religionId: Number,
  hasRiver: Boolean,
  habitability: Number,
}, { timestamps: true });

const ProvinceSchema = new mongoose.Schema({
  id: String,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  azgaarId: Number,
  color: String,
  centerCoords: [Number],
  area: Number,
  population: Number,
  resources: {
    timber: Number,
    agriculture: Number,
    fishing: Number,
    whaling: Number,
    livestock: Number,
    mining: Number,
  },
  gdp: Number,
  riverAccessBonus: Number,
}, { timestamps: true });

const CitySchema = new mongoose.Schema({
  azgaarId: Number,
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  position: [Number],
  cellId: mongoose.Schema.Types.ObjectId,
  provinceId: mongoose.Schema.Types.ObjectId,
  population: Number,
  isCapital: Boolean,
  economicType: String,
}, { timestamps: true });

async function importMap(sessionIdString) {
  const mapFilePath = path.join(__dirname, 'map-data.json');
  
  console.log('🗺️  Starting map import...');
  console.log(`   Session ID: ${sessionIdString}`);
  console.log(`   Data File: ${mapFilePath}`);
  console.log('');

  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    // Convert session ID to ObjectId
    const sessionId = new mongoose.Types.ObjectId(sessionIdString);

    const CellModel = mongoose.model('Cell', CellSchema);
    const ProvinceModel = mongoose.model('Province', ProvinceSchema);
    const CityModel = mongoose.model('City', CitySchema);

    // Clean up any existing data for this session
    console.log('🧹 Cleaning up existing data for this session...');
    await ProvinceModel.deleteMany({ sessionId });
    await CellModel.deleteMany({ sessionId });
    await CityModel.deleteMany({ sessionId });
    console.log('   ✓ Cleanup complete');

    // Parse map file
    console.log('📖 Loading pre-processed map data...');
    const data = JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));
    console.log(`   ✓ Map: ${data.metadata.mapName}`);
    console.log(`   ✓ Dimensions: ${data.metadata.width}x${data.metadata.height}`);

    // Import provinces
    console.log('');
    console.log('🏛️  Importing provinces...');
    const provinceIdMap = new Map();
    let provinceCount = 0;

    for (const province of data.provinces) {
      const doc = await ProvinceModel.create({
        id: `province-${province.id}`,
        sessionId,
        name: province.name,
        azgaarId: province.id,
        color: province.color,
        centerCoords: province.centerCoords,
        area: province.area,
        population: 0,
        gdp: 0,
      });

      provinceIdMap.set(province.id, doc._id);
      provinceCount++;
      console.log(`   ✓ ${province.name}`);
    }

    console.log(`   Total: ${provinceCount} provinces`);

    // Import all cells
    console.log('');
    console.log('🗺️  Importing terrain cells...');
    let cellCount = 0;
    const batchSize = 500;
    let batch = [];

    for (const cell of data.cells) {
      batch.push({
        azgaarId: cell.id,
        sessionId,
        vertices: cell.vertices,
        connections: cell.connections,
        position: cell.position,
        height: cell.height,
        temperature: 14 - (cell.height * 0.6),
        area: cell.area,
        biome: cell.biome,
        provinceId: provinceIdMap.get(cell.provinceId),
        cultureId: cell.cultureId,
        religionId: cell.religionId,
        hasRiver: cell.hasRiver,
        habitability: 0.5,
      });

      cellCount++;

      // Insert in batches
      if (batch.length >= batchSize) {
        await CellModel.insertMany(batch);
        batch = [];
        process.stdout.write(`\r   ✓ ${cellCount} cells imported...`);
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await CellModel.insertMany(batch);
    }
    console.log(`\r   ✓ Imported ${cellCount} cells          `);

    // Import cities
    console.log('');
    console.log('🏙️  Importing cities...');
    let cityCount = 0;
    const cityBatch = [];

    for (const city of data.cities) {
      cityBatch.push({
        azgaarId: city.id,
        sessionId,
        name: city.name,
        position: city.position,
        provinceId: provinceIdMap.get(city.provinceId),
        population: 0,
        isCapital: false,
      });
      
      if (cityBatch.length >= 50) {
        await CityModel.insertMany(cityBatch);
        cityCount += cityBatch.length;
        cityBatch.length = 0;
        process.stdout.write(`\r   ✓ ${cityCount} cities imported...`);
      }
    }
    
    // Insert remaining
    if (cityBatch.length > 0) {
      await CityModel.insertMany(cityBatch);
      cityCount += cityBatch.length;
    }

    console.log(`\r   ✓ Imported ${cityCount} cities          `);

    console.log('');
    console.log('✅ Import completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Provinces: ${provinceCount}`);
    console.log(`   Cells: ${cellCount}`);
    console.log(`   Cities: ${cityCount}`);
    console.log('');
    console.log('🎯 Map is ready for gameplay!');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node import-map.js <sessionId>');
  console.log('Example: node import-map.js 6930f0aefcc517aa45d6da5d');
  process.exit(1);
}

importMap(args[0]);
