/**
 * Data Dictionary API Routes
 * Makes game terminology accessible to all players
 */

import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

/**
 * GET /api/data-dictionary
 * Get complete data dictionary for players
 * No authentication required - public reference
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dictionaryPath = join(__dirname, '../../..', 'DATA_DICTIONARY.md');
    const dictionary = readFileSync(dictionaryPath, 'utf-8');
    
    res.json({
      dictionary,
      message: 'Use these exact field names when creating events/policies',
      version: '1.0.0',
      lastUpdated: new Date('2025-12-04')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/data-dictionary/resources
 * Get just resource names
 */
router.get('/resources', async (req: Request, res: Response) => {
  const resources = [
    // Forestry
    'timber', 'flax', 'kauri_gum',
    // Agriculture
    'grain', 'vegetables', 'fruit', 'wheat', 'barley',
    // Livestock
    'wool', 'leather', 'meat', 'dairy',
    // Marine
    'fish', 'whaling', 'sealing', 'shellfish',
    // Mining - Precious
    'gold', 'silver', 'platinum',
    // Mining - Industrial
    'coal', 'iron', 'copper', 'tin', 'zinc',
    // Mining - Specialty
    'sulfur', 'saltpeter', 'graphite',
    // Quarrying
    'stone', 'marble', 'clay', 'kaolin',
    // Special
    'guano', 'ice'
  ];
  
  res.json({ resources });
});

/**
 * GET /api/data-dictionary/reputation-groups
 * Get all reputation group names
 */
router.get('/reputation-groups', async (req: Request, res: Response) => {
  const groups = [
    // Economic Classes
    'upper_class', 'middle_class', 'working_class',
    // Cultural Groups
    'british_settlers', 'maori_communities', 'mixed_heritage',
    // Occupational Groups
    'farmers', 'merchants', 'miners', 'loggers', 'whalers', 
    'lawyers', 'clergy',
    // Political Groups
    'loyalists', 'reformists', 'autonomists',
    // Government
    'provincial_governments', 'federal_government', 'british_crown',
    // Special Interest
    'creditors', 'investors', 'landowners', 'treaty_advocates'
  ];
  
  res.json({ groups });
});

/**
 * GET /api/data-dictionary/event-types
 * Get valid event type strings
 */
router.get('/event-types', async (req: Request, res: Response) => {
  const eventTypes = [
    'economic_crisis',
    'natural_disaster',
    'political_crisis',
    'constitutional_crisis',
    'resource_discovery',
    'immigration',
    'epidemic',
    'trade_disruption',
    'war',
    'treaty_violation',
    'land_dispute',
    'labor_unrest',
    'financial_panic',
    'agricultural_boom',
    'technological_advancement'
  ];
  
  res.json({ 
    eventTypes,
    customNote: 'If no word exists, GM can use custom type in quotes like "miners_strike"'
  });
});

/**
 * GET /api/data-dictionary/cultural-groups
 * Get cultural composition keys
 */
router.get('/cultural-groups', async (req: Request, res: Response) => {
  const culturalGroups = [
    'English', 'Scottish', 'Irish', 'Dutch', 'French', 
    'Spanish', 'German', 'Scandinavian', 'Māori', 'Mixed', 'Other'
  ];
  
  res.json({ culturalGroups });
});

export default router;
