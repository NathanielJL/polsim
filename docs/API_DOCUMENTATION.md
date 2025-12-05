# Comprehensive API Documentation

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Base URL:** `http://localhost:5000/api`

This document provides complete reference documentation for all API endpoints in the Zealandia Political Simulation system.

---

## Table of Contents

1. [Authentication & Sessions](#authentication--sessions)
2. [Map & Provinces](#map--provinces)
3. [Legislature & Government](#legislature--government)
4. [Policies](#policies)
5. [Resources & Exploration](#resources--exploration)
6. [Immigration](#immigration)
7. [Legal System & Court Cases](#legal-system--court-cases)
8. [Archive System](#archive-system)
9. [Data Dictionary](#data-dictionary)
10. [Business & Trading](#business--trading)
11. [News & Media](#news--media)
12. [Game Master Tools](#game-master-tools)
13. [Error Codes](#error-codes)

---

## Authentication & Sessions

### Register New Player
**POST** `/api/auth/register`

Create a new player account.

**Request Body:**
```json
{
  "username": "john_smith",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "Player registered successfully",
  "playerId": "abc123",
  "token": "jwt_token_here"
}
```

**Errors:**
- `400` - Username or email already exists
- `400` - Invalid email format
- `400` - Password too weak

---

### Login
**POST** `/api/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "jwt_token_here",
  "player": {
    "id": "abc123",
    "username": "john_smith",
    "email": "john@example.com",
    "cash": 100000,
    "reputation": 0,
    "actionsRemaining": 5,
    "currentProvinceId": "prov_001",
    "heldOffice": {
      "type": "house-of-representatives",
      "provinceId": "prov_001",
      "position": "Member for Auckland",
      "electedAt": "2025-01-15T00:00:00Z"
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - Player not found

---

### Get Current Player
**GET** `/api/players/me`

Retrieve authenticated player's profile.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "id": "abc123",
  "username": "john_smith",
  "cash": 95000,
  "reputation": 15,
  "reputationByGroup": {
    "upper_class": -20,
    "working_class": 45,
    "maori_communities": 10
  },
  "actionsRemaining": 3,
  "currentProvinceId": "prov_001",
  "heldOffice": {
    "type": "superintendent",
    "provinceId": "prov_001",
    "position": "Superintendent of Auckland",
    "electedAt": "2025-01-15T00:00:00Z"
  }
}
```

**Errors:**
- `401` - Unauthorized (invalid/missing token)

---

### Create New Session
**POST** `/api/sessions/create`

Start a new game session (GM only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "name": "Zealandia 1854 Campaign",
  "startDate": "1854-01-01",
  "description": "Historical simulation starting with Constitution Act",
  "turnDuration": 1.0,
  "actionsPerTurn": 3
}
```

**Response (201 Created):**
```json
{
  "sessionId": "sess_001",
  "name": "Zealandia 1854 Campaign",
  "turnNumber": 1,
  "inGameDate": "1854-01-01T00:00:00Z",
  "createdAt": "2025-12-05T10:00:00Z"
}
```

**Errors:**
- `403` - Forbidden (non-GM player)
- `400` - Invalid session parameters

---

## Map & Provinces

### Get Map Render Data
**GET** `/api/map/{sessionId}/render-data`

Retrieve complete map data for rendering provinces, cells, cities.

**Parameters:**
- `sessionId` (path) - Game session identifier

**Response (200 OK):**
```json
{
  "provinces": [
    {
      "id": "prov_001",
      "name": "Auckland",
      "superintendent": "William Hobson",
      "ltGovernor": "John Logan Campbell",
      "population": 12500,
      "area": 4894,
      "gdp": 125000,
      "gdpPerCapita": 10.0,
      "color": "#C41E3A",
      "cells": [
        {
          "id": "cell_001",
          "vertices": [[-36.8, 174.7], [-36.9, 174.8], [-36.85, 174.75]],
          "height": 150,
          "biome": "temperate_forest"
        }
      ]
    }
  ],
  "cities": [
    {
      "name": "Auckland",
      "position": [-36.8485, 174.7633],
      "population": 8000,
      "provinceId": "prov_001"
    }
  ]
}
```

**Errors:**
- `404` - Session not found

---

### Get Province Details
**GET** `/api/map/{sessionId}/provinces/{provinceId}`

Get detailed statistics for a specific province.

**Parameters:**
- `sessionId` (path) - Game session ID
- `provinceId` (path) - Province ID

**Response (200 OK):**
```json
{
  "id": "prov_001",
  "name": "Auckland",
  "superintendent": "William Hobson",
  "ltGovernor": "John Logan Campbell",
  "population": 12500,
  "area": 4894,
  "gdp": 125000,
  "gdpPerCapita": 10.0,
  "unemployment": 8.5,
  "urbanization": 65.2,
  "culturalComposition": {
    "english": 45.0,
    "irish": 20.0,
    "scottish": 15.0,
    "maori": 18.0,
    "mixed": 2.0
  },
  "religiousComposition": {
    "anglican": 50.0,
    "catholic": 25.0,
    "methodist": 15.0,
    "traditional_maori": 10.0
  },
  "resources": {
    "timber": { "abundance": "high", "production": 1500 },
    "agriculture": { "abundance": "medium", "production": 800 },
    "fishing": { "abundance": "high", "production": 600 }
  },
  "developmentLevel": 3,
  "infrastructure": {
    "roads": 45,
    "ports": 2,
    "railroads": 0
  }
}
```

**Errors:**
- `404` - Province not found

---

### List All Provinces
**GET** `/api/map/{sessionId}/provinces`

Get summary list of all provinces.

**Response (200 OK):**
```json
{
  "provinces": [
    {
      "id": "prov_001",
      "name": "Auckland",
      "population": 12500,
      "gdp": 125000,
      "superintendent": "William Hobson"
    },
    {
      "id": "prov_002",
      "name": "Wellington",
      "population": 8000,
      "gdp": 85000,
      "superintendent": "Edward Jerningham Wakefield"
    }
  ],
  "totalPopulation": 95000,
  "totalGDP": 950000
}
```

---

## Legislature & Government

### Get Legislative Seats
**GET** `/api/legislature/seats/{sessionId}`

Retrieve all seats in General Assembly (Upper and Lower Houses).

**Response (200 OK):**
```json
{
  "governor": {
    "name": "Sir George Grey",
    "appointed": "1845-11-18",
    "authority": "Crown-appointed"
  },
  "upperHouse": {
    "name": "Legislative Council",
    "totalSeats": 14,
    "members": [
      {
        "id": "player_001",
        "name": "John Smith",
        "appointedAt": "1854-01-15",
        "faction": "loyalist",
        "provinceId": "prov_001"
      }
    ]
  },
  "lowerHouse": {
    "name": "House of Representatives",
    "totalSeats": 35,
    "members": [
      {
        "id": "player_002",
        "name": "Mary Johnson",
        "electedAt": "1854-01-20",
        "faction": "reformist",
        "constituencyId": "const_001",
        "provinceId": "prov_001"
      }
    ]
  },
  "superintendents": [
    {
      "provinceId": "prov_001",
      "provinceName": "Auckland",
      "superintendentId": "player_003",
      "superintendentName": "William Hobson",
      "electedAt": "1854-01-10"
    }
  ]
}
```

---

### Vote on Policy
**POST** `/api/legislature/vote`

Cast a vote on a policy (requires legislative office).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "policyId": "policy_001",
  "vote": "yes"
}
```

**Vote Options:** `yes`, `no`, `abstain`

**Response (200 OK):**
```json
{
  "message": "Vote recorded successfully",
  "policyId": "policy_001",
  "playerVote": "yes",
  "updatedVoteCounts": {
    "yes": 18,
    "no": 12,
    "abstain": 5
  }
}
```

**Errors:**
- `403` - Player does not hold legislative office
- `400` - Policy not in voting status
- `400` - Player already voted on this policy

---

### Get Executive Officers
**GET** `/api/legislature/executive/{sessionId}`

List Governor and Provincial Superintendents.

**Response (200 OK):**
```json
{
  "governor": {
    "name": "Sir George Grey",
    "appointed": "1845-11-18"
  },
  "superintendents": [
    {
      "provinceId": "prov_001",
      "provinceName": "Auckland",
      "name": "William Hobson",
      "electedAt": "1854-01-10"
    }
  ]
}
```

---

## Policies

### List Policies
**GET** `/api/policies/{sessionId}`

Get all policies with optional status filter.

**Query Parameters:**
- `status` (optional) - Filter by: `proposed`, `voting`, `passed`, `rejected`, `superseded`

**Response (200 OK):**
```json
{
  "policies": [
    {
      "id": "policy_001",
      "title": "Land Reform Act",
      "description": "Redistribute Crown land to settlers with fair compensation to Māori iwi.",
      "proposedBy": "john_smith",
      "turnProposed": 5,
      "turnPassed": 7,
      "status": "passed",
      "votes": {
        "yes": 22,
        "no": 10,
        "abstain": 3
      },
      "economicImpact": {
        "gdp": 5000,
        "employment": 2.5,
        "approval": {
          "maori_communities": -15,
          "farmers": 20
        }
      }
    }
  ]
}
```

---

### Propose Policy
**POST** `/api/policies/propose`

Submit a new policy for consideration (costs 1 AP).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "title": "Education Reform Act",
  "description": "Establish free primary education for all children.",
  "economicImpact": {
    "publicSpending": 10000,
    "literacy": 15
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Policy proposed successfully",
  "policyId": "policy_002",
  "apRemaining": 2
}
```

**Errors:**
- `400` - Insufficient action points
- `400` - Missing required fields

---

### Get Policy Details
**GET** `/api/policies/{sessionId}/{policyId}`

Retrieve full details of a specific policy.

**Response (200 OK):**
```json
{
  "id": "policy_001",
  "title": "Land Reform Act",
  "description": "Full policy text...",
  "proposedBy": "john_smith",
  "turnProposed": 5,
  "turnPassed": 7,
  "status": "passed",
  "votes": {
    "yes": 22,
    "no": 10,
    "abstain": 3,
    "voterDetails": [
      {
        "playerId": "player_001",
        "playerName": "Mary Johnson",
        "vote": "yes",
        "timestamp": "2025-12-05T14:30:00Z"
      }
    ]
  },
  "economicImpact": {
    "gdp": 5000,
    "employment": 2.5,
    "approval": {
      "maori_communities": -15,
      "farmers": 20
    }
  },
  "supersededBy": null
}
```

---

### Supersede Policy
**POST** `/api/policies/supersede`

Replace an old policy with a new one (GM only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "oldPolicyId": "policy_001",
  "newPolicyId": "policy_005"
}
```

**Response (200 OK):**
```json
{
  "message": "Policy superseded successfully",
  "oldPolicyId": "policy_001",
  "newPolicyId": "policy_005"
}
```

**Errors:**
- `403` - Not authorized (non-GM)
- `404` - Policy not found

---

## Resources & Exploration

### Explore Province
**POST** `/api/resources/explore`

Search for hidden resources in a province (costs 1 AP, 5% base success chance).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "provinceId": "prov_001"
}
```

**Response (200 OK - Success):**
```json
{
  "success": true,
  "discoveredResource": "gold",
  "message": "Gold discovered in Auckland!",
  "eventGenerated": true,
  "marketImpact": {
    "gold": {
      "priceChange": -12.5,
      "supplyIncrease": 500
    }
  },
  "apRemaining": 2
}
```

**Response (200 OK - Failure):**
```json
{
  "success": false,
  "message": "No resources discovered this attempt.",
  "apRemaining": 2
}
```

**Errors:**
- `400` - Insufficient action points
- `404` - Province not found

---

### Get Resource Prices
**GET** `/api/resources/market/{sessionId}`

Retrieve current market prices for all resources.

**Response (200 OK):**
```json
{
  "resources": [
    {
      "name": "timber",
      "currentPrice": 15.50,
      "basePrice": 15.00,
      "supply": 1200,
      "demand": 900,
      "priceHistory": [
        { "turn": 1, "price": 15.00 },
        { "turn": 2, "price": 15.25 },
        { "turn": 3, "price": 15.50 }
      ]
    },
    {
      "name": "gold",
      "currentPrice": 125.00,
      "basePrice": 100.00,
      "supply": 500,
      "demand": 800,
      "priceHistory": [...]
    }
  ]
}
```

---

## Immigration

### Get Immigration Stats
**GET** `/api/immigration/stats/{sessionId}`

Retrieve population and immigration statistics.

**Response (200 OK):**
```json
{
  "totalPopulation": 95000,
  "annualImmigration": 1900,
  "baselineRate": 2.0,
  "policyModifiers": {
    "openBorders": 0.5,
    "settlementGrants": 0.3
  },
  "forecast": 97500,
  "culturalTrends": [
    {
      "culture": "english",
      "currentPercentage": 45.0,
      "trend": "increasing",
      "change": 0.5
    },
    {
      "culture": "irish",
      "currentPercentage": 20.0,
      "trend": "stable",
      "change": 0.0
    }
  ]
}
```

---

### Get Immigration Events
**GET** `/api/immigration/events/{sessionId}`

List recent immigration waves and their impact.

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": "imm_001",
      "turnNumber": 8,
      "title": "Irish Potato Famine Refugees",
      "totalImmigrants": 450,
      "culturalMakeup": {
        "irish": 100.0
      },
      "targetProvinces": ["prov_001", "prov_003"],
      "trigger": "natural_disaster"
    }
  ]
}
```

---

## Legal System & Court Cases

### Get Court Cases
**GET** `/api/legal/cases/{sessionId}`

List available, active, and resolved court cases (lawyer access only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `status` (optional) - Filter: `pending`, `in_progress`, `resolved`

**Response (200 OK):**
```json
{
  "cases": [
    {
      "id": "case_001",
      "type": "civil",
      "difficulty": 6,
      "plaintiff": "John Smith",
      "defendant": "Mary Johnson",
      "summary": "Dispute over land boundary...",
      "legalIssues": [
        "Property rights",
        "Treaty of Waitangi interpretation"
      ],
      "culturalContext": "Māori customary land claims",
      "potentialOutcomes": [
        "Plaintiff awarded damages £500",
        "Defendant retains land"
      ],
      "reward": 250,
      "status": "pending",
      "assignedTo": null
    }
  ]
}
```

**Errors:**
- `403` - Player is not a lawyer

---

### Resolve Court Case
**POST** `/api/legal/resolve-case`

Submit legal strategy and arguments to resolve a case (costs 1 AP).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "caseId": "case_001",
  "strategy": "cultural",
  "arguments": "The Treaty of Waitangi guarantees Māori customary rights to this land. Historical evidence shows continuous occupation by the iwi..."
}
```

**Strategy Options:**
- `aggressive` - Strong prosecution
- `defensive` - Protect client
- `negotiation` - Settlement-focused
- `procedural` - Technical/legal challenges
- `cultural` - Cultural sensitivity approach

**Response (200 OK):**
```json
{
  "message": "Case resolved successfully",
  "outcome": "Defendant retains land with compensation to plaintiff £200",
  "rewardEarned": 250,
  "reputationImpact": {
    "maori_communities": 15,
    "british_settlers": -5
  },
  "apRemaining": 2
}
```

**Errors:**
- `400` - Insufficient action points
- `403` - Not a lawyer
- `400` - Missing strategy or arguments

---

## Archive System

### Get Archivable Policies
**GET** `/api/archive/policies/{sessionId}`

List policies eligible for archival (superseded or >24 turns old).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "archivablePolicies": [
    {
      "id": "policy_001",
      "title": "Land Reform Act",
      "turnProposed": 5,
      "turnPassed": 7,
      "status": "superseded",
      "supersededBy": "policy_015"
    }
  ]
}
```

**Errors:**
- `403` - Not a Game Master

---

### Get Archivable Events
**GET** `/api/archive/events/{sessionId}`

List events eligible for archival (completed or >24 turns old).

**Response (200 OK):**
```json
{
  "archivableEvents": [
    {
      "id": "event_001",
      "title": "Auckland Gold Rush",
      "type": "resource_discovery",
      "turnNumber": 8,
      "status": "completed"
    }
  ]
}
```

---

### Get Archivable News
**GET** `/api/archive/news/{sessionId}`

List news articles >24 turns old.

**Response (200 OK):**
```json
{
  "archivableNews": [
    {
      "id": "news_001",
      "headline": "Governor Announces Infrastructure Plan",
      "outlet": "Auckland Observer",
      "publishedAt": "1854-03-15",
      "turnNumber": 10
    }
  ]
}
```

---

### Mark Item as Archived
**POST** `/api/archive/mark-archived`

Record that an item has been archived externally.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "itemType": "policy",
  "itemId": "policy_001",
  "externalUrl": "https://wiki.example.com/Land_Reform_Act",
  "notes": "Exported to Notion wiki"
}
```

**Response (200 OK):**
```json
{
  "message": "Item marked as archived",
  "archiveId": "archive_001"
}
```

---

### Get Archive History
**GET** `/api/archive/history/{sessionId}`

List all previously archived items.

**Response (200 OK):**
```json
{
  "archivedItems": [
    {
      "id": "archive_001",
      "itemType": "policy",
      "itemId": "policy_001",
      "title": "Land Reform Act",
      "externalUrl": "https://wiki.example.com/Land_Reform_Act",
      "archivedAt": "2025-12-05T12:00:00Z",
      "archivedBy": "gm_player"
    }
  ]
}
```

---

## Data Dictionary

### Get Full Data Dictionary
**GET** `/api/data-dictionary`

Retrieve complete standardized field reference (public, no auth required).

**Response (200 OK):**
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-04",
  "resources": ["timber", "agriculture", "fishing", "gold", "coal", ...],
  "reputationGroups": ["upper_class", "working_class", "maori_communities", ...],
  "eventTypes": ["economic_crisis", "natural_disaster", "custom_type_in_quotes", ...],
  "culturalGroups": ["english", "irish", "scottish", "maori", ...]
}
```

---

### Get Resources List
**GET** `/api/data-dictionary/resources`

Get standardized resource names only.

**Response (200 OK):**
```json
{
  "resources": [
    "timber", "agriculture", "fishing", "whaling", "livestock",
    "gold", "silver", "coal", "iron", "copper", "platinum", "gemstones"
  ]
}
```

---

### Get Reputation Groups
**GET** `/api/data-dictionary/reputation-groups`

Get all demographic reputation groups.

**Response (200 OK):**
```json
{
  "reputationGroups": [
    "upper_class", "middle_class", "working_class",
    "maori_communities", "british_settlers", "irish_settlers",
    "miners", "farmers", "merchants", "clergy", "military"
  ]
}
```

---

### Get Event Types
**GET** `/api/data-dictionary/event-types`

Get valid event type categories.

**Response (200 OK):**
```json
{
  "eventTypes": [
    "economic_crisis", "natural_disaster", "cultural_event",
    "political_scandal", "resource_discovery", "treaty_negotiation",
    "immigration_wave", "technological_advancement", "social_movement",
    "military_conflict", "custom_type_in_quotes"
  ],
  "note": "Custom event types can be specified in quotes, e.g., 'miners_strike'"
}
```

---

### Get Cultural Groups
**GET** `/api/data-dictionary/cultural-groups`

Get cultural demographic categories.

**Response (200 OK):**
```json
{
  "culturalGroups": [
    "english", "irish", "scottish", "maori", "welsh",
    "german", "scandinavian", "chinese", "mixed"
  ]
}
```

---

## Business & Trading

### Create Company
**POST** `/api/business/create`

Start a new company (costs 1 AP, requires £10,000).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "name": "Auckland Timber Co.",
  "industry": "timber",
  "provinceId": "prov_001"
}
```

**Response (201 Created):**
```json
{
  "message": "Company created successfully",
  "companyId": "company_001",
  "apRemaining": 2,
  "cashRemaining": 90000
}
```

**Errors:**
- `400` - Insufficient funds
- `400` - Player already owns a company

---

### Buy Resources
**POST** `/api/business/buy`

Purchase resources from the market.

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "companyId": "company_001",
  "resource": "timber",
  "quantity": 100
}
```

**Response (200 OK):**
```json
{
  "message": "Purchase successful",
  "totalCost": 1550,
  "newInventory": {
    "timber": 100
  },
  "marketPriceChange": 15.75
}
```

---

### Sell Resources
**POST** `/api/business/sell`

Sell resources to the market.

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "companyId": "company_001",
  "resource": "timber",
  "quantity": 50
}
```

**Response (200 OK):**
```json
{
  "message": "Sale successful",
  "totalRevenue": 775,
  "newInventory": {
    "timber": 50
  },
  "marketPriceChange": 15.25
}
```

---

## News & Media

### Get News Articles
**GET** `/api/news/{sessionId}`

Retrieve recent news articles.

**Query Parameters:**
- `outlet` (optional) - Filter by news outlet name
- `turn` (optional) - Filter by turn number

**Response (200 OK):**
```json
{
  "articles": [
    {
      "id": "news_001",
      "headline": "Governor Announces Infrastructure Plan",
      "content": "Full article text...",
      "outlet": "Auckland Observer",
      "publishedAt": "1854-03-15T00:00:00Z",
      "turnNumber": 10,
      "authorId": "player_005",
      "authorName": "Sarah Williams",
      "bias": {
        "economic": 15,
        "social": -5
      }
    }
  ]
}
```

---

### Create News Outlet
**POST** `/api/news/create-outlet`

Establish a new news outlet (costs 1 AP, £5,000).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "name": "Wellington Gazette",
  "bias": {
    "economic": -20,
    "social": 10,
    "personal": -5
  }
}
```

**Response (201 Created):**
```json
{
  "message": "News outlet created successfully",
  "outletId": "outlet_002",
  "apRemaining": 2,
  "cashRemaining": 95000
}
```

---

### Publish News Article
**POST** `/api/news/publish`

Write and publish a news article (costs 1 AP).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "outletId": "outlet_001",
  "headline": "Land Reform Act Passes General Assembly",
  "content": "In a historic vote today, the General Assembly passed the Land Reform Act..."
}
```

**Response (201 Created):**
```json
{
  "message": "Article published successfully",
  "articleId": "news_005",
  "reputationImpact": {
    "farmers": 5,
    "maori_communities": -3
  },
  "apRemaining": 2
}
```

---

## Game Master Tools

### Advance Turn
**POST** `/api/turns/advance`

Progress the game to the next turn (GM only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001"
}
```

**Response (200 OK):**
```json
{
  "message": "Turn advanced successfully",
  "newTurnNumber": 15,
  "newInGameDate": "1855-02-01T00:00:00Z",
  "eventsProcessed": 8,
  "policiesResolved": 3,
  "playersRefreshed": 12
}
```

**Errors:**
- `403` - Not authorized (non-GM)

---

### Create Event
**POST** `/api/gm/create-event`

Generate a custom game event (GM only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "title": "Wellington Earthquake",
  "description": "A magnitude 7.5 earthquake strikes Wellington...",
  "type": "natural_disaster",
  "affectedProvinces": ["prov_002"],
  "economicImpact": {
    "gdp": -15000,
    "infrastructure": -20
  },
  "reputationImpact": {
    "working_class": -10
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Event created successfully",
  "eventId": "event_015"
}
```

---

### Generate NPCs
**POST** `/api/gm/generate-npcs`

AI-generate NPC characters for the session (GM only).

**Request Body:**
```json
{
  "sessionId": "sess_001",
  "count": 5,
  "roles": ["merchant", "clergy", "farmer", "military", "politician"]
}
```

**Response (201 Created):**
```json
{
  "message": "NPCs generated successfully",
  "npcs": [
    {
      "id": "npc_001",
      "name": "Thomas McKenzie",
      "role": "merchant",
      "provinceId": "prov_001",
      "ideology": { "economic": 25, "social": -10 }
    }
  ]
}
```

---

### Set Player AP
**POST** `/api/gm/set-action-points`

Manually adjust player action points (GM only).

**Request Body:**
```json
{
  "playerId": "player_001",
  "actionPoints": 10
}
```

**Response (200 OK):**
```json
{
  "message": "Action points updated",
  "playerId": "player_001",
  "newActionPoints": 10
}
```

---

## Error Codes

### Standard HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions (e.g., non-GM accessing GM endpoints)
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side error

### Custom Error Responses

All error responses follow this format:

```json
{
  "error": "Error category",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error context"
  }
}
```

**Common Error Codes:**

- `INSUFFICIENT_AP` - Player lacks action points
- `INSUFFICIENT_FUNDS` - Player lacks money
- `UNAUTHORIZED_ACCESS` - Not authorized for this action
- `INVALID_OFFICE` - Player does not hold required office
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `ALREADY_VOTED` - Player already voted on this policy
- `SESSION_NOT_FOUND` - Game session doesn't exist
- `VALIDATION_ERROR` - Request body failed validation

---

## Rate Limiting

- **General endpoints:** 100 requests per minute per IP
- **Authentication endpoints:** 10 requests per minute per IP
- **GM endpoints:** 200 requests per minute (higher limit for turn processing)

---

## Pagination

Endpoints returning large lists support pagination:

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20
  }
}
```

---

## Versioning

API version is included in the base URL. Current version: **v1**

Future versions will use: `/api/v2/...`

---

## Support

For API questions or issues:
- **Documentation:** See `docs/` folder
- **GitHub Issues:** Report bugs and feature requests
- **Contact:** GM or development team

---

**Last Updated:** December 2025  
**Version:** 1.0.0
