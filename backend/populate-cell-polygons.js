const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://nathanieljl:AHWjZYnV9V21hEZ7@cluster0.2fduw.mongodb.net/polsim?retryWrites=true&w=majority&appName=Cluster0';

async function populateCellPolygons() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('polsim');
    
    // Load Azgaar map data
    console.log('\nLoading Azgaar map data...');
    const mapData = JSON.parse(fs.readFileSync('./Aotearoa Full 2025-12-03-19-27.json', 'utf8'));
    const packVertices = mapData.pack.vertices;
    const packCells = mapData.pack.cells;
    
    console.log(`Loaded ${packVertices.length} vertices from Azgaar map`);
    
    // Get beta session
    const session = await db.collection('sessions').findOne({ name: 'Zealandia Beta Test' });
    if (!session) {
      console.error('Beta session not found');
      return;
    }
    
    console.log(`Found session: ${session.name} (${session._id})`);
    
    // Get all cells for this session
    const cells = await db.collection('cells').find({ sessionId: session._id }).toArray();
    console.log(`\nFound ${cells.length} cells to update`);
    
    let updated = 0;
    const bulkOps = [];
    
    for (const cell of cells) {
      const azgaarCell = packCells[cell.azgaarId];
      if (!azgaarCell || !azgaarCell.v) continue;
      
      // Resolve vertex IDs to coordinates
      const polygon = azgaarCell.v.map(vertexId => {
        const vertex = packVertices[vertexId];
        return vertex ? [vertex.p[0], vertex.p[1]] : null;
      }).filter(v => v !== null);
      
      if (polygon.length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: cell._id },
            update: { $set: { polygon } }
          }
        });
        updated++;
      }
    }
    
    if (bulkOps.length > 0) {
      await db.collection('cells').bulkWrite(bulkOps);
      console.log(`✓ Updated ${updated} cells with polygon coordinates`);
    }
    
    console.log('\nDone!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

populateCellPolygons();
