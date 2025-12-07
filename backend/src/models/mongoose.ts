/**
 * Mongoose Models for POLSIM
 * Database schemas for all game entities
 */

import mongoose, { Schema, Document } from "mongoose";
import { Player, Market, Policy, Event, NewsArticle, NewsOutlet, Province, PopulationGroup, Company, GameState, IdeologyPoint } from "../models/types";
import { DemographicSliceModel, ReputationScoreModel, ReputationChangeModel, CampaignModel, EndorsementModel } from "./ReputationModels";

// ===== IDEOLOGY POINT SCHEMA =====
const IdeologyPointSchema = new Schema({
  economic: { type: Number, min: -100, max: 100, default: 0 },
  social: { type: Number, min: -100, max: 100, default: 0 },
  personal: { type: Number, min: -100, max: 100, default: 0 },
}, { _id: false });

// ===== POPULATION GROUP SCHEMA =====
const PopulationGroupSchema = new Schema({
  id: { type: String, unique: true, required: true },
  archetype: String,
  classLevel: { type: Number, min: 1, max: 4, required: true },
  size: { type: Number, min: 0, max: 100, required: true },
  bias: IdeologyPointSchema,
  approval: { type: Number, min: -100, max: 100, default: 0 },
  employed: { type: Number, min: 0, max: 100, default: 60 },
  maleRatio: { type: Number, min: 0, max: 1, default: 0.5 },
  // For emergent archetypes
  isOfficial: { type: Boolean, default: true },
  parentArchetypes: [String],
  createdTurn: Number,
  stability: { type: Number, min: 0, max: 100, default: 50 },
});

export const PopulationGroupModel = mongoose.model<PopulationGroup & Document>(
  "PopulationGroup",
  PopulationGroupSchema
);

// ===== PLAYER SCHEMA =====
const PlayerSchema = new Schema({
  id: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session' }, // Global session reference
  cash: { type: Number, default: 100000 },
  reputation: { type: Number, default: 0 },
  reputationByGroup: { type: Map, of: Number, default: new Map() },
  portraitUrl: { type: String }, // AI-generated portrait path
  ideologyPoint: IdeologyPointSchema, // Player's political position
  approval: { type: Number, min: 0, max: 100, default: 50 }, // Public approval rating
  
  // Location & Office
  currentProvinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  office: { 
    type: String, 
    enum: ['Governor', 'General Assembly Member', 'Superintendent', 'Provincial Counsel Member', 'Judge', null],
    default: null
  }, // Simplified office tracking for income distribution
  heldOffice: {
    type: {
      type: String,
      enum: [
        'governor',            // Federal Governor (Crown-appointed)
        'superintendent',      // Provincial Superintendent (elected)
        'lt-governor',         // Provincial Lt. Governor
        'legislative-council', // Upper House (appointed for life)
        'house-of-representatives', // Lower House (elected)
        'cabinet',             // Executive cabinet
        'supreme-court',       // Federal Supreme Court
        'provincial-court',    // Provincial courts
        'lawyer',              // Legal profession (for court cases)
        null
      ],
      default: null,
    },
    provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
    position: String, // e.g., "Minister of Finance", "Chief Justice", "Superintendent of Auckland"
    electedAt: Date,
    _id: false,
  },
  lastProvinceMove: { type: Date }, // For week cooldown
  isAI: { type: Boolean, default: false }, // NPC flag
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isGameMaster: { type: Boolean, default: false },
  actionsRemaining: { type: Number, default: 5 },
  companyOwned: String,
  newsOutletOwned: String,
  lastLogin: Date,
  preferences: {
    theme: { type: String, default: "dark" },
    notifications: { type: Boolean, default: true },
  },
});

export const PlayerModel = mongoose.model<Player & Document>("Player", PlayerSchema);

// ===== MARKET SCHEMA =====
const MarketSchema = new Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  supply: { type: Number, default: 100 },
  demand: { type: Number, default: 100 },
  priceHistory: [
    {
      turn: Number,
      price: Number,
      _id: false,
    },
  ],
  affectedByPolicies: [String],
  affectedByCompanies: [String],
  createdAt: { type: Date, default: Date.now },
});

MarketSchema.index({ name: 1 });
export const MarketModel = mongoose.model<Market & Document>("Market", MarketSchema);

// ===== COMPANY SCHEMA =====
const CompanySchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['farm', 'mine', 'factory', 'shop', 'tavern', 'shipping', 'bank'],
    required: true 
  },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  cash: { type: Number, default: 0 },
  employees: { type: Number, default: 1 },
  marketInfluence: { type: Map, of: Number, default: new Map() },
  monthlyProfit: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  valuation: { type: Number, default: 0 },
  totalShares: { type: Number, default: 10000 },
  shareholders: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    shares: { type: Number },
    _id: false
  }],
  profitHistory: [{
    turn: Number,
    profit: Number,
    _id: false
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CompanySchema.index({ ownerId: 1 });
CompanySchema.index({ sessionId: 1 });
export const CompanyModel = mongoose.model<Company & Document>("Company", CompanySchema);

// ===== POLICY SCHEMA =====
const PolicySchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  id: { type: String, unique: true, required: true },
  proposedBy: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  title: { type: String, required: true },
  description: String,
  
  // Policy classification
  policyType: {
    type: String,
    enum: [
      'tax', 'tariff', 'land_reform', 'immigration', 'labor', 
      'resource_regulation', 'infrastructure', 'education', 
      'maori_rights', 'electoral_reform', 'other'
    ],
    default: 'other'
  },
  type: String, // Legacy field
  ideology: IdeologyPointSchema,
  
  // AI-extracted data
  affectedResources: [String],
  affectedProvinces: [String],
  economicImpact: {
    gdpChange: Number,
    unemploymentChange: Number,
    inflationChange: Number,
    immigrationModifier: Number, // 0.5 = -50%, 1.5 = +50%, 2.0 = +100%
    _id: false
  },
  culturalModifiers: Schema.Types.Mixed, // { Irish: 1.5, German: 2.0, Chinese: 0.5 }
  reputationImpact: Schema.Types.Mixed, // { upper_class: -10, working_class: +15, etc }
  resourcePriceChanges: Schema.Types.Mixed, // { timber: 0.10, wool: -0.05 }
  estimatedRevenue: Number,
  estimatedCost: Number,
  
  // Voting and status
  duration: { type: Number, default: 10 },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "enacted", "repealed"],
    default: "pending",
  },
  votingDeadline: Date,
  votes: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 },
    abstain: { type: Number, default: 0 },
    for: { type: Number, default: 0 }, // Legacy
    against: { type: Number, default: 0 }, // Legacy
  },
  voters: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    vote: { type: String, enum: ['yes', 'no', 'abstain'] },
    timestamp: Date,
    _id: false
  }],
  legislatureVotes: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    vote: { type: String, enum: ['yes', 'no', 'abstain'] },
    house: { type: String, enum: ['lower', 'upper'] },
    timestamp: Date,
    _id: false
  }],
  sponsors: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  
  // Supersession tracking
  supersededBy: { type: String }, // Policy ID that replaced this one
  supersedes: [{ type: String }], // Policy IDs this one replaced
  supersededAt: { type: Date },
  deletedByEvent: { type: String }, // Event ID that deleted this policy
  deletionReason: { type: String }, // GM explanation
  supersededEconomicImpact: Schema.Types.Mixed, // Original impact before deletion
  supersededReputationImpact: Schema.Types.Mixed,
  supersededResourcePriceChanges: Schema.Types.Mixed,
  supersededCulturalModifiers: Schema.Types.Mixed,
  supersededDelayedEffect: Schema.Types.Mixed,
  
  // Delayed effects
  delayedEffect: {
    applyAtTurn: Number,
    gdpChange: Number,
    unemploymentChange: Number,
    revenue: Number,
    prorated: Boolean,
    completionPercentage: Number,
    _id: false
  },
  
  // Archive tracking (GM manual)
  archivedUrl: { type: String }, // External wiki URL
  archivedAt: { type: Date },
  archivedBy: { type: Schema.Types.ObjectId, ref: 'Player' },
  archiveNotes: { type: String },
  
  // Legacy fields
  numericEffects: {
    unemploymentChange: Number,
    gdpChange: Number,
    governmentBudgetChange: Number,
    _id: false,
  },
  eventTriggerChance: { type: Number, min: 0, max: 100 },
  turnProposed: Number,
  turnApproved: Number,
  turnEnds: Number,
  enactedAt: Date,
  
  createdAt: { type: Date, default: Date.now },
});

PolicySchema.index({ status: 1, turnEnds: 1 });
PolicySchema.index({ sessionId: 1, status: 1 });
export const PolicyModel = mongoose.model<Policy & Document>("Policy", PolicySchema);

// ===== EVENT SCHEMA =====
const EventSchema = new Schema({
  id: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: Number, min: 1, max: 10, required: true },
  type: String,
  duration: { type: Number, default: 1 },
  affectedGroups: [String],
  gdpImpact: Number,
  populationBiasMod: { type: Map, of: Number },
  triggeredBy: String,
  gmApproved: { type: Boolean, default: false },
  gmApprovingNotes: String,
  articles: [String],
  turnCreated: Number,
  turnEnds: Number,
  
  // Archive tracking (GM manual)
  archivedUrl: { type: String },
  archivedAt: { type: Date },
  archivedBy: { type: Schema.Types.ObjectId, ref: 'Player' },
  archiveNotes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

EventSchema.index({ gmApproved: 1, turnCreated: 1 });
export const EventModel = mongoose.model<Event & Document>("Event", EventSchema);

// ===== NEWS ARTICLE SCHEMA =====
const NewsArticleSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'Player' },
  outletId: { type: String, required: true },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  tone: { type: String }, // "supportive", "critical", "neutral"
  eventId: String,
  aiGenerated: { type: Boolean, default: false },
  approvalImpact: { type: Map, of: Number },
  turn: Number,
  
  // Archive tracking (GM manual)
  archivedUrl: { type: String },
  archivedAt: { type: Date },
  archivedBy: { type: Schema.Types.ObjectId, ref: 'Player' },
  archiveNotes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

NewsArticleSchema.index({ outletId: 1, turn: 1 });
NewsArticleSchema.index({ sessionId: 1, createdAt: -1 });
export const NewsArticleModel = mongoose.model<NewsArticle & Document>(
  "NewsArticle",
  NewsArticleSchema
);

// ===== NEWS OUTLET SCHEMA =====
const NewsOutletSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["national", "provincial"], 
    default: "provincial" 
  },
  politicalStance: { type: String }, // "moderate", "progressive", "conservative", etc.
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Player' },
  employees: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  bias: { type: Number, min: -100, max: 100, default: 0 },
  
  // Newspaper stats
  readership: { type: Number, default: 100 },
  cash: { type: Number, default: 0 },
  reputation: { type: Number, default: 50 },
  staff: { type: Number, default: 1 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NewsOutletSchema.index({ sessionId: 1, type: 1 });
NewsOutletSchema.index({ provinceId: 1 });
export const NewsOutletModel = mongoose.model<NewsOutlet & Document>(
  "NewsOutlet",
  NewsOutletSchema
);

// ===== CELL SCHEMA (Azgaar Map Terrain) =====
const CellSchema = new Schema({
  azgaarId: { type: Number, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  vertices: [Number], // Vertex IDs from Azgaar
  polygon: [[Number]], // Resolved [x,y] coordinates for rendering
  connections: [Number],
  position: { type: [Number], required: true }, // [x, y]
  height: { type: Number, required: true },
  temperature: { type: Number, required: true },
  area: { type: Number, required: true },
  biome: { type: Number, required: true },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  cultureId: { type: Number },
  religionId: { type: Number },
  hasRiver: { type: Boolean, default: false },
  habitability: { type: Number, min: 0, max: 1, default: 0.5 }, // For population distribution
}, { timestamps: true });

CellSchema.index({ sessionId: 1, provinceId: 1 });
CellSchema.index({ sessionId: 1, azgaarId: 1 }, { unique: true });
export const CellModel = mongoose.model("Cell", CellSchema);

// ===== CITY SCHEMA (From Azgaar Burgs) =====
const CitySchema = new Schema({
  azgaarId: { type: Number, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  position: { type: [Number], required: true }, // [x, y]
  cellId: { type: Schema.Types.ObjectId, ref: 'Cell' },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province', required: true },
  population: { type: Number, default: 0 },
  isCapital: { type: Boolean, default: false },
  economicType: { 
    type: String, 
    enum: ['port', 'inland', 'mining', 'agricultural'], 
    default: 'inland' 
  },
}, { timestamps: true });

CitySchema.index({ sessionId: 1, provinceId: 1 });
CitySchema.index({ sessionId: 1, azgaarId: 1 }, { unique: true });
export const CityModel = mongoose.model("City", CitySchema);

// ===== CULTURE SCHEMA =====
const CultureSchema = new Schema({
  azgaarId: { type: Number, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
}, { timestamps: true });

CultureSchema.index({ sessionId: 1, azgaarId: 1 }, { unique: true });
export const CultureModel = mongoose.model("Culture", CultureSchema);

// ===== RELIGION SCHEMA =====
const ReligionSchema = new Schema({
  azgaarId: { type: Number, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, default: 'Unknown' },
}, { timestamps: true });

ReligionSchema.index({ sessionId: 1, azgaarId: 1 }, { unique: true });
export const ReligionModel = mongoose.model("Religion", ReligionSchema);

// ===== RIVER SCHEMA =====
const RiverSchema = new Schema({
  azgaarId: { type: Number, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  source: { type: Number }, // Cell ID
  mouth: { type: Number },  // Cell ID
  cells: [Number], // Path of cells
}, { timestamps: true });

RiverSchema.index({ sessionId: 1, azgaarId: 1 }, { unique: true });
export const RiverModel = mongoose.model("River", RiverSchema);

// ===== ELECTION SCHEMA =====
const ElectionSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  officeType: { 
    type: String, 
    enum: ['primeMinister', 'parliament', 'governor', 'mayor'],
    required: true 
  },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  candidates: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    platform: { type: String, required: true },
    ideology: IdeologyPointSchema,
    endorsements: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    fundingRaised: { type: Number, default: 0 },
    _id: false,
  }],
  votingOpen: { type: Boolean, default: false },
  votingCloses: { type: Date },
  results: {
    winner: { type: Schema.Types.ObjectId, ref: 'Player' },
    voteBreakdown: { type: Map, of: Number },
    turnout: { type: Number, min: 0, max: 100 },
    _id: false,
  },
  status: {
    type: String,
    enum: ['announced', 'campaigning', 'voting', 'completed'],
    default: 'announced',
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

ElectionSchema.index({ sessionId: 1, status: 1 });
ElectionSchema.index({ sessionId: 1, officeType: 1 });
export const ElectionModel = mongoose.model('Election', ElectionSchema);

// ===== OFFICE SCHEMA =====
const OfficeSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  type: {
    type: String,
    enum: ['primeMinister', 'parliament', 'governor', 'ltGovernor', 'mayor', 'supremeCourt', 'legislative-council'],
    required: true,
  },
  name: { type: String }, // e.g., "New Zealand - House Seat 1"
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  cityId: { type: Schema.Types.ObjectId, ref: 'City' },
  holderId: { type: Schema.Types.ObjectId, ref: 'Player' }, // Changed from currentHolder
  currentHolder: { type: Schema.Types.ObjectId, ref: 'Player' }, // Keep for backward compatibility
  term: { type: Number, default: 0 },
  termLimit: { type: Number, default: 10 },
  salary: { type: Number, default: 5000 },
  powers: [{ type: String }],
  nextElection: { type: Date },
  electedAt: { type: Date },
  appointedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

OfficeSchema.index({ sessionId: 1, type: 1 });
OfficeSchema.index({ currentHolder: 1 });
export const OfficeModel = mongoose.model('Office', OfficeSchema);

// ===== VOTE SCHEMA =====
const VoteSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  voterId: { type: String, required: true },
  isNPC: { type: Boolean, default: false },
  electionId: { type: Schema.Types.ObjectId, ref: 'Election' },
  policyId: { type: Schema.Types.ObjectId, ref: 'Policy' },
  choice: { type: String, required: true },
  turn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

VoteSchema.index({ sessionId: 1, electionId: 1 });
VoteSchema.index({ voterId: 1 });
export const VoteModel = mongoose.model('Vote', VoteSchema);

// ===== PARTY SCHEMA =====
const PartySchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  faction: { 
    type: String, 
    enum: ['Loyalty League', 'Miscegenation Block', 'Broader Reform Faction'],
    required: true 
  },
  platform: { type: String },
  leaderId: { type: Schema.Types.ObjectId, ref: 'Player' },
  secondLeaderId: { type: Schema.Types.ObjectId, ref: 'Player' }, // Second party leader
  members: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  treasury: { type: Number, default: 0 },
  partyEndorsements: [{ type: String }], // Policy IDs
  founded: { type: Date, default: Date.now },
  dissolved: { type: Date },
});

PartySchema.index({ sessionId: 1 });
PartySchema.index({ leaderId: 1 });
PartySchema.index({ secondLeaderId: 1 });
export const PartyModel = mongoose.model('Party', PartySchema);

// ===== REPUTATION GROUP SCHEMA =====
const ReputationGroupSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['political', 'cultural', 'religious', 'racial', 'socioeconomic'],
    required: true 
  },
  archetypeId: { type: String }, // For political groups
  cultureId: { type: String }, // For cultural groups
  religionId: { type: String }, // For religious groups
  population: { type: Number, required: true },
  ideology: IdeologyPointSchema,
  traits: [{ type: String }],
  politicalPower: { type: Number, min: 0, max: 100, default: 50 },
  economicPower: { type: Number, min: 0, max: 100, default: 50 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

ReputationGroupSchema.index({ sessionId: 1, type: 1 });
ReputationGroupSchema.index({ sessionId: 1, archetypeId: 1 });
ReputationGroupSchema.index({ sessionId: 1, cultureId: 1 });
ReputationGroupSchema.index({ sessionId: 1, religionId: 1 });
export const ReputationGroupModel = mongoose.model('ReputationGroup', ReputationGroupSchema);

// ===== PLAYER REPUTATION SCHEMA =====
const PlayerReputationSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'ReputationGroup', required: true },
  approval: { type: Number, min: 0, max: 100, default: 50 },
  lastChanged: { type: Date, default: Date.now },
  history: [{
    turn: { type: Number, required: true },
    approval: { type: Number, min: 0, max: 100 },
    changeReason: { type: String },
    _id: false,
  }],
}, { timestamps: true });

PlayerReputationSchema.index({ playerId: 1, sessionId: 1 });
PlayerReputationSchema.index({ groupId: 1 });
PlayerReputationSchema.index({ playerId: 1, groupId: 1 }, { unique: true });
export const PlayerReputationModel = mongoose.model('PlayerReputation', PlayerReputationSchema);

// ===== PROVINCE SCHEMA (Updated for Azgaar Integration) =====
const ProvinceSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  azgaarId: { type: Number },
  color: { type: String }, // Hex color from map
  centerCoords: { type: [Number] }, // [x, y]
  area: { type: Number, default: 0 },
  population: { type: Number, default: 0 },
  
  // Geographic data
  cellIds: [{ type: Schema.Types.ObjectId, ref: 'Cell' }],
  cityIds: [{ type: Schema.Types.ObjectId, ref: 'City' }],
  capitalCityId: { type: Schema.Types.ObjectId, ref: 'City' },
  
  // Economic data (1850s Zealandia)
  gdp: { type: Number, default: 1000000 },
  developmentLevel: { type: Number, min: 0, max: 100, default: 5 }, // % of land exploited
  averageTemperature: { type: Number }, // Celsius
  
  resources: {
    // Forestry & Plant Products
    forestry: {
      timber: { type: Number, default: 0 },
      flax: { type: Number, default: 0 },
      hemp: { type: Number, default: 0 },
      _id: false,
    },
    
    // Agriculture
    agriculture: {
      grain: { type: Number, default: 0 },
      vegetables: { type: Number, default: 0 },
      fruit: { type: Number, default: 0 },
      _id: false,
    },
    
    // Livestock Products
    livestock: {
      wool: { type: Number, default: 0 },
      leather: { type: Number, default: 0 },
      meat: { type: Number, default: 0 },
      _id: false,
    },
    
    // Marine Resources
    marine: {
      fish: { type: Number, default: 0 },
      whaling: { type: Number, default: 0 },
      sealing: { type: Number, default: 0 },
      shellfish: { type: Number, default: 0 },
      pearls: { type: Number, default: 0 },
      _id: false,
    },
    
    // Mining - Precious Metals
    miningPrecious: {
      gold: { type: Number, default: 0 },
      silver: { type: Number, default: 0 },
      _id: false,
    },
    
    // Mining - Industrial
    miningIndustrial: {
      coal: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      copper: { type: Number, default: 0 },
      tin: { type: Number, default: 0 },
      zinc: { type: Number, default: 0 },
      _id: false,
    },
    
    // Mining - Specialty
    miningSpecialty: {
      sulfur: { type: Number, default: 0 },
      saltpeter: { type: Number, default: 0 },
      graphite: { type: Number, default: 0 },
      _id: false,
    },
    
    // Quarrying
    quarrying: {
      stone: { type: Number, default: 0 },
      marble: { type: Number, default: 0 },
      clay: { type: Number, default: 0 },
      kaolin: { type: Number, default: 0 },
      _id: false,
    },
    
    // Special Resources
    special: {
      guano: { type: Number, default: 0 },
      ice: { type: Number, default: 0 },
      _id: false,
    },
    _id: false,
  },
  
  riverAccessBonus: { type: Number, min: 0, max: 0.25, default: 0 }, // GDP multiplier
  
  // Political data
  defaultIdeology: IdeologyPointSchema,
  currentGovernor: { type: Schema.Types.ObjectId, ref: 'Player' },
  currentLtGovernor: { type: Schema.Types.ObjectId, ref: 'Player' },
  hasLegislature: { type: Boolean, default: false },
  
  // Cultural/Religious composition
  culturalComposition: [{
    cultureId: { type: Number, required: true },
    percentage: { type: Number, min: 0, max: 100, required: true },
    _id: false,
  }],
  religiousComposition: [{
    religionId: { type: Number, required: true },
    percentage: { type: Number, min: 0, max: 100, required: true },
    _id: false,
  }],
  
  // Hidden resources (for exploration system)
  hiddenResources: [{ type: String }], // e.g., ['gold', 'silver', 'uranium']
  
  // Legacy fields
  laws: [String],
  unemployment: { type: Number, min: 0, max: 100, default: 5 },
  populationGroups: [PopulationGroupSchema],
  markets: [String],
  companies: [String],
  governmentType: {
    type: String,
    enum: ["democracy", "monarchy", "dictatorship"],
    default: "democracy",
  },
  createdAt: { type: Date, default: Date.now },
});

ProvinceSchema.index({ sessionId: 1, name: 1 });
ProvinceSchema.index({ sessionId: 1, azgaarId: 1 });
export const ProvinceModel = mongoose.model<Province & Document>("Province", ProvinceSchema);

// ===== GAME STATE SCHEMA =====
const GameStateSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: String, required: true },
  currentTurn: { type: Number, default: 1 },
  startDate: { type: Date, default: Date.now },
  era: {
    type: String,
    enum: ["modern", "industrial", "futuristic"],
    default: "modern",
  },
  economicHealth: { type: Number, min: -100, max: 100, default: 0 },
  unemploymentRate: { type: Number, min: 0, max: 100, default: 5 },
  gdp: { type: Number, default: 1000000 },
  populationMood: { type: Number, min: -100, max: 100, default: 0 },
  maintenanceMode: { type: Boolean, default: false },
  nextMaintenanceTime: Date,
  nextTurnTime: Date,
  lastProcessedTurn: { type: Number, default: 0 },
});

GameStateSchema.index({ sessionId: 1, currentTurn: 1 });
export const GameStateModel = mongoose.model<GameState & Document>(
  "GameState",
  GameStateSchema
);

// ===== ACTION SCHEMA =====
const ActionSchema = new Schema({
  id: { type: String, unique: true, required: true },
  playerId: { type: String, required: true },
  sessionId: { type: String, required: true },
  type: {
    type: String,
    enum: ["political", "economic", "media", "administrative"],
    required: true,
  },
  subType: { type: String, required: true },
  data: Schema.Types.Mixed,
  turn: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
  processed: { type: Boolean, default: false },
});

ActionSchema.index({ playerId: 1, turn: 1, processed: 1 });
export const ActionModel = mongoose.model("Action", ActionSchema);

// ===== STOCK MARKET SCHEMA =====
const StockMarketSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  sector: String,
  currentPrice: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  priceHistory: [
    {
      turn: Number,
      price: Number,
      _id: false,
    },
  ],
  volatility: { type: Number, default: 0.15 },
  supply: { type: Number, default: 1000 },
  demand: { type: Number, default: 1000 },
  totalShares: { type: Number, default: 10000 },
  outstandingShares: { type: Number, default: 10000 },
}, { timestamps: true });

StockMarketSchema.index({ sessionId: 1, sector: 1 });
export const StockMarketModel = mongoose.model('StockMarket', StockMarketSchema);

// ===== MARKET ITEM SCHEMA =====
const MarketItemSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: String,
  category: String,
  market: String,
  currentPrice: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  quantity: { type: Number, default: 100 },
  priceHistory: [
    {
      turn: Number,
      price: Number,
      _id: false,
    },
  ],
}, { timestamps: true });

MarketItemSchema.index({ sessionId: 1, category: 1 });
export const MarketItemModel = mongoose.model('MarketItem', MarketItemSchema);

// ===== PLAYER PORTFOLIO SCHEMA =====
const PlayerPortfolioSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  cash: { type: Number, default: 100000 },
  stocks: [
    {
      stockMarketId: { type: Schema.Types.ObjectId, ref: 'StockMarket' },
      shares: Number,
      purchasePrice: Number,
      purchaseTurn: Number,
      _id: false,
    },
  ],
  marketItems: [
    {
      marketItemId: { type: Schema.Types.ObjectId, ref: 'MarketItem' },
      quantity: Number,
      purchasePrice: Number,
      purchaseTurn: Number,
      _id: false,
    },
  ],
}, { timestamps: true });

PlayerPortfolioSchema.index({ playerId: 1, sessionId: 1 });
export const PlayerPortfolioModel = mongoose.model('PlayerPortfolio', PlayerPortfolioSchema);

// ===== COURT CASE SCHEMA =====
// ===== COURT CASE SCHEMA =====
const CourtCaseSchema = new Schema({
  id: { type: String, unique: true, required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  title: { type: String, required: true },
  plaintiff: { type: String, required: true },
  defendant: { type: String, required: true },
  provinceId: { type: Schema.Types.ObjectId, ref: 'Province' },
  description: { type: String, required: true },
  
  // Lawyer representation
  plaintiffLawyer: { type: Schema.Types.ObjectId, ref: 'Player' },
  defendantLawyer: { type: Schema.Types.ObjectId, ref: 'Player' },
  
  // Case metadata
  aiGenerated: { type: Boolean, default: false },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'Player' },
  
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Chatroom for lawyer collaboration
  chatroomId: { type: String },
  
  // Resolution
  outcome: { type: String },
  rulingDate: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CourtCaseSchema.index({ sessionId: 1, status: 1 });
CourtCaseSchema.index({ plaintiffLawyer: 1 });
CourtCaseSchema.index({ defendantLawyer: 1 });
export const CourtCaseModel = mongoose.model('CourtCase', CourtCaseSchema);

// ===== SESSION SCHEMA =====
const SessionSchema = new Schema({
  name: String,
  gamemaster: { type: Schema.Types.ObjectId, ref: 'Player', required: false },
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  status: { type: String, enum: ['waiting', 'active', 'paused', 'completed'], default: 'active' },
  currentTurn: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  turnStartTime: { type: Date },
  turnEndTime: { type: Date },
  lastTurnAt: { type: Date },
  autoAdvanceEnabled: { type: Boolean, default: true },
  pendingEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  approvedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  pendingActions: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
  world: {
    provinces: [Object],
    markets: [Object],
    populationGroups: [Object],
    companies: [Object],
  },
}, { timestamps: true });

SessionSchema.index({ name: 1, isActive: 1 });
export const SessionModel = mongoose.model("Session", SessionSchema);

// ===== EXPORT ALL MODELS =====
export const models = {
  Player: PlayerModel,
  Market: MarketModel,
  Company: CompanyModel,
  Policy: PolicyModel,
  Event: EventModel,
  NewsArticle: NewsArticleModel,
  NewsOutlet: NewsOutletModel,
  Province: ProvinceModel,
  GameState: GameStateModel,
  Action: ActionModel,
  Session: SessionModel,
  PopulationGroup: PopulationGroupModel,
  StockMarket: StockMarketModel,
  MarketItem: MarketItemModel,
  PlayerPortfolio: PlayerPortfolioModel,
  Cell: CellModel,
  City: CityModel,
  Culture: CultureModel,
  Religion: ReligionModel,
  River: RiverModel,
  Election: ElectionModel,
  Office: OfficeModel,
  Vote: VoteModel,
  Party: PartyModel,
  ReputationGroup: ReputationGroupModel,
  PlayerReputation: PlayerReputationModel,
  CourtCase: CourtCaseModel,
  // Reputation System Models
  DemographicSlice: DemographicSliceModel,
  ReputationScore: ReputationScoreModel,
  ReputationChange: ReputationChangeModel,
  Campaign: CampaignModel,
  Endorsement: EndorsementModel,
};
