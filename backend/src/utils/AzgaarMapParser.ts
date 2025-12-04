/**
 * Azgaar Map Parser for POLSIM
 * Extracts province, terrain, city, river, culture, and religion data
 * from Azgaar Fantasy Map Generator exports
 */

import * as fs from 'fs';
import * as path from 'path';

interface AzgaarCell {
  i: number;
  v: number[];      // vertices
  c: number[];      // connections
  p: [number, number]; // position
  h: number;        // height
  area: number;
  t: number;        // temperature
  biome: number;
  province: number;
  culture: number;
  religion: number;
  r: number;        // river
}

interface AzgaarProvince {
  i: number;
  name: string;
  formName: string;
  fullName: string;
  color: string;
  center: number;
  burg: number;
  area: number;
  burgs: number[];
  pole: [number, number];
  state: number;
  removed?: boolean;
}

interface AzgaarBurg {
  i: number;
  cell: number;
  x: number;
  y: number;
  name: string;
  population?: number;
  capital?: number;
  province: number;
}

interface AzgaarRiver {
  i: number;
  source: number;
  mouth: number;
  cells: number[];
  name?: string;
}

interface AzgaarCulture {
  i: number;
  name: string;
  code: string;
  base?: number;
}

interface AzgaarReligion {
  i: number;
  name: string;
  code: string;
  type?: string;
  form?: string;
}

interface ParsedProvince {
  id: number;
  name: string;
  color: string;
  centerCell: number;
  centerCoords: [number, number];
  capitalBurgId: number | null;
  area: number;
  cells: number[];
}

interface ParsedCell {
  id: number;
  vertices: number[];
  connections: number[];
  position: [number, number];
  height: number;
  area: number;
  temperature: number;
  biome: number;
  provinceId: number;
  cultureId: number;
  religionId: number;
  hasRiver: boolean;
}

interface ParsedBurg {
  id: number;
  name: string;
  cellId: number;
  position: [number, number];
  provinceId: number;
  isCapital: boolean;
}

interface ParsedRiver {
  id: number;
  name: string;
  source: number;
  mouth: number;
  cells: number[];
}

interface ParsedCulture {
  id: number;
  name: string;
  code: string;
}

interface ParsedReligion {
  id: number;
  name: string;
  code: string;
  type: string;
}

interface ParsedMapData {
  metadata: {
    mapName: string;
    width: number;
    height: number;
    seed: string;
    exportDate: string;
    totalPopulation: number; // Fixed to 95000
  };
  provinces: ParsedProvince[];
  cells: ParsedCell[];
  burgs: ParsedBurg[];
  rivers: ParsedRiver[];
  cultures: ParsedCulture[];
  religions: ParsedReligion[];
}

export class AzgaarMapParser {
  private data: any;

  constructor(jsonFilePath: string) {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    this.data = JSON.parse(fileContent);
  }

  /**
   * Parse all relevant data from the Azgaar map
   */
  public parse(): ParsedMapData {
    return {
      metadata: this.parseMetadata(),
      provinces: this.parseProvinces(),
      cells: this.parseCells(),
      burgs: this.parseBurgs(),
      rivers: this.parseRivers(),
      cultures: this.parseCultures(),
      religions: this.parseReligions(),
    };
  }

  private parseMetadata() {
    return {
      mapName: this.data.info.mapName,
      width: this.data.info.width,
      height: this.data.info.height,
      seed: this.data.info.seed,
      exportDate: this.data.info.exportedAt,
      totalPopulation: 95000, // Fixed total population
    };
  }

  private parseProvinces(): ParsedProvince[] {
    const provinces: ParsedProvince[] = [];
    const rawProvinces = this.data.pack.provinces as AzgaarProvince[];

    for (const province of rawProvinces) {
      // Skip removed provinces, default province (0), and Queensland (113)
      if (province.removed || province.i === 0 || province.i === 113) continue;

      // Find all cells belonging to this province
      const cells = this.data.pack.cells
        .map((cell: AzgaarCell, index: number) => 
          cell.province === province.i ? index : -1
        )
        .filter((id: number) => id !== -1);

      provinces.push({
        id: province.i,
        name: province.name,
        color: province.color,
        centerCell: province.center,
        centerCoords: province.pole,
        capitalBurgId: province.burg || null,
        area: province.area,
        cells,
      });
    }

    return provinces;
  }

  private parseCells(): ParsedCell[] {
    const cells: ParsedCell[] = [];
    const rawCells = this.data.pack.cells as AzgaarCell[];

    for (const cell of rawCells) {
      // Skip ocean/water cells (province 0 or no province)
      if (!cell.province || cell.province === 0) continue;

      cells.push({
        id: cell.i,
        vertices: cell.v,
        connections: cell.c,
        position: cell.p,
        height: cell.h,
        area: cell.area,
        temperature: cell.t,
        biome: cell.biome,
        provinceId: cell.province,
        cultureId: cell.culture,
        religionId: cell.religion,
        hasRiver: cell.r > 0,
      });
    }

    return cells;
  }

  private parseBurgs(): ParsedBurg[] {
    const burgs: ParsedBurg[] = [];
    const rawBurgs = this.data.pack.burgs as AzgaarBurg[];
    const rawProvinces = this.data.pack.provinces as AzgaarProvince[];

    // Build a map of capital burgs per province
    const capitalBurgs = new Set<number>();
    rawProvinces.forEach(p => {
      if (p.burg) capitalBurgs.add(p.burg);
    });

    for (const burg of rawBurgs) {
      if (!burg || !burg.name || burg.i === 0) continue;

      burgs.push({
        id: burg.i,
        name: burg.name,
        cellId: burg.cell,
        position: [burg.x, burg.y],
        provinceId: burg.province,
        isCapital: capitalBurgs.has(burg.i),
      });
    }

    return burgs;
  }

  private parseRivers(): ParsedRiver[] {
    const rivers: ParsedRiver[] = [];
    const rawRivers = this.data.pack.rivers;

    if (!rawRivers) return rivers;

    for (const river of rawRivers) {
      if (!river || river.i === 0) continue;

      rivers.push({
        id: river.i,
        name: river.name || `River ${river.i}`,
        source: river.source,
        mouth: river.mouth,
        cells: river.cells || [],
      });
    }

    return rivers;
  }

  private parseCultures(): ParsedCulture[] {
    const cultures: ParsedCulture[] = [];
    const rawCultures = this.data.pack.cultures as AzgaarCulture[];

    for (const culture of rawCultures) {
      if (!culture || culture.i === 0) continue;

      cultures.push({
        id: culture.i,
        name: culture.name,
        code: culture.code,
      });
    }

    return cultures;
  }

  private parseReligions(): ParsedReligion[] {
    const religions: ParsedReligion[] = [];
    const rawReligions = this.data.pack.religions as AzgaarReligion[];

    for (const religion of rawReligions) {
      if (!religion || religion.i === 0) continue;

      religions.push({
        id: religion.i,
        name: religion.name,
        code: religion.code,
        type: religion.type || religion.form || 'Unknown',
      });
    }

    return religions;
  }

  /**
   * Export parsed data to JSON
   */
  public exportToJSON(outputPath: string): void {
    const parsedData = this.parse();
    fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2), 'utf-8');
    console.log(`✅ Parsed map data exported to ${outputPath}`);
  }

  /**
   * Generate summary statistics
   */
  public getSummary(): string {
    const parsed = this.parse();
    
    return `
=== POLSIM Map Parse Summary ===
Map: ${parsed.metadata.mapName}
Dimensions: ${parsed.metadata.width}x${parsed.metadata.height}
Total Population: ${parsed.metadata.totalPopulation.toLocaleString()}

Provinces: ${parsed.provinces.length}
${parsed.provinces.map(p => `  - ${p.name} (${p.cells.length} cells)`).join('\n')}

Cells: ${parsed.cells.length}
Burgs/Cities: ${parsed.burgs.length}
  - Capitals: ${parsed.burgs.filter(b => b.isCapital).length}
Rivers: ${parsed.rivers.length}
Cultures: ${parsed.cultures.length}
Religions: ${parsed.religions.length}

Province Details:
${parsed.provinces.map(p => 
  `  ${p.name}: ${p.cells.length} cells, color: ${p.color}, capital: ${
    parsed.burgs.find(b => b.id === p.capitalBurgId)?.name || 'None'
  }`
).join('\n')}
`;
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: ts-node AzgaarMapParser.ts <input.json> [output.json]');
    console.log('Example: ts-node AzgaarMapParser.ts "Aotearoa Full 2025-12-03-19-27.json" parsed-map.json');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || 'parsed-map.json';

  try {
    const parser = new AzgaarMapParser(inputPath);
    
    // Show summary
    console.log(parser.getSummary());
    
    // Export parsed data
    parser.exportToJSON(outputPath);
    
  } catch (error) {
    console.error('❌ Error parsing map:', error);
    process.exit(1);
  }
}
