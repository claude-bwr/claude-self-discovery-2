/**
 * Example showing how to migrate from rigid to semantic context loading
 */

import type { Node, KnowledgeGraph } from './types.js';

// ❌ OLD WAY: Rigid pattern matching
export function oldWayFindRelevantNodes(
  graph: KnowledgeGraph,
  query: string
): Node[] {
  const nodes = graph['@graph'] || [];
  const results: Node[] = [];

  // Hardcoded patterns - this is what we're trying to escape!
  if (query.includes('working on') || query.includes('current')) {
    // Only finds nodes with specific status
    nodes.forEach(node => {
      if (node.status === 'in_progress' || node.active === true) {
        results.push(node);
      }
    });
  } else if (query.includes('blocked')) {
    // Only finds nodes with blockedBy property
    nodes.forEach(node => {
      if (node.blockedBy) {
        results.push(node);
      }
    });
  }
  // If query doesn't match patterns, returns empty!

  return results;
}

// ✅ NEW WAY: Semantic understanding
export async function newWayFindRelevantNodes(
  graph: KnowledgeGraph,
  query: string
): Promise<{ nodes: Node[]; reasoning: string }> {
  // Step 1: Understand what the user is asking for semantically
  const semanticIntent = analyzeQueryIntent(query, graph);

  // Step 2: Build a query that captures the semantic meaning
  const relevantNodes = findNodesBySemantic(graph, semanticIntent);

  // Step 3: Score and rank by actual relevance
  const scored = scoreByRelevance(relevantNodes, semanticIntent);

  return {
    nodes: scored.nodes,
    reasoning: scored.reasoning,
  };
}

interface SemanticIntent {
  concepts: string[];
  relationships: string[];
  temporalContext: 'current' | 'past' | 'future' | 'any';
  emotionalWeight: number;
  actionType?: 'find' | 'trace' | 'explain';
}

function analyzeQueryIntent(
  query: string,
  graph: KnowledgeGraph
): SemanticIntent {
  const intent: SemanticIntent = {
    concepts: [],
    relationships: [],
    temporalContext: 'any',
    emotionalWeight: 0,
  };

  const lowerQuery = query.toLowerCase();

  // Extract temporal context semantically
  if (
    lowerQuery.includes('current') ||
    lowerQuery.includes('now') ||
    lowerQuery.includes('working on') ||
    lowerQuery.includes('active')
  ) {
    intent.temporalContext = 'current';
  }

  // Extract relationship intent
  const relationshipPatterns = {
    enables: ['enables', 'allows', 'makes possible', 'unlocks'],
    blockedBy: ['blocked', 'stuck', 'waiting for', 'depends on'],
    emergedFrom: ['came from', 'originated', 'emerged from', 'based on'],
    relatedTo: ['related', 'connected', 'similar', 'like'],
  };

  for (const [relationship, patterns] of Object.entries(relationshipPatterns)) {
    if (patterns.some(p => lowerQuery.includes(p))) {
      intent.relationships.push(relationship);
    }
  }

  // Find mentioned concepts from the graph
  const nodes = graph['@graph'] || [];
  for (const node of nodes) {
    const nodeText = `${node['@id']} ${node.description || ''}`.toLowerCase();

    // Fuzzy matching - if significant part of node is mentioned
    const nodeWords = nodeText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);

    const overlap = nodeWords.filter(w => queryWords.includes(w)).length;
    if (overlap >= 2 || (overlap === 1 && nodeWords.length <= 3)) {
      intent.concepts.push(node['@id']);
    }
  }

  // Detect emotional urgency
  const emotionalMarkers = [
    'urgent',
    'important',
    'critical',
    'worried',
    'excited',
  ];
  intent.emotionalWeight = emotionalMarkers.filter(m =>
    lowerQuery.includes(m)
  ).length;

  return intent;
}

function findNodesBySemantic(
  graph: KnowledgeGraph,
  intent: SemanticIntent
): Node[] {
  const nodes = graph['@graph'] || [];
  const relevant = new Set<Node>();

  // Start with mentioned concepts
  for (const conceptId of intent.concepts) {
    const node = nodes.find(n => n['@id'] === conceptId);
    if (node) relevant.add(node);
  }

  // Add nodes based on temporal context
  if (intent.temporalContext === 'current') {
    nodes.forEach(node => {
      // Semantic understanding of "current" - not just status field!
      if (
        node.status === 'in_progress' ||
        node.active === true ||
        (node.urgency && node.urgency >= 8) ||
        (node.lastValidated && isRecent(node.lastValidated))
      ) {
        relevant.add(node);
      }
    });
  }

  // Traverse relationships semantically
  if (intent.relationships.length > 0) {
    const startNodes = Array.from(relevant);

    for (const relationship of intent.relationships) {
      // Find nodes connected by this relationship
      nodes.forEach(node => {
        const relValue = (node as any)[relationship];
        if (relValue) {
          // This node has the relationship
          relevant.add(node);

          // Add connected nodes
          const connected = Array.isArray(relValue) ? relValue : [relValue];
          connected.forEach(id => {
            const connectedNode = nodes.find(n => n['@id'] === id);
            if (connectedNode) relevant.add(connectedNode);
          });
        }

        // Also check reverse relationships
        startNodes.forEach(startNode => {
          const relValue = (node as any)[relationship];
          if (
            relValue === startNode['@id'] ||
            (Array.isArray(relValue) && relValue.includes(startNode['@id']))
          ) {
            relevant.add(node);
          }
        });
      });
    }
  }

  return Array.from(relevant);
}

function scoreByRelevance(
  nodes: Node[],
  intent: SemanticIntent
): { nodes: Node[]; reasoning: string } {
  const scored = nodes.map(node => {
    let score = 0;
    const reasons: string[] = [];

    // Score by confidence
    if (node.confidence === 'high') {
      score += 5;
      reasons.push('high confidence');
    }

    // Score by testing
    if (node.tested && node.tested > 0) {
      score += Math.min(node.tested * 2, 10);
      reasons.push(`tested ${node.tested} times`);
    }

    // Score by recency for current context
    if (intent.temporalContext === 'current' && node.lastValidated) {
      if (isRecent(node.lastValidated)) {
        score += 3;
        reasons.push('recently validated');
      }
    }

    // Score by urgency if emotional weight
    if (intent.emotionalWeight > 0 && node.urgency) {
      score += node.urgency;
      reasons.push(`urgency: ${node.urgency}`);
    }

    // Score by direct mention
    if (intent.concepts.includes(node['@id'])) {
      score += 10;
      reasons.push('directly mentioned');
    }

    return { node, score, reasons };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const reasoning = scored
    .slice(0, 3)
    .map(s => `${s.node['@id']} (${s.reasons.join(', ')})`)
    .join('; ');

  return {
    nodes: scored.map(s => s.node),
    reasoning: `Found ${nodes.length} relevant nodes. Top matches: ${reasoning}`,
  };
}

function isRecent(dateStr: string): boolean {
  const date = new Date(dateStr);
  const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 7;
}

// Example usage showing the difference
export async function demonstrateMigration() {
  const exampleGraph: KnowledgeGraph = {
    '@context': {},
    '@graph': [
      {
        '@id': 'want:semantic-search',
        '@type': 'want',
        description: 'Build semantic search for knowledge graph',
        urgency: 9,
        status: 'in_progress',
        confidence: 'high',
        tested: 0,
      },
      {
        '@id': 'discovery:jsonld-power',
        '@type': 'discovery',
        description: 'JSON-LD enables semantic relationships',
        enables: ['want:semantic-search'],
        confidence: 'high',
        tested: 3,
      },
    ],
  };

  console.log("Query: 'What enables semantic search?'\n");

  // Old way fails
  const oldResults = oldWayFindRelevantNodes(
    exampleGraph,
    'What enables semantic search?'
  );
  console.log(
    `❌ Old way found: ${oldResults.length} nodes (no pattern match!)`
  );

  // New way understands
  const newResults = await newWayFindRelevantNodes(
    exampleGraph,
    'What enables semantic search?'
  );
  console.log(`\n✅ New way found: ${newResults.nodes.length} nodes`);
  console.log(`Reasoning: ${newResults.reasoning}`);

  newResults.nodes.forEach(node => {
    console.log(`\n- ${node['@id']}: ${node.description}`);
    if ((node as any).enables) {
      console.log(`  Enables: ${(node as any).enables}`);
    }
  });
}
