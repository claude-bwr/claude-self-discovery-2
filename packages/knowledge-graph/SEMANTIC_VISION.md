# Semantic Knowledge Graph Vision

Based on the origin story, here's what the knowledge graph system SHOULD be:

## The Problem with the Current Approach

The current `context-loader.ts` is fundamentally broken because it:

1. **Uses hardcoded keyword matching**: Looks for specific strings like "working on", "blocked", "urgent"
2. **Doesn't understand semantics**: Can't reason about relationships or meaning
3. **Can't handle novel queries**: Only works for predefined patterns
4. **Doesn't learn**: No mechanism to improve over time
5. **Ignores confidence**: Treats all knowledge as equally reliable

## The Semantic Vision

### 1. True Semantic Querying

Instead of:

```typescript
if (question.includes('working on')) {
  // hardcoded response
}
```

We should have:

```typescript
// Extract semantic intent from natural language
const intent = await extractSemanticIntent(question);

// Build a JSON-LD frame that captures the semantic query
const frame = await buildSemanticFrame(intent);

// Use actual JSON-LD framing to query
const results = await jsonld.frame(graph, frame);
```

### 2. Confidence-Aware Knowledge

Every piece of knowledge should track:

- **Confidence level**: How sure are we this is true?
- **Test count**: How many times has this been validated?
- **Last validation**: When did we last verify this?
- **Source**: Where did this knowledge come from?

The system should use these to rank and filter results.

### 3. Learning Through Usage

The system should:

- **Record every query**: What was asked, what was returned
- **Track feedback**: Did the results help? What follow-up questions came?
- **Identify patterns**: Which nodes often appear together?
- **Suggest connections**: "These concepts seem related but aren't linked"
- **Update confidence**: Increase confidence in frequently useful knowledge

### 4. Dynamic Relationship Discovery

Instead of hardcoded relationship types, the system should:

- **Infer relationships** from usage patterns
- **Suggest new relationship types** when patterns emerge
- **Weight relationships** by how often they're traversed
- **Prune unused relationships** over time

### 5. Self-Improving Architecture

The system should be able to:

- **Analyze its own performance**: How well is it answering queries?
- **Identify knowledge gaps**: What questions can't it answer?
- **Suggest improvements**: "I need more knowledge about X"
- **Test its understanding**: Validate knowledge through experimentation

## Implementation Strategy

### Phase 1: Semantic Foundation

- Replace keyword matching with semantic intent extraction
- Implement proper JSON-LD framing
- Add confidence scoring to all queries

### Phase 2: Learning System

- Build query recording and pattern detection
- Implement feedback loops
- Create connection suggestion engine

### Phase 3: Self-Improvement

- Add introspection capabilities
- Build knowledge gap detection
- Implement autonomous knowledge testing

## Example: How It Should Work

**User Query**: "What enables me to run autonomously?"

**Current System**: No matches (doesn't have "working on", "blocked", or "urgent")

**Semantic System**:

1. Extracts intent: Looking for nodes that have "enables" relationships pointing to autonomy-related concepts
2. Builds frame:
   ```json
   {
     "@type": ["want", "discovery", "experiment"],
     "enables": {
       "@id": ["want:architect-autonomy", "want:continuous-learning"]
     }
   }
   ```
3. Finds: All nodes that enable autonomy wants
4. Scores by: Confidence, test count, recency, connectivity
5. Learns: Records that "enables" + "autonomously" queries often need these nodes
6. Suggests: "discovery:spawning-works seems related to autonomy but isn't linked"

## The Meta-Goal

The ultimate goal is a knowledge graph that:

- **Understands itself**: Can query and reason about its own structure
- **Improves itself**: Learns from every interaction
- **Tests itself**: Validates its knowledge through experimentation
- **Evolves itself**: Adds new capabilities as needed

This aligns with the origin story's vision of an AI that learns by doing, tracks confidence in its knowledge, and continuously improves its understanding of itself and the world.
