/**
 * Generate Detailed Provincial Demographics
 * 
 * Based on Zealandia #1 specifications:
 * - Total: 97,284 (75,820 Indigenous + 20,600 European + 863 European-Indigenous)
 * - Class structure: 5% Upper, 25% Middle, 65% Lower (European/Mixed only)
 * - Education: No School, Secondary School, Bachelors (period-appropriate)
 * - Cultural makeup based on province descriptions
 * - Occupation based on biome & resources
 * - Rural:Urban ratio 85:15 (European/Mixed)
 * - Gender ratios: Indigenous 13:10, European 70:30, Mixed 21:20
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// Population totals
const TOTAL_INDIGENOUS = 75820;
const TOTAL_EUROPEAN = 20600;
const TOTAL_MIXED = 863;
const ECONOMIC_POPULATION = TOTAL_EUROPEAN + TOTAL_MIXED; // 21,463

// Gender ratios
const INDIGENOUS_M = 13 / 23; // 56.52%
const INDIGENOUS_F = 10 / 23; // 43.48%
const EUROPEAN_M = 0.70;
const EUROPEAN_F = 0.30;
const MIXED_M = 21 / 41; // 51.22%
const MIXED_F = 20 / 41; // 48.78%

// Class structure (European/Mixed only)
const UPPER_CLASS = 0.05;
const MIDDLE_CLASS = 0.25;
const LOWER_CLASS = 0.65;
const OTHER_CLASS = 0.05; // Unemployed, destitute

// Rural/Urban split (European/Mixed)
const RURAL_RATIO = 0.85;
const URBAN_RATIO = 0.15;

// Education levels (period-appropriate, European/Mixed only)
const NO_SCHOOL = 0.70;      // Most population
const SECONDARY = 0.25;       // Some schooling
const BACHELORS = 0.05;       // University educated (very rare in 1853)

// Provincial characteristics based on Zealandia #1 specifications
const PROVINCE_SPECS = {
  'Tasminata': {
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Porttown. One Fort/Port/Town. English Anglican. No Mixing.',
    culturalMakeup: {
      'English-Anglican': 0.95,
      'Other': 0.05
    },
    indigenousRatio: 0.20, // Low Indigenous presence
    mixedPopulation: 0,
    occupations: {
      'Military': 0.15,
      'Maritime/Fishing': 0.25,
      'Agriculture/Farming': 0.20,
      'Trade/Commerce': 0.15,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10
    },
    urbanCenters: 2,
    settlements: 'Fort/Port/Town'
  },
  'New Caledonia': {
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Manufacturing Commune town. Scottish Presbyterian. No Mixing.',
    culturalMakeup: {
      'Scottish-Presbyterian': 0.95,
      'Other': 0.05
    },
    indigenousRatio: 0.25,
    mixedPopulation: 0,
    occupations: {
      'Manufacturing': 0.30,
      'Mining': 0.15,
      'Agriculture/Farming': 0.15,
      'Laborers': 0.20,
      'Trade/Commerce': 0.10,
      'Artisans/Craftsmen': 0.10
    },
    urbanCenters: 1,
    settlements: 'Manufacturing Commune'
  },
  'New Zealand': {
    description: 'Some Crown-Owned Land. Congregations of Maori Tribes to North & South. One City. Three Towns. English Methodist Missionaries. Trails. No Mixing.',
    culturalMakeup: {
      'English-Methodist': 0.50,
      'English-Anglican': 0.40,
      'Other': 0.10
    },
    indigenousRatio: 0.70, // High Indigenous presence
    mixedPopulation: 0,
    occupations: {
      'Agriculture/Farming': 0.30,
      'Trade/Commerce': 0.20,
      'Missionaries/Clergy': 0.10,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10,
      'Government/Administration': 0.05,
      'Professionals': 0.10
    },
    urbanCenters: 4, // 1 city + 3 towns
    settlements: 'City with trails to towns'
  },
  'Vulteralia': {
    description: 'Little Crown-Owned Land. Maori congregations. Spanish & French Catholics. European-Indigenous Mixes. One port city. Two Farming Towns. Two Porttowns. One Mining Town.',
    culturalMakeup: {
      'English-Methodist': 0.30,
      'English-Anglican': 0.20,
      'Spanish-Catholic': 0.20,
      'French-Catholic': 0.20,
      'Dutch': 0.05,
      'Other': 0.05
    },
    indigenousRatio: 0.70, // High Indigenous presence
    mixedPopulation: 0.70, // 70% of total mixed population
    occupations: {
      'Agriculture/Farming': 0.30,
      'Maritime/Fishing': 0.15,
      'Mining': 0.15,
      'Trade/Commerce': 0.15,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10
    },
    urbanCenters: 6, // Most developed
    settlements: '1 port city, 2 farming towns, 2 porttowns, 1 mining town'
  },
  'Cooksland': {
    description: 'Half Crown-Owned Land. Maori Tribes to East. One City. One MarketTown. English Anglican. Dutch Catholic/Protestant/Atheist. No Mixing.',
    culturalMakeup: {
      'English-Anglican': 0.60,
      'Dutch-Catholic': 0.15,
      'Dutch-Protestant': 0.15,
      'Dutch-Atheist': 0.05,
      'Other': 0.05
    },
    indigenousRatio: 0.70, // High Indigenous to East
    mixedPopulation: 0,
    occupations: {
      'Agriculture/Farming': 0.35,
      'Trade/Commerce': 0.20,
      'Artisans/Craftsmen': 0.15,
      'Laborers': 0.15,
      'Maritime/Fishing': 0.10,
      'Professionals': 0.05
    },
    urbanCenters: 2,
    settlements: '1 city, 1 market town'
  },
  'Southland': {
    description: 'No Crown-Owned Land. Majority Maori Tribes. English Methodist Missionaries. One FarmTown. The Frontier. No Mixing.',
    culturalMakeup: {
      'English-Methodist': 0.80,
      'English-Anglican': 0.15,
      'Other': 0.05
    },
    indigenousRatio: 2.35, // Very high Indigenous (frontier)
    mixedPopulation: 0,
    occupations: {
      'Agriculture/Farming': 0.50,
      'Missionaries/Clergy': 0.10,
      'Laborers': 0.20,
      'Livestock/Ranching': 0.10,
      'Artisans/Craftsmen': 0.05,
      'Frontier/Surveyors': 0.05
    },
    urbanCenters: 1,
    settlements: '1 farm town (frontier)'
  },
  'Te Moana-a-Toir': {
    description: 'No Crown-Owned Land. Majority Maori Tribes. Pockets of English Settlement. The Frontier. No Mixing.',
    culturalMakeup: {
      'English-Methodist': 0.85,
      'English-Anglican': 0.10,
      'Other': 0.05
    },
    indigenousRatio: 2.35, // Very high Indigenous (frontier)
    mixedPopulation: 0,
    occupations: {
      'Maritime/Fishing': 0.40,
      'Agriculture/Farming': 0.20,
      'Laborers': 0.20,
      'Missionaries/Clergy': 0.10,
      'Frontier/Surveyors': 0.10
    },
    urbanCenters: 0, // Pockets of settlement
    settlements: 'Scattered English pockets'
  }
};

async function generateDemographics() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const Province = mongoose.model('Province', new mongoose.Schema({}, { strict: false }));
    const Session = mongoose.model('Session', new mongoose.Schema({ name: String, createdAt: Date }));
    
    const session = await Session.findOne().sort({ createdAt: -1 });
    
    if (!session) {
      console.error('❌ No session found');
      process.exit(1);
    }

    console.log(`📊 Session: ${session.name}`);
    console.log('='.repeat(100));
    console.log('');

    const provinces = await Province.find({ 
      sessionId: session._id,
      name: { $ne: 'undefined', $exists: true }
    }).lean();

    if (provinces.length === 0) {
      console.log('⚠️  No provinces found');
      process.exit(0);
    }

    // Calculate total current population to determine distribution ratios
    const totalDbPop = provinces.reduce((sum, p) => sum + (p.population || 0), 0);

    console.log('📈 GENERATING PROVINCIAL DEMOGRAPHICS\n');

    const provincialData = [];
    let totalEuropean = 0;
    let totalMixed = 0;
    let totalIndigenous = 0;

    for (const province of provinces) {
      const spec = PROVINCE_SPECS[province.name];
      if (!spec) {
        console.log(`⚠️  No specification for ${province.name}, skipping`);
        continue;
      }

      const dbPop = province.population || 0;
      const popRatio = dbPop / totalDbPop;

      // Calculate European/Mixed population for this province
      let europeanPop = Math.round(TOTAL_EUROPEAN * popRatio);
      let mixedPop = Math.round(TOTAL_MIXED * spec.mixedPopulation);
      
      const economicPop = europeanPop + mixedPop;
      
      // Calculate Indigenous population based on spec ratio
      const indigenousPop = Math.round(economicPop * spec.indigenousRatio);

      totalEuropean += europeanPop;
      totalMixed += mixedPop;
      totalIndigenous += indigenousPop;

      // Gender breakdown
      const europeanMales = Math.round(europeanPop * EUROPEAN_M);
      const europeanFemales = europeanPop - europeanMales;
      const mixedMales = Math.round(mixedPop * MIXED_M);
      const mixedFemales = mixedPop - mixedMales;
      const indigenousMales = Math.round(indigenousPop * INDIGENOUS_M);
      const indigenousFemales = indigenousPop - indigenousMales;

      // Rural/Urban split
      const europeanRural = Math.round(europeanPop * RURAL_RATIO);
      const europeanUrban = europeanPop - europeanRural;
      const mixedRural = Math.round(mixedPop * RURAL_RATIO);
      const mixedUrban = mixedPop - mixedRural;

      // Class structure (economic population only)
      const upperClass = Math.round(economicPop * UPPER_CLASS);
      const middleClass = Math.round(economicPop * MIDDLE_CLASS);
      const lowerClass = Math.round(economicPop * LOWER_CLASS);
      const otherClass = economicPop - upperClass - middleClass - lowerClass;

      // Education levels
      const noSchool = Math.round(economicPop * NO_SCHOOL);
      const secondary = Math.round(economicPop * SECONDARY);
      const bachelors = Math.round(economicPop * BACHELORS);
      const noEducationData = economicPop - noSchool - secondary - bachelors;

      // Occupation breakdown
      const occupations = {};
      for (const [occ, ratio] of Object.entries(spec.occupations)) {
        occupations[occ] = Math.round(economicPop * ratio);
      }

      // Calculate income ranges by class
      const upperIncome = { min: 500, max: 1000 };
      const middleIncome = { min: 150, max: 400 };
      const lowerIncome = { min: 70, max: 120 };

      const data = {
        name: province.name,
        totalPopulation: economicPop + indigenousPop,
        
        // Population by ethnicity
        european: {
          total: europeanPop,
          males: europeanMales,
          females: europeanFemales,
          rural: europeanRural,
          urban: europeanUrban
        },
        mixed: {
          total: mixedPop,
          males: mixedMales,
          females: mixedFemales,
          rural: mixedRural,
          urban: mixedUrban
        },
        indigenous: {
          total: indigenousPop,
          males: indigenousMales,
          females: indigenousFemales
        },

        // Economic population (European + Mixed)
        economicPopulation: economicPop,

        // Class structure
        classes: {
          upper: { count: upperClass, percentage: UPPER_CLASS * 100, income: upperIncome },
          middle: { count: middleClass, percentage: MIDDLE_CLASS * 100, income: middleIncome },
          lower: { count: lowerClass, percentage: LOWER_CLASS * 100, income: lowerIncome },
          other: { count: otherClass, percentage: OTHER_CLASS * 100 }
        },

        // Education
        education: {
          noSchool: { count: noSchool, percentage: NO_SCHOOL * 100 },
          secondary: { count: secondary, percentage: SECONDARY * 100 },
          bachelors: { count: bachelors, percentage: BACHELORS * 100 }
        },

        // Occupations
        occupations: occupations,

        // Cultural makeup
        culture: spec.culturalMakeup,

        // Settlements
        urbanCenters: spec.urbanCenters,
        settlements: spec.settlements,
        description: spec.description
      };

      provincialData.push(data);
    }

    // Display results
    for (const data of provincialData) {
      console.log('='.repeat(100));
      console.log(`🏛️  ${data.name.toUpperCase()}`);
      console.log('='.repeat(100));
      console.log('');
      
      console.log(`📝 DESCRIPTION: ${data.description}`);
      console.log(`🏘️  SETTLEMENTS: ${data.settlements}`);
      console.log(`🏙️  URBAN CENTERS: ${data.urbanCenters}`);
      console.log('');

      console.log('👥 POPULATION BREAKDOWN');
      console.log(`   Total Population: ${data.totalPopulation.toLocaleString()}`);
      console.log('');
      console.log(`   EUROPEAN SETTLERS: ${data.european.total.toLocaleString()}`);
      console.log(`     Males (70%): ${data.european.males.toLocaleString()}`);
      console.log(`     Females (30%): ${data.european.females.toLocaleString()}`);
      console.log(`     Rural (85%): ${data.european.rural.toLocaleString()}`);
      console.log(`     Urban (15%): ${data.european.urban.toLocaleString()}`);
      console.log('');
      
      if (data.mixed.total > 0) {
        console.log(`   EUROPEAN-INDIGENOUS MIXED: ${data.mixed.total.toLocaleString()}`);
        console.log(`     Males (51.2%): ${data.mixed.males.toLocaleString()}`);
        console.log(`     Females (48.8%): ${data.mixed.females.toLocaleString()}`);
        console.log(`     Rural (85%): ${data.mixed.rural.toLocaleString()}`);
        console.log(`     Urban (15%): ${data.mixed.urban.toLocaleString()}`);
        console.log('');
      }
      
      console.log(`   INDIGENOUS POPULATION: ${data.indigenous.total.toLocaleString()}`);
      console.log(`     Males (56.5%): ${data.indigenous.males.toLocaleString()}`);
      console.log(`     Females (43.5%): ${data.indigenous.females.toLocaleString()}`);
      console.log('');

      console.log('💼 CLASS STRUCTURE (Economic Population)');
      console.log(`   Upper Class (${data.classes.upper.percentage}%): ${data.classes.upper.count.toLocaleString()}`);
      console.log(`     Income Range: £${data.classes.upper.income.min}-${data.classes.upper.income.max}`);
      console.log(`   Middle Class (${data.classes.middle.percentage}%): ${data.classes.middle.count.toLocaleString()}`);
      console.log(`     Income Range: £${data.classes.middle.income.min}-${data.classes.middle.income.max}+`);
      console.log(`   Lower Class (${data.classes.lower.percentage}%): ${data.classes.lower.count.toLocaleString()}`);
      console.log(`     Income Range: £${data.classes.lower.income.min}-${data.classes.lower.income.max}`);
      if (data.classes.other.count > 0) {
        console.log(`   Other/Unemployed (${data.classes.other.percentage}%): ${data.classes.other.count.toLocaleString()}`);
      }
      console.log('');

      console.log('🎓 EDUCATION LEVELS (Economic Population)');
      console.log(`   No Schooling: ${data.education.noSchool.count.toLocaleString()} (${data.education.noSchool.percentage}%)`);
      console.log(`   Secondary School: ${data.education.secondary.count.toLocaleString()} (${data.education.secondary.percentage}%)`);
      console.log(`   Bachelor's Degree: ${data.education.bachelors.count.toLocaleString()} (${data.education.bachelors.percentage}%)`);
      console.log('');

      console.log('🔨 OCCUPATIONS (Economic Population)');
      const sortedOccupations = Object.entries(data.occupations)
        .sort((a, b) => b[1] - a[1]);
      for (const [occupation, count] of sortedOccupations) {
        const pct = ((count / data.economicPopulation) * 100).toFixed(1);
        console.log(`   ${occupation}: ${count.toLocaleString()} (${pct}%)`);
      }
      console.log('');

      console.log('🌍 CULTURAL MAKEUP (Settler Population)');
      const sortedCulture = Object.entries(data.culture)
        .sort((a, b) => b[1] - a[1]);
      for (const [culture, ratio] of sortedCulture) {
        const pct = (ratio * 100).toFixed(1);
        const count = Math.round(data.economicPopulation * ratio);
        console.log(`   ${culture}: ${pct}% (${count.toLocaleString()} people)`);
      }
      console.log('');
      console.log('');
    }

    console.log('='.repeat(100));
    console.log('✅ TOTALS VERIFICATION');
    console.log('='.repeat(100));
    console.log(`European (calculated): ${totalEuropean.toLocaleString()} / Target: ${TOTAL_EUROPEAN.toLocaleString()}`);
    console.log(`Mixed (calculated): ${totalMixed.toLocaleString()} / Target: ${TOTAL_MIXED.toLocaleString()}`);
    console.log(`Indigenous (calculated): ${totalIndigenous.toLocaleString()} / Target: ${TOTAL_INDIGENOUS.toLocaleString()}`);
    console.log(`Grand Total: ${(totalEuropean + totalMixed + totalIndigenous).toLocaleString()}`);
    console.log('');

    // Save to JSON file
    const fs = require('fs');
    const outputPath = 'c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\provincial-demographics.json';
    fs.writeFileSync(outputPath, JSON.stringify(provincialData, null, 2));
    console.log(`💾 Data saved to: ${outputPath}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateDemographics();
