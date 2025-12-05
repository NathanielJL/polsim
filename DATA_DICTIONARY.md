# ZEALANDIA GAME DATA DICTIONARY
# Standardized terminology for AI event/policy generation
# Use these exact field names when referencing game data

# ========================================
# ECONOMIC MODIFIERS
# ========================================

## GDP (Gross Domestic Product)
gdp: number                    # Total provincial GDP in pounds (£)
gdpChange: number              # Multiplier: 0.10 = +10%, -0.05 = -5%
gdpGrowthRate: number          # Annual percentage

## Government Finance
governmentRevenue: number      # Annual tax revenue (£)
governmentExpenditure: number  # Annual spending (£)
governmentBudget: number       # Revenue - Expenditure
governmentDebt: number         # Total debt (£)
debtToGdpRatio: number         # Debt / GDP

## Employment
unemployment: number           # Percentage (0-100)
unemploymentChange: number     # Percentage points: -2 = decrease by 2%
employmentRate: number         # Percentage (0-100)
laborForce: number             # Total working-age population

## Prices & Inflation
inflation: number              # Annual percentage
inflationChange: number        # Percentage points
priceLevel: number             # General price index (base 100)

## Trade
exportValue: number            # Total exports (£)
importValue: number            # Total imports (£)
tradeBalance: number           # Exports - Imports
tariffRate: number             # Percentage on imports

# ========================================
# POPULATION DEMOGRAPHICS
# ========================================

## Total Population
population: number             # Total settlers + Māori
populationGrowth: number       # Annual percentage
populationChange: number       # Absolute change in people

## Cultural Composition (percentages sum to 1.0)
culturalMakeup: {
  English: number              # 0.0 - 1.0
  Scottish: number
  Irish: number
  Dutch: number
  French: number
  Spanish: number
  German: number
  Scandinavian: number
  Māori: number
  Mixed: number                # Bi-cultural heritage
  Other: number
}

## Age Distribution
workingAgePopulation: number   # Ages 15-64
dependentPopulation: number    # Ages 0-14 + 65+
medianAge: number              # Years

## Migration
immigrationRate: number        # Annual percentage
immigrationModifier: number    # Multiplier: 1.5 = +50% immigration
emigrationRate: number         # Annual percentage
netMigration: number           # Immigration - Emigration

# ========================================
# REPUTATION GROUPS
# ========================================
# Reputation values: 0-100 (50 = neutral)

reputationImpact: {
  # Economic Classes
  upper_class: number          # Wealthy landowners, merchants
  middle_class: number         # Professionals, small business
  working_class: number        # Laborers, farmers, artisans
  
  # Cultural Groups
  british_settlers: number     # English/Scottish/Irish
  maori_communities: number    # Indigenous Māori
  mixed_heritage: number       # Bi-cultural families
  
  # Occupational Groups
  farmers: number              # Agricultural workers
  merchants: number            # Traders, shopkeepers
  miners: number               # Mining industry
  loggers: number              # Timber industry
  whalers: number              # Whaling industry
  lawyers: number              # Legal profession
  clergy: number               # Religious leaders
  
  # Political Groups
  loyalists: number            # British Crown supporters
  reformists: number           # Progressive reformers
  autonomists: number          # Provincial rights advocates
  
  # Government
  provincial_governments: number
  federal_government: number
  british_crown: number
  
  # Special Interest
  creditors: number            # Banks, lenders
  investors: number            # Business investors
  landowners: number           # Large property owners
  treaty_advocates: number     # Treaty of Waitangi supporters
}

# ========================================
# RESOURCES & COMMODITIES
# ========================================

## Forestry
timber: number                 # Volume (cubic feet)
flax: number                   # Weight (tons)
kauri_gum: number             # Weight (tons)

## Agriculture  
grain: number                  # Weight (tons)
vegetables: number
fruit: number
wheat: number
barley: number

## Livestock
wool: number                   # Weight (tons)
leather: number
meat: number
dairy: number

## Marine
fish: number                   # Weight (tons)
whaling: number                # Barrels of oil
sealing: number                # Pelts
shellfish: number

## Mining - Precious
gold: number                   # Ounces
silver: number                 # Ounces
platinum: number

## Mining - Industrial
coal: number                   # Tons
iron: number                   # Tons
copper: number
tin: number
zinc: number

## Mining - Specialty
sulfur: number
saltpeter: number
graphite: number

## Quarrying
stone: number                  # Cubic yards
marble: number
clay: number
kaolin: number

## Special
guano: number                  # Fertilizer (tons)
ice: number                    # Blocks

# ========================================
# RESOURCE MARKET DATA
# ========================================

resourcePriceChanges: {
  [resourceName]: number       # Multiplier: 0.10 = +10% price, -0.20 = -20%
}

marketData: {
  basePrice: number            # Price in £ per unit
  currentPrice: number         # Adjusted for supply/demand
  supply: number               # Units available
  demand: number               # Units demanded
  volatility: number           # Price variance (0-1)
}

# ========================================
# STOCK MARKET
# ========================================

## Company Data
companyValuation: number       # Total value (£)
sharePrice: number             # Price per share (£)
totalShares: number            # Number of shares
dividendYield: number          # Annual percentage
profitMargin: number           # Percentage

## Market Indices
stockMarketIndex: number       # Overall market value (base 100)
marketCapitalization: number   # Total value of all companies
tradingVolume: number          # Shares traded per turn

## Investment
shareholderCount: number
portfolioValue: number         # Total investment value
stockReturn: number            # Percentage gain/loss

# ========================================
# LAND & TERRITORY
# ========================================

## Provincial Geography
area: number                   # Square kilometers
developmentLevel: number       # Percentage (0-100)
urbanization: number           # Percentage urban vs rural

## Land Ownership
crownLand: number              # Acres owned by Crown
privateLand: number            # Acres privately owned
maoriLand: number              # Acres held under Treaty
disputedLand: number           # Contested ownership

## Climate
averageTemperature: number     # Celsius
rainfall: number               # mm per year
growingSeason: number          # Days per year

# ========================================
# POLITICAL DATA
# ========================================

## Legislature
lowerHouseSeats: number        # Total seats (35 for Zealandia)
upperHouseSeats: number        # Total seats (14 for Zealandia)
votingPower: number            # Influence score

## Elections
voterTurnout: number           # Percentage
electoralSupport: number       # Percentage backing
electionCycle: number          # Years between elections (3)

## Faction Alignment
factionStrength: {
  loyalty_league: number       # Conservative faction
  miscegenation_block: number  # Progressive faction
  broader_reform: number       # Moderate faction
}

# ========================================
# LEGAL SYSTEM
# ========================================

## Court Cases
caseLoad: number               # Active cases
conviction Rate: number        # Percentage
averageSentence: number        # Months

## Legal Profession
barredLawyers: number          # Licensed attorneys
legalFees: number              # Average fee (£)

# ========================================
# INFRASTRUCTURE
# ========================================

## Transportation
roadMiles: number              # Miles of road
portCapacity: number           # Tons per year
shippingRoutes: number

## Buildings
residentialBuildings: number
commercialBuildings: number
governmentBuildings: number
religiousBuildings: number

# ========================================
# SOCIAL INDICATORS
# ========================================

## Education
literacyRate: number           # Percentage
schoolEnrollment: number       # Number of students
universities: number

## Health
lifeExpectancy: number         # Years
infantMortality: number        # Per 1000 births
physicians: number             # Per 1000 people

## Religion
religiousAffiliation: {
  Anglican: number             # Percentage
  Presbyterian: number
  Catholic: number
  Methodist: number
  Māori_Traditional: number
  Other: number
}

# ========================================
# EVENT TRIGGERS & SEVERITY
# ========================================

## Event Classification
severity: number               # 1-10 scale
  # 1-3: Minor (local impact)
  # 4-6: Moderate (provincial impact)
  # 7-9: Major (national impact)
  # 10: Crisis (existential threat)

duration: number               # Turns event lasts

## Event Types (use these strings)
eventType: 
  | "economic_crisis"
  | "natural_disaster"
  | "political_crisis"
  | "constitutional_crisis"
  | "resource_discovery"
  | "immigration"
  | "epidemic"
  | "trade_disruption"
  | "war"
  | "treaty_violation"
  | "land_dispute"
  | "labor_unrest"
  | "financial_panic"
  | "agricultural_boom"
  | "technological_advancement"
  | "custom_type_in_quotes"  # GM can use custom like "miners_strike"

# ========================================
# GAME MECHANICS
# ========================================

## Turn System
currentTurn: number            # Turn number (1, 2, 3...)
turnDuration: number           # Real-time hours (24)
inGameDate: Date               # Game world date
inGameMonths: number           # Months per turn (1.0)

## Action Points
actionPoints: number           # Current AP (0-5)
actionPointCost: number        # Cost of action (1, 2, etc.)
actionPointBonus: number       # Temporary AP grant

## Player Stats
cash: number                   # Player wealth (£)
reputation: number             # Overall reputation (0-100)
politicalPower: number         # Influence score
officeHeld: string             # Current position

# ========================================
# USAGE EXAMPLES
# ========================================

# EXAMPLE EVENT (Economic Crisis):
{
  "title": "Tasminata Debt Crisis",
  "eventType": "economic_crisis",
  "severity": 9,
  "duration": 12,
  "economicImpact": {
    "gdpChange": -0.05,
    "unemploymentChange": 2.5,
    "governmentDebt": 35000
  },
  "reputationImpact": {
    "provincial_governments": -15,
    "creditors": -20,
    "working_class": -10
  },
  "affectedProvinces": ["Tasminata"]
}

# EXAMPLE POLICY (Tax Reform):
{
  "title": "Progressive Income Tax Act",
  "policyType": "tax_income",
  "economicImpact": {
    "gdpChange": -0.02,
    "governmentRevenue": 50000
  },
  "reputationImpact": {
    "upper_class": -10,
    "working_class": 15,
    "middle_class": 5
  }
}

# EXAMPLE RESOURCE DISCOVERY:
{
  "title": "Gold Discovery in Otago",
  "eventType": "resource_discovery",
  "severity": 7,
  "economicImpact": {
    "gdpChange": 0.15,
    "immigrationModifier": 2.0
  },
  "resourcePriceChanges": {
    "gold": -0.20
  },
  "reputationImpact": {
    "miners": 20,
    "investors": 15
  }
}

# EXAMPLE IMMIGRATION EVENT:
{
  "title": "Irish Famine Refugees Arrive",
  "eventType": "immigration",
  "severity": 5,
  "populationChange": 5000,
  "culturalMakeup": {
    "Irish": 1.0
  },
  "reputationImpact": {
    "clergy": 10,
    "working_class": -5,
    "british_settlers": -3
  }
}
