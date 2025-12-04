/**
 * Reputation Service
 * Manages player approval ratings across demographic groups
 */

import { models } from '../models/mongoose';

export class ReputationService {
  /**
   * Initialize reputation groups for a new session
   * Creates groups based on cultures, religions, and political archetypes
   */
  static async initializeReputationGroups(sessionId: string): Promise<void> {
    // 1. Create political groups (by archetype)
    const archetypes = [
      'LibertarianCapitalist',
      'ConservativeMonarchist', 
      'ProgressiveReformer',
      'SocialistWorker',
      'FarRightNationalist',
      'GreenEnvironmentalist',
      'ReligiousConservative',
      'SocialDemocrat',
      'CentristPragmatist',
    ];
    
    for (const archetype of archetypes) {
      const ideology = this.getArchetypeIdeology(archetype);
      
      await models.ReputationGroup.create({
        id: `political-${archetype}-${sessionId}`,
        sessionId,
        name: this.getArchetypeName(archetype),
        type: 'political',
        archetypeId: archetype,
        population: 1000, // Will be updated based on NPC distribution
        ideology,
        traits: this.getArchetypeTraits(archetype),
        politicalPower: this.getArchetypePoliticalPower(archetype),
        economicPower: 50,
      });
    }
    
    // 2. Create cultural groups
    const cultures = await models.Culture.find({ sessionId });
    
    for (const culture of cultures) {
      await models.ReputationGroup.create({
        id: `cultural-${culture.id}-${sessionId}`,
        sessionId,
        name: culture.name,
        type: 'cultural',
        cultureId: culture.id,
        population: 0, // Will be calculated from cells
        politicalPower: 50,
        economicPower: 50,
      });
    }
    
    // 3. Create religious groups
    const religions = await models.Religion.find({ sessionId });
    
    for (const religion of religions) {
      await models.ReputationGroup.create({
        id: `religious-${religion.id}-${sessionId}`,
        sessionId,
        name: religion.name,
        type: 'religious',
        religionId: religion.id,
        population: 0, // Will be calculated from cells
        politicalPower: 50,
        economicPower: 50,
      });
    }
    
    // 4. Create socioeconomic groups
    const socioeconomicClasses = [
      { name: 'Upper Class', power: 80, econ: 90 },
      { name: 'Middle Class', power: 60, econ: 50 },
      { name: 'Working Class', power: 40, econ: 20 },
      { name: 'Lower Class', power: 20, econ: 10 },
    ];
    
    for (let i = 0; i < socioeconomicClasses.length; i++) {
      const cls = socioeconomicClasses[i];
      await models.ReputationGroup.create({
        id: `socioeconomic-${i + 1}-${sessionId}`,
        sessionId,
        name: cls.name,
        type: 'socioeconomic',
        population: 1000,
        politicalPower: cls.power,
        economicPower: cls.econ,
      });
    }
    
    // 5. Update populations from cell data
    await this.updateGroupPopulations(sessionId);
  }
  
  /**
   * Update group populations based on cell data
   */
  private static async updateGroupPopulations(sessionId: string): Promise<void> {
    const cells = await models.Cell.find({ sessionId });
    
    // Count by culture
    const cultureCounts = new Map<string, number>();
    const religionCounts = new Map<string, number>();
    
    cells.forEach(cell => {
      if (cell.culture && cell.pop) {
        cultureCounts.set(cell.culture, (cultureCounts.get(cell.culture) || 0) + cell.pop);
      }
      if (cell.religion && cell.pop) {
        religionCounts.set(cell.religion, (religionCounts.get(cell.religion) || 0) + cell.pop);
      }
    });
    
    // Update cultural groups
    for (const [cultureId, pop] of cultureCounts) {
      await models.ReputationGroup.updateOne(
        { sessionId, type: 'cultural', cultureId },
        { population: pop }
      );
    }
    
    // Update religious groups
    for (const [religionId, pop] of religionCounts) {
      await models.ReputationGroup.updateOne(
        { sessionId, type: 'religious', religionId },
        { population: pop }
      );
    }
  }
  
  /**
   * Initialize player reputation with all groups (starts at 50)
   */
  static async initializePlayerReputation(playerId: string, sessionId: string): Promise<void> {
    const groups = await models.ReputationGroup.find({ sessionId });
    
    for (const group of groups) {
      await models.PlayerReputation.create({
        playerId,
        sessionId,
        groupId: group._id,
        approval: 50, // Neutral starting point
        lastChanged: new Date(),
        history: [],
      });
    }
  }
  
  /**
   * Update player reputation with a group
   */
  static async updateReputation(
    playerId: string,
    groupId: string,
    change: number,
    reason: string,
    turn: number
  ): Promise<void> {
    const rep = await models.PlayerReputation.findOne({ playerId, groupId });
    
    if (!rep) {
      throw new Error('Reputation record not found');
    }
    
    const newApproval = Math.max(0, Math.min(100, rep.approval + change));
    
    rep.approval = newApproval;
    rep.lastChanged = new Date();
    
    if (!rep.history) {
      rep.history = [];
    }
    
    rep.history.push({
      turn,
      approval: newApproval,
      changeReason: reason,
    } as any);
    
    await rep.save();
  }
  
  /**
   * Apply policy effects to reputation
   */
  static async applyPolicyEffects(
    playerId: string,
    sessionId: string,
    policyType: string,
    ideologyPoint: { economic: number; social: number; personal: number },
    turn: number
  ): Promise<void> {
    const groups = await models.ReputationGroup.find({ sessionId, type: 'political' });
    
    for (const group of groups) {
      if (!group.ideology) continue;
      
      // Calculate ideology distance
      const economicDist = Math.abs(group.ideology.economic - ideologyPoint.economic);
      const socialDist = Math.abs(group.ideology.social - ideologyPoint.social);
      const personalDist = Math.abs(group.ideology.personal - ideologyPoint.personal);
      
      const totalDist = (economicDist * 0.5) + (socialDist * 0.3) + (personalDist * 0.2);
      
      // Closer ideology = positive change, farther = negative
      // Scale: 0-20 distance -> +10 to -10 approval
      const change = Math.round(10 - totalDist);
      
      await this.updateReputation(
        playerId,
        group._id.toString(),
        change,
        `Enacted ${policyType} policy`,
        turn
      );
    }
  }
  
  /**
   * Get player's reputation summary
   */
  static async getPlayerReputationSummary(playerId: string, sessionId: string): Promise<any> {
    const reputations = await models.PlayerReputation.find({ playerId, sessionId })
      .populate('groupId')
      .lean();
    
    const byType: any = {
      political: [],
      cultural: [],
      religious: [],
      socioeconomic: [],
    };
    
    reputations.forEach((rep: any) => {
      if (rep.groupId) {
        byType[rep.groupId.type]?.push({
          groupName: rep.groupId.name,
          approval: rep.approval,
          population: rep.groupId.population,
        });
      }
    });
    
    // Calculate weighted average
    let totalApproval = 0;
    let totalPop = 0;
    
    reputations.forEach((rep: any) => {
      if (rep.groupId) {
        totalApproval += rep.approval * rep.groupId.population;
        totalPop += rep.groupId.population;
      }
    });
    
    const overallApproval = totalPop > 0 ? Math.round(totalApproval / totalPop) : 50;
    
    return {
      overall: overallApproval,
      byType,
    };
  }
  
  // Helper methods for archetype definitions
  private static getArchetypeIdeology(archetype: string): { economic: number; social: number; personal: number } {
    const ideologies: any = {
      LibertarianCapitalist: { economic: 10, social: 0, personal: 10 },
      ConservativeMonarchist: { economic: 5, social: 8, personal: -5 },
      ProgressiveReformer: { economic: -3, social: -5, personal: 5 },
      SocialistWorker: { economic: -10, social: -3, personal: 0 },
      FarRightNationalist: { economic: 3, social: 10, personal: -8 },
      GreenEnvironmentalist: { economic: -5, social: -2, personal: 3 },
      ReligiousConservative: { economic: 0, social: 9, personal: -7 },
      SocialDemocrat: { economic: -5, social: 0, personal: 3 },
      CentristPragmatist: { economic: 0, social: 0, personal: 0 },
    };
    
    return ideologies[archetype] || { economic: 0, social: 0, personal: 0 };
  }
  
  private static getArchetypeName(archetype: string): string {
    const names: any = {
      LibertarianCapitalist: 'Free Market Advocates',
      ConservativeMonarchist: 'Monarchist Loyalists',
      ProgressiveReformer: 'Progressive Reformers',
      SocialistWorker: 'Socialist Workers',
      FarRightNationalist: 'Nationalist Movement',
      GreenEnvironmentalist: 'Environmental Activists',
      ReligiousConservative: 'Religious Conservatives',
      SocialDemocrat: 'Social Democrats',
      CentristPragmatist: 'Centrist Pragmatists',
    };
    
    return names[archetype] || archetype;
  }
  
  private static getArchetypeTraits(archetype: string): string[] {
    const traits: any = {
      LibertarianCapitalist: ['pro-business', 'anti-regulation', 'individualist'],
      ConservativeMonarchist: ['traditional', 'authoritarian', 'hierarchical'],
      ProgressiveReformer: ['reformist', 'democratic', 'modernizing'],
      SocialistWorker: ['collectivist', 'egalitarian', 'pro-labor'],
      FarRightNationalist: ['nationalist', 'xenophobic', 'authoritarian'],
      GreenEnvironmentalist: ['environmentalist', 'sustainable', 'progressive'],
      ReligiousConservative: ['religious', 'traditional', 'moralist'],
      SocialDemocrat: ['welfare-state', 'democratic', 'moderate'],
      CentristPragmatist: ['pragmatic', 'moderate', 'consensus-building'],
    };
    
    return traits[archetype] || [];
  }
  
  private static getArchetypePoliticalPower(archetype: string): number {
    const power: any = {
      LibertarianCapitalist: 65, // Business influence
      ConservativeMonarchist: 70, // Traditional authority
      ProgressiveReformer: 55,
      SocialistWorker: 45,
      FarRightNationalist: 50,
      GreenEnvironmentalist: 35, // Emerging movement
      ReligiousConservative: 60, // Church influence
      SocialDemocrat: 55,
      CentristPragmatist: 50,
    };
    
    return power[archetype] || 50;
  }
}
