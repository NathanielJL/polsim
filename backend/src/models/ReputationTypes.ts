/**
 * Reputation Groups
 * Tracks player approval among different demographic and ideological groups
 */

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
