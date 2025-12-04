/**
 * Test Script: Import Azgaar Map
 * Run this to test the complete map import pipeline
 * 
 * Usage: ts-node test-import.ts <sessionId>
 */

import { MapImportService } from './backend/src/services/MapImportService';
import { connectDB } from './backend/src/config/database';
import * as path from 'path';

async function testImport() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: ts-node test-import.ts <sessionId>');
    console.log('Example: ts-node test-import.ts 674f5e1a2b3c4d5e6f7g8h9i');
    process.exit(1);
  }
  
  const sessionId = args[0];
  const mapFilePath = path.join(__dirname, 'Aotearoa Full 2025-12-03-19-27.json');
  
  console.log('=== POLSIM Map Import Test ===');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Map File: ${mapFilePath}`);
  console.log('');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    
    // Run import
    const mapService = new MapImportService();
    await mapService.importMap(sessionId, mapFilePath);
    
    // Show summary
    console.log('');
    console.log('=== Import Summary ===');
    const summary = await mapService.getImportSummary(sessionId);
    console.log(JSON.stringify(summary, null, 2));
    
    console.log('');
    console.log('✅ Import test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    process.exit(1);
  }
}

testImport();
