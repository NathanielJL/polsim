// Political ideology scale: Economic (left-right), Social (liberal-conservative), Personal Freedom (restrictive-libertarian)
export interface IdeologyPoint {
  economic: number; // -100 to 100
  social: number;   // -100 to 100
  personal: number; // -100 to 100
}

export type PlayerArchetype = 
  | "AuthoritarianRight"
  | "LibertarianRight"
  | "LibertarianLeft"
  | "Communism"
  | "Centrist"
  | "RightModerate"
  | "LeftModerate"
  | "LibertarianModerate"
  | "AuthoritarianModerate";

export interface PopulationGroup {
  archetype: PlayerArchetype;
  classLevel: number; // 1-4 (lower to upper class)
  size: number; // percentage of population
  bias: IdeologyPoint; // weighted toward their archetype
  approval: number; // -100 to 100
  employed: number; // percentage
  maleRatio: number; // 0-1
}

export interface Player {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  cash: number; // Starting $100,000
  reputation: number; // Single score
  reputationByGroup: Map<string, number>; // Per-group approval breakdown
  currentLocation: string; // Province/City ID
  createdAt: Date;
  updatedAt: Date;
  isGameMaster: boolean;
  actionsRemaining: number; // 5 per turn
  companyOwned?: string; // Company ID if entrepreneur
  newsOutletOwned?: string; // News outlet ID if press owner
  
  // Political career
  isCandidate?: boolean; // Currently running for office
  candidacyFor?: string; // Office ID they're running for
  officeHeld?: string; // Current office ID
  electionHistory?: Array<{
    electionId: string;
    office: string;
    won: boolean;
    votes: number;
    turn: number;
  }>;
  
  // Professional career
  profession?: 'lawyer' | 'journalist' | 'entrepreneur' | 'politician' | 'citizen';
  professionalCredentials?: {
    barAdmitted?: boolean; // Lawyer certification
    cases?: number; // Cases handled
    licenses?: string[]; // Various professional licenses
  };
}

export interface Market {
  id: string;
  name: string; // Healthcare, Transportation, Housing, Food, Technology, Goods
  basePrice: number;
  currentPrice: number;
  supply: number;
  demand: number;
  priceHistory: Array<{ turn: number; price: number }>;
  affectedByPolicies: string[]; // Policy IDs
  affectedByCompanies: string[]; // Company IDs
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  type: string; // Hotel, Construction, Medicine, Finance, etc.
  cash: number;
  employees: number;
  marketInfluence: Map<string, number>; // market -> influence strength
  monthlyProfit: number; // Auto-calculated
  createdAt: Date;
}

export interface Policy {
  id: string;
  proposedBy: string; // Player ID
  title: string;
  description: string;
  type: string; // Tax, Budget, Regulation, etc.
  ideology: IdeologyPoint; // Where it falls on spectrum
  duration: number; // Turns it's active
  numericEffects: {
    unemploymentChange?: number; // percentage
    gdpChange?: number; // percentage
    governmentBudgetChange?: number; // percentage
  };
  eventTriggerChance?: number; // 0-100% chance to trigger event
  status: "proposed" | "approved" | "active" | "repealed";
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  severity: number; // 1-10
  type: string; // Economic, Political, Foreign, Natural, etc.
  duration: number; // Turns active
  affectedGroups: string[]; // Population group archetypes
  gdpImpact?: number; // percentage
  populationBiasMod?: Partial<Record<PlayerArchetype, number>>;
  triggeredBy?: string; // Policy ID or Player action
  gmApproved: boolean;
  articles: string[]; // News article IDs
  createdAt: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  authorId?: string; // Player ID for submitted articles, null for AI
  outlletId: string;
  ideology: IdeologyPoint; // Outlet's political leaning
  eventId?: string; // Event it's reporting
  approvalImpact: Map<string, number>; // group -> impact
  turn: number;
  createdAt: Date;
}

export interface NewsOutlet {
  id: string;
  name: string;
  ideology: IdeologyPoint; // Political spectrum position
  ownerId?: string; // Player ID if player-owned (local only)
  isNational: boolean; // 3 national + many local
  reachScope: "national" | "provincial" | "city";
  articles: string[]; // Article IDs
}

export interface Province {
  id: string;
  name: string;
  
  // Geographic data
  azgaarId?: number;
  color?: string;
  centerCoords?: [number, number];
  area?: number;
  population?: number;
  cellIds?: string[];
  cityIds?: string[];
  capitalCityId?: string;
  
  // Economic data
  gdp: number;
  developmentLevel?: number; // 0-100%, how much land is actually exploited
  averageTemperature?: number; // Celsius
  
  resources?: {
    // Forestry & Plant Products
    forestry?: {
      timber?: number;
      flax?: number;
      hemp?: number;
    };
    
    // Agriculture
    agriculture?: {
      grain?: number;
      vegetables?: number;
      fruit?: number;
    };
    
    // Livestock Products
    livestock?: {
      wool?: number;
      leather?: number;
      meat?: number;
    };
    
    // Marine Resources
    marine?: {
      fish?: number;
      whaling?: number;
      sealing?: number;
      shellfish?: number;
      pearls?: number;
    };
    
    // Mining - Precious Metals
    miningPrecious?: {
      gold?: number;
      silver?: number;
    };
    
    // Mining - Industrial
    miningIndustrial?: {
      coal?: number;
      iron?: number;
      copper?: number;
      tin?: number;
      zinc?: number;
    };
    
    // Mining - Specialty
    miningSpecialty?: {
      sulfur?: number;
      saltpeter?: number;
      graphite?: number;
    };
    
    // Quarrying
    quarrying?: {
      stone?: number;
      marble?: number;
      clay?: number;
      kaolin?: number; // China clay
    };
    
    // Special Resources
    special?: {
      guano?: number; // Fertilizer from bird droppings
      ice?: number; // Export from cold regions
    };
  };
  
  riverAccessBonus?: number;
  
  // Political data
  defaultIdeology?: IdeologyPoint;
  currentGovernor?: string;
  currentLtGovernor?: string;
  hasLegislature?: boolean;
  
  // Cultural composition
  culturalComposition?: Array<{ cultureId: number; percentage: number }>;
  religiousComposition?: Array<{ religionId: number; percentage: number }>;
  
  // Legacy fields
  laws: string[]; // Policy IDs
  unemployment: number;
  populationGroups: PopulationGroup[];
  markets: Market[];
  companies: Company[];
  cities: string[]; // City IDs
  governmentType: "democracy" | "monarchy" | "dictatorship";
  currentLeader?: string; // Player ID (deprecated, use currentGovernor)
}

export interface Election {
  id: string;
  sessionId: string;
  officeType: 'primeMinister' | 'parliament' | 'governor' | 'mayor';
  provinceId?: string; // For provincial/local elections
  candidates: Array<{
    playerId: string;
    platform: string; // Campaign promises
    ideology: IdeologyPoint;
    endorsements: string[]; // Player/NPC IDs
    fundingRaised: number;
  }>;
  votingOpen: boolean;
  votingCloses: Date;
  results?: {
    winner: string; // Player ID
    voteBreakdown: Map<string, number>; // candidateId -> votes
    turnout: number; // Percentage
  };
  status: 'announced' | 'campaigning' | 'voting' | 'completed';
  createdAt: Date;
}

export interface Office {
  id: string;
  sessionId: string;
  type: 'primeMinister' | 'parliament' | 'governor' | 'ltGovernor' | 'mayor' | 'supremeCourt';
  provinceId?: string; // For provincial offices
  cityId?: string; // For city offices
  currentHolder?: string; // Player ID
  term: number; // Turns in office
  termLimit: number; // Max turns before re-election
  salary: number; // £ per turn
  powers: string[]; // 'proposePolicy', 'veto', 'appointJudges', etc.
  nextElection?: Date;
}

export interface Vote {
  id: string;
  sessionId: string;
  voterId: string; // Player or NPC ID
  isNPC: boolean;
  electionId?: string; // For elections
  policyId?: string; // For policy votes
  choice: string; // Candidate ID or 'for'/'against'
  turn: number;
  createdAt: Date;
}

export interface GameState {
  currentTurn: number;
  startDate: Date;
  era: "modern" | "industrial" | "futuristic"; // Affects communication, markets
  economicHealth: number; // -100 to 100, affects multiple systems
  unemploymentRate: number;
  gdp: number;
  populationMood: number; // -100 to 100
  maintenanceMode: boolean;
  nextMaintenanceTime: Date;
}
