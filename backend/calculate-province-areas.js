const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'polsim';

async function calculateAreas() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const sessionId = new ObjectId('69335e0db46cacf01f1bec3a');

    console.log('📐 Calculating Province Areas from Cells...');
    console.log('='.repeat(60));

    // Get all provinces
    const provinces = await db.collection('provinces')
      .find({ sessionId })
      .toArray();

    let totalArea = 0;

    for (const province of provinces) {
      // Sum up all cell areas for this province
      const result = await db.collection('cells').aggregate([
        { $match: { provinceId: province._id } },
        { $group: { _id: null, totalArea: { $sum: '$area' } } }
      ]).toArray();

      const provinceArea = result[0]?.totalArea || 0;
      totalArea += provinceArea;

      // Update province
      await db.collection('provinces').updateOne(
        { _id: province._id },
        { $set: { totalArea: provinceArea } }
      );

      console.log(`${province.name.padEnd(20)} ${provinceArea.toLocaleString().padStart(10)} units²`);
    }

    console.log('='.repeat(60));
    console.log(`${'TOTAL'.padEnd(20)} ${totalArea.toLocaleString().padStart(10)} units²\n`);

    console.log('✅ Province areas calculated');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

calculateAreas();
