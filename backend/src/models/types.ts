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
  laws: string[]; // Policy IDs
  gdp: number;
  unemployment: number;
  populationGroups: PopulationGroup[];
  markets: Market[];
  companies: Company[];
  cities: string[]; // City IDs
  governmentType: "democracy" | "monarchy" | "dictatorship"; // Can change via policy/event
  currentLeader?: string; // Player ID
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
