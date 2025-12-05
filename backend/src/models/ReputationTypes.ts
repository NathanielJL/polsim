/**
 * Reputation System Types
 * Multi-dimensional demographic system for political reputation tracking
 * Based on Zealandia #1 specifications
 */

// ============================================================================
// DEMOGRAPHIC SLICING
// ============================================================================

/**
 * Layer 1: Economic × Occupation × Gender
 * Primary economic and occupational identity
 */
export interface EconomicDemographic {
  class: 'upper' | 'middle' | 'lower' | 'other'; // 4 types
  occupation: OccupationType; // ~15 types
  gender: 'male' | 'female'; // 2 types
  propertyOwnership?: 'landowner' | 'tenant' | 'none'; // For land-based occupations
}

export type OccupationType =
  // Agriculture & Livestock
  | 'landowner-farmer'
  | 'tenant-farmer'
  | 'agricultural-laborer'
  | 'rancher'
  
  // Maritime & Fishing
  | 'fisherman'
  | 'whaler'
  | 'sealer'
  | 'merchant-sailor'
  
  // Mining & Quarrying
  | 'coal-miner'
  | 'gold-miner'
  | 'industrial-miner'
  | 'quarry-worker'
  
  // Manufacturing & Artisans
  | 'manufacturer'
  | 'artisan'
  | 'craftsman'
  
  // Trade & Commerce
  | 'merchant'
  | 'shopkeeper'
  | 'trader'
  
  // Professionals
  | 'lawyer'
  | 'doctor'
  | 'teacher'
  | 'government-official'
  
  // Labor & Services
  | 'domestic-servant'
  | 'general-laborer'
  
  // Special
  | 'missionary'
  | 'military'
  | 'frontier-surveyor'
  
  // Unemployed
  | 'unemployed';

/**
 * Layer 2: Culture × Religion
 * Cultural and religious identity
 */
export interface CulturalDemographic {
  ethnicity: EthnicityType; // ~11 types
  religion: ReligionType; // ~8 types
  indigenous: boolean;
  mixed: boolean;
}

export type EthnicityType =
  // European
  | 'english'
  | 'irish'
  | 'scottish'
  | 'dutch'
  | 'french'
  | 'spanish'
  
  // Indigenous
  | 'maori'
  
  // Mixed
  | 'european-indigenous'
  
  // Other
  | 'highlander'
  | 'moriri'
  | 'other';

export type ReligionType =
  | 'anglican'
  | 'methodist'
  | 'presbyterian'
  | 'catholic'
  | 'protestant'
  | 'atheist'
  | 'indigenous-beliefs'
  | 'syncretic';

/**
 * Layer 3: Special Interest & Location
 * Geographic and special interest affiliations
 */
export interface LocationalDemographic {
  province: string; // 7 provinces
  settlement: 'urban' | 'rural'; // 2 types
  urbanCenter?: string; // Specific city/town name if urban
}

export interface SpecialInterest {
  group: SpecialInterestGroup;
  salience: number; // 0-1, how strongly they identify with this group
}

export type SpecialInterestGroup =
  // Land & Property
  | 'large-landowners'
  | 'small-landowners'
  | 'tenant-farmers-union'
  
  // Labor
  | 'workers-collective'
  | 'miners-association'
  | 'maritime-workers'
  
  // Business
  | 'merchants-guild'
  | 'manufacturers-association'
  
  // Indigenous Rights
  | 'kingitanga-supporters'
  | 'treaty-rights-advocates'
  | 'assimilation-advocates'
  
  // Political
  | 'responsible-government-advocates'
  | 'crown-loyalists'
  | 'provincial-autonomy'
  | 'centralization-advocates'
  
  // Social
  | 'suffrage-movement'
  | 'temperance-movement'
  | 'education-reformers'
  
  // Religious
  | 'missionary-societies'
  | 'secular-reformers';

/**
 * Complete Demographic Slice
 * Represents a single demographic group that tracks reputation
 */
export interface DemographicSlice {
  id: string; // Unique identifier
  
  // Core demographics
  economic: EconomicDemographic;
  cultural: CulturalDemographic;
  locational: LocationalDemographic;
  
  // Special interests (can belong to multiple)
  specialInterests: SpecialInterest[];
  
  // Population count
  population: number;
  
  // Voting eligibility
  canVote: boolean;
  
  // Default political position
  defaultPosition: PoliticalPosition;
}

// ============================================================================
// POLITICAL POSITIONING
// ============================================================================

/**
 * 3D Political Cube (-10 to +10 on each axis)
 */
export interface PoliticalCube {
  economic: number; // -10 (Regulation) to +10 (Laissez-faire)
  authority: number; // -10 (Totalitarian) to +10 (Anarchist)
  social: number; // -10 (Progressive) to +10 (Conservative)
}

/**
 * 34 Specific Policy Issues (-10 to +10 on each scale)
 */
export interface IssuePositions {
  // Governance & Sovereignty
  sovereignty: number; // -10 National vs +10 Supranational
  responsibleGovernment: number; // -10 Imperial vs +10 Elected Parliament
  centralization: number; // -10 Strong Central vs +10 Provincial Autonomy
  
  // Property & Land
  propertyRights: number; // -10 Absolute Private vs +10 Social Responsibility
  eminentDomain: number; // -10 Public Good vs +10 Private Protection
  landSales: number; // -10 Accelerated Acquisition vs +10 Cessation (Tuku Whenua)
  
  // Economy & Trade
  taxes: number; // -10 Lower/Flat vs +10 Progressive
  protectionism: number; // -10 Tariffs vs +10 Free Trade
  economicIntervention: number; // -10 Laissez-faire vs +10 Keynesian
  businessRegulation: number; // -10 Deregulation vs +10 Regulation
  privatization: number; // -10 Market-Driven vs +10 Public Control
  
  // Labor & Employment
  workerRights: number; // -10 Employer Flexibility vs +10 Collective Bargaining
  minimumWage: number; // -10 Market-Driven vs +10 Living Wage
  
  // Welfare & Social Services
  welfareState: number; // -10 Limited State vs +10 Comprehensive Social Security
  healthcare: number; // -10 Private vs +10 Universal
  universalIncome: number; // -10 Work Requirement vs +10 UBI
  
  // Rights & Suffrage
  propertySuffrage: number; // -10 Restricted vs +10 Universal
  womensSuffrage: number; // -10 Traditional Roles vs +10 Universal Suffrage
  indigenousRights: number; // -10 Assimilation vs +10 Self-Determination
  gayRights: number; // -10 Traditional vs +10 Expanded Rights
  transRights: number; // -10 Traditional vs +10 Expanded Rights
  
  // Indigenous Issues (NZ-specific)
  kingitanga: number; // -10 Challenge to Crown vs +10 Māori Unity/Land Protection
  waterRights: number; // -10 Centralized/Economic vs +10 Indigenous/Ecological
  
  // Immigration & Integration
  immigration: number; // -10 Strict Control vs +10 Openness
  
  // Education
  educationRights: number; // -10 Local Control vs +10 Equity/Standardization
  
  // Justice & Law
  deathPenalty: number; // -10 Retribution vs +10 Abolition
  justice: number; // -10 Law & Order vs +10 Rehabilitation
  policeReform: number; // -10 Increased Funding vs +10 Reallocation
  
  // Foreign Policy
  interventionism: number; // -10 Isolationism vs +10 Active Engagement
  globalism: number; // -10 National Sovereignty vs +10 Interdependence
  
  // Social Issues
  privacyRights: number; // -10 Surveillance vs +10 Civil Liberties
  animalRights: number; // -10 Welfare/Utility vs +10 Liberation/Rights
  productiveRights: number; // -10 Pro-Life vs +10 Pro-Choice (reproductive)
  
  // Environment
  environmentalRegulation: number; // -10 Economic Cost vs +10 Ecological Protection
  
  // Equity
  equity: number; // -10 Equality of Opportunity vs +10 Equity of Outcome
}

/**
 * Issue Salience - How much a demographic cares about each issue
 * Sum of all saliences must be ≤ 10.0
 */
export type IssueSalience = {
  [K in keyof IssuePositions]: number; // 0-1 for each issue
};

/**
 * Complete Political Position
 */
export interface PoliticalPosition {
  cube: PoliticalCube;
  issues: IssuePositions;
  salience: IssueSalience;
}

// ============================================================================
// REPUTATION TRACKING
// ============================================================================

/**
 * Reputation Score for a player with a demographic group
 */
export interface ReputationScore {
  playerId: string;
  demographicSliceId: string;
  
  // Current approval rating (0-100%)
  approval: number;
  
  // Historical tracking
  approvalHistory: ApprovalDataPoint[];
  
  // Last updated
  lastUpdated: Date;
  turnUpdated: number;
}

export interface ApprovalDataPoint {
  turn: number;
  approval: number;
  change: number;
  reason?: string; // e.g., "Voted YES on Minimum Wage Bill"
}

/**
 * Reputation Change Event
 */
export interface ReputationChange {
  playerId: string;
  demographicSliceId: string;
  
  // Change amount
  delta: number;
  
  // Source of change
  source: ReputationChangeSource;
  sourceId: string; // Bill ID, news article ID, campaign ID, etc.
  
  // Calculation details
  calculation: {
    issueMatches?: Array<{
      issue: keyof IssuePositions;
      playerPosition: number;
      groupPosition: number;
      salience: number;
      weight: number;
      contribution: number;
    }>;
    cubeMatch?: {
      distance: number;
      weight: number;
      contribution: number;
    };
    totalDelta: number;
  };
  
  timestamp: Date;
  turn: number;
}

export type ReputationChangeSource =
  | 'bill-proposal'
  | 'bill-vote-yes'
  | 'bill-vote-no'
  | 'bill-vote-abstain'
  | 'bill-outcome'
  | 'news-article'
  | 'campaign'
  | 'endorsement'
  | 'scandal'
  | 'turn-decay';

// ============================================================================
// CAMPAIGN SYSTEM
// ============================================================================

/**
 * Campaign Action
 */
export interface Campaign {
  _id: string;
  sessionId: string;
  playerId: string;
  
  // Target
  targetDemographicSliceId: string;
  targetProvince: string;
  
  // Campaign details
  startTurn: number;
  duration: 12; // Fixed 12 turns
  endTurn: number;
  
  // Cost
  actionPointCost: 1;
  moneyCost: 100;
  
  // Effect
  boost: number; // Random 1-5% rolled at campaign start
  
  // Status
  status: 'active' | 'completed' | 'cancelled';
  
  createdAt: Date;
}

/**
 * Endorsement
 */
export interface Endorsement {
  _id: string;
  sessionId: string;
  
  // Endorser and endorsed
  endorserId: string;
  endorsedId: string;
  
  // Turn given
  turn: number;
  
  // Transfer rate based on endorser's approval with each demographic
  // 0-39%: -7 to +1%
  // 40-59%: -5 to +5%
  // 60-100%: -1 to +7%
  transfers: Array<{
    demographicSliceId: string;
    endorserApproval: number;
    transferRate: number; // -7 to +7
  }>;
  
  // Cost
  actionPointCost: 1;
  
  createdAt: Date;
}

// ============================================================================
// NEWS SYSTEM
// ============================================================================

/**
 * News Article Impact
 */
export interface NewsImpact {
  articleId: string;
  
  // Article details
  outletType: 'ai-conservative' | 'ai-moderate' | 'ai-progressive' | 'player-provincial';
  province?: string; // For player provincial outlets
  
  // Targets mentioned
  playersAffected: Array<{
    playerId: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  
  // Impact on demographics
  demographicImpacts: Array<{
    demographicSliceId: string;
    playerId: string;
    delta: number; // -5 to +5 for AI, -5 to +5 for player
    reason: string;
  }>;
  
  // Decay
  turnsActive: number;
  decayRate: 0.20; // 20% decay per turn
  
  publishedTurn: number;
}

// ============================================================================
// VOTING SYSTEM
// ============================================================================

/**
 * Vote Calculation for a demographic group
 */
export interface DemographicVote {
  demographicSliceId: string;
  
  // Population voting
  eligibleVoters: number;
  
  // Turnout based on factors
  baseTurnout: number; // 0-1
  reputationModifier: number; // Based on approval ratings
  finalTurnout: number;
  
  // Effective votes
  effectiveVotes: number; // population × turnout × (1 + reputation/100)
  
  // Distribution
  voteDistribution: Array<{
    playerId: string;
    votes: number;
    percentage: number;
  }>;
}

/**
 * Election Results
 */
export interface ElectionResult {
  sessionId: string;
  turn: number;
  
  // Election type
  electionType: 'governor' | 'lower-house' | 'upper-house' | 'superintendent' | 'provincial-council';
  province?: string; // For provincial elections
  
  // Results
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  
  // Candidates
  candidates: Array<{
    playerId: string;
    playerName: string;
    party?: string;
    votes: number;
    percentage: number;
  }>;
  
  // Winner
  winnerId: string;
  
  // Demographic breakdown
  demographicBreakdown: DemographicVote[];
  
  completedAt: Date;
}

// ============================================================================
// PARTY SYSTEM
// ============================================================================

/**
 * Political Party
 */
export interface PoliticalParty {
  _id: string;
  sessionId: string;
  
  name: string;
  type: 'provincial' | 'federal';
  province?: string; // For provincial parties
  
  // Leadership
  leader?: string; // Player ID
  second?: string; // Player ID
  
  // Faction support
  supportedFaction?: 'loyalty-league' | 'broader-reform' | 'miscegenation-bloc';
  
  // Members
  members: string[]; // Player IDs
  npcMembers: string[]; // NPC IDs
  
  // Position
  platform: PoliticalPosition;
  
  createdAt: Date;
}

/**
 * Political Faction (pre-defined)
 */
export interface PoliticalFaction {
  name: 'loyalty-league' | 'broader-reform' | 'miscegenation-bloc';
  
  // Default position
  position: PoliticalPosition;
  
  // Demographic support base
  supportingDemographics: string[]; // Demographic slice IDs
  
  // Bonus for party support
  supportBonus: 0.01; // +1% from agreeing population
}

// ============================================================================
// POLICY IMPACT
// ============================================================================

/**
 * Policy/Bill Position
 */
export interface PolicyPosition {
  policyId: string;
  
  // Position on cube
  cubePosition: PoliticalCube;
  
  // Position on relevant issues
  issuePositions: Partial<IssuePositions>;
  
  // Proposer
  proposerId: string;
  
  // Votes
  yesVotes: string[]; // Player IDs
  noVotes: string[];
  abstainVotes: string[];
  
  // Outcome
  passed: boolean;
  
  // Reputation impacts
  impacts: ReputationChange[];
}

// ============================================================================
// TURN SYSTEM
// ============================================================================

/**
 * Turn Update for Reputation
 */
export interface TurnReputationUpdate {
  turn: number;
  
  // Updates every 3 turns
  updateType: 'reputation-refresh' | 'annual-data' | 'none';
  
  // Decay old scandals
  decayedScandals: string[];
  
  // News decay
  decayedNews: string[];
  
  // Campaign completions
  completedCampaigns: string[];
  
  // Reputation changes this turn
  reputationChanges: ReputationChange[];
  
  processedAt: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ReputationSystemConfig {
  // Demographic generation
  totalDemographicSlices: number; // Target 300-500
  
  // Update frequencies
  reputationUpdateFrequency: 3; // Every 3 turns
  annualDataFrequency: 12; // Every 12 turns
  
  // Decay rates
  scandalDecayRate: number; // Percentage per turn
  newsDecayRate: 0.20; // 20% per turn
  
  // Campaign settings
  campaignDuration: 12;
  campaignCost: { actionPoints: 1; money: 100 };
  campaignBoostRange: { min: 1; max: 5 };
  
  // Endorsement settings
  endorsementCost: { actionPoints: 1; money: 0 };
  endorsementRanges: {
    low: { approvalRange: [0, 39]; transferRange: [-7, 1] };
    medium: { approvalRange: [40, 59]; transferRange: [-5, 5] };
    high: { approvalRange: [60, 100]; transferRange: [-1, 7] };
  };
  
  // Reputation impact weights
  reputationImpacts: {
    proposer: 1.0; // 100%
    yesVoter: 0.4; // 40%
    noVoter: -0.2; // -20% (opposite)
    abstainVoter: 0.0; // 0%
  };
  
  // News impact ranges
  newsImpactRanges: {
    ai: { min: -5; max: 5 };
    player: { min: -5; max: 5 };
  };
}

// ============================================================================
// LEGACY TYPES (for backwards compatibility)
// ============================================================================

export interface ReputationGroup {
  id: string;
  sessionId: string;
  name: string;
  type: 'political' | 'cultural' | 'religious' | 'racial' | 'socioeconomic';
  
  // Reference IDs
  archetypeId?: string; // For political groups
  cultureId?: string; // For cultural groups
  religionId?: string; // For religious groups
  
  // Demographics
  population: number; // Number of people in this group
  
  // Ideology profile (for political alignment)
  ideology?: {
    economic: number; // -10 to +10
    social: number;
    personal: number;
  };
  
  // Characteristics
  traits?: string[]; // e.g., ["conservative", "rural", "religious"]
  
  // Influence
  politicalPower: number; // 0-100, affects policy impact
  economicPower: number; // 0-100, affects market impact
  
  createdAt: Date;
}

export interface PlayerReputation {
  playerId: string;
  sessionId: string;
  groupId: string;
  approval: number; // 0-100
  lastChanged: Date;
  
  // History
  history?: Array<{
    turn: number;
    approval: number;
    changeReason: string; // e.g., "Voted for budget cuts", "Funded healthcare"
  }>;
}
