/**
 * Population Distribution Service
 * Distributes 95,000 population across provinces based on:
 * - Biome habitability (1850s New Zealand context)
 * - City locations
 * - Terrain factors
 */

import { CellModel, CityModel, ProvinceModel } from '../models/mongoose';
import { Types } from 'mongoose';

interface BiomeHabitability {
  [biomeId: number]: number;
}

// Biome habitability weights for 1850s New Zealand settlement patterns
const BIOME_HABITABILITY: BiomeHabitability = {
  1: 0.15,  // Marine (coastal settlements, fishing villages)
  2: 0.20,  // Hot desert (low habitability)
  3: 0.15,  // Cold desert
  4: 0.75,  // Savanna
  5: 0.85,  // Grassland (prime farming/livestock - highly desirable)
  6: 0.70,  // Tropical seasonal forest
  7: 0.95,  // Temperate deciduous forest (ideal NZ climate)
  8: 0.90,  // Temperate rainforest (NZ native forests)
  9: 0.88,  // Temperate grassland (Canterbury Plains equivalent)
  10: 0.45, // Taiga (too cold for major settlement)
  11: 0.10, // Tundra (minimal settlement)
  12: 0.05, // Glacier (uninhabitable)
};

const TOTAL_POPULATION = 95000;
const CITY_POPULATION_MULTIPLIER = 5; // Cities attract 5x base population

export class PopulationDistributionService {
  
  /**
   * Distribute population across all provinces in a session
   */
  async distributePopulation(sessionId: Types.ObjectId): Promise<void> {
    console.log('🏘️  Starting population distribution...');
    
    // Get all cells for this session
    const cells = await CellModel.find({ sessionId });
    const cities = await CityModel.find({ sessionId });
    const provinces = await ProvinceModel.find({ sessionId });
    
    if (cells.length === 0) {
      throw new Error('No cells found for session');
    }
    
    // Calculate habitability score for each cell
    const cellScores = new Map<string, number>();
    let totalScore = 0;
    
    for (const cell of cells) {
      const baseHabitability = BIOME_HABITABILITY[cell.biome] || 0.5;
      
      // Check if cell has a city
      const hasCity = cities.some(city => 
        city.cellId && city.cellId.equals(cell._id)
      );
      
      // Calculate final score
      let score = cell.area * baseHabitability;
      if (hasCity) {
        score *= CITY_POPULATION_MULTIPLIER;
      }
      
      // Update cell habitability field
      await CellModel.updateOne(
        { _id: cell._id },
        { habitability: baseHabitability }
      );
      
      cellScores.set(cell._id.toString(), score);
      totalScore += score;
    }
    
    // Distribute population proportionally
    const provincePops = new Map<string, number>();
    
    for (const cell of cells) {
      const score = cellScores.get(cell._id.toString()) || 0;
      const cellPopulation = Math.floor((score / totalScore) * TOTAL_POPULATION);
      
      if (cell.provinceId) {
        const provinceId = cell.provinceId.toString();
        provincePops.set(provinceId, (provincePops.get(provinceId) || 0) + cellPopulation);
      }
    }
    
    // Update province populations
    for (const province of provinces) {
      const population = provincePops.get(province._id.toString()) || 0;
      await ProvinceModel.updateOne(
        { _id: province._id },
        { population }
      );
      console.log(`  ${province.name}: ${population.toLocaleString()} people`);
    }
    
    // Distribute city populations
    await this.distributeCityPopulations(sessionId, cities, cellScores, totalScore);
    
    console.log('✅ Population distribution complete');
  }
  
  /**
   * Distribute population within cities
   */
  private async distributeCityPopulations(
    sessionId: Types.ObjectId,
    cities: any[],
    cellScores: Map<string, number>,
    totalScore: number
  ): Promise<void> {
    for (const city of cities) {
      if (!city.cellId) continue;
      
      const cellScore = cellScores.get(city.cellId.toString()) || 0;
      const cityPopulation = Math.floor((cellScore / totalScore) * TOTAL_POPULATION);
      
      // Cities get majority of their cell's population
      const finalCityPop = Math.floor(cityPopulation * 0.7);
      
      await CityModel.updateOne(
        { _id: city._id },
        { population: finalCityPop }
      );
      
      console.log(`    ${city.name}: ${finalCityPop.toLocaleString()} (${city.isCapital ? 'capital' : 'city'})`);
    }
  }
  
  /**
   * Get population summary for a session
   */
  async getPopulationSummary(sessionId: Types.ObjectId): Promise<any> {
    const provinces = await ProvinceModel.find({ sessionId })
      .populate('capitalCityId')
      .lean();
    
    const totalPop = provinces.reduce((sum, p: any) => sum + (p.population || 0), 0);
    
    return {
      totalPopulation: totalPop,
      provinces: provinces.map((p: any) => ({
        name: p.name,
        population: p.population,
        percentage: ((p.population / totalPop) * 100).toFixed(1),
        capital: p.capitalCityId?.name || 'None',
      })),
    };
  }
}
