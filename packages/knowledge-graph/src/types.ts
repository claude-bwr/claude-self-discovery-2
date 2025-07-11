/**
 * Type definitions for the knowledge graph
 */

export interface Node {
  '@id': string;
  '@type': string;
  description?: string;
  urgency?: number;
  why?: string;
  emergedFrom?: string;
  enables?: string[];
  blockedBy?: string;
  relatedTo?: string[];
  confidence?: string;
  tested?: number;
  lastValidated?: string;
  discoveredAt?: string;
  intensity?: number;
  triggeredBy?: string;
  resultedIn?: string[];
  discoveredBy?: string;
}

export interface KnowledgeGraph {
  '@context': any;
  '@graph': Node[];
}
