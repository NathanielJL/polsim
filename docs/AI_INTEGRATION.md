# POLSIM - AI Integration Guide

## Overview

This document outlines how to integrate Claude AI with POLSIM for intelligent event generation, news article writing, and other AI-powered features.

---

## Integration Points

### 1. Event Description Generation
**Purpose**: Create narrative, contextual descriptions for procedurally generated events
**Frequency**: 1-3 times per turn
**Cost**: ~500 tokens per event

**System Prompt**:
```
You are generating events for a political economy simulation. Create vivid, 
realistic narratives that respond to the current game state.

Context provided:
- Current economic conditions (GDP, unemployment, inflation)
- Recent events and their outcomes
- Population sentiment
- Active government policies
- Recent news coverage

Generate an event description that:
1. Feels contextually appropriate
2. Creates interesting consequences
3. Suggests multiple possible outcomes
4. Fits the current political spectrum
```

**Example Request**:
```json
{
  "type": "economic",
  "severity": 6,
  "context": {
    "gdp_trend": "declining",
    "unemployment": 7.2,
    "recent_policy": "progressive_tax_increase",
    "population_mood": "anxious",
    "affected_groups": ["working_class", "middle_class"]
  },
  "request": "Generate a narrative event about labor disputes given the above context"
}
```

**Example Response**:
```
Event: "Labor Unrest Spreads"

Description: Following weeks of rising unemployment and the recent tax increase 
on high earners, worker unions have announced coordinated strikes across 
manufacturing sectors. Workers cite both job cuts and reduced purchasing power 
of lower wages. Major transportation hubs report slowdowns, threatening supply 
chains for market goods...

Likely Outcomes:
1. Transportation market prices spike (+10-15%)
2. Manufacturing sectors report losses
3. Left-archetype approval increases (+5-10 points)
4. Right-archetype approval decreases (-5-8 points)
5. Risk of escalation to general strike (20% probability)
```

---

### 2. News Article Generation
**Purpose**: Create believable news articles about events
**Frequency**: 1-3 articles per event
**Cost**: ~300 tokens per article
**Outlet Bias**: Critical—articles must match outlet ideology

**System Prompt**:
```
You are a news writer for [OUTLET_NAME], a [IDEOLOGY] political outlet.
Write a news article about the following event that reflects this outlet's 
typical coverage style and political perspective.

The article should:
1. Be 2-3 paragraphs
2. Include quotes (you may fabricate realistic quotes)
3. Reflect the outlet's bias without being obviously propaganda
4. Include factual details from the event
5. Suggest narrative causes/effects aligned with the outlet's ideology
6. Be compelling enough that players would want to read it

Outlet Profile:
- Name: [NAME]
- Political Leaning: [IDEOLOGY]
- Target Audience: [DEMOGRAPHIC]
- Known Style: [DESCRIPTORS]
```

**Example Request**:
```json
{
  "event": "Labor Unrest Spreads",
  "outlet": {
    "name": "Progressive Voice",
    "ideology": "left_moderate",
    "style": "pro-worker, reform-focused"
  },
  "request": "Write a news article from Progressive Voice about the labor unrest event"
}
```

**Example Response**:
```
"Worker Demands Fair Wages As Strikes Expand"

Workers across the manufacturing sector have begun coordinated strike action, 
citing insufficient wages and recent tax policies that place burden on working 
families while the wealthy continue to prosper. Union organizers report strong 
support, with workers demanding a living wage increase of 15%.

"This is about dignity and survival," said union spokesperson Maria Chen. 
"The current system isn't working for working families. We're producing wealth 
but not sharing in it fairly."

Economists warn that continued labor disputes could disrupt supply chains, 
potentially raising prices for consumers. Progressive advocates see this as an 
opportunity to pass stronger worker protections and wage floor increases.
```

---

### 3. Policy Consequence Analysis
**Purpose**: Determine realistic policy effects and event probabilities
**Frequency**: When policy is proposed
**Cost**: ~400 tokens
**Trigger**: Player proposes new policy

**System Prompt**:
```
Analyze the consequences of a proposed policy in a political economy simulation.

Policy Details:
- Title and description
- Political ideology
- Intended effects
- Affected markets/groups

Provide:
1. Numeric effects (GDP%, unemployment%, budget impact)
2. Group approval changes (by archetype and class)
3. Market impacts (which markets, how much)
4. Probability of triggering events (type and likelihood)
5. Unintended consequences
6. Timeline (immediate, delayed, permanent)

Format as structured data for game processing.
```

---

### 4. Population Response to Events
**Purpose**: Determine how different population groups react to events
**Frequency**: Per event, per group type
**Cost**: ~200 tokens
**Trigger**: After event is approved

**System Prompt**:
```
How would [ARCHETYPE] at [CLASS_LEVEL] likely respond to this event?

Event: [EVENT_DESCRIPTION]
Current Mood: [APPROVAL_SCORE]
Economic Situation: [CURRENT_CONDITIONS]

Provide:
1. Approval change (-25 to +25 points)
2. Narrative explanation
3. Predicted behavior (protest, celebration, indifference)
4. Likelihood they're persuaded by counter-narrative
```

---

### 5. NPC Political Behavior (Future)
**Purpose**: Give NPC politicians realistic decision-making
**Frequency**: Per vote
**Cost**: ~300 tokens
**Trigger**: NPC must vote on legislation

**System Prompt**:
```
You are [NPC_NAME], a [ARCHETYPE] politician.

Your background: [HISTORY]
Your voting record: [RECENT_VOTES]
Pressure from: [FACTIONS]
Current constituent mood: [APPROVAL]

A bill [TITLE] is being voted on. It [DESCRIPTION].

Considering your ideology, recent events, and constituent pressure, 
do you vote yes, no, or abstain? Provide your reasoning.
```

---

## Implementation Strategy

### Phase 1: Basic Event Descriptions
```typescript
// services/AIIntegration.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface EventGenerationRequest {
  type: string;
  severity: number;
  context: {
    gdp_trend: string;
    unemployment: number;
    recent_policy?: string;
    population_mood: number;
    affected_groups: string[];
  };
}

async function generateEventDescription(req: EventGenerationRequest): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: "You are a political economy simulation event generator...",
    messages: [
      {
        role: "user",
        content: `Generate an event of type '${req.type}' with severity ${req.severity} given this context: ${JSON.stringify(req.context)}`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}
```

### Phase 2: Outlet-Specific Articles
```typescript
interface NewsGenerationRequest {
  event_id: string;
  outlet_id: string;
  outlet_ideology: IdeologyPoint;
}

async function generateNewsArticle(req: NewsGenerationRequest): Promise<string> {
  const outlet = await getOutlet(req.outlet_id);
  const event = await getEvent(req.event_id);

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    system: `You write for ${outlet.name}, a ${ideologyToString(req.outlet_ideology)} 
             political outlet. Write a news article about the event in this outlet's style.`,
    messages: [
      {
        role: "user",
        content: `Event: ${event.title}\n\n${event.description}`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}
```

### Phase 3: Policy Analysis
```typescript
interface PolicyAnalysisRequest {
  title: string;
  description: string;
  ideology: IdeologyPoint;
  affected_markets: string[];
}

async function analyzePolicyConsequences(
  req: PolicyAnalysisRequest
): Promise<PolicyEffect> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    system: "You analyze policies in a political economy simulation...",
    messages: [
      {
        role: "user",
        content: `Policy: ${req.title}\n\nDescription: ${req.description}\n\nAnalyze the consequences as JSON.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  return JSON.parse(text);
}
```

---

## Cost Management

### Token Usage Estimates
- **Event description**: 400-600 tokens
- **News article**: 200-400 tokens
- **Policy analysis**: 600-1000 tokens
- **Population response**: 200-300 tokens
- **NPC behavior**: 400-600 tokens

### Monthly Budget Example (100 players, 30 turns)
- Events: 30 × 2 events × 500 tokens = 30,000 tokens
- News: 60 events × 2 articles × 300 tokens = 36,000 tokens
- Policy: ~10 proposals × 800 tokens = 8,000 tokens
- Population: 60 events × 9 groups × 250 tokens = 135,000 tokens
- **Total: ~210,000 tokens (~$6.30 @ $0.03/1K tokens)**

### Cost Reduction Strategies
1. **Cache results** (same event type, different outlet)
2. **Batch requests** (daily processing instead of real-time)
3. **Template fallback** (use cached responses for similar scenarios)
4. **Simplified models** (use Claude 3.5 Haiku for simpler tasks)
5. **Lazy generation** (generate articles only if players read news)

---

## Caching Strategy

```typescript
interface CachedResponse {
  type: "event" | "article" | "policy";
  input_hash: string;
  output: string;
  created_at: Date;
  expires_at: Date;
  cost_tokens: number;
}

async function generateWithCache(
  type: string,
  input: object
): Promise<string> {
  const hash = md5(JSON.stringify(input));
  const cached = await db.cache.findOne({ type, input_hash: hash });

  if (cached && !cached.expires_at.isAfter(now())) {
    return cached.output;
  }

  // Generate fresh
  const output = await generateAI(type, input);

  // Cache for 24 hours
  await db.cache.create({
    type,
    input_hash: hash,
    output,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    cost_tokens: estimateTokens(output),
  });

  return output;
}
```

---

## Error Handling

```typescript
// Handle AI failures gracefully
async function safeGenerateEvent(req: EventGenerationRequest): Promise<Event> {
  try {
    const description = await generateEventDescription(req);

    return {
      // ... event data
      description,
      ai_generated: true,
    };
  } catch (error) {
    console.error("AI generation failed:", error);

    // Fallback to templated description
    return {
      // ... event data
      description: getTemplatedDescription(req.type, req.severity),
      ai_generated: false,
    };
  }
}
```

---

## Environment Setup

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-20241022
AI_GENERATION_ENABLED=true
AI_BATCH_MODE=true  # Process during maintenance window
AI_CACHE_TTL=86400  # 24 hours
```

---

## Monitoring & Optimization

```typescript
interface AIMetrics {
  total_calls: number;
  total_tokens_used: number;
  cache_hit_rate: number;
  avg_response_time: number;
  error_rate: number;
  cost_usd: number;
}

async function trackAIUsage(event: string, tokens_used: number) {
  await db.ai_metrics.updateOne({}, {
    $inc: { total_calls: 1, total_tokens_used: tokens_used },
    $set: { last_updated: new Date() }
  });
}
```

---

## Future Enhancements

1. **Fine-tuning**: Train Claude on POLSIM-specific event patterns
2. **Multi-modal**: Use images for historical political figures
3. **Vision**: Analyze generated maps/charts for narrative context
4. **Custom Models**: Build smaller specialized models for frequent tasks
5. **Streaming**: Stream long article generation for real-time display

---

## Recommended Reading

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Claude Models](https://docs.anthropic.com/en/docs/about-claude/models/latest)
- [Token Counting](https://docs.anthropic.com/en/docs/build-a-chatbot)
- [Prompt Engineering](https://docs.anthropic.com/en/docs/build-a-chatbot)

---

## Support & Feedback

For questions about AI integration:
1. Review this document
2. Check Anthropic documentation
3. Test in sandbox first
4. Monitor costs in production
5. Iterate based on player feedback
