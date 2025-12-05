/**
 * Assign Default Political Positions
 * Sets political cube, issue positions, and salience weights for each demographic slice
 */

const fs = require('fs');

// Load demographic slices
const sliceData = JSON.parse(
  fs.readFileSync('c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\demographic-slices.json', 'utf8')
);

const slices = sliceData.slices;

// ============================================================================
// POLITICAL POSITION TEMPLATES
// ============================================================================

/**
 * Define political archetypes based on demographic characteristics
 */

function getDefaultPoliticalPosition(slice) {
  const { economic, cultural, locational } = slice;
  
  // Initialize default position
  const position = {
    cube: {
      economic: 0,
      authority: 0,
      social: 0
    },
    issues: {},
    salience: {}
  };
  
  // ============================================================================
  // POLITICAL CUBE POSITIONING
  // ============================================================================
  
  // Economic axis (-10 socialist to +10 capitalist)
  let economicBase = 0;
  
  // Class influence
  if (economic.class === 'upper') economicBase += 8;
  else if (economic.class === 'middle') economicBase += 3;
  else if (economic.class === 'lower') economicBase -= 4;
  
  // Occupation influence
  if (economic.occupation.includes('landowner')) economicBase += 2;
  if (economic.occupation.includes('tenant')) economicBase -= 3;
  if (economic.occupation.includes('laborer')) economicBase -= 2;
  if (economic.occupation === 'manufacturer') economicBase += 4;
  if (economic.occupation === 'merchant') economicBase += 5;
  if (economic.occupation.includes('miner')) economicBase -= 2;
  
  // Property ownership influence
  if (economic.propertyOwnership === 'landowner') economicBase += 2;
  if (economic.propertyOwnership === 'tenant') economicBase -= 2;
  
  position.cube.economic = Math.max(-10, Math.min(10, economicBase));
  
  // Authority axis (-10 anarchist to +10 authoritarian)
  let authorityBase = 0;
  
  // Class influence
  if (economic.class === 'upper') authorityBase -= 5; // Favor limited government
  else if (economic.class === 'middle') authorityBase -= 2;
  else if (economic.class === 'lower') authorityBase += 3; // Want government support
  
  // Occupation influence
  if (economic.occupation === 'government-official') authorityBase += 4;
  if (economic.occupation === 'military') authorityBase += 6;
  if (economic.occupation === 'missionary') authorityBase += 3;
  
  // Ethnicity influence
  if (cultural.indigenous) authorityBase += 7; // Resist colonial authority
  if (cultural.mixed) authorityBase += 5;
  
  position.cube.authority = Math.max(-10, Math.min(10, authorityBase));
  
  // Social axis (-10 progressive to +10 conservative)
  let socialBase = 0;
  
  // Class influence
  if (economic.class === 'upper') socialBase += 7;
  else if (economic.class === 'middle') socialBase += 4;
  else if (economic.class === 'lower') socialBase += 2;
  
  // Ethnicity/Religion influence
  if (cultural.religion === 'methodist') socialBase += 5;
  if (cultural.religion === 'presbyterian') socialBase += 6;
  if (cultural.religion === 'catholic') socialBase += 4;
  if (cultural.religion === 'atheist') socialBase -= 5;
  if (cultural.indigenous) socialBase -= 6; // Progressive on social issues
  
  // Occupation influence
  if (economic.occupation === 'missionary') socialBase += 8;
  if (economic.occupation === 'teacher') socialBase -= 2;
  
  // Gender influence
  if (economic.gender === 'female') socialBase -= 1; // Slightly more progressive
  
  position.cube.social = Math.max(-10, Math.min(10, socialBase));
  
  // ============================================================================
  // ISSUE POSITIONS (34 issues, -10 to +10 scale)
  // ============================================================================
  
  // Governance
  position.issues.sovereignty = cultural.indigenous ? 10 : (economic.class === 'upper' ? -8 : -3);
  position.issues.responsibleGovernment = slice.canVote ? 8 : (cultural.indigenous ? -5 : 0);
  position.issues.centralization = economic.class === 'upper' ? -5 : (locational.province === 'Southland' ? -7 : 0);
  
  // Property Rights
  position.issues.propertyRights = economic.propertyOwnership === 'landowner' ? 9 : (economic.propertyOwnership === 'tenant' ? -4 : 0);
  position.issues.eminentDomain = economic.class === 'upper' ? -8 : 2;
  position.issues.landSales = cultural.indigenous ? -10 : (economic.occupation.includes('landowner') ? 7 : 2);
  
  // Economy
  position.issues.taxes = economic.class === 'upper' ? -9 : (economic.class === 'lower' ? 5 : 0);
  position.issues.protectionism = economic.occupation === 'manufacturer' ? 8 : (economic.occupation === 'merchant' ? -6 : 0);
  position.issues.economicIntervention = economic.class === 'lower' ? 6 : (economic.class === 'upper' ? -7 : -2);
  position.issues.businessRegulation = economic.occupation.includes('miner') ? 6 : (economic.occupation === 'manufacturer' ? -8 : 0);
  position.issues.privatization = economic.class === 'upper' ? 7 : -3;
  
  // Labor
  position.issues.workerRights = economic.occupation.includes('laborer') || economic.occupation.includes('miner') ? 9 : (economic.class === 'upper' ? -6 : 2);
  position.issues.minimumWage = economic.class === 'lower' ? 8 : (economic.class === 'upper' ? -7 : 0);
  
  // Welfare
  position.issues.welfareState = economic.class === 'lower' ? 7 : (economic.class === 'upper' ? -8 : -2);
  position.issues.healthcare = economic.class === 'lower' ? 6 : (economic.occupation === 'doctor' ? 4 : -3);
  position.issues.universalIncome = economic.class === 'lower' ? 5 : -7;
  
  // Suffrage/Rights
  position.issues.propertySuffrage = slice.canVote ? 8 : (economic.class === 'middle' ? 3 : -5);
  position.issues.womensSuffrage = economic.gender === 'female' ? 7 : (economic.class === 'upper' ? -8 : -4);
  position.issues.indigenousRights = cultural.indigenous ? 10 : (cultural.mixed ? 7 : (economic.class === 'upper' ? -6 : -2));
  position.issues.gayRights = cultural.religion === 'atheist' ? 5 : (economic.occupation === 'missionary' ? -9 : -6);
  position.issues.transRights = cultural.religion === 'atheist' ? 4 : -8;
  
  // Indigenous-specific
  position.issues.kingitanga = cultural.indigenous ? 10 : (cultural.mixed ? 5 : -7);
  position.issues.waterRights = cultural.indigenous ? 10 : (economic.occupation === 'fisherman' ? 4 : -2);
  
  // Immigration
  position.issues.immigration = cultural.indigenous ? -8 : (economic.class === 'upper' ? 6 : (economic.occupation.includes('laborer') ? -3 : 2));
  
  // Education
  position.issues.educationRights = economic.occupation === 'teacher' ? 8 : (economic.class === 'upper' ? 5 : 3);
  
  // Justice
  position.issues.deathPenalty = cultural.religion === 'methodist' ? -6 : (economic.class === 'upper' ? 4 : 2);
  position.issues.justice = economic.occupation === 'lawyer' ? 6 : 0;
  position.issues.policeReform = economic.class === 'lower' ? 4 : -3;
  
  // Foreign Policy
  position.issues.interventionism = economic.occupation === 'military' ? 7 : (cultural.indigenous ? -8 : -2);
  position.issues.globalism = economic.occupation === 'merchant' ? 8 : (cultural.indigenous ? -7 : 0);
  
  // Social
  position.issues.privacyRights = economic.class === 'upper' ? 7 : 2;
  position.issues.animalRights = cultural.religion === 'methodist' ? 5 : -2;
  position.issues.productiveRights = economic.class === 'upper' ? 8 : -4;
  
  // Environment
  position.issues.environmentalRegulation = economic.occupation.includes('miner') ? -7 : (cultural.indigenous ? 6 : 0);
  
  // Equity
  position.issues.equity = economic.class === 'lower' ? 6 : (economic.class === 'upper' ? -8 : -2);
  
  // ============================================================================
  // SALIENCE WEIGHTS (0-1 per issue, sum ≤ 10.0)
  // ============================================================================
  
  // TOP 9 ISSUES OF THE ERA (1840s-1850s New Zealand):
  // 1. Sovereignty, 2. Property Rights, 3. Taxes, 4. Protectionism,
  // 5. Land Sales, 6. Kīngitanga, 7. Responsible Government,
  // 8. Centralization, 9. Property-Based Suffrage
  
  // Initialize all issues to very low baseline
  const allIssues = Object.keys(position.issues);
  allIssues.forEach(issue => {
    position.salience[issue] = 0.05; // Lower baseline for non-priority issues
  });
  
  // ERA-APPROPRIATE SALIENCE: Focus on the 9 key issues of the time
  
  // Base salience for top 9 issues (everyone cares about these to some degree)
  const top9Issues = ['sovereignty', 'propertyRights', 'taxes', 'protectionism', 
                      'landSales', 'kingitanga', 'responsibleGovernment', 
                      'centralization', 'propertySuffrage'];
  
  top9Issues.forEach(issue => {
    position.salience[issue] = 0.3; // Base salience for era-defining issues
  });
  
  // DEMOGRAPHIC-SPECIFIC SALIENCE ADJUSTMENTS
  
  // Property owners care deeply about property rights, taxes, and suffrage
  if (economic.propertyOwnership === 'landowner') {
    position.salience.propertyRights = 1.0;
    position.salience.taxes = 1.0;
    position.salience.propertySuffrage = 0.9; // They have the vote
    position.salience.landSales = 0.8;
    position.salience.centralization = 0.6; // Provincial autonomy affects their land
  }
  
  // Tenant farmers care about land access and suffrage expansion
  if (economic.propertyOwnership === 'tenant') {
    position.salience.landSales = 1.0; // Need land to buy
    position.salience.propertyRights = 0.8;
    position.salience.propertySuffrage = 0.9; // Want voting rights
    position.salience.taxes = 0.5;
  }
  
  // Indigenous care deeply about sovereignty, land, and Kīngitanga
  if (cultural.indigenous) {
    position.salience.sovereignty = 1.0;
    position.salience.kingitanga = 1.0;
    position.salience.landSales = 1.0;
    position.salience.propertyRights = 0.9; // Communal vs individual property
    position.salience.responsibleGovernment = 0.7; // Self-governance
    position.salience.centralization = 0.6;
    // Lower salience for other issues
    position.salience.indigenousRights = 0.4;
    position.salience.waterRights = 0.4;
  }
  
  // Mixed population cares about sovereignty and land rights
  if (cultural.mixed) {
    position.salience.sovereignty = 0.8;
    position.salience.kingitanga = 0.7;
    position.salience.landSales = 0.7;
    position.salience.propertyRights = 0.6;
    position.salience.indigenousRights = 0.3;
  }
  
  // Upper class cares about taxes, property, and governance
  if (economic.class === 'upper') {
    position.salience.taxes = 1.0;
    position.salience.propertyRights = 1.0;
    position.salience.responsibleGovernment = 0.8; // Want elected parliament
    position.salience.centralization = 0.7;
    position.salience.protectionism = 0.6;
  }
  
  // Middle class cares about suffrage and economic policy
  if (economic.class === 'middle') {
    position.salience.propertySuffrage = 0.8; // Many want expanded voting
    position.salience.taxes = 0.7;
    position.salience.protectionism = 0.6;
    position.salience.responsibleGovernment = 0.7;
  }
  
  // Lower class cares about suffrage expansion and land access
  if (economic.class === 'lower') {
    position.salience.propertySuffrage = 0.9; // Want voting rights
    position.salience.landSales = 0.6; // Want access to land
    position.salience.taxes = 0.5;
    // Lower priority on labor issues in this era
    position.salience.workerRights = 0.3;
    position.salience.minimumWage = 0.2;
  }
  
  // Merchants care about trade and economic policy
  if (economic.occupation === 'merchant') {
    position.salience.protectionism = 1.0;
    position.salience.taxes = 0.9;
    position.salience.centralization = 0.6; // Trade regulations
    position.salience.responsibleGovernment = 0.7;
  }
  
  // Manufacturers care about protectionism and property
  if (economic.occupation === 'manufacturer') {
    position.salience.protectionism = 1.0;
    position.salience.propertyRights = 0.8;
    position.salience.taxes = 0.8;
  }
  
  // Farmers care about land and local governance
  if (economic.occupation.includes('farmer') || economic.occupation === 'rancher') {
    position.salience.landSales = 0.9;
    position.salience.propertyRights = 0.9;
    position.salience.centralization = 0.7; // Local control
    position.salience.taxes = 0.6;
  }
  
  // Government officials care about governance structure
  if (economic.occupation === 'government-official') {
    position.salience.responsibleGovernment = 1.0;
    position.salience.centralization = 0.9;
    position.salience.sovereignty = 0.8;
  }
  
  // Missionaries care about governance and cultural issues
  if (economic.occupation === 'missionary') {
    position.salience.sovereignty = 0.7;
    position.salience.kingitanga = 0.6;
    position.salience.responsibleGovernment = 0.6;
    position.salience.landSales = 0.5; // Protecting Māori land
  }
  
  // Voters (those who can vote) care about representation
  if (slice.canVote) {
    position.salience.responsibleGovernment = Math.max(position.salience.responsibleGovernment || 0, 0.8);
    position.salience.propertySuffrage = Math.max(position.salience.propertySuffrage || 0, 0.7);
    position.salience.centralization = Math.max(position.salience.centralization || 0, 0.6);
  }
  
  // Provincial variations
  // Southland (frontier) cares more about land and local autonomy
  if (locational.province === 'Southland') {
    position.salience.landSales = Math.max(position.salience.landSales || 0, 0.7);
    position.salience.centralization = Math.max(position.salience.centralization || 0, 0.7);
  }
  
  // Te Moana-a-Toir (remote frontier) cares about sovereignty
  if (locational.province === 'Te Moana-a-Toir') {
    position.salience.sovereignty = Math.max(position.salience.sovereignty || 0, 0.8);
    position.salience.centralization = Math.max(position.salience.centralization || 0, 0.7);
  }
  
  // Normalize salience to sum ≤ 10.0
  const salienceSum = Object.values(position.salience).reduce((a, b) => a + b, 0);
  if (salienceSum > 10.0) {
    const scaleFactor = 10.0 / salienceSum;
    allIssues.forEach(issue => {
      position.salience[issue] *= scaleFactor;
    });
  }
  
  return position;
}

// ============================================================================
// ASSIGN POSITIONS TO ALL SLICES
// ============================================================================

console.log('🎯 ASSIGNING POLITICAL POSITIONS\n');
console.log('='.repeat(80));

let processedCount = 0;

for (const slice of slices) {
  slice.defaultPosition = getDefaultPoliticalPosition(slice);
  processedCount++;
  
  if (processedCount % 200 === 0) {
    console.log(`   Processed ${processedCount}/${slices.length} slices...`);
  }
}

console.log(`   Processed ${processedCount}/${slices.length} slices... COMPLETE`);

// ============================================================================
// VALIDATION & STATISTICS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 POSITION STATISTICS\n');

// Calculate average positions by demographic
const upperClassSlices = slices.filter(s => s.economic.class === 'upper');
const lowerClassSlices = slices.filter(s => s.economic.class === 'lower');
const indigenousSlices = slices.filter(s => s.cultural.indigenous);
const voterSlices = slices.filter(s => s.canVote);

function avgCube(slices) {
  const sum = slices.reduce((acc, s) => ({
    economic: acc.economic + s.defaultPosition.cube.economic,
    authority: acc.authority + s.defaultPosition.cube.authority,
    social: acc.social + s.defaultPosition.cube.social
  }), { economic: 0, authority: 0, social: 0 });
  
  return {
    economic: (sum.economic / slices.length).toFixed(1),
    authority: (sum.authority / slices.length).toFixed(1),
    social: (sum.social / slices.length).toFixed(1)
  };
}

console.log('Average Political Cube Positions:');
console.log(`   Upper Class (${upperClassSlices.length} slices): Econ ${avgCube(upperClassSlices).economic}, Auth ${avgCube(upperClassSlices).authority}, Social ${avgCube(upperClassSlices).social}`);
console.log(`   Lower Class (${lowerClassSlices.length} slices): Econ ${avgCube(lowerClassSlices).economic}, Auth ${avgCube(lowerClassSlices).authority}, Social ${avgCube(lowerClassSlices).social}`);
console.log(`   Indigenous (${indigenousSlices.length} slices): Econ ${avgCube(indigenousSlices).economic}, Auth ${avgCube(indigenousSlices).authority}, Social ${avgCube(indigenousSlices).social}`);
console.log(`   Voters (${voterSlices.length} slices): Econ ${avgCube(voterSlices).economic}, Auth ${avgCube(voterSlices).authority}, Social ${avgCube(voterSlices).social}`);

// Top salient issues
const allSaliences = {};
slices.forEach(slice => {
  Object.entries(slice.defaultPosition.salience).forEach(([issue, salience]) => {
    if (!allSaliences[issue]) allSaliences[issue] = [];
    allSaliences[issue].push(salience);
  });
});

const avgSaliences = Object.entries(allSaliences).map(([issue, values]) => ({
  issue,
  avg: values.reduce((a, b) => a + b, 0) / values.length
})).sort((a, b) => b.avg - a.avg);

console.log('\nTop 10 Most Salient Issues (avg across all slices):');
avgSaliences.slice(0, 10).forEach(({ issue, avg }) => {
  console.log(`   ${issue}: ${avg.toFixed(3)}`);
});

// ============================================================================
// SAVE OUTPUT
// ============================================================================

const output = {
  metadata: {
    ...sliceData.metadata,
    positionsAssigned: new Date().toISOString()
  },
  slices: slices,
  breakdown: sliceData.breakdown,
  statistics: {
    averagePositions: {
      upperClass: avgCube(upperClassSlices),
      lowerClass: avgCube(lowerClassSlices),
      indigenous: avgCube(indigenousSlices),
      voters: avgCube(voterSlices)
    },
    topSalientIssues: avgSaliences.slice(0, 10)
  }
};

const outputPath = 'c:\\Users\\NateL\\Documents\\My Code\\polsim\\backend\\demographic-slices-with-positions.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n💾 Data saved to: ${outputPath}`);
console.log('\n' + '='.repeat(80));
console.log('✅ POLITICAL POSITIONS ASSIGNED');
console.log('='.repeat(80));
console.log('\n🎯 Next Step: Answer granular demographic questions & verify data');
console.log('='.repeat(80));
