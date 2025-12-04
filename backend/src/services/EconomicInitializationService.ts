/**
 * Economic Initialization Service
 * Calculates resources and GDP for 1850s Zealandia economy
 * Based on geography, terrain, and resource distribution
 */

import { CellModel, ProvinceModel, RiverModel, CityModel } from '../models/mongoose';
import { Types } from 'mongoose';

interface ProvinceResources {
  timber: number;
  agriculture: number;
  fishing: number;
  whaling: number;
  livestock: number;
  mining: number;
}

// Resource value multipliers (in 1850s pounds sterling equivalent)
const RESOURCE_VALUES = {
  timber: 12,       // Kauri forests highly valuable
  agriculture: 8,   // Wheat, flax
  fishing: 6,       // Coastal fisheries
  whaling: 20,      // Highly profitable in 1850s
  livestock: 10,    // Sheep, cattle
  mining: 25,       // Gold rush era
};

// Biome resource mappings
const BIOME_RESOURCES = {
  // Marine biomes
  1: { fishing: 8, whaling: 3 },
  
  // Desert biomes (low productivity)
  2: { agriculture: 1, livestock: 2 },
  3: { livestock: 1, mining: 2 },
  
  // Savanna
  4: { agriculture: 6, livestock: 8 },
  
  // Grassland (prime farming/livestock)
  5: { agriculture: 10, livestock: 12 },
  9: { agriculture: 12, livestock: 14 },
  
  // Forest biomes (timber + some agriculture)
  6: { timber: 12, agriculture: 5 },
  7: { timber: 15, agriculture: 6 },  // Temperate deciduous (ideal)
  8: { timber: 18, agriculture: 4 },  // Temperate rainforest (NZ native)
  
  // Cold biomes
  10: { timber: 6, livestock: 3 },    // Taiga
  11: { mining: 4 },                  // Tundra
  12: { mining: 2 },                  // Glacier
};

const MOUNTAIN_HEIGHT_THRESHOLD = 70; // Heights above this are mountainous
const HILL_HEIGHT_THRESHOLD = 50;

export class EconomicInitializationService {
  
  /**
   * Initialize economy for all provinces in a session
   */
  async initializeEconomy(sessionId: Types.ObjectId): Promise<void> {
    console.log('💰 Initializing 1850s Zealandia economy...');
    
    const provinces = await ProvinceModel.find({ sessionId });
    
    for (const province of provinces) {
      const resources = await this.calculateProvinceResources(province);
      const riverBonus = await this.calculateRiverBonus(province);
      const gdp = this.calculateGDP(resources, riverBonus);
      
      await ProvinceModel.updateOne(
        { _id: province._id },
        { 
          resources,
          riverAccessBonus: riverBonus,
          gdp,
        }
      );
      
      console.log(`  ${province.name}:`);
      console.log(`    GDP: £${gdp.toLocaleString()}`);
      console.log(`    River Bonus: ${(riverBonus * 100).toFixed(1)}%`);
      console.log(`    Resources: Timber=${resources.timber}, Ag=${resources.agriculture}, Livestock=${resources.livestock}, Mining=${resources.mining}`);
    }
    
    console.log('✅ Economic initialization complete');
  }
  
  /**
   * Calculate resources for a province based on its cells
   */
  private async calculateProvinceResources(province: any): Promise<ProvinceResources> {
    const cells = await CellModel.find({ provinceId: province._id });
    const cities = await CityModel.find({ provinceId: province._id });
    
    const resources: ProvinceResources = {
      timber: 0,
      agriculture: 0,
      fishing: 0,
      whaling: 0,
      livestock: 0,
      mining: 0,
    };
    
    // Aggregate resources from all cells
    for (const cell of cells) {
      const biomeResources = BIOME_RESOURCES[cell.biome as keyof typeof BIOME_RESOURCES] || {};
      const area = cell.area;
      
      // Add biome-based resources (using optional chaining and type assertion)
      const br = biomeResources as any;
      if (br.timber) resources.timber += br.timber * area;
      if (br.agriculture) resources.agriculture += br.agriculture * area;
      if (br.fishing) resources.fishing += br.fishing * area;
      if (br.whaling) resources.whaling += br.whaling * area;
      if (br.livestock) resources.livestock += br.livestock * area;
      if (br.mining) resources.mining += br.mining * area;
      
      // Add mining for mountainous terrain
      if (cell.height >= MOUNTAIN_HEIGHT_THRESHOLD) {
        resources.mining += 20 * area;
      } else if (cell.height >= HILL_HEIGHT_THRESHOLD) {
        resources.mining += 8 * area;
      }
    }
    
    // Whaling bonus for coastal provinces with ports
    const hasPort = cities.some((city: any) => city.economicType === 'port');
    if (hasPort && resources.fishing > 0) {
      resources.whaling = resources.fishing * 0.4; // 40% of fishing value
    }
    
    // Round all values
    return {
      timber: Math.round(resources.timber),
      agriculture: Math.round(resources.agriculture),
      fishing: Math.round(resources.fishing),
      whaling: Math.round(resources.whaling),
      livestock: Math.round(resources.livestock),
      mining: Math.round(resources.mining),
    };
  }
  
  /**
   * Calculate river transportation bonus
   * Rivers enable cheaper transport of goods, boosting GDP
   */
  private async calculateRiverBonus(province: any): Promise<number> {
    const cells = await CellModel.find({ provinceId: province._id });
    const riverCells = cells.filter(cell => cell.hasRiver);
    
    if (cells.length === 0) return 0;
    
    const riverCoverage = riverCells.length / cells.length;
    
    // Max 25% GDP bonus from rivers
    return Math.min(riverCoverage * 0.5, 0.25);
  }
  
  /**
   * Calculate GDP from resources
   */
  private calculateGDP(resources: ProvinceResources, riverBonus: number): number {
    const baseGDP = 
      (resources.timber * RESOURCE_VALUES.timber) +
      (resources.agriculture * RESOURCE_VALUES.agriculture) +
      (resources.fishing * RESOURCE_VALUES.fishing) +
      (resources.whaling * RESOURCE_VALUES.whaling) +
      (resources.livestock * RESOURCE_VALUES.livestock) +
      (resources.mining * RESOURCE_VALUES.mining);
    
    // Apply river transportation bonus
    const finalGDP = baseGDP * (1 + riverBonus);
    
    return Math.round(finalGDP);
  }
  
  /**
   * Determine city economic type based on location
   */
  async determineCityEconomicTypes(sessionId: Types.ObjectId): Promise<void> {
    const cities = await CityModel.find({ sessionId }).populate('cellId');
    
    for (const city of cities) {
      const cell = city.cellId as any;
      
      let economicType: 'port' | 'inland' | 'mining' | 'agricultural' = 'inland';
      
      // Port cities (marine biome)
      if (cell && cell.biome === 1) {
        economicType = 'port';
      }
      // Mining towns (high elevation)
      else if (cell && cell.height >= MOUNTAIN_HEIGHT_THRESHOLD) {
        economicType = 'mining';
      }
      // Agricultural centers (grassland)
      else if (cell && (cell.biome === 5 || cell.biome === 9)) {
        economicType = 'agricultural';
      }
      
      await CityModel.updateOne(
        { _id: city._id },
        { economicType }
      );
    }
    
    console.log('✅ City economic types determined');
  }
  
  /**
   * Get economic summary for a session
   */
  async getEconomicSummary(sessionId: Types.ObjectId): Promise<any> {
    const provinces = await ProvinceModel.find({ sessionId }).lean();
    
    const totalGDP = provinces.reduce((sum, p) => sum + (p.gdp || 0), 0);
    
    return {
      totalGDP,
      provinces: provinces.map(p => ({
        name: p.name,
        gdp: p.gdp,
        percentage: ((p.gdp / totalGDP) * 100).toFixed(1),
        topResource: this.getTopResource(p.resources),
        riverBonus: `${((p.riverAccessBonus || 0) * 100).toFixed(1)}%`,
      })),
    };
  }
  
  private getTopResource(resources: any): string {
    if (!resources) return 'None';
    
    const entries = Object.entries(resources)
      .filter(([key]) => key !== '_id')
      .sort(([, a], [, b]) => (b as number) - (a as number));
    
    return entries.length > 0 ? entries[0][0] : 'None';
  }
}
