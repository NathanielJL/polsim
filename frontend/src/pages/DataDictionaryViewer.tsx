import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/DataDictionaryViewer.css';

interface DictionaryData {
  version: string;
  lastUpdated: string;
  resources: string[];
  reputationGroups: string[];
  eventTypes: string[];
  culturalGroups: string[];
}

interface FieldCategory {
  name: string;
  description: string;
  fields: FieldDefinition[];
}

interface FieldDefinition {
  name: string;
  type: string;
  description: string;
  example?: string;
  validValues?: string[];
}

const DataDictionaryViewer: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dictionaryData, setDictionaryData] = useState<DictionaryData | null>(null);

  useEffect(() => {
    fetchDictionary();
  }, []);

  const fetchDictionary = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get('/api/data-dictionary');
      setDictionaryData(res.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data dictionary');
      setLoading(false);
    }
  };

  const categories: FieldCategory[] = [
    {
      name: 'Resources',
      description: 'Natural resources that can be discovered and exploited',
      fields: [
        { name: 'timber', type: 'string', description: 'Forest wood resources for construction and trade' },
        { name: 'agriculture', type: 'string', description: 'Farmland and agricultural production' },
        { name: 'fishing', type: 'string', description: 'Coastal and marine fishing resources' },
        { name: 'whaling', type: 'string', description: 'Whale oil and whalebone extraction' },
        { name: 'livestock', type: 'string', description: 'Sheep, cattle, and animal husbandry' },
        { name: 'gold', type: 'string', description: 'Gold deposits for mining' },
        { name: 'coal', type: 'string', description: 'Coal deposits for fuel and industry' },
        { name: 'iron', type: 'string', description: 'Iron ore for metallurgy' },
        { name: 'copper', type: 'string', description: 'Copper deposits for industry' },
        { name: 'silver', type: 'string', description: 'Silver deposits for currency and trade' },
        { name: 'platinum', type: 'string', description: 'Rare platinum deposits' },
        { name: 'gemstones', type: 'string', description: 'Precious gems (jade, opal, etc.)' },
      ],
    },
    {
      name: 'Reputation Groups',
      description: 'Demographic groups that have approval ratings toward players',
      fields: [
        { name: 'upper_class', type: 'number (-100 to 100)', description: 'Wealthy landowners and aristocrats' },
        { name: 'middle_class', type: 'number (-100 to 100)', description: 'Merchants and professionals' },
        { name: 'working_class', type: 'number (-100 to 100)', description: 'Laborers and artisans' },
        { name: 'maori_communities', type: 'number (-100 to 100)', description: 'Indigenous Māori population' },
        { name: 'british_settlers', type: 'number (-100 to 100)', description: 'British immigrant settlers' },
        { name: 'irish_settlers', type: 'number (-100 to 100)', description: 'Irish immigrant settlers' },
        { name: 'scottish_settlers', type: 'number (-100 to 100)', description: 'Scottish immigrant settlers' },
        { name: 'miners', type: 'number (-100 to 100)', description: 'Mining workers and prospectors' },
        { name: 'farmers', type: 'number (-100 to 100)', description: 'Agricultural workers and landholders' },
        { name: 'merchants', type: 'number (-100 to 100)', description: 'Trade and commerce professionals' },
        { name: 'clergy', type: 'number (-100 to 100)', description: 'Religious leaders and institutions' },
        { name: 'military', type: 'number (-100 to 100)', description: 'Armed forces personnel' },
      ],
    },
    {
      name: 'Event Types',
      description: 'Categories of events that can occur in the game',
      fields: [
        { name: 'economic_crisis', type: 'string', description: 'Financial downturns and market crashes' },
        { name: 'natural_disaster', type: 'string', description: 'Earthquakes, floods, droughts, etc.' },
        { name: 'cultural_event', type: 'string', description: 'Festivals, cultural movements, artistic events' },
        { name: 'political_scandal', type: 'string', description: 'Corruption, controversies, political drama' },
        { name: 'resource_discovery', type: 'string', description: 'New resource deposits found' },
        { name: 'treaty_negotiation', type: 'string', description: 'Diplomatic agreements with Māori iwi' },
        { name: 'immigration_wave', type: 'string', description: 'Sudden influx of immigrants' },
        { name: 'technological_advancement', type: 'string', description: 'Innovations and tech progress' },
        { name: 'social_movement', type: 'string', description: 'Labor movements, suffrage, social reform' },
        { name: 'military_conflict', type: 'string', description: 'Armed conflicts and skirmishes' },
        { name: 'custom_event', type: 'string', description: 'GM-defined custom events (use quotes)' },
      ],
    },
    {
      name: 'Cultural Groups',
      description: 'Ethnic and cultural populations tracked in demographics',
      fields: [
        { name: 'english', type: 'number (percentage)', description: 'English immigrant population' },
        { name: 'irish', type: 'number (percentage)', description: 'Irish immigrant population' },
        { name: 'scottish', type: 'number (percentage)', description: 'Scottish immigrant population' },
        { name: 'maori', type: 'number (percentage)', description: 'Indigenous Māori population' },
        { name: 'welsh', type: 'number (percentage)', description: 'Welsh immigrant population' },
        { name: 'german', type: 'number (percentage)', description: 'German immigrant population' },
        { name: 'scandinavian', type: 'number (percentage)', description: 'Nordic immigrant population' },
        { name: 'chinese', type: 'number (percentage)', description: 'Chinese immigrant population' },
        { name: 'mixed', type: 'number (percentage)', description: 'Mixed cultural heritage' },
      ],
    },
    {
      name: 'Turn System',
      description: 'Game timing and turn mechanics',
      fields: [
        { name: 'turnNumber', type: 'number', description: 'Current turn in the game session' },
        { name: 'inGameDate', type: 'Date', description: 'Current date in the game world (1854+)' },
        { name: 'inGameMonths', type: 'number', description: 'Number of in-game months per turn (1.0)' },
        { name: 'actionPoints', type: 'number', description: 'Player action points per turn (default 3)' },
      ],
    },
    {
      name: 'Economy',
      description: 'Economic fields and financial data',
      fields: [
        { name: 'gdp', type: 'number', description: 'Gross Domestic Product in pounds sterling' },
        { name: 'gdpPerCapita', type: 'number', description: 'GDP divided by population' },
        { name: 'unemployment', type: 'number (percentage)', description: 'Unemployment rate (0-100)' },
        { name: 'inflation', type: 'number (percentage)', description: 'Annual inflation rate' },
        { name: 'taxRate', type: 'number (percentage)', description: 'Tax rate applied to income/trade' },
        { name: 'publicDebt', type: 'number', description: 'Government debt in pounds' },
        { name: 'resourceProduction', type: 'object', description: 'Resource name → production quantity map' },
      ],
    },
    {
      name: 'Population',
      description: 'Population statistics and demographics',
      fields: [
        { name: 'population', type: 'number', description: 'Total population count' },
        { name: 'populationGrowthRate', type: 'number (percentage)', description: 'Annual growth rate' },
        { name: 'urbanizationRate', type: 'number (percentage)', description: 'Percentage living in cities' },
        { name: 'immigrationRate', type: 'number (percentage)', description: 'Annual immigration rate (baseline 2%)' },
        { name: 'culturalComposition', type: 'object', description: 'Cultural group → percentage map' },
        { name: 'religiousComposition', type: 'object', description: 'Religion → percentage map' },
      ],
    },
    {
      name: 'Policies',
      description: 'Legislative policy fields',
      fields: [
        { name: 'title', type: 'string', description: 'Policy name/title' },
        { name: 'description', type: 'string', description: 'Full policy text and details' },
        { name: 'proposedBy', type: 'string', description: 'Player or NPC who proposed the policy' },
        { name: 'turnProposed', type: 'number', description: 'Turn number when proposed' },
        { name: 'turnPassed', type: 'number', description: 'Turn number when passed (if applicable)' },
        { name: 'status', type: 'string', description: 'proposed | voting | passed | rejected | superseded', validValues: ['proposed', 'voting', 'passed', 'rejected', 'superseded'] },
        { name: 'supersededBy', type: 'string', description: 'ID of policy that replaced this one' },
        { name: 'economicImpact', type: 'object', description: 'Effects on GDP, employment, taxes, etc.' },
      ],
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied "${text}" to clipboard!`);
  };

  const filteredCategories = categories.map((category) => ({
    ...category,
    fields: category.fields.filter(
      (field) =>
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.fields.length > 0);

  if (loading) {
    return (
      <div className="data-dictionary-viewer loading">
        <div className="spinner"></div>
        <p>Loading data dictionary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-dictionary-viewer error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="data-dictionary-viewer">
      <div className="dictionary-header">
        <h1>📖 Data Dictionary</h1>
        <p className="subtitle">Standardized field reference for game mechanics</p>
        {dictionaryData && (
          <div className="version-info">
            <span>Version: <strong>{dictionaryData.version}</strong></span>
            <span>Last Updated: <strong>{new Date(dictionaryData.lastUpdated).toLocaleDateString()}</strong></span>
          </div>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search fields by name or description..."
        />
      </div>

      <div className="dictionary-tabs">
        <button
          className={activeCategory === 'overview' ? 'active' : ''}
          onClick={() => setActiveCategory('overview')}
        >
          📊 Overview
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            className={activeCategory === category.name ? 'active' : ''}
            onClick={() => setActiveCategory(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="dictionary-content">
        {activeCategory === 'overview' && (
          <div className="tab-panel overview-panel">
            <h2>Welcome to the Data Dictionary</h2>
            <p className="intro-text">
              This reference guide documents all standardized field names, data types, and valid values
              used throughout the Zealandia political simulation. Use this when creating policies, events,
              or analyzing game data.
            </p>

            <div className="quick-reference">
              <div className="ref-card">
                <h3>📦 Resources</h3>
                <p>{dictionaryData?.resources.length} resource types</p>
                <ul className="compact-list">
                  {dictionaryData?.resources.slice(0, 6).map((resource) => (
                    <li key={resource}>{resource}</li>
                  ))}
                </ul>
              </div>

              <div className="ref-card">
                <h3>👥 Reputation Groups</h3>
                <p>{dictionaryData?.reputationGroups.length} demographic groups</p>
                <ul className="compact-list">
                  {dictionaryData?.reputationGroups.slice(0, 6).map((group) => (
                    <li key={group}>{group.replace('_', ' ')}</li>
                  ))}
                </ul>
              </div>

              <div className="ref-card">
                <h3>🎭 Event Types</h3>
                <p>{dictionaryData?.eventTypes.length} event categories</p>
                <ul className="compact-list">
                  {dictionaryData?.eventTypes.slice(0, 6).map((type) => (
                    <li key={type}>{type.replace('_', ' ')}</li>
                  ))}
                </ul>
              </div>

              <div className="ref-card">
                <h3>🌏 Cultural Groups</h3>
                <p>{dictionaryData?.culturalGroups.length} cultural populations</p>
                <ul className="compact-list">
                  {dictionaryData?.culturalGroups.slice(0, 6).map((culture) => (
                    <li key={culture}>{culture}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="usage-note">
              <h3>Usage Guidelines</h3>
              <ul>
                <li>Use exact field names (case-sensitive) when referencing data</li>
                <li>Event types support custom values in quotes (e.g., "miners_strike")</li>
                <li>Reputation scores range from -100 (hostile) to +100 (beloved)</li>
                <li>All monetary values are in pounds sterling (£)</li>
                <li>Turn duration is 1.0 in-game months per turn</li>
              </ul>
            </div>
          </div>
        )}

        {activeCategory !== 'overview' && (
          <div className="tab-panel">
            {filteredCategories
              .filter((category) => category.name === activeCategory)
              .map((category) => (
                <div key={category.name}>
                  <div className="category-header">
                    <h2>{category.name}</h2>
                    <p className="category-description">{category.description}</p>
                  </div>

                  <div className="fields-list">
                    {category.fields.map((field) => (
                      <div key={field.name} className="field-card">
                        <div className="field-header">
                          <div className="field-name-section">
                            <code className="field-name">{field.name}</code>
                            <span className="field-type">{field.type}</span>
                          </div>
                          <button
                            className="copy-icon"
                            onClick={() => copyToClipboard(field.name)}
                            title="Copy field name"
                          >
                            📋
                          </button>
                        </div>
                        <p className="field-description">{field.description}</p>
                        {field.example && (
                          <div className="field-example">
                            <strong>Example:</strong> <code>{field.example}</code>
                          </div>
                        )}
                        {field.validValues && (
                          <div className="field-valid-values">
                            <strong>Valid values:</strong>
                            <div className="value-tags">
                              {field.validValues.map((value) => (
                                <span key={value} className="value-tag">{value}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDictionaryViewer;
