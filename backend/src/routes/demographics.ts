import express from 'express';
import { DemographicSliceModel } from '../models/ReputationModels';

const router = express.Router();

/**
 * GET /api/demographics/statistics
 * Returns demographic statistics for total and by province
 */
router.get('/statistics', async (req, res) => {
  try {
    // Fetch all demographic slices
    const slices = await DemographicSliceModel.find({});

    if (!slices || slices.length === 0) {
      return res.status(404).json({ 
        error: 'No demographic data found',
        message: 'Run populate-demographic-slices.js to generate demographic data'
      });
    }

    // Helper function to merge occupation categories
    const mergeOccupation = (occupation: string): string => {
      // Merge all miners
      if (occupation.includes('miner') || occupation.includes('quarry')) {
        return 'miner';
      }
      // Merge agricultural workers
      if (occupation === 'agricultural-laborer' || occupation === 'tenant-farmer') {
        return 'farmer';
      }
      // Merge fishers and whalers
      if (occupation === 'fisherman' || occupation === 'whaler') {
        return 'fisher';
      }
      // Merge craftsmen and artisans
      if (occupation === 'craftsman' || occupation === 'artisan') {
        return 'artisan';
      }
      return occupation;
    };

    // Helper function to aggregate stats
    const aggregateStats = (sliceList: any[]) => {
      const stats = {
        class: {} as Record<string, number>,
        propertyOwnership: {} as Record<string, number>,
        gender: {} as Record<string, number>,
        ethnicity: {} as Record<string, number>,
        religion: {} as Record<string, number>,
        settlement: {} as Record<string, number>,
        occupation: {} as Record<string, number>,
        education: {} as Record<string, number>,
        citizenship: {} as Record<string, number>,
        totalPopulation: 0
      };

      for (const slice of sliceList) {
        const pop = slice.population || 0;
        stats.totalPopulation += pop;

        // Class
        const className = slice.economic?.class || 'unknown';
        stats.class[className] = (stats.class[className] || 0) + pop;

        // Property Ownership
        const ownership = slice.economic?.propertyOwnership || 'none';
        stats.propertyOwnership[ownership] = (stats.propertyOwnership[ownership] || 0) + pop;

        // Gender
        const gender = slice.economic?.gender || 'unknown';
        stats.gender[gender] = (stats.gender[gender] || 0) + pop;

        // Ethnicity
        const ethnicity = slice.cultural?.ethnicity || 'unknown';
        stats.ethnicity[ethnicity] = (stats.ethnicity[ethnicity] || 0) + pop;

        // Religion
        const religion = slice.cultural?.religion || 'unknown';
        stats.religion[religion] = (stats.religion[religion] || 0) + pop;

        // Settlement
        const settlement = slice.locational?.settlement || 'unknown';
        stats.settlement[settlement] = (stats.settlement[settlement] || 0) + pop;

        // Occupation (with merging)
        const rawOccupation = slice.economic?.occupation || 'unemployed';
        const occupation = mergeOccupation(rawOccupation);
        stats.occupation[occupation] = (stats.occupation[occupation] || 0) + pop;

        // Education (based on class - European/Mixed only had formal education)
        const isIndigenous = slice.cultural?.indigenous || false;
        let education = 'none';
        if (!isIndigenous) {
          const classType = slice.economic?.class;
          if (classType === 'upper') {
            education = Math.random() > 0.5 ? 'secondary' : 'bachelors';
          } else if (classType === 'middle') {
            education = Math.random() > 0.7 ? 'secondary' : 'none';
          } else {
            education = 'none';
          }
        }
        stats.education[education] = (stats.education[education] || 0) + pop;

        // Citizenship (citizen if not full indigenous - European and Mixed populations are citizens)
        const isMixed = slice.cultural?.mixed || false;
        const citizenship = (!isIndigenous || isMixed) ? 'citizen' : 'non-citizen';
        stats.citizenship[citizenship] = (stats.citizenship[citizenship] || 0) + pop;
      }

      return stats;
    };

    // Calculate total stats
    const total = aggregateStats(slices);

    // Calculate stats by province
    const provinceMap = new Map<string, any[]>();
    for (const slice of slices) {
      const province = slice.locational?.province || 'Unknown';
      if (!provinceMap.has(province)) {
        provinceMap.set(province, []);
      }
      provinceMap.get(province)!.push(slice);
    }

    const provinces = Array.from(provinceMap.entries())
      .map(([province, provinceSlices]) => ({
        province,
        stats: aggregateStats(provinceSlices)
      }))
      .sort((a, b) => a.province.localeCompare(b.province));

    res.json({
      total,
      provinces
    });

  } catch (error) {
    console.error('Error fetching demographic statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch demographic statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/demographics/slices
 * Returns all demographic slices (for debugging)
 */
router.get('/slices', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const slices = await DemographicSliceModel.find({}).limit(limit);

    res.json({
      count: slices.length,
      slices
    });

  } catch (error) {
    console.error('Error fetching demographic slices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch demographic slices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
