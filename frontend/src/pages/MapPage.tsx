import React, { useState, useEffect } from 'react';
import { MapContainer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/MapPage.css';

interface Province {
  _id: string;
  name: string;
  azgaarId: number;
  color: string;
  area: number;
  population: number;
  gdp: number;
  currentSuperintendent?: {
    _id: string;
    username: string;
  };
  resources: {
    timber?: number;
    agriculture?: number;
    fishing?: number;
    whaling?: number;
    livestock?: number;
    mining?: number;
  };
}

interface Cell {
  azgaarId: number;
  vertices: number[][];
  position: number[];
  provinceId: string;
  biome: number;
  height: number;
  temperature: number;
}

interface City {
  _id: string;
  name: string;
  position: number[];
  population: number;
  isCapital: boolean;
  type: 'port' | 'inland' | 'mining' | 'agricultural';
  provinceId: string;
}

type MapLayer = 'political' | 'economic' | 'cultural' | 'exploration' | 'events';
type ColorScheme = 'political' | 'gdp' | 'population' | 'approval';

const MapPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map controls
  const [activeLayer, setActiveLayer] = useState<MapLayer>('political');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('political');
  const [showCities, setShowCities] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [showResourceIcons, setShowResourceIcons] = useState(false);

  useEffect(() => {
    fetchMapData();
  }, [sessionId]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/map/${sessionId}/render-data`);
      const { provinces, cells, cities } = response.data;
      
      setProvinces(provinces);
      setCells(cells);
      setCities(cities);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load map data');
      setLoading(false);
    }
  };

  const getProvinceColor = (province: Province): string => {
    switch (colorScheme) {
      case 'political':
        return province.color || '#cccccc';
      
      case 'gdp':
        // GDP heatmap (green scale)
        const gdpPerCapita = province.gdp / province.population;
        const intensity = Math.min(gdpPerCapita / 200, 1); // Normalize to 0-1
        return `rgb(${255 - intensity * 200}, ${200 + intensity * 55}, ${255 - intensity * 200})`;
      
      case 'population':
        // Population density (blue scale)
        const density = province.population / province.area;
        const densityIntensity = Math.min(density / 2, 1);
        return `rgb(${200 - densityIntensity * 150}, ${200 - densityIntensity * 150}, ${255})`;
      
      case 'approval':
        // Approval rating (red to green)
        // TODO: Integrate with reputation system
        return province.color || '#cccccc';
      
      default:
        return province.color || '#cccccc';
    }
  };

  const handleProvinceClick = (province: Province) => {
    setSelectedProvince(province);
  };

  const closeProvincePanel = () => {
    setSelectedProvince(null);
  };

  const getCityIcon = (city: City) => {
    const iconSize = city.isCapital ? 8 : 5;
    const iconColor = city.isCapital ? 'gold' : 'black';
    
    return L.divIcon({
      className: 'custom-city-icon',
      html: `<div style="width: ${iconSize}px; height: ${iconSize}px; background: ${iconColor}; border: 2px solid white; border-radius: 50%;"></div>`,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
    });
  };

  const formatCurrency = (amount: number): string => {
    return `£${(amount / 1000).toFixed(1)}k`;
  };

  const getTopResource = (resources: Province['resources']): string => {
    const entries = Object.entries(resources).filter(([_, value]) => value && value > 0);
    if (entries.length === 0) return 'None';
    
    const sorted = entries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
    const [resource, value] = sorted[0];
    return `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${value}`;
  };

  if (loading) {
    return (
      <div className="map-page-loading">
        <div className="spinner"></div>
        <p>Loading map data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page-error">
        <h2>Error Loading Map</h2>
        <p>{error}</p>
        <button onClick={fetchMapData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Map Controls Panel */}
      <div className="map-controls">
        <h3>Map Layers</h3>
        
        <div className="control-section">
          <label>View Mode:</label>
          <select value={activeLayer} onChange={(e) => setActiveLayer(e.target.value as MapLayer)}>
            <option value="political">Political</option>
            <option value="economic">Economic</option>
            <option value="cultural">Cultural</option>
            <option value="exploration">Exploration</option>
            <option value="events">Events</option>
          </select>
        </div>

        <div className="control-section">
          <label>Color Scheme:</label>
          <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value as ColorScheme)}>
            <option value="political">Political</option>
            <option value="gdp">GDP (Heatmap)</option>
            <option value="population">Population Density</option>
            <option value="approval">Approval Rating</option>
          </select>
        </div>

        <div className="control-section">
          <label>
            <input type="checkbox" checked={showCities} onChange={(e) => setShowCities(e.target.checked)} />
            Show Cities
          </label>
        </div>

        <div className="control-section">
          <label>
            <input type="checkbox" checked={showBorders} onChange={(e) => setShowBorders(e.target.checked)} />
            Province Borders
          </label>
        </div>

        <div className="control-section">
          <label>
            <input type="checkbox" checked={showResourceIcons} onChange={(e) => setShowResourceIcons(e.target.checked)} />
            Resource Icons
          </label>
        </div>

        <div className="legend">
          <h4>Legend</h4>
          {colorScheme === 'political' && <p>Colors represent provinces</p>}
          {colorScheme === 'gdp' && <p>Dark green = High GDP/capita<br/>Light green = Low GDP/capita</p>}
          {colorScheme === 'population' && <p>Dark blue = Dense<br/>Light blue = Sparse</p>}
        </div>
      </div>

      {/* Main Map */}
      <div className="map-container">
        <MapContainer
          center={[0, 0]}
          zoom={6}
          style={{ height: '100%', width: '100%', background: '#a3c9e8' }}
          zoomControl={true}
        >
          {/* Render provinces */}
          {provinces.map((province) => {
            const provinceCells = cells.filter(c => c.provinceId === province._id);
            
            return provinceCells.map((cell) => (
              <Polygon
                key={cell.azgaarId}
                positions={cell.vertices.map(v => [v[1], v[0]])} // Leaflet uses [lat, lng]
                pathOptions={{
                  fillColor: getProvinceColor(province),
                  fillOpacity: 0.7,
                  color: showBorders ? '#000000' : 'transparent',
                  weight: showBorders ? 1 : 0,
                }}
                eventHandlers={{
                  click: () => handleProvinceClick(province),
                }}
              >
                <Popup>
                  <strong>{province.name}</strong><br />
                  Superintendent: {province.currentSuperintendent?.username || 'Vacant'}<br />
                  Population: {province.population.toLocaleString()}
                </Popup>
              </Polygon>
            ));
          })}

          {/* Render cities */}
          {showCities && cities.map((city) => (
            <Marker
              key={city._id}
              position={[city.position[1], city.position[0]]}
              icon={getCityIcon(city)}
            >
              <Popup>
                <strong>{city.name}</strong> {city.isCapital && '⭐'}<br />
                Type: {city.type}<br />
                Population: {city.population.toLocaleString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Province Details Panel */}
      {selectedProvince && (
        <div className="province-panel">
          <div className="province-panel-header">
            <h2>{selectedProvince.name}</h2>
            <button className="close-button" onClick={closeProvincePanel}>×</button>
          </div>

          <div className="province-panel-content">
            <div className="province-stat">
              <label>Superintendent:</label>
              <span>{selectedProvince.currentSuperintendent?.username || 'Vacant'}</span>
            </div>

            <div className="province-stat">
              <label>Population:</label>
              <span>{selectedProvince.population.toLocaleString()}</span>
            </div>

            <div className="province-stat">
              <label>GDP:</label>
              <span>{formatCurrency(selectedProvince.gdp)}</span>
            </div>

            <div className="province-stat">
              <label>Area:</label>
              <span>{selectedProvince.area.toLocaleString()} km²</span>
            </div>

            <div className="province-stat">
              <label>GDP/Capita:</label>
              <span>£{(selectedProvince.gdp / selectedProvince.population).toFixed(0)}</span>
            </div>

            <h3>Resources</h3>
            <div className="resources-list">
              {Object.entries(selectedProvince.resources).map(([resource, value]) => {
                if (!value || value === 0) return null;
                return (
                  <div key={resource} className="resource-item">
                    <span className="resource-name">
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}:
                    </span>
                    <span className="resource-value">{value} units</span>
                  </div>
                );
              })}
            </div>

            <div className="province-actions">
              <button className="action-button">View Details</button>
              <button className="action-button">Propose Policy</button>
              <button className="action-button">Explore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
