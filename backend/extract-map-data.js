/**
 * Extract and prepare Azgaar data for POLSIM import
 * This pre-processes the huge Azgaar file into a clean format
 * Run: node extract-map-data.js
 */

const fs = require('fs');
const path = require('path');

console.log('📖 Reading Azgaar map file...');
const mapFilePath = path.join(__dirname, '..', 'Aotearoa Full 2025-12-03-19-27.json');
const data = JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));

console.log('🔍 Extracting relevant data...');

// Extract provinces (excluding Queensland = 113)
const provinces = [];
for (const province of data.pack.provinces) {
  if (province.removed || province.i === 0 || province.i === 113) continue;
  
  provinces.push({
    id: province.i,
    name: province.name,
    color: province.color,
    centerCoords: province.pole,
    area: province.area,
    capitalBurgId: province.burg || null,
  });
}

// Extract cells (excluding Queensland cells)
const cells = [];
for (const cell of data.pack.cells) {
  if (!cell.province || cell.province === 0 || cell.province === 113) continue;
  
  cells.push({
    id: cell.i,
    vertices: cell.v || [],
    connections: cell.c || [],
    position: cell.p,
    height: cell.h,
    area: cell.area,
    biome: cell.biome,
    provinceId: cell.province,
    cultureId: cell.culture,
    religionId: cell.religion,
    hasRiver: cell.r > 0,
  });
}

// Extract cities
const cities = [];
for (const burg of data.pack.burgs) {
  if (!burg || burg.i === 0 || !burg.name || burg.province === 113) continue;
  
  cities.push({
    id: burg.i,
    name: burg.name,
    position: [burg.x, burg.y],
    cellId: burg.cell,
    provinceId: burg.province,
  });
}

// Extract cultures
const cultures = [];
for (const culture of data.pack.cultures) {
  if (!culture || culture.i === 0) continue;
  
  cultures.push({
    id: culture.i,
    name: culture.name,
    code: culture.code,
  });
}

// Extract religions
const religions = [];
for (const religion of data.pack.religions) {
  if (!religion || religion.i === 0) continue;
  
  religions.push({
    id: religion.i,
    name: religion.name,
    code: religion.code,
    type: religion.type || religion.form || 'Unknown',
  });
}

// Extract rivers
const rivers = [];
if (data.pack.rivers) {
  for (const river of data.pack.rivers) {
    if (!river || river.i === 0) continue;
    
    rivers.push({
      id: river.i,
      name: river.name || `River ${river.i}`,
      source: river.source,
      mouth: river.mouth,
      cells: river.cells || [],
    });
  }
}

// Create clean export
const exportData = {
  metadata: {
    mapName: data.info.mapName,
    width: data.info.width,
    height: data.info.height,
    exportDate: data.info.exportedAt,
  },
  provinces,
  cells,
  cities,
  cultures,
  religions,
  rivers,
};

// Save to file
const outputPath = path.join(__dirname, 'map-data.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log('');
console.log('✅ Data extracted successfully!');
console.log('');
console.log('📊 Summary:');
console.log(`   Provinces: ${provinces.length}`);
console.log(`   Cells: ${cells.length}`);
console.log(`   Cities: ${cities.length}`);
console.log(`   Cultures: ${cultures.length}`);
console.log(`   Religions: ${religions.length}`);
console.log(`   Rivers: ${rivers.length}`);
console.log('');
console.log(`💾 Saved to: ${outputPath}`);
console.log('');
console.log('🎯 Now run: node import-map.js <sessionId>');
