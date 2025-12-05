/**
 * Generate Complete Federal & Provincial Demographics and Economic Data
 * 
 * Based on Zealandia #1 specifications:
 * - Federal Total: 97,284 (75,820 Indigenous + 20,600 European + 863 European-Indigenous)
 * - Distribution based on biome/terrain/resources/province descriptions
 * - Class structure: 5% Upper (£500-1000), 25% Middle (£150-400), 65% Lower (£70-120)
 * - Voting population: 7% of European males (White Male Landowners)
 * - GDP per capita: £418 for economic population
 */

const fs = require('fs');

// Federal totals from Zealandia #1
const FEDERAL = {
  totalPopulation: 97284,
  indigenous: 75820,
  european: 20600,
  mixed: 863, // European-Indigenous
  economicPopulation: 21463, // European + Mixed
  gdp: 8971952,
  gdpPerCapita: 418,
  federalDebt: 0,
  provincialDebt: 0
};

// Gender ratios
const RATIOS = {
  indigenous: { male: 13/23, female: 10/23 },
  european: { male: 0.70, female: 0.30 },
  mixed: { male: 21/41, female: 20/41 },
  ruralUrban: { rural: 0.85, urban: 0.15 }
};

// Class structure (economic population only)
const CLASSES = {
  upper: { ratio: 0.05, income: { min: 500, max: 1000 } },
  middle: { ratio: 0.25, income: { min: 150, max: 400 } },
  lower: { ratio: 0.65, income: { min: 70, max: 120 } },
  other: { ratio: 0.05 } // Unemployed/destitute
};

// Education (economic population, period-appropriate 1853)
const EDUCATION = {
  noSchool: 0.70,
  secondary: 0.25,
  bachelors: 0.05
};

// Provincial distribution weights (based on resources, biome, settlements, descriptions)
const PROVINCIAL_WEIGHTS = {
  'Southland': {
    // No Crown land, majority Māori, 1 farm town, frontier
    // Massive wool/livestock resources, frontier character
    europeanWeight: 0.40, // High due to farming potential
    indigenousWeight: 0.25, // Very high Māori presence
    mixedWeight: 0.0, // No mixing
    description: 'No Crown-Owned Land. Majority Maori Tribes. English Methodist Missionaries. One FarmTown. The Frontier. No Mixing.',
    settlements: '1 farm town',
    urbanCenters: 1,
    culture: {
      'English-Methodist': 0.80,
      'English-Anglican': 0.15,
      'Other': 0.05
    },
    occupations: {
      'Agriculture/Farming': 0.40,
      'Livestock/Ranching': 0.20,
      'Laborers': 0.20,
      'Missionaries/Clergy': 0.10,
      'Artisans/Craftsmen': 0.05,
      'Frontier/Surveyors': 0.05
    }
  },
  'Vulteralia': {
    // Little Crown land, Māori congregations, Spanish/French Catholics, mixed population
    // 1 port city, 2 farm towns, 2 porttowns, 1 mining town (most developed)
    europeanWeight: 0.18,
    indigenousWeight: 0.12,
    mixedWeight: 0.70, // 70% of all mixed population here
    description: 'Little Crown-Owned Land. Maori congregations. Spanish & French Catholics. European-Indigenous Mixes. One port city. Two Farming Towns. Two Porttowns. One Mining Town.',
    settlements: '1 port city, 2 farming towns, 2 porttowns, 1 mining town',
    urbanCenters: 6,
    culture: {
      'English-Methodist': 0.25,
      'English-Anglican': 0.15,
      'Spanish-Catholic': 0.25,
      'French-Catholic': 0.25,
      'Dutch': 0.05,
      'Other': 0.05
    },
    occupations: {
      'Agriculture/Farming': 0.30,
      'Maritime/Fishing': 0.15,
      'Mining': 0.15,
      'Trade/Commerce': 0.15,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10
    }
  },
  'Cooksland': {
    // Half Crown land, Māori to East, 1 city + 1 market town
    // English Anglican + Dutch cultures, no mixing
    europeanWeight: 0.14,
    indigenousWeight: 0.18,
    mixedWeight: 0.0,
    description: 'Half Crown-Owned Land. Maori Tribes to East. One City. One MarketTown. English Anglican. Dutch Catholic/Protestant/Atheist. No Mixing.',
    settlements: '1 city, 1 market town',
    urbanCenters: 2,
    culture: {
      'English-Anglican': 0.60,
      'Dutch-Catholic': 0.15,
      'Dutch-Protestant': 0.15,
      'Dutch-Atheist': 0.05,
      'Other': 0.05
    },
    occupations: {
      'Agriculture/Farming': 0.35,
      'Trade/Commerce': 0.20,
      'Artisans/Craftsmen': 0.15,
      'Laborers': 0.15,
      'Maritime/Fishing': 0.10,
      'Professionals': 0.05
    }
  },
  'Tasminata': {
    // Majority Crown land, Māori pockets, 1 porttown + 1 fort/port/town
    // English Anglican, military presence
    europeanWeight: 0.12,
    indigenousWeight: 0.08,
    mixedWeight: 0.0,
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Porttown. One Fort/Port/Town. English Anglican. No Mixing.',
    settlements: 'Fort/Port/Town',
    urbanCenters: 2,
    culture: {
      'English-Anglican': 0.95,
      'Other': 0.05
    },
    occupations: {
      'Maritime/Fishing': 0.25,
      'Agriculture/Farming': 0.20,
      'Military': 0.15,
      'Trade/Commerce': 0.15,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10
    }
  },
  'New Zealand': {
    // Some Crown land, Māori congregations N/S, 1 city + 3 towns
    // English Methodist missionaries, trails
    europeanWeight: 0.11,
    indigenousWeight: 0.20,
    mixedWeight: 0.0,
    description: 'Some Crown-Owned Land. Congregations of Maori Tribes to North & South. One City. Three Towns. English Methodist Missionaries. Trails. No Mixing.',
    settlements: 'City with trails to towns',
    urbanCenters: 4,
    culture: {
      'English-Methodist': 0.50,
      'English-Anglican': 0.40,
      'Other': 0.10
    },
    occupations: {
      'Agriculture/Farming': 0.30,
      'Trade/Commerce': 0.20,
      'Missionaries/Clergy': 0.10,
      'Laborers': 0.15,
      'Artisans/Craftsmen': 0.10,
      'Government/Administration': 0.05,
      'Professionals': 0.10
    }
  },
  'New Caledonia': {
    // Majority Crown land, Māori pockets, 1 manufacturing commune
    // Scottish Presbyterian
    europeanWeight: 0.03,
    indigenousWeight: 0.04,
    mixedWeight: 0.0,
    description: 'Majority Crown-Owned Land. Pockets of Maori Tribes. One Manufacturing Commune town. Scottish Presbyterian. No Mixing.',
    settlements: 'Manufacturing Commune',
    urbanCenters: 1,
    culture: {
      'Scottish-Presbyterian': 0.95,
      'Other': 0.05
    },
    occupations: {
      'Manufacturing': 0.30,
      'Mining': 0.15,
      'Agriculture/Farming': 0.15,
      'Laborers': 0.20,
      'Trade/Commerce': 0.10,
      'Artisans/Craftsmen': 0.10
    }
  },
  'Te Moana-a-Toir': {
    // No Crown land, majority Māori, pockets of English, frontier
    // Smallest settler population, fishing focus
    europeanWeight: 0.02,
    indigenousWeight: 0.13,
    mixedWeight: 0.30, // 30% of mixed (island mixing)
    description: 'No Crown-Owned Land. Majority Maori Tribes. Pockets of English Settlement. The Frontier. No Mixing.',
    settlements: 'Scattered English pockets',
    urbanCenters: 0,
    culture: {
      'English-Methodist': 0.85,
      'English-Anglican': 0.10,
      'Other': 0.05
    },
    occupations: {
      'Maritime/Fishing': 0.40,
      'Agriculture/Farming': 0.20,
      'Laborers': 0.20,
      'Missionaries/Clergy': 0.10,
      'Frontier/Surveyors': 0.10
    }
  }
};

function generateProvinceData() {
  const provinces = [];
  
  // Normalize weights
  const totalEuropeanWeight = Object.values(PROVINCIAL_WEIGHTS).reduce((sum, p) => sum + p.europeanWeight, 0);
  const totalIndigenousWeight = Object.values(PROVINCIAL_WEIGHTS).reduce((sum, p) => sum + p.indigenousWeight, 0);
  const totalMixedWeight = Object.values(PROVINCIAL_WEIGHTS).reduce((sum, p) => sum + p.mixedWeight, 0);
  
  for (const [name, spec] of Object.entries(PROVINCIAL_WEIGHTS)) {
    // Calculate populations
    const europeanPop = Math.round((spec.europeanWeight / totalEuropeanWeight) * FEDERAL.european);
    const mixedPop = Math.round((spec.mixedWeight / totalMixedWeight) * FEDERAL.mixed);
    const indigenousPop = Math.round((spec.indigenousWeight / totalIndigenousWeight) * FEDERAL.indigenous);
    
    const economicPop = europeanPop + mixedPop;
    const totalPop = economicPop + indigenousPop;
    
    // Gender breakdowns
    const europeanMales = Math.round(europeanPop * RATIOS.european.male);
    const europeanFemales = europeanPop - europeanMales;
    const mixedMales = Math.round(mixedPop * RATIOS.mixed.male);
    const mixedFemales = mixedPop - mixedMales;
    const indigenousMales = Math.round(indigenousPop * RATIOS.indigenous.male);
    const indigenousFemales = indigenousPop - indigenousMales;
    
    // Rural/Urban split (European + Mixed)
    const economicRural = Math.round(economicPop * RATIOS.ruralUrban.rural);
    const economicUrban = economicPop - economicRural;
    
    // Voting population: 7% of European males (White Male Landowners)
    const votingPopulation = Math.round(europeanMales * 0.07);
    
    // Class structure (economic population)
    const upperClass = Math.round(economicPop * CLASSES.upper.ratio);
    const middleClass = Math.round(economicPop * CLASSES.middle.ratio);
    const lowerClass = Math.round(economicPop * CLASSES.lower.ratio);
    const otherClass = economicPop - upperClass - middleClass - lowerClass;
    
    // Education (economic population)
    const noSchool = Math.round(economicPop * EDUCATION.noSchool);
    const secondary = Math.round(economicPop * EDUCATION.secondary);
    const bachelors = Math.round(economicPop * EDUCATION.bachelors);
    
    // Occupations
    const occupations = {};
    for (const [occ, ratio] of Object.entries(spec.occupations)) {
      occupations[occ] = Math.round(economicPop * ratio);
    }
    
    // Culture breakdown
    const culture = {};
    for (const [cult, ratio] of Object.entries(spec.culture)) {
      culture[cult] = {
        percentage: ratio * 100,
        population: Math.round(economicPop * ratio)
      };
    }
    
    // Economic data
    const provincialGDP = economicPop * FEDERAL.gdpPerCapita;
    const gdpPerCapita = FEDERAL.gdpPerCapita;
    
    // Lower House seats (1 seat per 601 economic population per Zealandia #1)
    const lowerHouseSeats = Math.floor(economicPop / 601);
    
    provinces.push({
      name,
      description: spec.description,
      settlements: spec.settlements,
      urbanCenters: spec.urbanCenters,
      
      population: {
        total: totalPop,
        economic: economicPop,
        
        european: {
          total: europeanPop,
          males: europeanMales,
          females: europeanFemales,
          percentage: (europeanPop / totalPop * 100).toFixed(1)
        },
        
        mixed: {
          total: mixedPop,
          males: mixedMales,
          females: mixedFemales,
          percentage: (mixedPop / totalPop * 100).toFixed(1)
        },
        
        indigenous: {
          total: indigenousPop,
          males: indigenousMales,
          females: indigenousFemales,
          percentage: (indigenousPop / totalPop * 100).toFixed(1)
        },
        
        settlement: {
          rural: economicRural,
          urban: economicUrban
        },
        
        voting: {
          eligibleVoters: votingPopulation,
          percentageOfTotal: (votingPopulation / totalPop * 100).toFixed(2),
          percentageOfEuropeanMales: 7.0
        }
      },
      
      economy: {
        gdp: provincialGDP,
        gdpPerCapita: gdpPerCapita,
        debt: 0,
        unemploymentRate: 0, // Will be calculated by economic system
        developmentLevel: 6 // Initial from database
      },
      
      classes: {
        upper: {
          count: upperClass,
          percentage: CLASSES.upper.ratio * 100,
          income: CLASSES.upper.income
        },
        middle: {
          count: middleClass,
          percentage: CLASSES.middle.ratio * 100,
          income: CLASSES.middle.income
        },
        lower: {
          count: lowerClass,
          percentage: CLASSES.lower.ratio * 100,
          income: CLASSES.lower.income
        },
        other: {
          count: otherClass,
          percentage: CLASSES.other.ratio * 100
        }
      },
      
      education: {
        noSchool: {
          count: noSchool,
          percentage: EDUCATION.noSchool * 100
        },
        secondary: {
          count: secondary,
          percentage: EDUCATION.secondary * 100
        },
        bachelors: {
          count: bachelors,
          percentage: EDUCATION.bachelors * 100
        }
      },
      
      occupations,
      culture,
      
      government: {
        lowerHouseSeats,
        upperHouseSeats: 2, // Fixed 2 per province
        superintendent: 'TBD (players vote or appointed by Governor)'
      }
    });
  }
  
  return provinces;
}

function generateFederalSummary(provinces) {
  const totals = {
    population: 0,
    economic: 0,
    european: 0,
    mixed: 0,
    indigenous: 0,
    voting: 0,
    gdp: 0,
    lowerHouseSeats: 0
  };
  
  for (const p of provinces) {
    totals.population += p.population.total;
    totals.economic += p.population.economic;
    totals.european += p.population.european.total;
    totals.mixed += p.population.mixed.total;
    totals.indigenous += p.population.indigenous.total;
    totals.voting += p.population.voting.eligibleVoters;
    totals.gdp += p.economy.gdp;
    totals.lowerHouseSeats += p.government.lowerHouseSeats;
  }
  
  return {
    name: 'Federal Colony of Zealandia',
    year: 1853,
    
    population: {
      grandTotal: totals.population,
      economicPopulation: totals.economic,
      
      european: {
        total: totals.european,
        males: Math.round(totals.european * RATIOS.european.male),
        females: Math.round(totals.european * RATIOS.european.female),
        percentage: (totals.european / totals.population * 100).toFixed(1)
      },
      
      mixed: {
        total: totals.mixed,
        males: Math.round(totals.mixed * RATIOS.mixed.male),
        females: Math.round(totals.mixed * RATIOS.mixed.female),
        percentage: (totals.mixed / totals.population * 100).toFixed(1)
      },
      
      indigenous: {
        total: totals.indigenous,
        males: Math.round(totals.indigenous * RATIOS.indigenous.male),
        females: Math.round(totals.indigenous * RATIOS.indigenous.female),
        percentage: (totals.indigenous / totals.population * 100).toFixed(1)
      },
      
      voting: {
        eligibleVoters: totals.voting,
        percentageOfTotal: (totals.voting / totals.population * 100).toFixed(2),
        criteria: 'White Male Landowners (7% of European Males)'
      }
    },
    
    economy: {
      totalGDP: totals.gdp,
      gdpPerCapita: FEDERAL.gdpPerCapita,
      federalDebt: FEDERAL.federalDebt,
      provincialDebt: FEDERAL.provincialDebt
    },
    
    government: {
      provinces: provinces.length,
      lowerHouse: {
        totalSeats: totals.lowerHouseSeats,
        ratio: '1 seat per 601 economic population'
      },
      upperHouse: {
        totalSeats: 14,
        distribution: '2 per province (for life or resignation)'
      },
      governor: 'John P. Marsden (Crown-appointed)',
      superintendents: {
        'Vulteralia': 'Monsieur Armand DuBois',
        'New Zealand': 'William S. Hamilton',
        'Cooksland': 'Frederick L. Davies',
        'New Caledonia': 'Up for election',
        'Te Moana-a-Toir': 'Up for election',
        'Tasminata': 'Up for election',
        'Southland': 'Up for election'
      }
    }
  };
}

function displayReport(federal, provinces) {
  console.log('═'.repeat(120));
  console.log('🏛️  FEDERAL COLONY OF ZEALANDIA - COMPLETE DEMOGRAPHIC & ECONOMIC REPORT (1853)');
  console.log('═'.repeat(120));
  console.log('');
  
  // Federal Summary
  console.log('📊 FEDERAL SUMMARY');
  console.log('─'.repeat(120));
  console.log(`Grand Total Population: ${federal.population.grandTotal.toLocaleString()}`);
  console.log(`Economic Population (European + Mixed): ${federal.population.economicPopulation.toLocaleString()}`);
  console.log('');
  console.log(`Indigenous Population: ${federal.population.indigenous.total.toLocaleString()} (${federal.population.indigenous.percentage}%)`);
  console.log(`  Males (13:10 ratio): ${federal.population.indigenous.males.toLocaleString()} (56.5%)`);
  console.log(`  Females (13:10 ratio): ${federal.population.indigenous.females.toLocaleString()} (43.5%)`);
  console.log('');
  console.log(`European Settler Population: ${federal.population.european.total.toLocaleString()} (${federal.population.european.percentage}%)`);
  console.log(`  Males (70:30 ratio): ${federal.population.european.males.toLocaleString()} (70%)`);
  console.log(`  Females (70:30 ratio): ${federal.population.european.females.toLocaleString()} (30%)`);
  console.log('');
  console.log(`European-Indigenous Mixed: ${federal.population.mixed.total.toLocaleString()} (${federal.population.mixed.percentage}%)`);
  console.log(`  Males (21:20 ratio): ${federal.population.mixed.males.toLocaleString()} (51.2%)`);
  console.log(`  Females (21:20 ratio): ${federal.population.mixed.females.toLocaleString()} (48.8%)`);
  console.log('');
  console.log(`💰 Total Federal GDP: £${federal.economy.totalGDP.toLocaleString()}`);
  console.log(`   GDP per Capita (Economic Pop): £${federal.economy.gdpPerCapita}`);
  console.log(`   Federal Debt: £${federal.economy.federalDebt.toLocaleString()}`);
  console.log(`   Total Provincial Debt: £${federal.economy.provincialDebt.toLocaleString()}`);
  console.log('');
  console.log(`🗳️  Voting Population: ${federal.population.voting.eligibleVoters.toLocaleString()} (${federal.population.voting.percentageOfTotal}% of total)`);
  console.log(`   Criteria: ${federal.population.voting.criteria}`);
  console.log('');
  console.log(`🏛️  General Assembly:`);
  console.log(`   Lower House (House of Representatives): ${federal.government.lowerHouse.totalSeats} seats (${federal.government.lowerHouse.ratio})`);
  console.log(`   Upper House (Legislative Council): ${federal.government.upperHouse.totalSeats} seats (${federal.government.upperHouse.distribution})`);
  console.log(`   Governor: ${federal.government.governor}`);
  console.log('');
  console.log('');
  
  // Provincial Details
  console.log('═'.repeat(120));
  console.log('🗺️  PROVINCIAL BREAKDOWN');
  console.log('═'.repeat(120));
  console.log('');
  
  // Sort by total population descending
  const sortedProvinces = [...provinces].sort((a, b) => b.population.total - a.population.total);
  
  for (const province of sortedProvinces) {
    console.log('─'.repeat(120));
    console.log(`🏛️  ${province.name.toUpperCase()}`);
    console.log('─'.repeat(120));
    console.log(`📝 ${province.description}`);
    console.log(`🏘️  Settlements: ${province.settlements}`);
    console.log(`🏙️  Urban Centers: ${province.urbanCenters}`);
    console.log('');
    
    console.log('👥 POPULATION');
    console.log(`   Total: ${province.population.total.toLocaleString()}`);
    console.log(`   Economic (European + Mixed): ${province.population.economic.toLocaleString()}`);
    console.log('');
    console.log(`   European: ${province.population.european.total.toLocaleString()} (${province.population.european.percentage}%)`);
    console.log(`     Males: ${province.population.european.males.toLocaleString()} | Females: ${province.population.european.females.toLocaleString()}`);
    console.log(`   Mixed: ${province.population.mixed.total.toLocaleString()} (${province.population.mixed.percentage}%)`);
    console.log(`     Males: ${province.population.mixed.males.toLocaleString()} | Females: ${province.population.mixed.females.toLocaleString()}`);
    console.log(`   Indigenous: ${province.population.indigenous.total.toLocaleString()} (${province.population.indigenous.percentage}%)`);
    console.log(`     Males: ${province.population.indigenous.males.toLocaleString()} | Females: ${province.population.indigenous.females.toLocaleString()}`);
    console.log('');
    console.log(`   Settlement Distribution (Economic Pop):`);
    console.log(`     Rural (85%): ${province.population.settlement.rural.toLocaleString()}`);
    console.log(`     Urban (15%): ${province.population.settlement.urban.toLocaleString()}`);
    console.log('');
    console.log(`   🗳️  Eligible Voters: ${province.population.voting.eligibleVoters.toLocaleString()} (${province.population.voting.percentageOfTotal}% of provincial pop)`);
    console.log('');
    
    console.log('💰 ECONOMY');
    console.log(`   Provincial GDP: £${province.economy.gdp.toLocaleString()}`);
    console.log(`   GDP per Capita: £${province.economy.gdpPerCapita}`);
    console.log(`   Provincial Debt: £${province.economy.debt.toLocaleString()}`);
    console.log(`   Unemployment Rate: ${province.economy.unemploymentRate}%`);
    console.log(`   Development Level: ${province.economy.developmentLevel}%`);
    console.log('');
    
    console.log('💼 CLASS STRUCTURE (Economic Population)');
    console.log(`   Upper Class (${province.classes.upper.percentage}%): ${province.classes.upper.count.toLocaleString()}`);
    console.log(`     Income: £${province.classes.upper.income.min}-${province.classes.upper.income.max}/year`);
    console.log(`     Occupations: Landowners, Lawyers, Doctors, Industrialists`);
    console.log(`   Middle Class (${province.classes.middle.percentage}%): ${province.classes.middle.count.toLocaleString()}`);
    console.log(`     Income: £${province.classes.middle.income.min}-${province.classes.middle.income.max}+/year`);
    console.log(`     Occupations: Merchants, Artisans, Teachers, Small Business Owners`);
    console.log(`   Lower Class (${province.classes.lower.percentage}%): ${province.classes.lower.count.toLocaleString()}`);
    console.log(`     Income: £${province.classes.lower.income.min}-${province.classes.lower.income.max}/year`);
    console.log(`     Occupations: Domestic Servants, Farmers, Laborers`);
    if (province.classes.other.count > 0) {
      console.log(`   Other/Unemployed (${province.classes.other.percentage}%): ${province.classes.other.count.toLocaleString()}`);
    }
    console.log('');
    
    console.log('🎓 EDUCATION (Economic Population)');
    console.log(`   No Schooling: ${province.education.noSchool.count.toLocaleString()} (${province.education.noSchool.percentage}%)`);
    console.log(`   Secondary School: ${province.education.secondary.count.toLocaleString()} (${province.education.secondary.percentage}%)`);
    console.log(`   Bachelor's Degree: ${province.education.bachelors.count.toLocaleString()} (${province.education.bachelors.percentage}%)`);
    console.log('');
    
    console.log('🔨 OCCUPATIONS (Economic Population)');
    const sortedOccupations = Object.entries(province.occupations).sort((a, b) => b[1] - a[1]);
    for (const [occ, count] of sortedOccupations) {
      const pct = ((count / province.population.economic) * 100).toFixed(1);
      console.log(`   ${occ}: ${count.toLocaleString()} (${pct}%)`);
    }
    console.log('');
    
    console.log('🌍 CULTURAL MAKEUP (Settler Population)');
    const sortedCulture = Object.entries(province.culture).sort((a, b) => b[1].percentage - a[1].percentage);
    for (const [cult, data] of sortedCulture) {
      console.log(`   ${cult}: ${data.percentage.toFixed(1)}% (${data.population.toLocaleString()} people)`);
    }
    console.log('');
    
    console.log('🏛️  GOVERNMENT');
    console.log(`   Lower House Seats: ${province.government.lowerHouseSeats}`);
    console.log(`   Upper House Seats: ${province.government.upperHouseSeats}`);
    console.log(`   Superintendent: ${province.government.superintendent}`);
    console.log('');
    console.log('');
  }
  
  console.log('═'.repeat(120));
  console.log('✅ REPORT COMPLETE');
  console.log('═'.repeat(120));
}

// Generate and display
const provinces = generateProvinceData();
const federal = generateFederalSummary(provinces);

displayReport(federal, provinces);

// Save to JSON
const output = {
  federal,
  provinces,
  metadata: {
    generated: new Date().toISOString(),
    source: 'Zealandia #1 specifications',
    notes: 'Demographics based on biome/terrain/resources/province descriptions. GDP calculated at £418 per capita for economic population.'
  }
};

fs.writeFileSync(
  'c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\federal-provincial-demographics.json',
  JSON.stringify(output, null, 2)
);

console.log('');
console.log('💾 Complete data saved to: federal-provincial-demographics.json');
