/**
 * Export Corrected Province Data with Accurate Demographics
 * Uses corrected population numbers:
 * - Total: 97,284
 * - Indigenous: 75,820 (13:10 M:F)
 * - European: 20,600 (70:30 M:F)
 * - European-Indigenous Mixed: 863 (21:20 M:F)
 * - GDP per capita: £418
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Corrected totals
const TOTAL_POPULATION = 97284;
const INDIGENOUS_POPULATION = 75820;
const EUROPEAN_POPULATION = 20600;
const MIXED_POPULATION = 863;
const ECONOMIC_POPULATION = EUROPEAN_POPULATION + MIXED_POPULATION; // 21,463
const GDP_PER_CAPITA = 418;
const TOTAL_GDP = ECONOMIC_POPULATION * GDP_PER_CAPITA; // £8,971,952

// Gender ratios
const INDIGENOUS_MALE_RATIO = 13 / 23; // 56.5%
const INDIGENOUS_FEMALE_RATIO = 10 / 23; // 43.5%
const EUROPEAN_MALE_RATIO = 0.70;
const EUROPEAN_FEMALE_RATIO = 0.30;
const MIXED_MALE_RATIO = 21 / 41; // 51.2%
const MIXED_FEMALE_RATIO = 20 / 41; // 48.8%

const ProvinceSchema = new mongoose.Schema({
  sessionId: mongoose.Schema.Types.ObjectId,
  name: String,
  azgaarId: Number,
  capital: String,
  population: Number,
  area: Number,
  gdp: Number,
  unemployment: Number,
  averageTemperature: Number,
  developmentLevel: Number,
  debt: Number,
  culturalMakeup: Object,
  resources: Object,
  riverAccessBonus: Number,
}, { strict: false });

async function exportCorrectedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const Province = mongoose.model('Province', ProvinceSchema);
    
    const Session = mongoose.model('Session', new mongoose.Schema({
      name: String,
      createdAt: Date
    }));
    
    const session = await Session.findOne().sort({ createdAt: -1 });
    
    if (!session) {
      console.error('❌ No session found');
      process.exit(1);
    }

    console.log(`📊 Session: ${session.name} (${session._id})`);
    console.log('='.repeat(80));
    console.log('');

    const provinces = await Province.find({ 
      sessionId: session._id,
      name: { $ne: 'undefined', $exists: true }
    }).lean();

    if (provinces.length === 0) {
      console.log('⚠️  No provinces found');
      process.exit(0);
    }

    // Calculate correction factor from database to actual numbers
    const dbEconomicPop = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
    const correctionFactor = ECONOMIC_POPULATION / dbEconomicPop;

    console.log('📈 OVERALL STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Grand Total Population: ${TOTAL_POPULATION.toLocaleString()}`);
    console.log(`Indigenous Population: ${INDIGENOUS_POPULATION.toLocaleString()} (77.9%)`);
    console.log(`  Male:Female Ratio: 13:10`);
    console.log(`  Males: ${Math.round(INDIGENOUS_POPULATION * INDIGENOUS_MALE_RATIO).toLocaleString()}`);
    console.log(`  Females: ${Math.round(INDIGENOUS_POPULATION * INDIGENOUS_FEMALE_RATIO).toLocaleString()}`);
    console.log(`European Settler Population: ${EUROPEAN_POPULATION.toLocaleString()} (21.2%)`);
    console.log(`  Male:Female Ratio: 70:30`);
    console.log(`  Males: ${Math.round(EUROPEAN_POPULATION * EUROPEAN_MALE_RATIO).toLocaleString()}`);
    console.log(`  Females: ${Math.round(EUROPEAN_POPULATION * EUROPEAN_FEMALE_RATIO).toLocaleString()}`);
    console.log(`European-Indigenous Mixed: ${MIXED_POPULATION.toLocaleString()} (0.9%)`);
    console.log(`  Male:Female Ratio: 21:20`);
    console.log(`  Males: ${Math.round(MIXED_POPULATION * MIXED_MALE_RATIO).toLocaleString()}`);
    console.log(`  Females: ${Math.round(MIXED_POPULATION * MIXED_FEMALE_RATIO).toLocaleString()}`);
    console.log('');
    console.log(`Total GDP: £${TOTAL_GDP.toLocaleString()}`);
    console.log(`GDP per Capita: £${GDP_PER_CAPITA}`);
    console.log(`Federal Debt: £0`);
    console.log(`Total Provincial Debt: £0`);
    console.log(`Number of Provinces: ${provinces.length}`);
    console.log('');
    console.log('');

    // Sort by population
    provinces.sort((a, b) => (b.population || 0) - (a.population || 0));

    let totalEuropean = 0;
    let totalMixed = 0;
    let totalIndigenous = 0;

    for (const province of provinces) {
      // Calculate corrected populations
      const dbPop = province.population || 0;
      const economicPop = Math.round(dbPop * correctionFactor);
      
      // Get cultural makeup
      const culturalMakeup = province.culturalMakeup || {};
      
      // Estimate Indigenous percentage from cultural makeup
      const maoriPct = culturalMakeup['Māori'] || culturalMakeup['Maori'] || 0;
      const mixedPct = culturalMakeup['Mixed'] || 0;
      const europeanPct = 1 - maoriPct - mixedPct;
      
      // Calculate populations by type
      const europeanPop = Math.round(economicPop * europeanPct);
      const mixedPop = Math.round(economicPop * mixedPct);
      
      // Indigenous population in this province (estimate based on cultural makeup)
      // Total Indigenous distributed proportionally to Māori cultural percentage
      const provinceMaoriPct = maoriPct || 0.20; // default 20% if not specified
      const indigenousPop = Math.round(INDIGENOUS_POPULATION * (economicPop / ECONOMIC_POPULATION) * (provinceMaoriPct / 0.30));
      
      totalEuropean += europeanPop;
      totalMixed += mixedPop;
      totalIndigenous += indigenousPop;

      // Calculate GDP
      const provinceGDP = economicPop * GDP_PER_CAPITA;

      console.log('='.repeat(80));
      console.log(`🏛️  ${province.name.toUpperCase()}`);
      console.log('='.repeat(80));
      console.log('');

      // Basic Info
      console.log('📍 BASIC INFORMATION');
      console.log(`   Capital: ${province.capital || 'TBD (players vote)'}`);
      console.log(`   Azgaar ID: ${province.azgaarId || 'N/A'}`);
      console.log(`   Area: ${(province.area || 0).toLocaleString()} km²`);
      console.log('');

      // Demographics
      console.log('👥 POPULATION & DEMOGRAPHICS');
      console.log(`   Total Population: ${(economicPop + indigenousPop).toLocaleString()}`);
      console.log('');
      console.log(`   EUROPEAN SETTLERS: ${europeanPop.toLocaleString()}`);
      console.log(`     Males (70%): ${Math.round(europeanPop * EUROPEAN_MALE_RATIO).toLocaleString()}`);
      console.log(`     Females (30%): ${Math.round(europeanPop * EUROPEAN_FEMALE_RATIO).toLocaleString()}`);
      console.log('');
      console.log(`   EUROPEAN-INDIGENOUS MIXED: ${mixedPop.toLocaleString()}`);
      console.log(`     Males (51.2%): ${Math.round(mixedPop * MIXED_MALE_RATIO).toLocaleString()}`);
      console.log(`     Females (48.8%): ${Math.round(mixedPop * MIXED_FEMALE_RATIO).toLocaleString()}`);
      console.log('');
      console.log(`   INDIGENOUS POPULATION: ${indigenousPop.toLocaleString()}`);
      console.log(`     Males (56.5%): ${Math.round(indigenousPop * INDIGENOUS_MALE_RATIO).toLocaleString()}`);
      console.log(`     Females (43.5%): ${Math.round(indigenousPop * INDIGENOUS_FEMALE_RATIO).toLocaleString()}`);
      console.log('');
      
      if (culturalMakeup && Object.keys(culturalMakeup).length > 0) {
        console.log('   Cultural Composition (Settler Population):');
        const sorted = Object.entries(culturalMakeup)
          .sort((a, b) => b[1] - a[1]);
        
        for (const [culture, percentage] of sorted) {
          const pct = (percentage * 100).toFixed(1);
          const count = Math.round(economicPop * percentage);
          console.log(`     - ${culture}: ${pct}% (${count.toLocaleString()} people)`);
        }
        console.log('');
      }

      // Economy
      console.log('💰 ECONOMY');
      console.log(`   GDP: £${provinceGDP.toLocaleString()}`);
      console.log(`   GDP per Capita (Economic Pop): £${GDP_PER_CAPITA}`);
      console.log(`   Economic Population: ${economicPop.toLocaleString()} (European + Mixed)`);
      console.log(`   Unemployment: ${(province.unemployment || 0).toFixed(1)}%`);
      
      const employed = Math.round(economicPop * (1 - (province.unemployment || 0) / 100));
      const unemployed = economicPop - employed;
      console.log(`     Employed: ${employed.toLocaleString()}`);
      console.log(`     Unemployed: ${unemployed.toLocaleString()}`);
      
      console.log(`   Provincial Debt: £${(province.debt || 0).toLocaleString()}`);
      console.log(`   Development Level: ${(province.developmentLevel || 0)}%`);
      console.log('');

      // Climate
      if (province.averageTemperature !== undefined) {
        console.log('🌡️  CLIMATE');
        console.log(`   Average Temperature: ${province.averageTemperature.toFixed(1)}°C`);
        console.log('');
      }

      // Resources (top 10)
      if (province.resources) {
        console.log('🏭 TOP RESOURCES');
        
        const flatResources = [];
        
        if (typeof province.resources === 'object') {
          Object.keys(province.resources).forEach(category => {
            if (typeof province.resources[category] === 'object' && province.resources[category] !== null) {
              Object.keys(province.resources[category]).forEach(resource => {
                const value = province.resources[category][resource];
                if (value > 0) {
                  flatResources.push({
                    name: resource,
                    value: value,
                    category: category
                  });
                }
              });
            }
          });
        }
        
        if (flatResources.length > 0) {
          flatResources.sort((a, b) => b.value - a.value);
          
          flatResources.slice(0, 10).forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.name}: ${Math.round(r.value).toLocaleString()} units`);
          });
        }
      }
      
      console.log('');
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ VERIFICATION TOTALS');
    console.log('='.repeat(80));
    console.log(`Total European (calculated): ${totalEuropean.toLocaleString()}`);
    console.log(`Target European: ${EUROPEAN_POPULATION.toLocaleString()}`);
    console.log(`Total Mixed (calculated): ${totalMixed.toLocaleString()}`);
    console.log(`Target Mixed: ${MIXED_POPULATION.toLocaleString()}`);
    console.log(`Total Indigenous (calculated): ${totalIndigenous.toLocaleString()}`);
    console.log(`Target Indigenous: ${INDIGENOUS_POPULATION.toLocaleString()}`);
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

exportCorrectedData();
