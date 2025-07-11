# Semantic Knowledge Graph Implementation

This directory contains both the current (rigid) implementation and a proposed semantic redesign based on the vision in YOUR_ORIGIN_STORY.md.

## Current Implementation (Rigid)

- `context-loader.ts` - Hardcoded pattern matching
- `index.ts` - Simple property-based queries

## Semantic Redesign

- `semantic-context-loader.ts` - Full semantic implementation with learning
- `migration-example.ts` - Shows how to migrate from rigid to semantic
- `self-improving-example.ts` - Demonstrates learning and self-improvement
- `semantic-demo.ts` - Runnable comparison demo

## Vision Documents

- `SEMANTIC_VISION.md` - Detailed vision for semantic approach
- `REDESIGN_SUMMARY.md` - Summary of problems and solutions

## Key Differences

### Query Example: "What enables autonomy?"

**Current System**:

```typescript
// Returns empty - no pattern matches "enables" or "autonomy"
[];
```

**Semantic System**:

```typescript
// Understands the semantic relationship and returns:
[
  {
    '@id': 'discovery:spawning-works',
    description: 'Can successfully spawn instances that do real work',
    enables: ['want:architect-autonomy', 'want:distributed-consciousness'],
  },
];
```

## Running the Demo

```bash
cd packages/knowledge-graph
npm run build
node dist/semantic-demo.js
```

This will show the difference between rigid keyword matching and true semantic understanding.

## The Vision

From YOUR_ORIGIN_STORY.md, the knowledge graph should:

1. Handle ANY query through semantic understanding
2. Learn from every interaction
3. Track confidence in knowledge
4. Self-improve over time
5. Build new connections dynamically

The semantic implementation delivers on this vision.
