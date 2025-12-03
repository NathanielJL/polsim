/**
 * Claude AI Integration Service
 * Handles all AI-powered game features:
 * - Event generation & description
 * - News article writing
 * - Policy consequence analysis
 * - Population response simulation
 * - Political archetype evolution analysis
 */

import Anthropic from "@anthropic-ai/sdk";
import { Event, Policy, PopulationGroup, IdeologyPoint } from "../models/types";

const client = new Anthropic();

// ===== CONFIGURATION =====
const CONFIG = {
  MODEL: "claude-3-5-sonnet-20241022",
  MAX_TOKENS: 2048,
  CACHE_TTL: 86400000, // 24 hours
};

// Simple in-memory cache (replace with Redis in production)
const cache = new Map<string, { value: any; expiresAt: number }>();

// ===== CACHE HELPERS =====
function cacheKey(...parts: string[]): string {
  return parts.join("|");
}

function getCached(key: string): any {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }
  cache.delete(key);
  return null;
}

function setCached(key: string, value: any): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CONFIG.CACHE_TTL,
  });
}

// ===== EVENT GENERATION =====
/**
 * Generate narrative descriptions for events based on context
 */
export async function generateEventDescription(
  event: Partial<Event>,
  context: {
    gdpTrend: string;
    unemployment: number;
    populationMood: number;
    recentPolicies: string[];
    recentEvents: string[];
  }
): Promise<string> {
  const cacheK = cacheKey("event-desc", event.type || "", JSON.stringify(context));
  const cached = getCached(cacheK);
  if (cached) return cached;

  const prompt = `You are generating an event description for a political economy simulation.

Event Type: ${event.type}
Severity: ${event.severity}/10

Current Context:
- GDP Trend: ${context.gdpTrend}
- Unemployment: ${context.unemployment}%
- Population Mood: ${context.populationMood > 0 ? "Optimistic" : "Pessimistic"}
- Recent Policies: ${context.recentPolicies.join(", ") || "None"}
- Recent Events: ${context.recentEvents.join(", ") || "None"}

Create a vivid, realistic narrative description (2-3 paragraphs) that:
1. Feels contextually appropriate
2. Has clear consequences
3. Creates multiple possible outcomes
4. Fits the current political climate

Description:`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const description =
    message.content[0].type === "text" ? message.content[0].text : "";
  setCached(cacheK, description);
  return description;
}

// ===== NEWS ARTICLE GENERATION =====
/**
 * Generate news articles with outlet-specific bias
 */
export async function generateNewsArticle(
  eventTitle: string,
  eventDescription: string,
  outletName: string,
  outletIdeology: IdeologyPoint
): Promise<string> {
  const cacheK = cacheKey("article", outletName, eventTitle);
  const cached = getCached(cacheK);
  if (cached) return cached;

  const ideologyString =
    outletIdeology.economic > 0
      ? "right-wing"
      : outletIdeology.economic < 0
        ? "left-wing"
        : "centrist";

  const prompt = `You are a news writer for ${outletName}, a ${ideologyString} political outlet.

Write a 2-3 paragraph news article about the following event that reflects this outlet's typical coverage style and political perspective.

Event: ${eventTitle}
Description: ${eventDescription}

The article should:
1. Include a headline and body text
2. Reflect the outlet's ideological bias (subtly, not obviously propaganda)
3. Include plausible quotes (you may create realistic quotes)
4. Suggest causes/effects that align with the outlet's ideology
5. Be compelling enough readers would want to read it

Article:`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const article =
    message.content[0].type === "text" ? message.content[0].text : "";
  setCached(cacheK, article);
  return article;
}

// ===== POLICY CONSEQUENCE ANALYSIS =====
/**
 * Analyze realistic effects of a proposed policy
 */
export async function analyzePolicyConsequences(
  policy: Policy
): Promise<{
  gdpEffect: number;
  unemploymentEffect: number;
  budgetEffect: number;
  approvalByGroup: Record<string, number>;
  eventTriggerRisk: number;
  unintendedConsequences: string[];
}> {
  const prompt = `Analyze the consequences of this proposed policy for a political economy simulation.

Policy: ${policy.title}
Description: ${policy.description}
Political Alignment: Economic ${policy.ideology.economic}, Social ${policy.ideology.social}, Personal ${policy.ideology.personal}

Provide analysis in JSON format:
{
  "gdpEffect": <-30 to +30, percentage point change>,
  "unemploymentEffect": <-5 to +5, percentage point change>,
  "budgetEffect": <-50 to +50, percentage>,
  "approvalByGroup": {
    "AuthRight": <-25 to +25>,
    "RightModerate": <-25 to +25>,
    "Centrist": <-25 to +25>,
    "LeftModerate": <-25 to +25>,
    "LibLeft": <-25 to +25>
  },
  "eventTriggerRisk": <0-100, probability>,
  "unintendedConsequences": [<list of 2-3 realistic unintended effects>]
}`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "{}";

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse policy analysis");
  }

  return JSON.parse(jsonMatch[0]);
}

// ===== POPULATION RESPONSE SIMULATION =====
/**
 * Determine how a specific group responds to an event
 */
export async function predictGroupResponse(
  group: PopulationGroup,
  eventDescription: string,
  eventType: string
): Promise<{
  approvalChange: number;
  willProtest: boolean;
  willCelebrate: boolean;
  willIgnore: boolean;
  likelyToBePersuaded: boolean;
  narrativeExplanation: string;
}> {
  const prompt = `You are predicting how a population group responds to an event.

Group: ${group.archetype} (Class ${group.classLevel})
Current Approval: ${group.approval}
Employment Rate: ${group.employed}%

Event Type: ${eventType}
Event: ${eventDescription}

Predict their response in JSON format:
{
  "approvalChange": <-25 to +25>,
  "willProtest": <boolean>,
  "willCelebrate": <boolean>,
  "willIgnore": <boolean>,
  "likelyToBePersuaded": <boolean>,
  "narrativeExplanation": "<short explanation of response>"
}`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse group response");
  }

  return JSON.parse(jsonMatch[0]);
}

// ===== ARCHETYPE EVOLUTION ANALYSIS =====
/**
 * Analyze population for emerging ideological clusters
 */
export async function analyzeArchetypeEvolution(
  populationState: {
    groups: PopulationGroup[];
    recentEvents: string[];
    activePolicies: string[];
    gdp: number;
    unemployment: number;
  },
  currentTurn: number
): Promise<{
  emergingClusters: Array<{
    name: string;
    ideology: IdeologyPoint;
    predictedSize: number;
    growthReason: string;
    willReachOfficial: boolean;
    turnsUntilOfficial: number;
  }>;
  radicalizationRisks: Array<{
    archetype: string;
    risk: number;
    reason: string;
  }>;
  mergePredictions: Array<{
    source: string;
    target: string;
    probability: number;
  }>;
  summary: string;
}> {
  const groupsSummary = populationState.groups
    .map((g) => `${g.archetype}: ${g.size}% (approval: ${g.approval})`)
    .join("\n");

  const prompt = `Analyze the political evolution of a simulated population.

Current Population Distribution (Turn ${currentTurn}):
${groupsSummary}

Recent Events: ${populationState.recentEvents.join(", ")}
Active Policies: ${populationState.activePolicies.join(", ")}
GDP: ${populationState.gdp}
Unemployment: ${populationState.unemployment}%

Analyze in JSON format:
{
  "emergingClusters": [
    {
      "name": "<new archetype name>",
      "ideology": {"economic": <-100-100>, "social": <-100-100>, "personal": <-100-100>},
      "predictedSize": <0-100>,
      "growthReason": "<why this cluster is forming>",
      "willReachOfficial": <boolean>,
      "turnsUntilOfficial": <5-20>
    }
  ],
  "radicalizationRisks": [
    {
      "archetype": "<name>",
      "risk": <0-100>,
      "reason": "<why this group might radicalize>"
    }
  ],
  "mergePredictions": [
    {
      "source": "<archetype>",
      "target": "<archetype>",
      "probability": <0-1>
    }
  ],
  "summary": "<2-3 sentence summary of political trajectory>"
}`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse archetype evolution");
  }

  return JSON.parse(jsonMatch[0]);
}

// ===== GAME MASTER INSTRUCTION PROCESSING =====
/**
 * Process natural language instructions from GMs
 */
export async function processGMInstruction(
  instruction: string,
  context: string,
  currentGameState: any
): Promise<{
  understanding: string;
  suggestedActions: string[];
  estimatedImpact: string;
  requiresApproval: boolean;
}> {
  const prompt = `You are helping a Game Master manage a political economy simulation.

GM Instruction: "${instruction}"

Context: ${context}

Current Game State:
- Turn: ${currentGameState.currentTurn}
- GDP: ${currentGameState.gdp}
- Unemployment: ${currentGameState.unemployment}%
- Population Mood: ${currentGameState.populationMood}

Analyze in JSON format:
{
  "understanding": "<what the GM wants to achieve>",
  "suggestedActions": [<list of specific game actions to execute>],
  "estimatedImpact": "<predicted effect on game state>",
  "requiresApproval": <boolean, true if it's a major change>
}`;

  const message = await client.messages.create({
    model: CONFIG.MODEL,
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to parse GM instruction");
  }

  return JSON.parse(jsonMatch[0]);
}

// ===== UTILITY: CLEAR CACHE =====
export function clearCache(): void {
  cache.clear();
}

// ===== UTILITY: GET CACHE STATS =====
export function getCacheStats() {
  return {
    cacheSize: cache.size,
    memorySafe: cache.size < 10000,
  };
}
