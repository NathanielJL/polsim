/**
 * Immigration System
 * 
 * Three types of immigration:
 * 1. Annual baseline (2% population growth every January)
 * 2. GM event-driven immigration (wars, disasters, opportunities)
 * 3. Policy-driven modifiers (immigration policies boost/reduce flow)
 * 
 * Cultural distribution of immigrants reflects origin countries and policies
 */

import { models } from '../models/mongoose';

export class ImmigrationService {
  
  /**
   * Process annual baseline immigration (called every January by TurnService)
   * 2% population growth distributed across provinces
   */
  async processAnnualImmigration(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const provinces = await models.Province.find({ sessionId });
      const totalPopulation = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
      
      // Base immigration: 2% of total population
      const baseImmigrants = Math.floor(totalPopulation * 0.02);
      
      // Check for active immigration policies
      const immigrationPolicies = await models.Policy.find({
        sessionId,
        status: 'enacted',
        policyType: 'immigration'
      });
      
      // Calculate policy modifier (-50% to +200%)
      let policyModifier = 1.0;
      for (const policy of immigrationPolicies) {
        if (policy.economicImpact?.immigrationModifier) {
          policyModifier *= policy.economicImpact.immigrationModifier;
        }
      }
      
      const totalImmigrants = Math.floor(baseImmigrants * policyModifier);
      
      // Default cultural distribution (reflects 1850s immigration patterns)
      const defaultCulturalDistribution = {
        'English': 0.40,
        'Scottish': 0.15,
        'Irish': 0.20,
        'Dutch': 0.05,
        'French': 0.05,
        'German': 0.05,
        'Scandinavian': 0.05,
        'Other European': 0.05
      };
      
      // Modify distribution based on policies
      let culturalDistribution = { ...defaultCulturalDistribution };
      for (const policy of immigrationPolicies) {
        if (policy.culturalModifiers) {
          for (const [culture, modifier] of Object.entries(policy.culturalModifiers)) {
            if (culturalDistribution[culture]) {
              culturalDistribution[culture] *= modifier as number;
            }
          }
        }
      }
      
      // Normalize distribution
      const sum = Object.values(culturalDistribution).reduce((a, b) => a + b, 0);
      for (const culture of Object.keys(culturalDistribution)) {
        culturalDistribution[culture] /= sum;
      }
      
      // Distribute immigrants across provinces
      // Provinces with higher GDP and lower unemployment attract more immigrants
      const provinceScores: any[] = [];
      for (const province of provinces) {
        const gdpScore = (province.gdp || 0) / 100000; // Higher GDP attracts immigrants
        const unemploymentPenalty = 1 - ((province.unemployment || 5) / 100); // Lower unemployment attracts
        const developmentBonus = (province.developmentLevel || 5) / 100; // More developed attracts
        
        const score = gdpScore * unemploymentPenalty * (1 + developmentBonus);
        
        provinceScores.push({
          province,
          score
        });
      }
      
      const totalScore = provinceScores.reduce((sum, p) => sum + p.score, 0);
      
      const results: any[] = [];
      
      for (const { province, score } of provinceScores) {
        const provinceImmigrants = Math.floor((score / totalScore) * totalImmigrants);
        
        if (provinceImmigrants > 0) {
          // Update population
          province.population = (province.population || 0) + provinceImmigrants;
          await province.save();
          
          // Create immigration record
          const culturalBreakdown: any = {};
          for (const [culture, percentage] of Object.entries(culturalDistribution)) {
            const count = Math.floor(provinceImmigrants * percentage);
            if (count > 0) {
              culturalBreakdown[culture] = count;
            }
          }
          
          results.push({
            province: province.name,
            immigrants: provinceImmigrants,
            culturalBreakdown
          });
        }
      }
      
      // Create news event
      await models.Event.create({
        id: `event-immigration-${Date.now()}`,
        sessionId,
        title: `Annual Immigration Wave Brings ${totalImmigrants.toLocaleString()} New Settlers`,
        description: `The year's immigration wave has brought ${totalImmigrants.toLocaleString()} new settlers to Zealandia (${policyModifier > 1 ? 'boosted' : policyModifier < 1 ? 'reduced' : ''} by immigration policies). Settlers are primarily English (${(culturalDistribution['English'] * 100).toFixed(0)}%), Irish (${(culturalDistribution['Irish'] * 100).toFixed(0)}%), and Scottish (${(culturalDistribution['Scottish'] * 100).toFixed(0)}%).`,
        severity: 4,
        type: 'immigration',
        duration: 1,
        affectedGroups: ['settlers', 'provincial_governments'],
        gdpImpact: 0.02, // Immigration brings economic growth
        gmApproved: true,
        turnCreated: session.currentTurn,
        turnEnds: session.currentTurn + 1
      });
      
      return {
        totalImmigrants,
        policyModifier,
        culturalDistribution,
        provinceBreakdown: results
      };
    } catch (error: any) {
      console.error('Immigration processing error:', error);
      throw error;
    }
  }
  
  /**
   * Process event-driven immigration (called by GM events)
   * Examples: Irish Potato Famine, Gold Rush, War refugees
   */
  async processEventImmigration(
    sessionId: string, 
    eventId: string,
    immigrants: number,
    culturalMakeup: any,
    targetProvinces?: string[]
  ): Promise<any> {
    try {
      const event = await models.Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      const provinces = targetProvinces && targetProvinces.length > 0
        ? await models.Province.find({ sessionId, name: { $in: targetProvinces } })
        : await models.Province.find({ sessionId });
      
      // Distribute evenly or by GDP if no target provinces
      const totalGDP = provinces.reduce((sum, p) => sum + (p.gdp || 0), 0);
      
      const results: any[] = [];
      
      for (const province of provinces) {
        const provinceShare = targetProvinces && targetProvinces.length > 0
          ? immigrants / provinces.length // Even split if targeted
          : (province.gdp || 0) / totalGDP * immigrants; // GDP-based if general
        
        const provinceImmigrants = Math.floor(provinceShare);
        
        if (provinceImmigrants > 0) {
          province.population = (province.population || 0) + provinceImmigrants;
          await province.save();
          
          results.push({
            province: province.name,
            immigrants: provinceImmigrants
          });
        }
      }
      
      return {
        event: event.title,
        totalImmigrants: immigrants,
        culturalMakeup,
        provinceBreakdown: results
      };
    } catch (error: any) {
      console.error('Event immigration error:', error);
      throw error;
    }
  }
  
  /**
   * Get immigration statistics for a session
   */
  async getImmigrationStats(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const provinces = await models.Province.find({ sessionId });
      const currentPopulation = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
      
      // Get immigration policies
      const immigrationPolicies = await models.Policy.find({
        sessionId,
        status: 'enacted',
        policyType: 'immigration'
      });
      
      let policyModifier = 1.0;
      for (const policy of immigrationPolicies) {
        if (policy.economicImpact?.immigrationModifier) {
          policyModifier *= policy.economicImpact.immigrationModifier;
        }
      }
      
      const baseAnnualRate = 0.02; // 2% baseline
      const modifiedRate = baseAnnualRate * policyModifier;
      const expectedNextYear = Math.floor(currentPopulation * modifiedRate);
      
      // Get immigration events
      const immigrationEvents = await models.Event.find({
        sessionId,
        type: 'immigration',
        turnCreated: { $gte: session.currentTurn - 12 } // Last year
      }).sort({ turnCreated: -1 });
      
      return {
        currentPopulation,
        baseAnnualRate: (baseAnnualRate * 100).toFixed(1) + '%',
        policyModifier: policyModifier.toFixed(2),
        modifiedAnnualRate: (modifiedRate * 100).toFixed(1) + '%',
        expectedNextYear,
        activePolicies: immigrationPolicies.map(p => ({
          title: p.title,
          modifier: p.economicImpact?.immigrationModifier || 1.0
        })),
        recentEvents: immigrationEvents.map(e => ({
          title: e.title,
          turn: e.turnCreated,
          description: e.description
        }))
      };
    } catch (error: any) {
      console.error('Immigration stats error:', error);
      throw error;
    }
  }
}

export default new ImmigrationService();
