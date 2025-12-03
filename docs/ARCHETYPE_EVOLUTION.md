# POLSIM - Design Review Document

## Core Vision
A passive-accessible, AI-driven political economy sandbox where players influence populations through policy, media, and business decisions. The world responds organically—population biases shift, markets crash, revolutions occur—based on accumulated player actions and AI-generated events.

---

## 1. POLITICAL IDEOLOGY SYSTEM (Expandable)

### Current Architecture: 3D Spectrum + Dynamic Evolution

**Three Continuous Axes (Each -100 to +100):**
```
Economic Axis:
  -100 (Socialist/Collectivist) ↔ 0 (Mixed) ↔ +100 (Capitalist/Free Market)

Social Axis:
  -100 (Liberal/Progressive) ↔ 0 (Moderate) ↔ +100 (Conservative/Traditional)

Personal Freedom Axis:
  -100 (Restrictive/Authoritarian) ↔ 0 (Mixed) ↔ +100 (Libertarian/Free)
```

### Base Archetypes (9 Starting Groups)
These are *distribution centers*, not hard boundaries:
1. **Authoritarian Right**: Economic +70, Social +70, Personal -80
2. **Libertarian Right**: Economic +80, Social 0, Personal +80
3. **Libertarian Left**: Economic -80, Social -80, Personal +80
4. **Communist**: Economic -100, Social -70, Personal -20
5. **Centrist**: Economic 0, Social 0, Personal 0
6. **Right Moderate**: Economic +40, Social +20, Personal 0
7. **Left Moderate**: Economic -40, Social -20, Personal 0
8. **Libertarian Moderate**: Economic 0, Social -50, Personal +70
9. **Authoritarian Moderate**: Economic 0, Social +50, Personal -40

### Dynamically Emerging Archetypes
As the game progresses, **new ideological clusters** can form:

**Example: "Fascism" Emerges**
```
Condition: High unemployment + foreign threat + media pushing nationalism
AI Recognition: "I see a cluster forming near Economic +60, Social +95, Personal -95"
Population Effect: Some AuthRight + some Right Moderate → shift toward extreme social conservatism
Result: New "Fascist" archetype (maybe 3-8% of population) with distinct policies/preferences
```

**Example: "Anarchism" Emerges**
```
Condition: Strong libertarian movement + market instability
Result: "Anarchist" cluster (Economic -80, Social -70, Personal +95)
Preference: Anti-government policies, direct action, decentralization
```

**Example: "Techno-Libertarian" Emerges**
```
Condition: Tech boom + libertarian politics
Result: New tech-forward libertarian subset
Preference: Deregulation, innovation, tech sector support
```

---

## 2. HOW ARCHETYPES EVOLVE - AI-DRIVEN MECHANICS

### System Architecture

**Step 1: Population Data Collection**
Each turn, the system tracks:
- Individual player approval scores by group
- Economic conditions (GDP, unemployment, inflation)
- Recent major events
- Active policies
- Media coverage/sentiment
- Population mood overall

**Step 2: Clustering Analysis (AI)**
Using Claude, the system analyzes population distribution:

```python
# Pseudo-code for AI analysis
AI_PROMPT = """
Current population distribution (showing real coordinates, not names):
- Cluster A: 8% at (econ: +75, social: +70, personal: -75) - called "AuthRight"
- Cluster B: 6% at (econ: -70, social: -60, personal: +80) - called "LibLeft"
- 18% distributed between clusters
- Large amorphous center: 40% around (0, 0, 0)

Recent events:
- Market crash (GDP -15%)
- Foreign military incident
- Populist media campaign

Question: Are new ideological clusters forming? Where?
"""

# Claude responds with something like:
"""
ANALYSIS:
1. AuthRight cluster is CONSOLIDATING - gaining followers from center
   Reason: Foreign threat + economic anxiety favors strong nationalism
   Predicted movement: +2-3% over next 3 turns
   
2. NEW CLUSTER FORMING at (econ: +50, social: +90, personal: -85)
   Name: "Nationalist-Authoritarian" 
   Size: ~2-3% currently
   Momentum: GROWING (media amplifying anti-immigrant sentiment)
   Prediction: Could reach 5-8% if foreign tensions escalate
   
3. LibLeft holds stable but internal fragmentation possible
   Nascent split between: 
   - Anarchist-left (econ: -100, social: -70, personal: +95)
   - Democratic-socialist (econ: -70, social: -40, personal: +20)
"""
```

**Step 3: Dynamic Group Creation**
When a new cluster reaches **2-3% of population**, the system can:
- Create a new "archetype"
- Give it specific policy preferences
- Assign distinct appearance/identity
- Trigger events that appeal to it
- Allow politicians to campaign to it

**Step 4: Continuous Evolution**
Each turn, existing clusters can:
- **Grow/shrink** based on events and policies
- **Merge** (libertarians + right-wing join against centralization)
- **Split** (socialists divide on authoritarianism)
- **Migrate** (move along ideology spectrum gradually)
- **Polarize** (move toward extremes during crises)
- **Radicalize** (shift toward adjacent extreme)

### The Math Behind It

**Approval Shift for a Group:**
```
new_approval = old_approval 
             + event_impact        (-25 to +25 based on alignment)
             + media_impact        (-20 to +20 based on coverage)
             + economic_impact     (-15 to +15 based on class/policy)
             + policy_alignment    (-10 to +10 per active policy)
             + gradual_drift       (-2 to +2 toward center per turn)
```

**Cluster Detection:**
The AI looks for populations that:
1. Share high approval on similar policies
2. Respond predictably to events
3. Have distinct media preferences
4. Form geographic/temporal patterns
5. Achieve a minimum 2% threshold

**When Cluster is "Real" (becomes official archetype):**
- Appears on player's Reputation breakdown
- Gets its own name/identity
- Shows on the political spectrum visualization
- Becomes targetable by campaigns
- Can form their own faction (future)

---

## 3. EXAMPLE PROGRESSION - HOW FASCISM EMERGES

### Turn 1-5: Setup
- Baseline: AuthRight = 8%, Right Moderate = 20%
- Foreign military incident triggers
- Market drops 10%
- Unemployment rises to 8%

### Turn 6-10: AI Detection
**Claude analyzes:**
"I see strong drift from Right Moderate and AuthRight toward extreme social/economic conservatism. 
Media outlets are amplifying nationalist messaging. This looks like precursor to fascism."

**System creates "Nationalist" cluster:**
- Size: 1% (split from AuthRight)
- Identity: "Nationalist-Authoritarian"
- Preferences: Strong borders, nationalism, order, authority

### Turn 11-20: Growth Phase
- If players/policies reinforce nationalism: cluster grows
- If centrist voices dominate: cluster stagnates
- Each turn, ~0.2-0.5% of population can shift toward it

**Events that accelerate growth:**
- Foreign conflict escalates (triggers "Invasion Scare")
- Terrorist attack (triggers "Security Crackdown")
- Immigrant population surge (triggers "Cultural Shift")
- Economic recovery fails (triggers "False Hope")

**Media effect:**
If conservative outlets run nationalist stories:
- "Fascist" approval +5 per article
- Other groups' approval -2 per article
- Creates political polarization

### Turn 21-40: Stabilization or Collapse
**If it reaches 8-12%:**
- Becomes major political force
- Can propose policies (authoritarian, nationalist)
- Gets elected officials
- Triggers centrist backlash (new "Anti-Fascist" coalition?)

**If it plateaus at 2-3%:**
- Remains fringe movement
- Still affects politics (kingmaker in close votes)
- Can trigger violent events if frustrated

**If it decays below 1%:**
- Absorbed back into AuthRight
- Historic record: "briefly emerged 2045"

---

## 4. OTHER EMERGING ARCHETYPES

### Anarchism
```
Trigger: Tech boom + severe economic inequality + libertarian growth
Characteristics: Economic -90, Social -70, Personal +100 (extreme)
Growth conditions: Government failure + mutual aid success + anti-police sentiment
Decline conditions: Government provides stability + state violence crackdown
```

### Techno-Libertarian
```
Trigger: Major technological breakthrough + crypto adoption
Characteristics: Economic +85, Social -20, Personal +90
Special: Unique policy preferences (deregulation, innovation incentives)
Media: Tech outlets amplify, traditional media dismisses
```

### Green-Socialist
```
Trigger: Climate crisis event + socialist media growth
Characteristics: Economic -70, Social -60, Personal +20
Growth: Climate disasters + youth mobilization
Decline: Climate policy success
```

### Neo-Conservative
```
Trigger: Security threat + cultural backlash
Characteristics: Economic +50, Social +85, Personal -60
Mix of: Economic moderate + social conservative + authoritarian
```

### Radical Centrist
```
Trigger: Polarization exhaustion + pragmatic media growth
Characteristics: Economic 0±10, Social 0±10, Personal 0±10
Growth: When left/right grow too extreme (votes move to center)
Decline: When center successfully implements policy
```

---

## 5. AI ROLE IN ARCHETYPE EVOLUTION

### What Claude Does Each Turn:

**Morning Brief (0.5 turn):**
- Analyze population distribution
- Identify forming clusters
- Detect radical shifts
- Suggest emerging archetypes
- Flag polarization risks

**Event Generation:**
- "Given population sentiment, what events are likely?"
- Suggest events that would resonate with emerging groups
- Balance: don't create too-favorable conditions for any one archetype

**Media Generation:**
- Different outlets emphasize different archetype narratives
- Pro-nationalist outlets: run fascism-supporting stories
- Progressive outlets: run anti-fascism stories
- Feeds back into population opinion

**Consequence Analysis:**
- "If this policy passes, which groups win/lose?"
- "What's the multi-turn ripple effect?"
- "Could this spark a revolution?"

**Population Response Simulation:**
```
Policy: "Close borders, increase military spending"
Claude simulates:
- AuthRight: +15 approval (perfect fit)
- Nationalist (new): +20 approval (core issue)
- Right Moderate: +8 approval (mostly align)
- Centrist: -3 approval (concerned)
- Left Moderate: -12 approval (opposed)
- LibLeft: -25 approval (strongly opposed)
- Anarchist (if exists): -30 approval (anti-state)
Result: Population becomes more polarized, fascist cluster grows
```

---

## 6. GAMEPLAY IMPLICATIONS

### For Players
- **Dynamic Political Landscape**: Can't rely on static 9 archetypes
- **New Opportunities**: Emerging archetypes = new voting blocs to appeal to
- **Risk/Reward**: Supporting extreme ideologies early is risky but can pay off
- **Long-term Strategy**: Building a coalition now might be split by new archetype tomorrow

### For Game Balance
- **AI prevents monoculture**: Can't just max one ideology
- **Emergent complexity**: Population never settles (organic)
- **Storytelling**: "Fascism emerged, then declined" is a narrative
- **Tension**: Creates natural conflict without scripting

### For GMs
- **Monitoring**: GMs can see which clusters are forming
- **Intervention**: Can nudge via events if imbalanced
- **Narrative**: Can explain emergent ideologies to players
- **Prediction**: Know which archetypes are at risk of radicalization

---

## 7. TECHNICAL IMPLEMENTATION

### Database
```
PopulationGroup {
  id: string
  name: string                    // "AuthRight", "Nationalist", "Anarchist"
  ideology: IdeologyPoint         // (econ, social, personal) coordinates
  size: number                    // 0-100 (percent of population)
  approval: number                // -100 to +100
  is_official: boolean            // Official archetype vs temporary cluster
  created_turn: number            // When it emerged
  last_updated: number
  
  // Optional: for emergent archetypes
  parent_archetypes: string[]     // Which groups it split from
  merge_targets: string[]         // Could merge into these
  stability: number               // How likely to collapse vs grow
}
```

### AI Query Pattern
```typescript
async function analyzePopulationEvolution(turn: number): Promise<ArchetypeAnalysis> {
  const population = await db.getPopulationState(turn);
  const events = await db.getRecentEvents(turn - 5, turn);
  const policies = await db.getActivePolicies(turn);
  
  const analysis = await claude.messages.create({
    system: "You are analyzing population ideology evolution...",
    messages: [{
      role: "user",
      content: `
        Current population clusters (by ideology coordinates):
        ${formatPopulation(population)}
        
        Recent events:
        ${formatEvents(events)}
        
        Active policies:
        ${formatPolicies(policies)}
        
        Questions:
        1. What ideological clusters are forming?
        2. Which could become "official" archetypes in 5-10 turns?
        3. What events would accelerate or prevent each?
        4. Are any archetypes at risk of splintering?
        5. What's the political mood trajectory?
      `
    }]
  });
  
  return parseAnalysis(analysis);
}
```

### Each Turn Processing
```typescript
async function processTurn(turnNumber: number) {
  // Every 3-5 turns
  if (turnNumber % 5 === 0) {
    const evolution = await analyzePopulationEvolution(turnNumber);
    
    // Create new archetypes if clusters are large enough
    for (const cluster of evolution.emerging_clusters) {
      if (cluster.size > 2.5) {
        await createNewArchetype(cluster);
      }
    }
    
    // Merge archetypes if they overlap
    const merges = evolution.suggested_merges;
    for (const merge of merges) {
      await mergeArchetypes(merge.source, merge.target);
    }
  }
  
  // Every turn: update sizes and approval
  for (const group of evolution.population_updates) {
    await updatePopulationGroup(group);
  }
}
```

---

## 8. DESIGN QUESTIONS FOR YOU

1. **Emergence Speed**: Should new archetypes appear every 10 turns, 50 turns, or organically based on conditions?

2. **Limits**: Should there be a max number of archetypes (15? 20? unlimited)?

3. **Extremism**: Should extreme ideologies (fascism, anarchism) require "hard conditions" to emerge, or just natural probability?

4. **Gameplay**: Should players be able to deliberately *create* new archetypes (mass media campaigns), or only emerge naturally?

5. **Visualization**: How should players see emerging clusters? 
   - Scatter plot of the 3D spectrum?
   - List view with growth trends?
   - Network graph showing splits/merges?

6. **Prediction**: Should AI tell GMs "Fascism will likely form in 5 turns if conditions continue"?

7. **Collapse**: Can archetypes go extinct? Or do they just shrink to <1%?

8. **Historical Memory**: Should game track all archetypes ever created for "history view"?

---

## Summary: What This Enables

✅ **Organic political evolution** - population naturally radicalizes/moderates
✅ **Endless variety** - not just 9 fixed groups forever
✅ **Player emergent gameplay** - supporting fringe movements could pay off later
✅ **AI coherence** - events/media feel responsive to actual population state
✅ **Realism** - mirrors how real political movements emerge
✅ **Long campaign narratives** - "the rise and fall of the Nationalist party"
✅ **Hard balancing** - players must watch for dangerous concentrations
✅ **GM storytelling** - "this is when democracy broke down" becomes emergent

---

**Ready to implement? Or refinement questions first?**
