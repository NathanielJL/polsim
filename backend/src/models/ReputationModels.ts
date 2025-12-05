import mongoose, { Schema, Document } from 'mongoose';
import {
  DemographicSlice,
  EconomicDemographic,
  CulturalDemographic,
  LocationalDemographic,
  SpecialInterest,
  PoliticalPosition,
  PoliticalCube,
  IssuePositions,
  IssueSalience,
  ReputationScore,
  ApprovalDataPoint,
  ReputationChange,
  Campaign,
  Endorsement,
  NewsImpact,
  ElectionResult,
  DemographicVote,
  PoliticalParty,
  PoliticalFaction,
  PolicyPosition,
  TurnReputationUpdate
} from './ReputationTypes';

// ============================================================================
// DEMOGRAPHIC SLICE SCHEMA
// ============================================================================

const EconomicDemographicSchema = new Schema<EconomicDemographic>({
  class: { type: String, enum: ['upper', 'middle', 'lower', 'other'], required: true },
  occupation: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  propertyOwnership: { type: String, enum: ['landowner', 'tenant', 'none'] }
}, { _id: false });

const CulturalDemographicSchema = new Schema<CulturalDemographic>({
  ethnicity: { type: String, required: true },
  religion: { type: String, required: true },
  indigenous: { type: Boolean, required: true },
  mixed: { type: Boolean, required: true }
}, { _id: false });

const LocationalDemographicSchema = new Schema<LocationalDemographic>({
  province: { type: String, required: true },
  settlement: { type: String, enum: ['urban', 'rural'], required: true },
  urbanCenter: { type: String }
}, { _id: false });

const SpecialInterestSchema = new Schema<SpecialInterest>({
  group: { type: String, required: true },
  salience: { type: Number, min: 0, max: 1, required: true }
}, { _id: false });

const PoliticalCubeSchema = new Schema<PoliticalCube>({
  economic: { type: Number, min: -10, max: 10, required: true },
  authority: { type: Number, min: -10, max: 10, required: true },
  social: { type: Number, min: -10, max: 10, required: true }
}, { _id: false });

const IssuePositionsSchema = new Schema<IssuePositions>({
  sovereignty: { type: Number, min: -10, max: 10, default: 0 },
  responsibleGovernment: { type: Number, min: -10, max: 10, default: 0 },
  centralization: { type: Number, min: -10, max: 10, default: 0 },
  propertyRights: { type: Number, min: -10, max: 10, default: 0 },
  eminentDomain: { type: Number, min: -10, max: 10, default: 0 },
  landSales: { type: Number, min: -10, max: 10, default: 0 },
  taxes: { type: Number, min: -10, max: 10, default: 0 },
  protectionism: { type: Number, min: -10, max: 10, default: 0 },
  economicIntervention: { type: Number, min: -10, max: 10, default: 0 },
  businessRegulation: { type: Number, min: -10, max: 10, default: 0 },
  privatization: { type: Number, min: -10, max: 10, default: 0 },
  workerRights: { type: Number, min: -10, max: 10, default: 0 },
  minimumWage: { type: Number, min: -10, max: 10, default: 0 },
  welfareState: { type: Number, min: -10, max: 10, default: 0 },
  healthcare: { type: Number, min: -10, max: 10, default: 0 },
  universalIncome: { type: Number, min: -10, max: 10, default: 0 },
  propertySuffrage: { type: Number, min: -10, max: 10, default: 0 },
  womensSuffrage: { type: Number, min: -10, max: 10, default: 0 },
  indigenousRights: { type: Number, min: -10, max: 10, default: 0 },
  gayRights: { type: Number, min: -10, max: 10, default: 0 },
  transRights: { type: Number, min: -10, max: 10, default: 0 },
  kingitanga: { type: Number, min: -10, max: 10, default: 0 },
  waterRights: { type: Number, min: -10, max: 10, default: 0 },
  immigration: { type: Number, min: -10, max: 10, default: 0 },
  educationRights: { type: Number, min: -10, max: 10, default: 0 },
  deathPenalty: { type: Number, min: -10, max: 10, default: 0 },
  justice: { type: Number, min: -10, max: 10, default: 0 },
  policeReform: { type: Number, min: -10, max: 10, default: 0 },
  interventionism: { type: Number, min: -10, max: 10, default: 0 },
  globalism: { type: Number, min: -10, max: 10, default: 0 },
  privacyRights: { type: Number, min: -10, max: 10, default: 0 },
  animalRights: { type: Number, min: -10, max: 10, default: 0 },
  productiveRights: { type: Number, min: -10, max: 10, default: 0 },
  environmentalRegulation: { type: Number, min: -10, max: 10, default: 0 },
  equity: { type: Number, min: -10, max: 10, default: 0 }
}, { _id: false });

const IssueSalienceSchema = new Schema<IssueSalience>({
  sovereignty: { type: Number, min: 0, max: 1, default: 0 },
  responsibleGovernment: { type: Number, min: 0, max: 1, default: 0 },
  centralization: { type: Number, min: 0, max: 1, default: 0 },
  propertyRights: { type: Number, min: 0, max: 1, default: 0 },
  eminentDomain: { type: Number, min: 0, max: 1, default: 0 },
  landSales: { type: Number, min: 0, max: 1, default: 0 },
  taxes: { type: Number, min: 0, max: 1, default: 0 },
  protectionism: { type: Number, min: 0, max: 1, default: 0 },
  economicIntervention: { type: Number, min: 0, max: 1, default: 0 },
  businessRegulation: { type: Number, min: 0, max: 1, default: 0 },
  privatization: { type: Number, min: 0, max: 1, default: 0 },
  workerRights: { type: Number, min: 0, max: 1, default: 0 },
  minimumWage: { type: Number, min: 0, max: 1, default: 0 },
  welfareState: { type: Number, min: 0, max: 1, default: 0 },
  healthcare: { type: Number, min: 0, max: 1, default: 0 },
  universalIncome: { type: Number, min: 0, max: 1, default: 0 },
  propertySuffrage: { type: Number, min: 0, max: 1, default: 0 },
  womensSuffrage: { type: Number, min: 0, max: 1, default: 0 },
  indigenousRights: { type: Number, min: 0, max: 1, default: 0 },
  gayRights: { type: Number, min: 0, max: 1, default: 0 },
  transRights: { type: Number, min: 0, max: 1, default: 0 },
  kingitanga: { type: Number, min: 0, max: 1, default: 0 },
  waterRights: { type: Number, min: 0, max: 1, default: 0 },
  immigration: { type: Number, min: 0, max: 1, default: 0 },
  educationRights: { type: Number, min: 0, max: 1, default: 0 },
  deathPenalty: { type: Number, min: 0, max: 1, default: 0 },
  justice: { type: Number, min: 0, max: 1, default: 0 },
  policeReform: { type: Number, min: 0, max: 1, default: 0 },
  interventionism: { type: Number, min: 0, max: 1, default: 0 },
  globalism: { type: Number, min: 0, max: 1, default: 0 },
  privacyRights: { type: Number, min: 0, max: 1, default: 0 },
  animalRights: { type: Number, min: 0, max: 1, default: 0 },
  productiveRights: { type: Number, min: 0, max: 1, default: 0 },
  environmentalRegulation: { type: Number, min: 0, max: 1, default: 0 },
  equity: { type: Number, min: 0, max: 1, default: 0 }
}, { _id: false });

const PoliticalPositionSchema = new Schema<PoliticalPosition>({
  cube: { type: PoliticalCubeSchema, required: true },
  issues: { type: IssuePositionsSchema, required: true },
  salience: { type: IssueSalienceSchema, required: true }
}, { _id: false });

interface IDemographicSlice extends DemographicSlice, Document {}

const DemographicSliceSchema = new Schema<IDemographicSlice>({
  id: { type: String, required: true, unique: true },
  economic: { type: EconomicDemographicSchema, required: true },
  cultural: { type: CulturalDemographicSchema, required: true },
  locational: { type: LocationalDemographicSchema, required: true },
  specialInterests: [SpecialInterestSchema],
  population: { type: Number, required: true, min: 0 },
  canVote: { type: Boolean, required: true },
  defaultPosition: { type: PoliticalPositionSchema, required: true }
}, { timestamps: true });

// Indexes
DemographicSliceSchema.index({ id: 1 });
DemographicSliceSchema.index({ 'locational.province': 1 });
DemographicSliceSchema.index({ 'economic.class': 1 });
DemographicSliceSchema.index({ 'economic.occupation': 1 });
DemographicSliceSchema.index({ canVote: 1 });

// ============================================================================
// REPUTATION SCORE SCHEMA
// ============================================================================

const ApprovalDataPointSchema = new Schema<ApprovalDataPoint>({
  turn: { type: Number, required: true },
  approval: { type: Number, required: true, min: 0, max: 100 },
  change: { type: Number, required: true },
  reason: { type: String }
}, { _id: false });

interface IReputationScore extends ReputationScore, Document {}

const ReputationScoreSchema = new Schema<IReputationScore>({
  playerId: { type: String, required: true },
  demographicSliceId: { type: String, required: true },
  approval: { type: Number, required: true, min: 0, max: 100, default: 50 },
  approvalHistory: [ApprovalDataPointSchema],
  lastUpdated: { type: Date, default: Date.now },
  turnUpdated: { type: Number, required: true, default: 0 }
}, { timestamps: true });

// Indexes
ReputationScoreSchema.index({ playerId: 1, demographicSliceId: 1 }, { unique: true });
ReputationScoreSchema.index({ playerId: 1 });
ReputationScoreSchema.index({ demographicSliceId: 1 });
ReputationScoreSchema.index({ approval: 1 });

// ============================================================================
// REPUTATION CHANGE SCHEMA
// ============================================================================

interface IReputationChange extends ReputationChange, Document {}

const ReputationChangeSchema = new Schema<IReputationChange>({
  playerId: { type: String, required: true },
  demographicSliceId: { type: String, required: true },
  delta: { type: Number, required: true },
  source: { 
    type: String, 
    enum: ['bill-proposal', 'bill-vote-yes', 'bill-vote-no', 'bill-vote-abstain', 'bill-outcome', 'news-article', 'campaign', 'endorsement', 'scandal', 'turn-decay'],
    required: true 
  },
  sourceId: { type: String, required: true },
  calculation: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  turn: { type: Number, required: true }
}, { timestamps: true });

// Indexes
ReputationChangeSchema.index({ playerId: 1, turn: 1 });
ReputationChangeSchema.index({ demographicSliceId: 1, turn: 1 });
ReputationChangeSchema.index({ source: 1, turn: 1 });

// ============================================================================
// CAMPAIGN SCHEMA
// ============================================================================

interface ICampaign extends Campaign, Document {}

const CampaignSchema = new Schema<ICampaign>({
  sessionId: { type: String, required: true },
  playerId: { type: String, required: true },
  targetDemographicSliceId: { type: String, required: true },
  targetProvince: { type: String, required: true },
  startTurn: { type: Number, required: true },
  duration: { type: Number, default: 12 },
  endTurn: { type: Number, required: true },
  actionPointCost: { type: Number, default: 1 },
  moneyCost: { type: Number, default: 100 },
  boost: { type: Number, required: true, min: 1, max: 5 },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
}, { timestamps: true });

// Indexes
CampaignSchema.index({ sessionId: 1, playerId: 1 });
CampaignSchema.index({ targetDemographicSliceId: 1 });
CampaignSchema.index({ status: 1, endTurn: 1 });

// ============================================================================
// ENDORSEMENT SCHEMA
// ============================================================================

interface IEndorsement extends Endorsement, Document {}

const EndorsementSchema = new Schema<IEndorsement>({
  sessionId: { type: String, required: true },
  endorserId: { type: String, required: true },
  endorsedId: { type: String, required: true },
  turn: { type: Number, required: true },
  transfers: [{
    demographicSliceId: { type: String, required: true },
    endorserApproval: { type: Number, required: true, min: 0, max: 100 },
    transferRate: { type: Number, required: true, min: -7, max: 7 }
  }],
  actionPointCost: { type: Number, default: 1 }
}, { timestamps: true });

// Indexes
EndorsementSchema.index({ sessionId: 1, turn: 1 });
EndorsementSchema.index({ endorserId: 1 });
EndorsementSchema.index({ endorsedId: 1 });

// ============================================================================
// POLITICAL PARTY SCHEMA
// ============================================================================

interface IPoliticalParty extends PoliticalParty, Document {}

const PoliticalPartySchema = new Schema<IPoliticalParty>({
  sessionId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['provincial', 'federal'], required: true },
  province: { type: String },
  leader: { type: String },
  second: { type: String },
  supportedFaction: { type: String, enum: ['loyalty-league', 'broader-reform', 'miscegenation-bloc'] },
  members: [{ type: String }],
  npcMembers: [{ type: String }],
  platform: { type: PoliticalPositionSchema, required: true }
}, { timestamps: true });

// Indexes
PoliticalPartySchema.index({ sessionId: 1 });
PoliticalPartySchema.index({ type: 1, province: 1 });

// ============================================================================
// EXPORTS
// ============================================================================

export const DemographicSliceModel = mongoose.model<any>('DemographicSlice', DemographicSliceSchema);
export const ReputationScoreModel = mongoose.model<any>('ReputationScore', ReputationScoreSchema);
export const ReputationChangeModel = mongoose.model<any>('ReputationChange', ReputationChangeSchema);
export const CampaignModel = mongoose.model<any>('Campaign', CampaignSchema);
export const EndorsementModel = mongoose.model<any>('Endorsement', EndorsementSchema);
export const PoliticalPartyModel = mongoose.model<any>('PoliticalParty', PoliticalPartySchema);
