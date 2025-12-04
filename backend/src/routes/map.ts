/**
 * Map Import API Routes
 * Endpoints for importing Azgaar maps and querying map data
 */

import { Router, Request, Response } from 'express';
import { MapImportService } from '../services/MapImportService';
import { ProvinceModel, CellModel, CityModel } from '../models/mongoose';
import * as path from 'path';

const router = Router();
const mapService = new MapImportService();

/**
 * POST /api/map/import
 * Import Azgaar map into a session
 * Body: { sessionId, mapFilePath }
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { sessionId, mapFilePath } = req.body;
    
    if (!sessionId || !mapFilePath) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, mapFilePath' 
      });
    }
    
    // Resolve absolute path
    const absolutePath = path.isAbsolute(mapFilePath) 
      ? mapFilePath 
      : path.join(process.cwd(), mapFilePath);
    
    console.log(`Starting map import for session ${sessionId} from ${absolutePath}`);
    
    await mapService.importMap(sessionId, absolutePath);
    
    const summary = await mapService.getImportSummary(sessionId);
    
    res.json({ 
      success: true, 
      message: 'Map imported successfully',
      summary,
    });
  } catch (error: any) {
    console.error('Map import error:', error);
    res.status(500).json({ 
      error: 'Failed to import map', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/summary
 * Get import summary for a session
 */
router.get('/:sessionId/summary', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const summary = await mapService.getImportSummary(sessionId);
    
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/provinces
 * Get all provinces for a session
 */
router.get('/:sessionId/provinces', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const provinces = await ProvinceModel.find({ sessionId })
      .populate('capitalCityId')
      .populate('currentGovernor', 'username')
      .lean();
    
    res.json({ provinces });
  } catch (error: any) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ 
      error: 'Failed to fetch provinces', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/provinces/:provinceId
 * Get detailed province data including cells
 */
router.get('/:sessionId/provinces/:provinceId', async (req: Request, res: Response) => {
  try {
    const { sessionId, provinceId } = req.params;
    
    const province = await ProvinceModel.findOne({ sessionId, _id: provinceId })
      .populate('capitalCityId')
      .populate('currentGovernor', 'username')
      .populate('currentLtGovernor', 'username')
      .lean();
    
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    const cells = await CellModel.find({ provinceId }).lean();
    const cities = await CityModel.find({ provinceId }).lean();
    
    res.json({ 
      province,
      cells,
      cities,
    });
  } catch (error: any) {
    console.error('Error fetching province details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch province details', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/cells
 * Get all cells for rendering the map
 * Query params: provinceId (optional)
 */
router.get('/:sessionId/cells', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { provinceId } = req.query;
    
    const query: any = { sessionId };
    if (provinceId) {
      query.provinceId = provinceId;
    }
    
    // Only return essential fields for map rendering
    const cells = await CellModel.find(query)
      .select('azgaarId vertices position provinceId biome height')
      .lean();
    
    res.json({ cells });
  } catch (error: any) {
    console.error('Error fetching cells:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cells', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/cities
 * Get all cities
 */
router.get('/:sessionId/cities', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const cities = await CityModel.find({ sessionId })
      .populate('provinceId', 'name')
      .lean();
    
    res.json({ cities });
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cities', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/render-data
 * Get complete map rendering data (provinces + cells + cities)
 */
router.get('/:sessionId/render-data', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const [provinces, cells, cities] = await Promise.all([
      ProvinceModel.find({ sessionId })
        .select('name azgaarId color centerCoords area population')
        .lean(),
      CellModel.find({ sessionId })
        .select('azgaarId vertices position provinceId biome height')
        .lean(),
      CityModel.find({ sessionId })
        .select('name position isCapital provinceId')
        .lean(),
    ]);
    
    res.json({ 
      provinces,
      cells,
      cities,
      metadata: {
        provinceCount: provinces.length,
        cellCount: cells.length,
        cityCount: cities.length,
      }
    });
  } catch (error: any) {
    console.error('Error fetching render data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch render data', 
      details: error.message 
    });
  }
});

export default router;
