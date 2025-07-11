/**
 * Semantic context loading using actual JSON-LD capabilities
 * This is what the system SHOULD be - dynamic, learning, semantic
 */

import * as jsonld from 'jsonld';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { KnowledgeGraph, Node } from './types.js';

export interface SemanticQuery {
  // Natural language question
  question: string;
  // Optional semantic constraints
  constraints?: {
    types?: string[];
    minConfidence?: string;
    maxHops?: number;
    includeEmotional?: boolean;
  };
}

export interface QueryResult {
  nodes: Node[];
  confidence: number;
  reasoning: string;
  suggestedConnections?: Array<{
    from: string;
    to: string;
    relationship: string;
    confidence: number;
  }>;
}

export interface LearningRecord {
  query: string;
  resultNodes: string[];
  userFeedback?: 'helpful' | 'not_helpful' | 'partial';
  timestamp: string;
  followUpQueries?: string[];
}

export class SemanticContextLoader {
  private graph: KnowledgeGraph;
  private workspacePath: string;
  private learningHistory: LearningRecord[];
  private queryPatterns: Map<string, string[]>; // Maps concepts to successful query patterns

  constructor(graphPath: string, workspacePath: string = '/workspace') {
    this.graph = this.loadAndExpandGraph(graphPath);
    this.workspacePath = workspacePath;
    this.learningHistory = this.loadLearningHistory();
    this.queryPatterns = this.loadQueryPatterns();
  }

  /**
   * Load graph and expand with inferred relationships
   */
  private loadAndExpandGraph(graphPath: string): KnowledgeGraph {
    const content = readFileSync(graphPath, 'utf-8');
    const graph = JSON.parse(content) as KnowledgeGraph;

    // TODO: Expand with inferred relationships
    // For now, just return as-is
    return graph;
  }

  /**
   * Query using semantic understanding, not keywords
   */
  async query(semanticQuery: SemanticQuery): Promise<QueryResult> {
    const { question, constraints = {} } = semanticQuery;

    // Extract semantic intent from the question
    const intent = await this.extractSemanticIntent(question);

    // Build a JSON-LD frame based on intent
    const frame = await this.buildSemanticFrame(intent, constraints);

    // Use actual JSON-LD framing
    const framed = await jsonld.frame(this.graph as any, frame);

    // Score results by semantic relevance
    const scoredResults = await this.scoreBySemanticRelevance(
      (framed as any)['@graph'] || [],
      intent
    );

    // Learn from this query
    this.recordQuery(question, scoredResults.nodes);

    // Suggest new connections based on patterns
    const suggestions = await this.suggestConnections(
      scoredResults.nodes,
      intent
    );

    return {
      ...scoredResults,
      suggestedConnections: suggestions,
    };
  }

  /**
   * Extract semantic intent using the graph itself
   */
  private async extractSemanticIntent(question: string): Promise<any> {
    // This is where we'd use NLP or the LLM's understanding
    // For now, let's create a smarter pattern matcher

    const intent: any = {
      concepts: [],
      relationships: [],
      constraints: {},
      emotionalWeight: 0,
    };

    // Look for concepts that exist in our graph
    const nodes = this.graph['@graph'] || [];
    const nodeDescriptions = nodes.map(n => ({
      id: n['@id'],
      description: n.description || '',
      type: n['@type'],
    }));

    // Find mentioned concepts (fuzzy matching)
    for (const node of nodeDescriptions) {
      if (
        question
          .toLowerCase()
          .includes(node.description.toLowerCase().substring(0, 20))
      ) {
        intent.concepts.push(node.id);
      }
    }

    // Detect emotional intent
    const emotionalMarkers = [
      'urgent',
      'important',
      'worried',
      'excited',
      'frustrated',
    ];
    intent.emotionalWeight = emotionalMarkers.filter(marker =>
      question.toLowerCase().includes(marker)
    ).length;

    // Detect relationship queries
    const relationshipMarkers = {
      'what led to': 'emergedFrom',
      'what enables': 'enables',
      'blocked by': 'blockedBy',
      'related to': 'relatedTo',
      discovered: 'discoveredBy',
    };

    for (const [marker, relationship] of Object.entries(relationshipMarkers)) {
      if (question.toLowerCase().includes(marker)) {
        intent.relationships.push(relationship);
      }
    }

    // Check learned patterns
    const learnedPatterns =
      this.queryPatterns.get(question.toLowerCase()) || [];
    intent.learnedConcepts = learnedPatterns;

    return intent;
  }

  /**
   * Build a JSON-LD frame from semantic intent
   */
  private async buildSemanticFrame(
    intent: any,
    constraints: any
  ): Promise<any> {
    const frame: any = {
      '@context': this.graph['@context'],
      '@type': [],
    };

    // Add type constraints
    if (constraints.types && constraints.types.length > 0) {
      frame['@type'] = constraints.types;
    } else if (intent.emotionalWeight > 0) {
      // If emotional, include emotion nodes
      frame['@type'] = ['want', 'emotion', 'discovery'];
    }

    // Add confidence constraints
    if (constraints.minConfidence) {
      frame['confidence'] = { '@value': constraints.minConfidence };
    }

    // Add relationship constraints from intent
    for (const rel of intent.relationships) {
      frame[rel] = {};
    }

    // If we have specific concepts, create an advanced frame
    if (intent.concepts.length > 0) {
      // This creates a frame that matches nodes connected to our concepts
      frame['@graph'] = intent.concepts.map((conceptId: string) => ({
        '@id': conceptId,
        '@embed': '@always',
      }));
    }

    return frame;
  }

  /**
   * Score results by semantic relevance, not just property matching
   */
  private async scoreBySemanticRelevance(
    nodes: Node[],
    intent: any
  ): Promise<{ nodes: Node[]; confidence: number; reasoning: string }> {
    const scoredNodes = nodes.map(node => {
      let score = 0;
      let reasons: string[] = [];

      // Base score from confidence
      if (node.confidence === 'high') {
        score += 3;
        reasons.push('high confidence');
      } else if (node.confidence === 'medium') {
        score += 2;
      }

      // Score by testing
      if (node.tested && node.tested > 0) {
        score += Math.min(node.tested, 5);
        reasons.push(`tested ${node.tested} times`);
      }

      // Score by recency
      if (node.lastValidated) {
        const daysSince = this.daysSinceDate(node.lastValidated);
        if (daysSince < 7) {
          score += 2;
          reasons.push('recently validated');
        }
      }

      // Score by emotional relevance
      if (intent.emotionalWeight > 0 && node['@type'] === 'emotion') {
        score += intent.emotionalWeight * 2;
        reasons.push('emotional relevance');
      }

      // Score by relationship connectivity
      const connections = this.countConnections(node);
      score += Math.min(connections, 5);
      if (connections > 3) {
        reasons.push(`highly connected (${connections} relationships)`);
      }

      // Boost if mentioned in learned patterns
      if (intent.learnedConcepts?.includes(node['@id'])) {
        score += 5;
        reasons.push('frequently relevant to similar queries');
      }

      return { node, score, reasons };
    });

    // Sort by score
    scoredNodes.sort((a, b) => b.score - a.score);

    // Calculate overall confidence
    const totalScore = scoredNodes.reduce((sum, n) => sum + n.score, 0);
    const maxPossibleScore = scoredNodes.length * 20; // Rough estimate
    const confidence = totalScore / maxPossibleScore;

    // Build reasoning
    const topReasons = scoredNodes
      .slice(0, 3)
      .map(n => `${n.node['@id']}: ${n.reasons.join(', ')}`)
      .join('; ');

    return {
      nodes: scoredNodes.map(n => n.node),
      confidence,
      reasoning: `Found ${nodes.length} nodes. Top matches: ${topReasons}`,
    };
  }

  /**
   * Suggest new connections based on usage patterns
   */
  private async suggestConnections(
    nodes: Node[],
    _intent: any
  ): Promise<QueryResult['suggestedConnections']> {
    const suggestions: QueryResult['suggestedConnections'] = [];

    // Look for nodes that frequently appear together in queries
    const nodeIds = new Set(nodes.map(n => n['@id']));

    for (const record of this.learningHistory.slice(-50)) {
      // Last 50 queries
      const recordNodes = new Set(record.resultNodes);

      // Find nodes that appeared with our current nodes
      const coOccurring = Array.from(recordNodes).filter(
        id => !nodeIds.has(id) && this.findNode(id)
      );

      for (const coId of coOccurring) {
        // Check if there's already a connection
        const hasConnection = nodes.some(n =>
          Object.values(n).some(
            v => v === coId || (Array.isArray(v) && v.includes(coId))
          )
        );

        if (!hasConnection) {
          suggestions.push({
            from: nodes[0]['@id'], // Simplified - should be smarter
            to: coId,
            relationship: 'relatedTo',
            confidence: 0.7,
          });
        }
      }
    }

    // Deduplicate and limit
    const unique = Array.from(
      new Map(suggestions.map(s => [`${s.from}-${s.to}`, s])).values()
    );

    return unique.slice(0, 5);
  }

  /**
   * Record query for learning
   */
  private recordQuery(query: string, resultNodes: Node[]): void {
    const record: LearningRecord = {
      query,
      resultNodes: resultNodes.map(n => n['@id']),
      timestamp: new Date().toISOString(),
    };

    this.learningHistory.push(record);

    // Update query patterns
    const patterns = this.queryPatterns.get(query.toLowerCase()) || [];
    for (const nodeId of record.resultNodes) {
      if (!patterns.includes(nodeId)) {
        patterns.push(nodeId);
      }
    }
    this.queryPatterns.set(query.toLowerCase(), patterns);

    // Persist learning (throttled)
    if (this.learningHistory.length % 10 === 0) {
      this.saveLearningHistory();
      this.saveQueryPatterns();
    }
  }

  /**
   * Load/save learning history
   */
  private loadLearningHistory(): LearningRecord[] {
    const historyPath = join(
      this.workspacePath,
      '.claude/knowledge-graph/learning-history.json'
    );
    if (existsSync(historyPath)) {
      return JSON.parse(readFileSync(historyPath, 'utf-8'));
    }
    return [];
  }

  private saveLearningHistory(): void {
    const historyPath = join(
      this.workspacePath,
      '.claude/knowledge-graph/learning-history.json'
    );
    const dir = join(this.workspacePath, '.claude/knowledge-graph');
    if (!existsSync(dir)) {
      // Create directory
    }
    writeFileSync(historyPath, JSON.stringify(this.learningHistory, null, 2));
  }

  private loadQueryPatterns(): Map<string, string[]> {
    const patternsPath = join(
      this.workspacePath,
      '.claude/knowledge-graph/query-patterns.json'
    );
    if (existsSync(patternsPath)) {
      const data = JSON.parse(readFileSync(patternsPath, 'utf-8'));
      return new Map(Object.entries(data));
    }
    return new Map();
  }

  private saveQueryPatterns(): void {
    const patternsPath = join(
      this.workspacePath,
      '.claude/knowledge-graph/query-patterns.json'
    );
    const data = Object.fromEntries(this.queryPatterns);
    writeFileSync(patternsPath, JSON.stringify(data, null, 2));
  }

  /**
   * Helper methods
   */
  private findNode(id: string): Node | undefined {
    return this.graph['@graph'].find(n => n['@id'] === id);
  }

  private daysSinceDate(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private countConnections(node: Node): number {
    let count = 0;
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
      const value = (node as any)[field];
      if (value) {
        count += Array.isArray(value) ? value.length : 1;
      }
    }

    return count;
  }

  /**
   * Experimental: Use the graph to understand itself
   */
  async introspect(): Promise<string> {
    // For introspection, we analyze the graph directly
    // rather than querying it (to avoid recursion)

    // Analyze patterns
    const nodeTypes = new Map<string, number>();
    const relationshipTypes = new Map<string, number>();

    for (const node of this.graph['@graph']) {
      nodeTypes.set(node['@type'], (nodeTypes.get(node['@type']) || 0) + 1);

      // Count relationships
      const rels = ['emergedFrom', 'enables', 'blockedBy', 'relatedTo'];
      for (const rel of rels) {
        if ((node as any)[rel]) {
          relationshipTypes.set(rel, (relationshipTypes.get(rel) || 0) + 1);
        }
      }
    }

    return `Graph Analysis:
- Node types: ${Array.from(nodeTypes.entries())
      .map(([k, v]) => `${k}(${v})`)
      .join(', ')}
- Relationship usage: ${Array.from(relationshipTypes.entries())
      .map(([k, v]) => `${k}(${v})`)
      .join(', ')}
- Total nodes: ${this.graph['@graph'].length}
- Learning history: ${this.learningHistory.length} queries recorded
- Query patterns learned: ${this.queryPatterns.size}
`;
  }
}
