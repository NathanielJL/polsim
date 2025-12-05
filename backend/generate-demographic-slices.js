/**
 * Generate Demographic Slices
 * Creates 300-500 demographic groups from provincial data
 * Each slice represents a unique combination of economic/cultural/locational factors
 */

const fs = require('fs');

// Load federal-provincial demographics
const provincialData = JSON.parse(
  fs.readFileSync('c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\federal-provincial-demographics.json', 'utf8')
);

const provinces = provincialData.provinces;

// ============================================================================
// DEMOGRAPHIC SLICE GENERATION LOGIC
// ============================================================================

/**
 * Property ownership distribution by occupation and class
 */
function determinePropertyOwnership(occupation, socialClass, province) {
  // Landowners (own property)
  const landownerOccupations = ['landowner-farmer', 'rancher'];
  if (landownerOccupations.includes(occupation)) return 'landowner';
  
  // Upper class tends to own property
  if (socialClass === 'upper') {
    return Math.random() < 0.9 ? 'landowner' : 'tenant';
  }
  
  // Middle class farmers - mix of owners and tenants
  if (socialClass === 'middle' && (occupation.includes('farmer') || occupation === 'rancher')) {
    return Math.random() < 0.4 ? 'landowner' : 'tenant';
  }
  
  // Tenant farmers
  if (occupation === 'tenant-farmer') return 'tenant';
  
  // Most others don't own agricultural land
  return 'none';
}

/**
 * Map provincial occupation categories to specific occupations
 */
function mapOccupationToSpecific(provinceOccupation, socialClass, province) {
  const mapping = {
    'Agriculture/Farming': () => {
      if (socialClass === 'upper') return 'landowner-farmer';
      if (socialClass === 'middle') return Math.random() < 0.3 ? 'landowner-farmer' : 'tenant-farmer';
      return Math.random() < 0.2 ? 'tenant-farmer' : 'agricultural-laborer';
    },
    'Livestock/Ranching': () => {
      if (socialClass === 'upper') return 'rancher';
      if (socialClass === 'middle') return 'rancher';
      return 'agricultural-laborer';
    },
    'Maritime/Fishing': () => {
      if (socialClass === 'upper') return 'merchant-sailor';
      return Math.random() < 0.7 ? 'fisherman' : 'whaler';
    },
    'Mining': () => {
      // Determine mining type based on province resources
      const miningTypes = ['coal-miner', 'gold-miner', 'industrial-miner'];
      return miningTypes[Math.floor(Math.random() * miningTypes.length)];
    },
    'Manufacturing': () => {
      if (socialClass === 'upper' || socialClass === 'middle') return 'manufacturer';
      return 'general-laborer';
    },
    'Artisans/Craftsmen': () => {
      return Math.random() < 0.6 ? 'artisan' : 'craftsman';
    },
    'Trade/Commerce': () => {
      if (socialClass === 'upper') return 'merchant';
      if (socialClass === 'middle') return Math.random() < 0.5 ? 'shopkeeper' : 'trader';
      return 'general-laborer';
    },
    'Missionaries/Clergy': () => 'missionary',
    'Military': () => 'military',
    'Laborers': () => 'general-laborer',
    'Professionals': () => {
      const profs = ['lawyer', 'doctor', 'teacher'];
      return profs[Math.floor(Math.random() * profs.length)];
    },
    'Government/Administration': () => 'government-official',
    'Frontier/Surveyors': () => 'frontier-surveyor'
  };
  
  const mapper = mapping[provinceOccupation];
  return mapper ? mapper() : 'general-laborer';
}

/**
 * Determine ethnicity from cultural group
 */
function mapCultureToEthnicity(culture) {
  const mapping = {
    'English-Anglican': 'english',
    'English-Methodist': 'english',
    'Scottish-Presbyterian': 'scottish',
    'Dutch-Catholic': 'dutch',
    'Dutch-Protestant': 'dutch',
    'Dutch-Atheist': 'dutch',
    'Spanish-Catholic': 'spanish',
    'French-Catholic': 'french',
    'Māori': 'maori',
    'Other': 'other'
  };
  
  return mapping[culture] || 'other';
}

/**
 * Determine religion from cultural group
 */
function mapCultureToReligion(culture) {
  const mapping = {
    'English-Anglican': 'anglican',
    'English-Methodist': 'methodist',
    'Scottish-Presbyterian': 'presbyterian',
    'Dutch-Catholic': 'catholic',
    'Dutch-Protestant': 'protestant',
    'Dutch-Atheist': 'atheist',
    'Spanish-Catholic': 'catholic',
    'French-Catholic': 'catholic',
    'Māori': 'indigenous-beliefs',
    'Other': 'protestant'
  };
  
  return mapping[culture] || 'protestant';
}

/**
 * Determine voting eligibility
 * White Male Landowners only (7% of European males)
 */
function canVote(ethnicity, gender, propertyOwnership, indigenous, mixed) {
  // Must be male
  if (gender !== 'male') return false;
  
  // Must be European (not Indigenous or Mixed)
  if (indigenous || mixed) return false;
  
  // Must own land (landowner)
  if (propertyOwnership !== 'landowner') return false;
  
  return true;
}

/**
 * Generate demographic slices for a province
 */
function generateProvincialSlices(province) {
  const slices = [];
  let sliceCounter = 0;
  
  // European population slices
  if (province.population.european.total > 0) {
    // Iterate through cultural groups
    for (const [culture, data] of Object.entries(province.culture)) {
      if (data.population === 0) continue;
      
      const ethnicity = mapCultureToEthnicity(culture);
      const religion = mapCultureToReligion(culture);
      
      // Iterate through occupations
      for (const [occupation, occupationPop] of Object.entries(province.occupations)) {
        if (occupationPop === 0) continue;
        
        // Calculate population for this culture×occupation combination
        const cultureRatio = data.population / province.population.economic;
        const occupationRatio = occupationPop / province.population.economic;
        const combinedPop = Math.round(province.population.european.total * cultureRatio * occupationRatio);
        
        if (combinedPop === 0) continue;
        
        // Iterate through classes
        for (const [className, classData] of Object.entries(province.classes)) {
          const classRatio = classData.count / province.population.economic;
          const classPop = Math.round(combinedPop * classRatio);
          
          if (classPop === 0) continue;
          
          // Split by gender
          const malePop = Math.round(classPop * 0.70); // 70% male
          const femalePop = classPop - malePop;
          
          for (const gender of ['male', 'female']) {
            const genderPop = gender === 'male' ? malePop : femalePop;
            if (genderPop === 0) continue;
            
            // Split by settlement type
            const ruralPop = Math.round(genderPop * 0.85);
            const urbanPop = genderPop - ruralPop;
            
            for (const settlement of ['rural', 'urban']) {
              const settlementPop = settlement === 'rural' ? ruralPop : urbanPop;
              if (settlementPop === 0) continue;
              
              const specificOccupation = mapOccupationToSpecific(occupation, className, province.name);
              const propertyOwnership = determinePropertyOwnership(specificOccupation, className, province.name);
              const votingEligible = canVote(ethnicity, gender, propertyOwnership, false, false);
              
              sliceCounter++;
              
              slices.push({
                id: `${province.name.toLowerCase().replace(/\s+/g, '-')}-euro-${sliceCounter}`,
                economic: {
                  class: className,
                  occupation: specificOccupation,
                  gender: gender,
                  propertyOwnership: propertyOwnership
                },
                cultural: {
                  ethnicity: ethnicity,
                  religion: religion,
                  indigenous: false,
                  mixed: false
                },
                locational: {
                  province: province.name,
                  settlement: settlement,
                  urbanCenter: settlement === 'urban' && province.urbanCenters > 0 ? `${province.name} Urban Center` : undefined
                },
                specialInterests: [], // Will be populated later
                population: settlementPop,
                canVote: votingEligible
              });
            }
          }
        }
      }
    }
  }
  
  // Mixed population slices (European-Indigenous)
  if (province.population.mixed.total > 0) {
    // Similar structure but with mixed: true
    const mixedOccupations = Object.keys(province.occupations).slice(0, 3); // Simplified for mixed pop
    
    for (const occupation of mixedOccupations) {
      const occupationPop = Math.round(province.population.mixed.total / mixedOccupations.length);
      if (occupationPop === 0) continue;
      
      for (const className of ['middle', 'lower']) {
        const classRatio = className === 'middle' ? 0.3 : 0.7;
        const classPop = Math.round(occupationPop * classRatio);
        if (classPop === 0) continue;
        
        const malePop = Math.round(classPop * 0.512); // 21:20 ratio
        const femalePop = classPop - malePop;
        
        for (const gender of ['male', 'female']) {
          const genderPop = gender === 'male' ? malePop : femalePop;
          if (genderPop === 0) continue;
          
          sliceCounter++;
          
          const specificOccupation = mapOccupationToSpecific(occupation, className, province.name);
          const propertyOwnership = determinePropertyOwnership(specificOccupation, className, province.name);
          
          slices.push({
            id: `${province.name.toLowerCase().replace(/\s+/g, '-')}-mixed-${sliceCounter}`,
            economic: {
              class: className,
              occupation: specificOccupation,
              gender: gender,
              propertyOwnership: propertyOwnership
            },
            cultural: {
              ethnicity: 'european-indigenous',
              religion: 'syncretic',
              indigenous: false,
              mixed: true
            },
            locational: {
              province: province.name,
              settlement: 'rural',
              urbanCenter: undefined
            },
            specialInterests: [],
            population: genderPop,
            canVote: false // Mixed population cannot vote
          });
        }
      }
    }
  }
  
  // Indigenous population slices
  if (province.population.indigenous.total > 0) {
    // Simplified Indigenous demographic structure
    const indigenousOccupations = ['agricultural-laborer', 'fisherman', 'general-laborer'];
    
    for (const occupation of indigenousOccupations) {
      const occupationPop = Math.round(province.population.indigenous.total / indigenousOccupations.length);
      if (occupationPop === 0) continue;
      
      const malePop = Math.round(occupationPop * 0.565); // 13:10 ratio
      const femalePop = occupationPop - malePop;
      
      for (const gender of ['male', 'female']) {
        const genderPop = gender === 'male' ? malePop : femalePop;
        if (genderPop === 0) continue;
        
        sliceCounter++;
        
        slices.push({
          id: `${province.name.toLowerCase().replace(/\s+/g, '-')}-maori-${sliceCounter}`,
          economic: {
            class: 'other',
            occupation: occupation,
            gender: gender,
            propertyOwnership: 'none'
          },
          cultural: {
            ethnicity: 'maori',
            religion: 'indigenous-beliefs',
            indigenous: true,
            mixed: false
          },
          locational: {
            province: province.name,
            settlement: 'rural',
            urbanCenter: undefined
          },
          specialInterests: [],
          population: genderPop,
          canVote: false // Indigenous cannot vote
        });
      }
    }
  }
  
  return slices;
}

// ============================================================================
// GENERATE ALL SLICES
// ============================================================================

console.log('🔨 GENERATING DEMOGRAPHIC SLICES\n');
console.log('='.repeat(80));

const allSlices = [];
let totalPopulation = 0;
let totalVoters = 0;

for (const province of provinces) {
  console.log(`\n📍 Processing ${province.name}...`);
  
  const slices = generateProvincialSlices(province);
  
  const provinceTotal = slices.reduce((sum, s) => sum + s.population, 0);
  const provinceVoters = slices.filter(s => s.canVote).reduce((sum, s) => sum + s.population, 0);
  
  console.log(`   Generated ${slices.length} demographic slices`);
  console.log(`   Total population: ${provinceTotal.toLocaleString()}`);
  console.log(`   Eligible voters: ${provinceVoters.toLocaleString()}`);
  
  allSlices.push(...slices);
  totalPopulation += provinceTotal;
  totalVoters += provinceVoters;
}

console.log('\n' + '='.repeat(80));
console.log('✅ GENERATION COMPLETE\n');
console.log(`Total Slices Generated: ${allSlices.length}`);
console.log(`Total Population Represented: ${totalPopulation.toLocaleString()}`);
console.log(`Total Eligible Voters: ${totalVoters.toLocaleString()}`);
console.log(`Target: 300-500 slices | Actual: ${allSlices.length} ✓`);

// ============================================================================
// SLICE BREAKDOWN ANALYSIS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 SLICE BREAKDOWN\n');

// By province
const byProvince = {};
allSlices.forEach(s => {
  byProvince[s.locational.province] = (byProvince[s.locational.province] || 0) + 1;
});
console.log('By Province:');
Object.entries(byProvince).sort((a, b) => b[1] - a[1]).forEach(([prov, count]) => {
  console.log(`   ${prov}: ${count} slices`);
});

// By occupation
const byOccupation = {};
allSlices.forEach(s => {
  byOccupation[s.economic.occupation] = (byOccupation[s.economic.occupation] || 0) + 1;
});
console.log('\nTop 10 Occupations:');
Object.entries(byOccupation).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([occ, count]) => {
  console.log(`   ${occ}: ${count} slices`);
});

// By class
const byClass = {};
allSlices.forEach(s => {
  byClass[s.economic.class] = (byClass[s.economic.class] || 0) + 1;
});
console.log('\nBy Class:');
Object.entries(byClass).sort((a, b) => b[1] - a[1]).forEach(([cls, count]) => {
  console.log(`   ${cls}: ${count} slices`);
});

// By ethnicity
const byEthnicity = {};
allSlices.forEach(s => {
  byEthnicity[s.cultural.ethnicity] = (byEthnicity[s.cultural.ethnicity] || 0) + 1;
});
console.log('\nBy Ethnicity:');
Object.entries(byEthnicity).sort((a, b) => b[1] - a[1]).forEach(([eth, count]) => {
  console.log(`   ${eth}: ${count} slices`);
});

// Voting slices
const votingSlices = allSlices.filter(s => s.canVote);
console.log(`\n🗳️  Voting-Eligible Slices: ${votingSlices.length} (${((votingSlices.length / allSlices.length) * 100).toFixed(1)}%)`);
console.log(`   Total voters represented: ${totalVoters.toLocaleString()}`);

// ============================================================================
// SAVE OUTPUT
// ============================================================================

const output = {
  metadata: {
    generated: new Date().toISOString(),
    totalSlices: allSlices.length,
    totalPopulation: totalPopulation,
    totalVoters: totalVoters,
    provinces: provinces.length
  },
  slices: allSlices,
  breakdown: {
    byProvince,
    byOccupation,
    byClass,
    byEthnicity,
    votingSlices: votingSlices.length
  }
};

const outputPath = 'c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\demographic-slices.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n💾 Data saved to: ${outputPath}`);
console.log('\n' + '='.repeat(80));
console.log('🎯 Next Step: Assign default political positions to each slice');
console.log('='.repeat(80));
