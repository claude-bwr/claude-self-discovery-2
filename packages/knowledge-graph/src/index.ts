/**
 * Core knowledge graph types and query functions
 */

// Re-export types
export * from './types.js';

// Re-export the new JSON-LD based functions
export * from './knowledge-graph.js';

// Keep the simple implementations for backward compatibility
import type { Node, KnowledgeGraph } from './types.js';

import { readFileSync } from 'fs';

export function loadGraph(filename: string): KnowledgeGraph {
  const content = readFileSync(filename, 'utf-8');
  return JSON.parse(content);
}

export function frameQuery(
  graph: KnowledgeGraph,
  frame: Partial<Node>
): Node[] {
  const results: Node[] = [];
  const nodes = graph['@graph'] || [];

  // Simple type matching
  if (frame['@type']) {
    const frameType = frame['@type'];
    for (const node of nodes) {
      if (node['@type'] === frameType) {
        // Check additional constraints
        let match = true;
        for (const [key] of Object.entries(frame)) {
          if (key !== '@type' && key !== '@context') {
            if (!(key in node)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          results.push(node);
        }
      }
    }
  }

  return results;
}

export function getUrgentWants(
  graph: KnowledgeGraph,
  minUrgency: number = 8
): Node[] {
  const wants = frameQuery(graph, { '@type': 'want' });
  return wants.filter(w => (w.urgency || 0) >= minUrgency);
}

export function getRelatedNodes(
  graph: KnowledgeGraph,
  nodeId: string
): string[] {
  const related = new Set<string>();
  const nodes = graph['@graph'] || [];

  // Find the target node
  const targetNode = nodes.find(n => n['@id'] === nodeId);
  if (!targetNode) return [];

  // Check all relationship fields
  const relationshipFields = [
    'emergedFrom',
    'enables',
    'blockedBy',
    'relatedTo',
    'discoveredBy',
    'triggeredBy',
    'resultedIn',
  ];

  for (const field of relationshipFields) {
    const value = (targetNode as any)[field];
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => related.add(v));
      } else {
        related.add(value);
      }
    }
  }

  // Also find nodes that reference this node
  for (const node of nodes) {
    for (const field of relationshipFields) {
      const value = (node as any)[field];
      if (value) {
        if (Array.isArray(value) && value.includes(nodeId)) {
          related.add(node['@id']);
        } else if (value === nodeId) {
          related.add(node['@id']);
        }
      }
    }
  }

  return Array.from(related);
}

export function getBlockedWants(graph: KnowledgeGraph): Node[] {
  const wants = frameQuery(graph, { '@type': 'want' });
  return wants.filter(w => w.blockedBy);
}

export function getUntestedIdeas(graph: KnowledgeGraph): Node[] {
  const allNodes = graph['@graph'] || [];
  return allNodes.filter(n => (n.tested || 1) === 0);
}

export function traceLineage(
  graph: KnowledgeGraph,
  nodeId: string,
  depth: number = 3
): any {
  const nodesDict: Record<string, Node> = {};
  graph['@graph'].forEach(n => {
    nodesDict[n['@id']] = n;
  });

  function traceBack(nid: string, currentDepth: number): any {
    if (currentDepth <= 0 || !nodesDict[nid]) {
      return { '@id': nid };
    }

    const node = nodesDict[nid];
    const result: any = {
      '@id': nid,
      '@type': node['@type'],
      description: node.description,
    };

    if (node.emergedFrom) {
      result.emergedFrom = traceBack(node.emergedFrom, currentDepth - 1);
    }

    return result;
  }

  return traceBack(nodeId, depth);
}
