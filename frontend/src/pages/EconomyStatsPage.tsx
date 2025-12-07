import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/EconomicStatsPage.css';

interface EconomicData {
  gdp: number;
  resources: number;
  unemployment: number;
  debt: number;
  inflation: number;
  productivity: number;
  imports: number;
  exports: number;
  income: number;
  taxes: number;
  housing: number;
  investments: number;
}

interface ResourceDetail {
  name: string;
  used: number;
  total: number;
  unit: string;
}

interface TradeItem {
  item: string;
  quantity: number;
  unit: string;
  value: number;
}

const EconomyStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'total' | 'province'>('total');
  const [selectedProvince, setSelectedProvince] = useState<string>('Southland');
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Resource breakdown data
  const resourceBreakdown: ResourceDetail[] = [
    { name: 'Timber & Kauri', used: 8, total: 15, unit: 'thousand tons' },
    { name: 'Wool', used: 6, total: 12, unit: 'thousand tons' },
    { name: 'Flax & Hemp', used: 5, total: 10, unit: 'thousand tons' },
    { name: 'Whale Oil', used: 4, total: 8, unit: 'thousand barrels' },
    { name: 'Coal', used: 3, total: 20, unit: 'thousand tons' },
    { name: 'Fish', used: 4, total: 8, unit: 'thousand tons' },
    { name: 'Grain', used: 3, total: 7, unit: 'thousand tons' },
    { name: 'Livestock', used: 2, total: 5, unit: 'thousand head' },
    { name: 'Stone & Marble', used: 2, total: 6, unit: 'thousand tons' },
    { name: 'Kauri Gum', used: 2, total: 4, unit: 'thousand tons' },
    { name: 'Seal Pelts', used: 1, total: 3, unit: 'thousand pelts' },
    { name: 'Other Resources', used: 2, total: 2, unit: 'various' }
  ];

  // Export breakdown
  const exportItems: TradeItem[] = [
    { item: 'Wool', quantity: 4200, unit: 'tons', value: 168000 },
    { item: 'Timber (Kauri)', quantity: 3500, unit: 'tons', value: 105000 },
    { item: 'Whale Oil', quantity: 2800, unit: 'barrels', value: 84000 },
    { item: 'Flax', quantity: 1500, unit: 'tons', value: 30000 },
    { item: 'Seal Pelts', quantity: 850, unit: 'pelts', value: 17000 },
    { item: 'Kauri Gum', quantity: 600, unit: 'tons', value: 12000 },
    { item: 'Grain', quantity: 450, unit: 'tons', value: 9000 }
  ];

  // Import breakdown
  const importItems: TradeItem[] = [
    { item: 'Manufactured Goods', quantity: 1200, unit: 'tons', value: 120000 },
    { item: 'Tools & Equipment', quantity: 800, unit: 'tons', value: 96000 },
    { item: 'Weapons & Ammunition', quantity: 450, unit: 'tons', value: 67500 },
    { item: 'Textiles & Clothing', quantity: 650, unit: 'tons', value: 52000 },
    { item: 'Luxury Goods', quantity: 200, unit: 'tons', value: 30000 },
    { item: 'Books & Paper', quantity: 150, unit: 'tons', value: 12000 },
    { item: 'Medicine & Supplies', quantity: 100, unit: 'tons', value: 7500 }
  ];

  // 1854 Zealandia colonial economy - British Pounds Sterling
  const totalStats: EconomicData = {
    gdp: 8971952, // Total colonial GDP in £ (1854)
    resources: 42, // Resources being actively exploited
    unemployment: 8.5, // Higher in frontier economy
    debt: 0, // Federal government debt in £
    inflation: 1.8, // Relatively stable under gold standard
    productivity: 45, // Lower in developing colony
    imports: 385000, // Manufactured goods, tools from Britain
    exports: 425000, // Wool, timber, whale oil, flax
    income: 199, // Weighted average: (5% × £750) + (25% × £275) + (65% × £95) + (5% indigenous × £50) = £199
    taxes: 78000, // Estimated ~0.87% of GDP in limited colonial taxation
    housing: 35, // Housing shortage in growing colony
    investments: 245000, // British capital investment
  };

  const provinceStatsData: Record<string, EconomicData> = {
    'Southland': { gdp: 3200000, resources: 14, unemployment: 7.2, debt: 0, inflation: 1.6, productivity: 52, imports: 125000, exports: 165000, income: 215, taxes: 24000, housing: 42, investments: 85000 },
    'Vulteralia': { gdp: 1450000, resources: 8, unemployment: 9.5, debt: 0, inflation: 2.1, productivity: 48, imports: 68000, exports: 72000, income: 195, taxes: 14000, housing: 38, investments: 42000 },
    'Tasminata': { gdp: 1350000, resources: 7, unemployment: 10.2, debt: 0, inflation: 2.3, productivity: 42, imports: 58000, exports: 62000, income: 185, taxes: 11000, housing: 30, investments: 35000 },
    'Cooksland': { gdp: 1200000, resources: 6, unemployment: 8.8, debt: 0, inflation: 1.9, productivity: 46, imports: 52000, exports: 58000, income: 190, taxes: 12000, housing: 35, investments: 38000 },
    'New Zealand': { gdp: 1100000, resources: 5, unemployment: 9.1, debt: 0, inflation: 2.0, productivity: 44, imports: 58000, exports: 48000, income: 188, taxes: 11000, housing: 32, investments: 32000 },
    'New Caledonia': { gdp: 450000, resources: 2, unemployment: 12.5, debt: 0, inflation: 1.7, productivity: 38, imports: 18000, exports: 15000, income: 165, taxes: 5000, housing: 25, investments: 10000 },
    'Te Moana-a-Toir': { gdp: 221952, resources: 0, unemployment: 15.0, debt: 0, inflation: 1.5, productivity: 25, imports: 6000, exports: 5000, income: 120, taxes: 1000, housing: 18, investments: 3000 }
  };

  const provinces = ['Southland', 'Vulteralia', 'Tasminata', 'Cooksland', 'New Zealand', 'New Caledonia', 'Te Moana-a-Toir'];
  const totalResources = 100; // Total available resources in Zealandia

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const renderStatCard = (label: string, value: string | number, icon: string, type: 'currency' | 'percent' | 'number' | 'resources' = 'number', resourcesUsed?: number, resourcesTotal?: number, explanation?: string, hasDropdown?: boolean, dropdownId?: string) => {
    let formattedValue = value.toString();
    if (type === 'currency' && typeof value === 'number') {
      formattedValue = formatCurrency(value);
    } else if (type === 'percent' && typeof value === 'number') {
      formattedValue = formatPercent(value);
    } else if (type === 'resources' && resourcesUsed !== undefined && resourcesTotal !== undefined) {
      formattedValue = `${resourcesUsed} / ${resourcesTotal}`;
    }

    const isExpanded = expandedCard === dropdownId;

    return (
      <div className="stat-card" onClick={() => hasDropdown && setExpandedCard(isExpanded ? null : dropdownId || null)}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
          <div className="stat-label">
            {label}
            {hasDropdown && <span className="dropdown-arrow">{isExpanded ? '▼' : '▶'}</span>}
          </div>
          <div className="stat-value">{formattedValue}</div>
          {explanation && <div className="stat-explanation">{explanation}</div>}
        </div>
        {hasDropdown && isExpanded && (
          <div className="stat-dropdown" onClick={(e) => e.stopPropagation()}>
            {dropdownId === 'resources' && (
              <div className="dropdown-content">
                {resourceBreakdown.map((resource, idx) => (
                  <div key={idx} className="dropdown-item">
                    <span className="item-name">{resource.name}</span>
                    <span className="item-value">{resource.used}/{resource.total} {resource.unit}</span>
                  </div>
                ))}
              </div>
            )}
            {dropdownId === 'exports' && (
              <div className="dropdown-content">
                {exportItems.map((item, idx) => (
                  <div key={idx} className="dropdown-item">
                    <span className="item-name">{item.item}</span>
                    <span className="item-value">{item.quantity.toLocaleString()} {item.unit} (£{item.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            )}
            {dropdownId === 'imports' && (
              <div className="dropdown-content">
                {importItems.map((item, idx) => (
                  <div key={idx} className="dropdown-item">
                    <span className="item-name">{item.item}</span>
                    <span className="item-value">{item.quantity.toLocaleString()} {item.unit} (£{item.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            )}
            {dropdownId === 'income' && (
              <div className="dropdown-content">
                <div className="dropdown-item">
                  <span className="item-name">Upper Class (5%)</span>
                  <span className="item-value">£500 - £1,000/year</span>
                </div>
                <div className="dropdown-item">
                  <span className="item-name">Middle Class (25%)</span>
                  <span className="item-value">£150 - £400/year</span>
                </div>
                <div className="dropdown-item">
                  <span className="item-name">Lower Class (65%)</span>
                  <span className="item-value">£70 - £120/year</span>
                </div>
                <div className="dropdown-item">
                  <span className="item-name">Indigenous Population</span>
                  <span className="item-value">Varies (subsistence + trade)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const currentStats = viewMode === 'total' ? totalStats : provinceStatsData[selectedProvince];

  return (
    <div className="economic-stats-page">
      <PageHeader title="Economic Statistics" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="page-content">
        <div className="province-selector">
          <button 
            className={viewMode === 'total' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setViewMode('total')}
          >
            Total (All Provinces)
          </button>
          {provinces.map(province => (
            <button 
              key={province}
              className={viewMode === 'province' && selectedProvince === province ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => {
                setViewMode('province');
                setSelectedProvince(province);
              }}
            >
              {province}
            </button>
          ))}
        </div>

        <div className="stats-grid">
          {renderStatCard('GDP', currentStats.gdp, '📊', 'currency')}
          {renderStatCard('Resources', currentStats.resources, '⛏️', 'resources', currentStats.resources, totalResources, 'Resources actively exploited', true, 'resources')}
          {renderStatCard('Unemployment', currentStats.unemployment, '👔', 'percent', undefined, undefined, 'Settlers without employment (frontier economy challenges)')}
          {renderStatCard('Debt', currentStats.debt, '💳', 'currency')}
          {renderStatCard('Inflation', currentStats.inflation, '📈', 'percent')}
          {renderStatCard('Productivity', currentStats.productivity, '⚙️', 'percent', undefined, undefined, 'Economic output efficiency (limited by 1854 technology)')}
          {renderStatCard('Imports', currentStats.imports, '📥', 'currency', undefined, undefined, 'Goods purchased from Britain & Australia', true, 'imports')}
          {renderStatCard('Exports', currentStats.exports, '📤', 'currency', undefined, undefined, 'Colonial goods sold to Empire markets', true, 'exports')}
          {renderStatCard('Average Income', currentStats.income, '💰', 'currency', undefined, undefined, 'Weighted average across all classes', true, 'income')}
          {renderStatCard('Taxes', currentStats.taxes, '🏛️', 'currency', undefined, undefined, 'Colonial tax revenue (~0.87% of GDP)')}
          {renderStatCard('Housing', currentStats.housing, '🏠', 'percent', undefined, undefined, 'Housing availability index (shortage in growing colony)')}
          {renderStatCard('Investments', currentStats.investments, '💼', 'currency')}
        </div>
      </div>
    </div>
  );
};

export default EconomyStatsPage;
