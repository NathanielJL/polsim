import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/PopulationDemographicsPage.css';

interface DemographicStats {
  class: Record<string, number>;
  propertyOwnership: Record<string, number>;
  gender: Record<string, number>;
  ethnicity: Record<string, number>;
  religion: Record<string, number>;
  settlement: Record<string, number>;
  occupation: Record<string, number>;
  education: Record<string, number>;
  citizenship: Record<string, number>;
  totalPopulation: number;
  literacyRate?: number;
}

interface ProvinceStats {
  province: string;
  stats: DemographicStats;
}

interface DemographicsData {
  total: DemographicStats;
  provinces: ProvinceStats[];
}

const PopulationDemographicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DemographicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('total');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadDemographics();
  }, []);

  const loadDemographics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/demographics/statistics');
      
      if (!response.ok) {
        throw new Error('Failed to load demographics data');
      }

      const demographicsData = await response.json();
      setData(demographicsData);
    } catch (err) {
      console.error('Error loading demographics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStats = (): DemographicStats | null => {
    if (!data) return null;
    
    if (selectedProvince === 'total') {
      return data.total;
    }
    
    const provinceData = data.provinces.find(p => p.province === selectedProvince);
    return provinceData?.stats || null;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatPercent = (num: number, total: number): string => {
    if (total === 0) return '0.0%';
    return ((num / total) * 100).toFixed(1) + '%';
  };

  const calculateLiteracyRate = (educationStats: Record<string, number>, total: number): number => {
    // Count as literate: Secondary, Tertiary, and University educated
    const literate = (educationStats['Secondary'] || 0) + 
                     (educationStats['Tertiary'] || 0) + 
                     (educationStats['University'] || 0);
    if (total === 0) return 0;
    return (literate / total) * 100;
  };

  const renderStatTable = (title: string, stats: Record<string, number>, total: number) => {
    const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    
    return (
      <div className="stat-section">
        <h3>{title}</h3>
        <table className="stat-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Population</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map(([category, count]) => (
              <tr key={category}>
                <td className="category-name">{category}</td>
                <td className="stat-number">{formatNumber(count)}</td>
                <td className="stat-percent">{formatPercent(count, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="demographics-page">
        <div className="loading">Loading demographics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="demographics-page">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
        </div>
      </div>
    );
  }

  const currentStats = getCurrentStats();

  if (!data || !currentStats) {
    return (
      <div className="demographics-page">
        <div className="error-message">
          <h2>No Data Available</h2>
          <p>No demographic data found in the database.</p>
          <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
        </div>
      </div>
    );
  }
  return (
    <div className="demographics-page">
      <PageHeader 
        title="Population Demographics" 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen}
      />
      <NavigationMenu isOpen={menuOpen} />

      <div className="province-selector">
        <button
          className={selectedProvince === 'total' ? 'province-btn active' : 'province-btn'}
          onClick={() => setSelectedProvince('total')}
        >
          Total (All Provinces)
        </button>
        {data.provinces.map(p => (
          <button
            key={p.province}
            className={selectedProvince === p.province ? 'province-btn active' : 'province-btn'}
            onClick={() => setSelectedProvince(p.province)}
          >
            {p.province}
          </button>
        ))}
      </div>

      <div className="total-population">
        <h2>Total Population: {formatNumber(currentStats.totalPopulation)}</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-section literacy-section">
          <h3>Literacy Rate</h3>
          <div className="literacy-rate-display">
            <span className="literacy-value">{calculateLiteracyRate(currentStats.education, currentStats.totalPopulation).toFixed(1)}%</span>
          </div>
          <p className="literacy-note">Based on Secondary, Tertiary, and University education levels</p>
        </div>
        {renderStatTable('Citizenship', currentStats.citizenship, currentStats.totalPopulation)}
        {renderStatTable('Gender Distribution', currentStats.gender, currentStats.totalPopulation)}
        {renderStatTable('Class Distribution', currentStats.class, currentStats.totalPopulation)}
        {renderStatTable('Property Ownership (Votable)', currentStats.propertyOwnership, currentStats.totalPopulation)}
        {renderStatTable('Ethnicity', currentStats.ethnicity, currentStats.totalPopulation)}
        {renderStatTable('Religion', currentStats.religion, currentStats.totalPopulation)}
        {renderStatTable('Urban/Rural', currentStats.settlement, currentStats.totalPopulation)}
        {renderStatTable('Education Level', currentStats.education, currentStats.totalPopulation)}
        {renderStatTable('Occupation', currentStats.occupation, currentStats.totalPopulation)}
      </div>
    </div>
  );
};

export default PopulationDemographicsPage;
