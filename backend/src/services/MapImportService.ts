/**
 * Map Import Service
 * Orchestrates the import of Azgaar map data into POLSIM
 * Handles parsing, database insertion, and initialization
 */

import * as fs from 'fs';
import * as path from 'path';
import { Types } from 'mongoose';
import { AzgaarMapParser } from '../utils/AzgaarMapParser';
import { PopulationDistributionService } from './PopulationDistributionService';
import { EconomicInitializationService } from './EconomicInitializationService';
import { 
  SessionModel, 
  ProvinceModel, 
  CellModel, 
  CityModel, 
  CultureModel, 
  ReligionModel,
  RiverModel 
} from '../models/mongoose';

export class MapImportService {
  private popService: PopulationDistributionService;
  private econService: EconomicInitializationService;
  
  constructor() {
    this.popService = new PopulationDistributionService();
    this.econService = new EconomicInitializationService();
  }
  
  /**
   * Import Azgaar map into a session
   */
  async importMap(sessionId: string, azgaarFilePath: string): Promise<void> {
    console.log('🗺️  Starting map import for session:', sessionId);
    
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Step 1: Parse Azgaar JSON
    console.log('📖 Parsing Azgaar map file...');
    const parser = new AzgaarMapParser(azgaarFilePath);
    const parsedData = parser.parse();
    
    console.log(parser.getSummary());
    
    // Step 2: Import cultures
    console.log('🌍 Importing cultures...');
    await this.importCultures(sessionId, parsedData.cultures);
    
    // Step 3: Import religions
    console.log('⛪ Importing religions...');
    await this.importReligions(sessionId, parsedData.religions);
    
    // Step 4: Import provinces
    console.log('🏛️  Importing provinces...');
    const provinceIdMap = await this.importProvinces(sessionId, parsedData.provinces);
    
    // Step 5: Import cells
    console.log('🗺️  Importing terrain cells...');
    await this.importCells(sessionId, parsedData.cells, provinceIdMap, parsedData.metadata);
    
    // Step 6: Import cities
    console.log('🏙️  Importing cities...');
    await this.importCities(sessionId, parsedData.burgs, provinceIdMap);
    
    // Step 7: Import rivers
    console.log('🌊 Importing rivers...');
    await this.importRivers(sessionId, parsedData.rivers);
    
    // Step 8: Determine city economic types
    console.log('🏪 Determining city economic types...');
    await this.econService.determineCityEconomicTypes(new Types.ObjectId(sessionId));
    
    // Step 9: Distribute population
    console.log('👥 Distributing population...');
    await this.popService.distributePopulation(new Types.ObjectId(sessionId));
    
    // Step 10: Initialize economy
    console.log('💰 Initializing economy...');
    await this.econService.initializeEconomy(new Types.ObjectId(sessionId));
    
    // Step 11: Calculate cultural/religious composition
    console.log('📊 Calculating cultural/religious composition...');
    await this.calculateCompositions(sessionId);
    
    // Step 12: Update session metadata
    await SessionModel.updateOne(
      { _id: sessionId },
      { 
        'world.mapImported': true,
        'world.mapName': parsedData.metadata.mapName,
        'world.totalPopulation': parsedData.metadata.totalPopulation,
      }
    );
    
    console.log('✅ Map import complete!');
  }
  
  private async importCultures(sessionId: string, cultures: any[]): Promise<void> {
    for (const culture of cultures) {
      await CultureModel.create({
        azgaarId: culture.id,
        sessionId,
        name: culture.name,
        code: culture.code,
      });
    }
    console.log(`  ✓ Imported ${cultures.length} cultures`);
  }
  
  private async importReligions(sessionId: string, religions: any[]): Promise<void> {
    for (const religion of religions) {
      await ReligionModel.create({
        azgaarId: religion.id,
        sessionId,
        name: religion.name,
        code: religion.code,
        type: religion.type,
      });
    }
    console.log(`  ✓ Imported ${religions.length} religions`);
  }
  
  private async importProvinces(sessionId: string, provinces: any[]): Promise<Map<number, Types.ObjectId>> {
    const idMap = new Map<number, Types.ObjectId>();
    
    for (const province of provinces) {
      const doc = await ProvinceModel.create({
        id: `province-${province.id}`,
        sessionId,
        name: province.name,
        azgaarId: province.id,
        color: province.color,
        centerCoords: province.centerCoords,
        area: province.area,
        defaultIdeology: { economic: 0, social: 0, personal: 0 }, // Moderate
        culturalComposition: [],
        religiousComposition: [],
      });
      
      idMap.set(province.id, doc._id);
    }
    
    console.log(`  ✓ Imported ${provinces.length} provinces`);
    return idMap;
  }
  
  private async importCells(
    sessionId: string, 
    cells: any[], 
    provinceIdMap: Map<number, Types.ObjectId>,
    metadata: any
  ): Promise<void> {
    const batchSize = 500; // Insert in batches for performance
    const batches = [];
    
    for (let i = 0; i < cells.length; i += batchSize) {
      const batch = cells.slice(i, i + batchSize).map(cell => {
        const temperature = this.calculateNZTemperature(cell.height, cell.position[1], metadata.height);
        
        return {
          azgaarId: cell.id,
          sessionId,
          vertices: cell.vertices,
          connections: cell.connections,
          position: cell.position,
          height: cell.height,
          temperature,
          area: cell.area,
          biome: cell.biome,
          provinceId: provinceIdMap.get(cell.provinceId),
          cultureId: cell.cultureId,
          religionId: cell.religionId,
          hasRiver: cell.hasRiver,
        };
      });
      
      batches.push(CellModel.insertMany(batch));
    }
    
    await Promise.all(batches);
    console.log(`  ✓ Imported ${cells.length} cells`);
  }
  
  private async importCities(
    sessionId: string, 
    burgs: any[], 
    provinceIdMap: Map<number, Types.ObjectId>
  ): Promise<void> {
    for (const burg of burgs) {
      const cell = await CellModel.findOne({ sessionId, azgaarId: burg.cellId });
      
      const cityDoc = await CityModel.create({
        azgaarId: burg.id,
        sessionId,
        name: burg.name,
        position: burg.position,
        cellId: cell?._id,
        provinceId: provinceIdMap.get(burg.provinceId),
        isCapital: burg.isCapital,
      });
      
      // Update province capital
      if (burg.isCapital) {
        await ProvinceModel.updateOne(
          { _id: provinceIdMap.get(burg.provinceId) },
          { capitalCityId: cityDoc._id }
        );
      }
    }
    
    console.log(`  ✓ Imported ${burgs.length} cities`);
  }
  
  private async importRivers(sessionId: string, rivers: any[]): Promise<void> {
    for (const river of rivers) {
      await RiverModel.create({
        azgaarId: river.id,
        sessionId,
        name: river.name,
        source: river.source,
        mouth: river.mouth,
        cells: river.cells,
      });
    }
    console.log(`  ✓ Imported ${rivers.length} rivers`);
  }
  
  /**
   * Calculate temperature using NZ climate model
   */
  private calculateNZTemperature(height: number, yPosition: number, mapHeight: number): number {
    const baseTemp = 14; // NZ average temp (°C)
    const heightPenalty = height * 0.6; // 0.6°C per height unit
    const latitudeEffect = (yPosition / mapHeight - 0.5) * -10; // South colder
    
    return baseTemp - heightPenalty + latitudeEffect;
  }
  
  /**
   * Calculate cultural and religious composition per province
   */
  private async calculateCompositions(sessionId: string): Promise<void> {
    const provinces = await ProvinceModel.find({ sessionId });
    
    for (const province of provinces) {
      const cells = await CellModel.find({ provinceId: province._id });
      
      // Count cultures
      const cultureCounts = new Map<number, number>();
      const religionCounts = new Map<number, number>();
      
      for (const cell of cells) {
        if (cell.cultureId) {
          cultureCounts.set(cell.cultureId, (cultureCounts.get(cell.cultureId) || 0) + 1);
        }
        if (cell.religionId) {
          religionCounts.set(cell.religionId, (religionCounts.get(cell.religionId) || 0) + 1);
        }
      }
      
      const totalCells = cells.length;
      
      // Calculate percentages
      const culturalComposition = Array.from(cultureCounts.entries())
        .map(([cultureId, count]) => ({
          cultureId,
          percentage: (count / totalCells) * 100,
        }))
        .sort((a, b) => b.percentage - a.percentage);
      
      const religiousComposition = Array.from(religionCounts.entries())
        .map(([religionId, count]) => ({
          religionId,
          percentage: (count / totalCells) * 100,
        }))
        .sort((a, b) => b.percentage - a.percentage);
      
      await ProvinceModel.updateOne(
        { _id: province._id },
        { culturalComposition, religiousComposition }
      );
    }
  }
  
  /**
   * Get import summary
   */
  async getImportSummary(sessionId: string): Promise<any> {
    const [provinces, cells, cities, cultures, religions, rivers] = await Promise.all([
      ProvinceModel.countDocuments({ sessionId }),
      CellModel.countDocuments({ sessionId }),
      CityModel.countDocuments({ sessionId }),
      CultureModel.countDocuments({ sessionId }),
      ReligionModel.countDocuments({ sessionId }),
      RiverModel.countDocuments({ sessionId }),
    ]);
    
    const popSummary = await this.popService.getPopulationSummary(new Types.ObjectId(sessionId));
    const econSummary = await this.econService.getEconomicSummary(new Types.ObjectId(sessionId));
    
    return {
      counts: { provinces, cells, cities, cultures, religions, rivers },
      population: popSummary,
      economy: econSummary,
    };
  }
}
