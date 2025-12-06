/**
 * HOME PAGE - Map-Centric Game Interface
 * 
 * Main interface:
 * - Central map of Zealandia
 * - Player stats panel (right side, open/closable)
 * - Game menus (left side)
 * - Single continuous multiplayer lobby
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import api from '../services/api';
import '../styles/HomePage.css';

interface Province {
  _id: string;
  name: string;
  population: number;
  gdp: number;
  totalArea: number;
  color?: string;
  centerCoords?: number[];
}

interface Cell {
  _id: string;
  azgaarId: number;
  provinceId: string;
  polygon?: number[][];
  vertices?: number[];
  position: number[];
  height: number;
  temperature: number;
  biome: number;
  hasRiver: boolean;
  state?: number;
  province?: number;
}

interface Route {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    name?: string;
  };
}

interface City {
  id: number;
  name: string;
  x: number;
  y: number;
  population: number;
  capital: number;
  type: string;
  port: number;
}

// State/Province colors (Azgaar default palette)
const getStateColor = (stateId: number): string => {
  const stateColors: { [key: number]: string } = {
    0: '#a8cadb',   // Neutral/ocean
    1: '#de4a38',   // Red
    2: '#b54f55',   // Dark red
    3: '#e33746',   // Bright red
    4: '#e33942',   // Red-orange
    5: '#da4f39',   // Orange-red
    6: '#e24538',   // Red
    7: '#db2727',   // Crimson
    8: '#4682b4',   // Steel blue
    9: '#6b8e23',   // Olive
  };
  return stateColors[stateId] || '#e8e8d8';
};

// Terrain color based on height (matching Azgaar map generator)
const getTerrainColor = (height: number): string => {
  if (height < 20) return '#1e3a5f'; // Deep ocean
  if (height < 25) return '#2a5a8a'; // Ocean  
  if (height < 30) return '#4a7ba7'; // Shallow water
  if (height < 35) return '#5a8fb7'; // Coast
  if (height < 40) return '#e8dcc2'; // Beach
  if (height < 50) return '#97b48c'; // Lowland
  if (height < 60) return '#7fa05a'; // Plains
  if (height < 70) return '#6b8c42'; // Highland
  if (height < 80) return '#a89968'; // Hills
  if (height < 90) return '#8a7a5a'; // Mountains
  return '#e8e8e8'; // Snow peaks
};

function HomePage() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const { session, loading, error, loadCurrentSession, clearError } = useGameStore();
  const [statsOpen, setStatsOpen] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loadingCells, setLoadingCells] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Map zoom and pan state
  const [viewBox, setViewBox] = useState({ x: -20, y: -52.5, width: 48, height: 28.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadCurrentSession();
  }, []);

  // Update time every second for countdown and clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session?.id) {
      loadProvinces();
      loadCells();
      loadRoutes();
      loadCities();
    }
  }, [session?.id]);

  useEffect(() => {
    if (provinces.length > 0 && cells.length > 0) {
      console.log('Province data:', provinces.map(p => ({
        name: p.name,
        id: p._id,
        color: p.color,
        cellCount: cells.filter(c => c.provinceId === p._id).length
      })));
      
      const cellsWithProvince = cells.filter(c => c.provinceId);
      console.log(`Cells with provinceId: ${cellsWithProvince.length}/${cells.length}`);
      if (cellsWithProvince.length > 0) {
        console.log('Sample cell with province:', cellsWithProvince[0]);
      }
    }
  }, [provinces, cells]);

  const loadProvinces = async () => {
    if (!session?.id) return;
    
    setLoadingProvinces(true);
    try {
      const provincesData = await api.getProvinces(session.id);
      console.log('Loaded provinces:', provincesData);
      console.log('Number of provinces:', provincesData.length);
      console.log('First province:', provincesData[0]);
      setProvinces(provincesData);
    } catch (err) {
      console.error('Failed to load provinces:', err);
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCells = async () => {
    if (!session?.id) return;
    
    setLoadingCells(true);
    try {
      const cellsData = await api.getCells(session.id);
      console.log('Loaded cells:', cellsData.length);
      console.log('First cell:', cellsData[0]);
      console.log('First cell keys:', cellsData[0] ? Object.keys(cellsData[0]) : 'none');
      setCells(cellsData);
    } catch (err) {
      console.error('Failed to load cells:', err);
      setCells([]);
    } finally {
      setLoadingCells(false);
    }
  };

  const loadRoutes = async () => {
    if (!session?.id) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/map/${session.id}/routes`);
      const geojson = await response.json();
      console.log('Loaded routes:', geojson.features?.length || 0);
      setRoutes(geojson.features || []);
    } catch (err) {
      console.error('Failed to load routes:', err);
      setRoutes([]);
    }
  };

  const loadCities = async () => {
    if (!session?.id) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/map/${session.id}/cities`);
      const data = await response.json();
      console.log('Loaded cities:', data.cities?.length || 0);
      setCities(data.cities || []);
    } catch (err) {
      console.error('Failed to load cities:', err);
      setCities([]);
    }
  };

  // Zoom in/out handlers
  const handleZoom = (delta: number) => {
    setViewBox(prev => {
      const zoomFactor = delta > 0 ? 0.8 : 1.25;
      const newWidth = prev.width * zoomFactor;
      const newHeight = prev.height * zoomFactor;
      
      // Prevent zooming out beyond default view
      if (newWidth > 48 || newHeight > 28.8) {
        return prev;
      }
      
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;
      
      return {
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight
      };
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? -1 : 1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    
    const dx = (dragStart.x - e.clientX) * scaleX;
    const dy = (dragStart.y - e.clientY) * scaleY * -1;
    
    setViewBox(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      
      const defaultBounds = {
        minX: -20,
        maxX: -20 + 48 - prev.width,
        minY: -52.5,
        maxY: -52.5 + 28.8 - prev.height
      };
      
      const clampedX = Math.max(defaultBounds.minX, Math.min(defaultBounds.maxX, newX));
      const clampedY = Math.max(defaultBounds.minY, Math.min(defaultBounds.maxY, newY));
      
      return {
        ...prev,
        x: clampedX,
        y: clampedY
      };
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const populatePolygons = async () => {
    if (!session?.id) return;
    
    try {
      console.log('Populating polygons...');
      const response = await fetch(`http://localhost:5001/api/map/${session.id}/populate-polygons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to populate polygons');
      }
      
      alert(`Updated ${data.updated} cells with polygon data!`);
      // Reload cells to get the new polygon data
      loadCells();
    } catch (err: any) {
      console.error('Failed to populate polygons:', err);
      alert(`Failed to populate polygons: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="home-page loading-screen">
        <div className="loading-content">
          <h1>Loading Zealandia...</h1>
          <p>Connecting to global session</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="home-page error-screen">
        <div className="error-content">
          <h1>Unable to Load Game</h1>
          <p>{error || 'There was a problem connecting to the global game session.'}</p>
          <div className="error-actions">
            <button onClick={() => loadCurrentSession()} className="btn-primary">
              Retry Connection
            </button>
            <button onClick={clearError} className="btn-secondary">
              Dismiss
            </button>
          </div>
          <div className="help-text">
            <h3>First time here?</h3>
            <p>This is a single continuous multiplayer lobby. No signup beyond registration is needed.</p>
            <p>If you just registered, try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page game-interface">
      {/* Left Menu Bar */}
      <div className="left-menu">
        <div className="menu-header">
          <h2>Zealandia</h2>
          <p className="turn-info">Turn {session.currentTurn}</p>
        </div>
        
        <nav className="game-nav">
          <button onClick={() => navigate('/government')} className="nav-btn">
            <span className="icon">🏛️</span>
            <span>Government</span>
          </button>
          <button onClick={() => navigate('/markets')} className="nav-btn">
            <span className="icon">💰</span>
            <span>Markets</span>
          </button>
          <button onClick={() => navigate('/business')} className="nav-btn">
            <span className="icon">🏢</span>
            <span>Business</span>
          </button>
          <button onClick={() => navigate('/news')} className="nav-btn">
            <span className="icon">📰</span>
            <span>News</span>
          </button>
          <button onClick={() => navigate('/legal')} className="nav-btn">
            <span className="icon">⚖️</span>
            <span>Legal</span>
          </button>
          <button onClick={() => navigate('/elections')} className="nav-btn">
            <span className="icon">🗳️</span>
            <span>Elections</span>
          </button>
        </nav>
      </div>

      {/* Central Map */}
      <div className="map-container">
          {loadingProvinces || loadingCells ? (
            <div className="map-loading">Loading map data...</div>
          ) : provinces.length === 0 ? (
            <div className="map-error">
              <p>No provinces loaded</p>
              <button onClick={() => { loadProvinces(); loadCells(); }} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              <svg 
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                className="province-map"
                preserveAspectRatio="xMidYMid meet"
                transform="scale(1, -1)"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                
                {/* Render cells grouped by state */}
                {cells.length > 0 ? (
                  <>
                    {/* Render all cells with province colors */}
                    {cells.map((cell) => {
                      if (!cell.polygon || cell.polygon.length < 2) return null;
                      
                      const pathData = cell.polygon.map((point, i) => 
                        `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`
                      ).join(' ') + ' Z';
                      
                      // Use state from GeoJSON data
                      let fillColor = '#a8cadb'; // Ocean
                      if (cell.height >= 20 && cell.state !== undefined) {
                        fillColor = getStateColor(cell.state);
                      } else if (cell.height >= 20) {
                        fillColor = '#e8e8d8'; // Land without state
                      }
                      
                      return (
                        <path
                          key={cell._id}
                          d={pathData}
                          fill={fillColor}
                          stroke={fillColor}
                          strokeWidth="0.02"
                          opacity="1"
                        />
                      );
                    })}
                    
                    {/* Draw province borders - group cells by state */}
                    {[...new Set(cells.map(c => c.state).filter(s => s !== undefined && s > 0))].map((stateId) => {
                      const stateCells = cells.filter(c => c.state === stateId && c.polygon);
                      if (stateCells.length === 0) return null;
                      
                      const stateColor = getStateColor(stateId);
                      
                      return (
                        <g key={`border-${stateId}`}>
                          {stateCells.map((cell) => {
                            const pathData = cell.polygon!.map((point, i) => 
                              `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`
                            ).join(' ') + ' Z';
                            
                            return (
                              <path
                                key={`border-${cell._id}`}
                                d={pathData}
                                fill="none"
                                stroke={stateColor}
                                strokeWidth="0.05"
                                opacity="0.9"
                                pointerEvents="none"
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                    
                    {/* Draw routes/roads */}
                    {routes.map((route, idx) => {
                      if (route.geometry.type !== 'LineString') return null;
                      
                      const pathData = route.geometry.coordinates.map((point, i) => 
                        `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`
                      ).join(' ');
                      
                      return (
                        <g key={`route-${idx}`}>
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#000000"
                            strokeWidth="0.15"
                            opacity="0.5"
                            pointerEvents="none"
                          />
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#d4a574"
                            strokeWidth="0.1"
                            strokeDasharray="0.3 0.2"
                            opacity="0.9"
                            pointerEvents="none"
                          />
                        </g>
                      );
                    })}
                    
                    {/* Province labels */}
                    {provinces.map((province) => {
                      const lonScale = 10 / 1000;
                      const latScale = 8 / 1000;
                      const lon = -2 + (province.centerCoords?.[0] || 0) * lonScale;
                      const lat = -43 + (province.centerCoords?.[1] || 0) * latScale;
                      
                      return (
                        <text
                          key={`label-${province._id}`}
                          x={lon}
                          y={lat}
                          textAnchor="middle"
                          fill="#2c2c2c"
                          fontSize="0.6"
                          fontWeight="bold"
                          fontFamily="Georgia, serif"
                          transform={`scale(1, -1) translate(0, ${2 * lat})`}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {province.name}
                        </text>
                      );
                    })}
                    
                    {/* City markers and labels */}
                    {cities.map((city) => {
                      const lonScale = 10 / 1000;
                      const latScale = 8 / 1000;
                      const lon = -2 + city.x * lonScale;
                      const lat = -43 + city.y * latScale;
                      
                      const isCapital = city.capital === 1;
                      const size = isCapital ? 0.3 : (city.population > 10 ? 0.2 : 0.15);
                      
                      return (
                        <g key={`city-${city.id}`}>
                          {isCapital ? (
                            <path
                              d={`M ${lon},${lat - size} L ${lon + size * 0.3},${lat + size * 0.3} L ${lon - size},${lat - size * 0.3} L ${lon + size},${lat - size * 0.3} L ${lon - size * 0.3},${lat + size * 0.3} Z`}
                              fill="#ffffff"
                              stroke="#000000"
                              strokeWidth="0.03"
                            />
                          ) : (
                            <circle
                              cx={lon}
                              cy={lat}
                              r={size}
                              fill="#ffffff"
                              stroke="#000000"
                              strokeWidth="0.03"
                            />
                          )}
                          
                          <text
                            x={lon}
                            y={lat - size - 0.2}
                            textAnchor="middle"
                            fill="#000000"
                            fontSize="0.25"
                            fontFamily="Arial, sans-serif"
                            transform={`scale(1, -1) translate(0, ${2 * (lat - size - 0.2)})`}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {city.name}
                          </text>
                        </g>
                      );
                    })}
                  </>
                ) : null}
              </svg>
              
              {/* Zoom controls */}
              <div className="map-controls">
                <button 
                  className="zoom-btn" 
                  onClick={() => handleZoom(1)}
                  title="Zoom in"
                >
                  +
                </button>
                <button 
                  className="zoom-btn" 
                  onClick={() => handleZoom(-1)}
                  title="Zoom out"
                >
                  −
                </button>
                <button 
                  className="zoom-btn" 
                  onClick={() => setViewBox({ x: -20, y: -52.5, width: 48, height: 28.8 })}
                  title="Reset view"
                >
                  ⌂
                </button>
              </div>
            </>
          )}
        </div>

      {/* Right Stats Panel */}
      <div className={`right-panel ${statsOpen ? 'open' : 'closed'}`}>
        <button 
          className="panel-toggle"
          onClick={() => setStatsOpen(!statsOpen)}
          aria-label={statsOpen ? 'Close panel' : 'Open panel'}
        >
          {statsOpen ? '→' : '←'}
        </button>
        
        {statsOpen && (
          <div className="panel-content">
            <div className="player-header">
              <h3>{player?.username}</h3>
              <p className="player-location">Location: Province Name</p>
            </div>

            <div className="player-stats">
              <div className="stat-item">
                <span className="label">Cash:</span>
                <span className="value">£{player?.cash?.toLocaleString() || 1000}</span>
              </div>
              <div className="stat-item">
                <span className="label">Reputation:</span>
                <span className="value">{player?.reputation || 40}%</span>
              </div>
              <div className="stat-item">
                <span className="label">Actions:</span>
                <span className="value">{player?.actionsRemaining || 5} / 5</span>
              </div>
            </div>

            <div className="turn-info-panel">
              <div className="turn-number">
                <span className="label">Turn:</span>
                <span className="value">{session.currentTurn}</span>
              </div>
              <div className="turn-timer">
                <span className="label">Turn Ends In:</span>
                <span className="value">{Math.floor((new Date(session.turnEndTime).getTime() - currentTime.getTime()) / (1000 * 60 * 60))}h {Math.floor(((new Date(session.turnEndTime).getTime() - currentTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m</span>
              </div>
              <div className="real-time">
                <span className="label">Time:</span>
                <span className="value">{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
