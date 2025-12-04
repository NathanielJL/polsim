/**
 * Test Script: Import Azgaar Map
 * Simplified JavaScript version (no TypeScript compilation needed)
 * 
 * Usage: node test-import-simple.js <sessionId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

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

async function importMap(sessionId) {
  const mapFilePath = path.join(__dirname, 'Aotearoa Full 2025-12-03-19-27.json');
  
  console.log('🗺️  Starting map import...');
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Map File: ${mapFilePath}`);
  console.log('');

  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const CellModel = mongoose.model('Cell', CellSchema);
    const ProvinceModel = mongoose.model('Province', ProvinceSchema);
    const CityModel = mongoose.model('City', CitySchema);

    // Parse map file
    console.log('📖 Parsing map file...');
    const data = JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));
    console.log(`   ✓ Map: ${data.info.mapName}`);
    console.log(`   ✓ Dimensions: ${data.info.width}x${data.info.height}`);

    // Import provinces (excluding Queensland = 113)
    console.log('');
    console.log('🏛️  Importing provinces...');
    const provinceIdMap = new Map();
    let provinceCount = 0;

    for (const province of data.pack.provinces) {
      if (province.removed || province.i === 0 || province.i === 113) continue;

      const doc = await ProvinceModel.create({
        id: `province-${province.i}`,
        sessionId,
        name: province.name,
        azgaarId: province.i,
        color: province.color,
        centerCoords: province.pole,
        area: province.area,
        population: 0,
        gdp: 0,
      });

      provinceIdMap.set(province.i, doc._id);
      provinceCount++;
      console.log(`   ✓ ${province.name}`);
    }

    console.log(`   Total: ${provinceCount} provinces`);

    // Import cells (sample - just import first 100 for quick test)
    console.log('');
    console.log('🗺️  Importing cells (sample)...');
    let cellCount = 0;
    const cellsToImport = data.pack.cells.slice(0, 100);

    for (const cell of cellsToImport) {
      if (!cell.province || cell.province === 0 || cell.province === 113) continue;

      await CellModel.create({
        azgaarId: cell.i,
        sessionId,
        vertices: cell.v || [],
        connections: cell.c || [],
        position: cell.p,
        height: cell.h,
        temperature: 14 - (cell.h * 0.6),
        area: cell.area,
        biome: cell.biome,
        provinceId: provinceIdMap.get(cell.province),
        cultureId: cell.culture,
        religionId: cell.religion,
        hasRiver: cell.r > 0,
        habitability: 0.5,
      });

      cellCount++;
    }

    console.log(`   ✓ Imported ${cellCount} cells (sample)`);

    console.log('');
    console.log('✅ Import test completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Provinces: ${provinceCount}`);
    console.log(`   Cells: ${cellCount} (sample)`);
    console.log('');
    console.log('🎯 To import full data, use the complete MapImportService');

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
  console.log('Usage: node test-import-simple.js <sessionId>');
  console.log('Example: node test-import-simple.js 674f5e1a2b3c4d5e6f7g8h9i');
  process.exit(1);
}

importMap(args[0]);
