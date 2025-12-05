/**
 * Zealandia Game Context
 * Constitutional, historical, and lore data for AI analysis
 * Loaded from Constitution and Lore text files
 */

import * as fs from 'fs';
import * as path from 'path';

export class ZealandiaContext {
  private static constitution: string = '';
  private static lore: string = '';
  private static gameRules: string = '';
  private static loaded: boolean = false;

  /**
   * Load all context files
   */
  static loadContext(): void {
    if (this.loaded) return;

    const rootDir = path.join(__dirname, '..', '..', '..');

    try {
      // Load Constitution
      const constitutionPath = path.join(rootDir, 'Zealandia Constitution.txt');
      this.constitution = fs.readFileSync(constitutionPath, 'utf-8');
      
      // Load Lore
      const lorePath = path.join(rootDir, 'Zealandia Lore.txt');
      this.lore = fs.readFileSync(lorePath, 'utf-8');
      
      // Load Game Rules
      const rulesPath = path.join(rootDir, 'Zealandia.txt');
      this.gameRules = fs.readFileSync(rulesPath, 'utf-8');

      this.loaded = true;
      console.log('✅ Zealandia context loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading Zealandia context:', error.message);
      throw error;
    }
  }

  /**
   * Get Constitution text
   */
  static getConstitution(): string {
    if (!this.loaded) this.loadContext();
    return this.constitution;
  }

  /**
   * Get Lore text
   */
  static getLore(): string {
    if (!this.loaded) this.loadContext();
    return this.lore;
  }

  /**
   * Get Game Rules
   */
  static getGameRules(): string {
    if (!this.loaded) this.loadContext();
    return this.gameRules;
  }

  /**
   * Get province-specific data
   */
  static getProvinceData(): any {
    return {
      provinces: [
        {
          name: 'Southland',
          capital: null, // To be decided by players
          population: 11954,
          lowerHouseSeats: 14,
          cultures: ['Māori', 'English-Methodist'],
          tensions: 'high',
          economy: 'pastoral',
        },
        {
          name: 'Vulteralia',
          capital: 'Auckland',
          population: 5363,
          lowerHouseSeats: 6,
          cultures: [
            'English-Anglican', 'English-Methodist', 'Spanish-Catholic',
            'French-Catholic', 'Spanish-Māori', 'French-Māori', 
            'Moriri', 'French-Highlander', 'Highlander'
          ],
          tensions: 'low', // High mixed communities
          economy: 'mixed',
        },
        {
          name: 'Cooksland',
          capital: "Cook's Landing",
          population: 4327,
          lowerHouseSeats: 5,
          cultures: ['English-Anglican', 'Māori', 'Dutch-Catholic', 'Dutch-Protestantism'],
          tensions: 'low',
          economy: 'trade',
        },
        {
          name: 'Tasminata',
          capital: null,
          population: 3730,
          lowerHouseSeats: 5,
          cultures: ['English-Anglican', 'Moriri'],
          tensions: 'high',
          economy: 'pastoral/whaling',
        },
        {
          name: 'New Zealand',
          capital: 'Wellington',
          population: 3494,
          lowerHouseSeats: 4,
          cultures: ['English-Anglican', 'English-Methodist', 'Māori', 'Highlanders'],
          tensions: 'high',
          economy: 'government/mixed',
        },
        {
          name: 'New Caledonia',
          capital: null,
          population: 917,
          lowerHouseSeats: 1,
          cultures: ['Scottish-Presbyterian', 'Moriri'],
          tensions: 'high',
          economy: 'whaling/timber',
        },
        {
          name: 'Orketers',
          capital: null,
          population: 218,
          lowerHouseSeats: 0,
          cultures: ['English-Methodist', 'Māori'],
          tensions: 'high',
          economy: 'frontier',
        },
      ],
      totalSettlerPopulation: 30000,
      totalMāoriPopulation: 65000,
      totalPopulation: 95000,
    };
  }

  /**
   * Get political factions
   */
  static getFactions(): any {
    return {
      factions: [
        {
          name: 'Loyalty League',
          ideology: 'Conservative/Reactionary',
          positions: {
            propertyRights: 'strict',
            biCulturalRights: 'abolish',
            expansion: 'non-expansionist',
            māoriPolicy: 'segregationist',
            immigration: 'tight',
            tariffs: 'anti-tariff',
          },
          strength: 'strong in New Caledonia, Tasminata, Southland',
        },
        {
          name: 'Miscegenation Block',
          ideology: 'Progressive',
          positions: {
            suffrage: 'universal male',
            biCulturalRights: 'expand',
            expansion: 'expansionist',
            māoriPolicy: 'autonomy',
            immigration: 'free',
            tariffs: 'anti-tariff',
          },
          strength: 'strong in Vulteralia, Cooksland',
        },
        {
          name: 'Broader Reform Faction',
          ideology: 'Moderate/Reformist',
          positions: {
            governance: 'devolutionist',
            expansion: 'expansionist',
            māoriPolicy: 'segregationist',
            immigration: 'tight',
            tariffs: 'pro-tariff',
          },
          strength: 'distributed across provinces',
        },
      ],
    };
  }

  /**
   * Get starting officials
   */
  static getOfficials(): any {
    return {
      governor: {
        name: 'John P. Marsden',
        appointed: true,
        faction: 'Crown Authority',
      },
      superintendents: {
        Vulteralia: {
          name: 'Monsieur Armand DuBois',
          faction: 'Miscegenation Block',
        },
        'New Zealand': {
          name: 'William S. Hamilton',
          faction: 'Broader Reform Faction',
        },
        Cooksland: {
          name: 'Frederick L. Davies',
          faction: 'Moderate',
        },
        // Others up for election
        Southland: null,
        Tasminata: null,
        'New Caledonia': null,
        Orketers: null,
      },
    };
  }

  /**
   * Get AI analysis context (summary for AI prompts)
   */
  static getAIContext(): string {
    return `
ZEALANDIA GAME CONTEXT (1854)

SETTING:
- Colony of Zealandia, 1854 (alternate New Zealand)
- Constitutional crisis: "The Two Years' Dissolution"
- 7 provinces, 30k European settlers, 65k Māori
- Representative government, transitioning to Responsible Government

KEY POLITICAL ISSUES (1854):
1. Provincial Debt Crisis (Tasminata drowning in debt)
2. Bi-cultural voting rights (Vulteralia's mixed population)
3. Crown monopoly on Māori land purchases
4. Auckland Dissolution (elected House walked out)
5. Conservative vs Progressive conflict
6. Māori land rights and Treaty of Waitangi disputes

PROVINCES:
- Southland: 11,954 pop, 14 seats, pastoral economy, high tensions
- Vulteralia: 5,363 pop, 6 seats, mixed cultures, low tensions, capital Auckland
- Cooksland: 4,327 pop, 5 seats, trade economy, low tensions, capital Cook's Landing
- Tasminata: 3,730 pop, 5 seats, pastoral/whaling, high tensions, in debt crisis
- New Zealand: 3,494 pop, 4 seats, government center, high tensions, capital Wellington
- New Caledonia: 917 pop, 1 seat, whaling/timber, high tensions
- Te Moana-a-Toir: 218 pop, 0 seats, frontier, high tensions

FACTIONS:
- Loyalty League (Conservative): Property rights, abolish bi-cultural rights, anti-immigration
- Miscegenation Block (Progressive): Universal suffrage, Māori autonomy, free immigration
- Broader Reform Faction (Moderate): Devolution, pro-tariff, tight immigration

GOVERNMENT STRUCTURE:
- Governor: John P. Marsden (Crown-appointed)
- Legislative Council (Upper House): 14 appointed members
- House of Representatives (Lower House): 35 elected members
- Bills need simple majority (both houses), 2/3 for Constitution amendments
- Governor can veto (requires 5/7 governors to override - unclear if typo?)

ECONOMIC CONTEXT:
- British Pounds Sterling currency
- 30 resources (timber, wool, flax, etc.)
- Gold/silver deposits hidden (future rushes)
- Trade with Britain, Australia, Pacific Islands
- Provincial debt crisis ongoing

VOTING RIGHTS (1854):
- White male property owners only
- No acreage/value requirement yet
- Bi-cultural rights in Vulteralia (French-Māori can vote)
- Show of hands voting (counted end of turn)
- Māori excluded except mixed-heritage in Vulteralia

TURN MECHANICS:
- 1 turn = 1.2 months in-game (36 days)
- 1 turn = 24 hours real-time
- Players have 5 Action Points per turn
- Game runs 1854-2037 (183 years)
`;
  }
}

export default ZealandiaContext;
