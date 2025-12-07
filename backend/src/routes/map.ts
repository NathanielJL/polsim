/**
 * Map Import API Routes
 * Endpoints for importing Azgaar maps and querying map data
 */

import { Router, Request, Response } from 'express';
import { MapImportService } from '../services/MapImportService';
import { ProvinceModel, CellModel, CityModel } from '../models/mongoose';
import * as path from 'path';
import * as fs from 'fs';

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
 * GET /api/map/:sessionId/cells
 * Get all cells for map rendering
 */
router.get('/:sessionId/cells', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    console.log('>>> CELLS ENDPOINT HIT <<<', sessionId);
    
    // Get all cells for this session
    const cells = await CellModel.find({ sessionId }).lean();
    
    console.log(`Returning ${cells.length} cells`);
    
    // If cells don't have polygon data, load it from GeoJSON
    let cellsWithPolygons = cells;
    if (cells.length > 0 && !cells[0].polygon) {
      try {
        const geojsonPath = path.join(process.cwd(), 'Aotearoa Cells 2025-12-06-14-14.geojson');
        console.log(`Attempting to load GeoJSON from: ${geojsonPath}`);
        
        if (!fs.existsSync(geojsonPath)) {
          console.error(`GeoJSON file not found at: ${geojsonPath}`);
        } else {
          const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
          
          console.log(`Loading polygons from GeoJSON (${geojsonData.features?.length || 0} features)...`);
          
          // Create a map of cell ID to polygon coordinates and state/province data
          const cellDataMap = new Map();
          geojsonData.features?.forEach((feature: any) => {
            const cellId = feature.properties?.i || feature.properties?.id;
            if (cellId !== undefined && feature.geometry?.coordinates) {
              cellDataMap.set(cellId, {
                polygon: feature.geometry.coordinates[0],
                state: feature.properties?.state,
                province: feature.properties?.province
              });
            }
          });
          
          console.log(`GeoJSON features in map: ${cellDataMap.size}`);
          console.log(`Sample GeoJSON IDs:`, Array.from(cellDataMap.keys()).slice(0, 10));
          console.log(`Sample DB cell azgaarIds:`, cells.slice(0, 10).map(c => c.azgaarId));
          
          cellsWithPolygons = cells.map(cell => {
            const cellData = cellDataMap.get(cell.azgaarId);
            if (cellData) {
              return { 
                ...cell, 
                polygon: cellData.polygon,
                state: cellData.state,
                province: cellData.province
              };
            }
            return cell;
          });
          
          const withPolygons = cellsWithPolygons.filter(c => c.polygon).length;
          console.log(`Polygons loaded! ${withPolygons}/${cells.length} cells have polygon data`);
        }
      } catch (err) {
        console.error('Failed to load polygons from GeoJSON:', err);
        // Return cells without polygons
      }
    }
    
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Return cells
    res.json({ 
      cells: cellsWithPolygons,
      mapWidth: 1000,
      mapHeight: 1000
    });
  } catch (error: any) {
    console.error('Error fetching cells:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cells', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/rivers
 * Get river data for map rendering
 */
router.get('/:sessionId/rivers', async (req: Request, res: Response) => {
  try {
    const geojsonPath = path.join(process.cwd(), 'Aotearoa Rivers 2025-12-06-14-14.geojson');
    console.log(`Loading rivers from: ${geojsonPath}`);
    
    if (!fs.existsSync(geojsonPath)) {
      console.error(`Rivers GeoJSON not found at: ${geojsonPath}`);
      return res.json({ type: 'FeatureCollection', features: [] });
    }
    
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(geojsonData);
  } catch (error: any) {
    console.error('Error fetching rivers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rivers', 
      details: error.message 
    });
  }
});

/**
 * GET /api/map/:sessionId/routes
 * Get route/road data for map rendering
 */
router.get('/:sessionId/routes', async (req: Request, res: Response) => {
  try {
    const geojsonPath = path.join(process.cwd(), 'Aotearoa Routes 2025-12-06-14-14.geojson');
    console.log(`Loading routes from: ${geojsonPath}`);
    
    if (!fs.existsSync(geojsonPath)) {
      console.error(`Routes GeoJSON not found at: ${geojsonPath}`);
      return res.json({ type: 'FeatureCollection', features: [] });
    }
    
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(geojsonData);
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch routes', 
      details: error.message 
    });
  }
});

/**
 * POST /api/map/:sessionId/populate-polygons
 * Populate cell polygon coordinates from Azgaar map data
 */
router.post('/:sessionId/populate-polygons', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    console.log('Populating polygons for session:', sessionId);
    
    // Load Azgaar map data - file is in project root
    const mapDataPath = path.join(process.cwd(), 'Aotearoa Full 2025-12-06-14-15.json');
    console.log('Loading map data from:', mapDataPath);
    
    if (!fs.existsSync(mapDataPath)) {
      return res.status(404).json({ error: 'Map data file not found', path: mapDataPath });
    }
    
    const mapData = JSON.parse(fs.readFileSync(mapDataPath, 'utf8'));
    const packVertices = mapData.pack.vertices;
    const packCells = mapData.pack.cells;
    
    console.log(`Loaded ${packVertices.length} vertices and ${packCells.length} cells from Azgaar map`);
    
    // Get all cells for this session
    const cells = await CellModel.find({ sessionId }).lean();
    console.log(`Found ${cells.length} cells in database to update`);
    
    let updated = 0;
    const bulkOps = [];
    
    for (const cell of cells) {
      const azgaarCell = packCells[cell.azgaarId];
      if (!azgaarCell || !azgaarCell.v) continue;
      
      // Resolve vertex IDs to coordinates
      const polygon = azgaarCell.v.map((vertexId: number) => {
        const vertex = packVertices[vertexId];
        return vertex ? [vertex.p[0], vertex.p[1]] : null;
      }).filter((v: any) => v !== null);
      
      if (polygon.length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: cell._id },
            update: { $set: { polygon } }
          }
        });
        updated++;
      }
    }
    
    if (bulkOps.length > 0) {
      await CellModel.bulkWrite(bulkOps);
      console.log(`✓ Updated ${updated} cells with polygon coordinates`);
    }
    
    res.json({ 
      success: true,
      updated,
      total: cells.length
    });
  } catch (error: any) {
    console.error('Error populating polygons:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to populate polygons', 
      details: error.message,
      stack: error.stack
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
 * Get all cities from Azgaar JSON file
 */
router.get('/:sessionId/cities', async (req: Request, res: Response) => {
  try {
    // Load cities directly from the updated Azgaar JSON file
    const mapDataPath = path.join(process.cwd(), 'Aotearoa Full 2025-12-06-14-15.json');
    console.log('Loading cities from:', mapDataPath);
    
    if (!fs.existsSync(mapDataPath)) {
      console.error(`Map data file not found at: ${mapDataPath}`);
      return res.json({ cities: [] });
    }
    
    const mapData = JSON.parse(fs.readFileSync(mapDataPath, 'utf8'));
    const burgs = mapData.pack?.burgs || [];
    
    // Filter out invalid burgs (id 0 is placeholder) and format for frontend
    const cities = burgs
      .filter((burg: any) => burg.i > 0)
      .map((burg: any) => ({
        id: burg.i,
        name: burg.name,
        x: burg.x,
        y: burg.y,
        population: burg.population || 0,
        capital: burg.capital || 0,
        type: burg.type || 'Generic',
        port: burg.port || 0,
        state: burg.state
      }));
    
    console.log(`Returning ${cities.length} cities from Azgaar data`);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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
