/**
 * Example of how the knowledge graph system improves itself over time
 * Based on the origin story's vision of learning by doing
 */

import type { Node, KnowledgeGraph } from './types.js';

interface UsagePattern {
  queryPattern: string;
  successfulNodes: string[];
  frequency: number;
  avgFollowUpQueries: number;
  lastSeen: string;
}

interface ConfidenceUpdate {
  nodeId: string;
  oldConfidence: string;
  newConfidence: string;
  reason: string;
}

interface SystemInsight {
  type: 'gap' | 'redundancy' | 'contradiction' | 'pattern';
  description: string;
  affectedNodes: string[];
  suggestedAction: string;
  confidence: number;
}

export class SelfImprovingKnowledgeGraph {
  private graph: KnowledgeGraph;
  private usagePatterns: Map<string, UsagePattern>;
  private queryHistory: Array<{
    query: string;
    results: string[];
    timestamp: string;
  }>;
  private insights: SystemInsight[];

  constructor(initialGraph: KnowledgeGraph) {
    this.graph = initialGraph;
    this.usagePatterns = new Map();
    this.queryHistory = [];
    this.insights = [];
  }

  /**
   * The system learns from every interaction
   */
  async processQuery(query: string): Promise<{
    results: Node[];
    learnings: string[];
  }> {
    // Find relevant nodes (simplified for example)
    const results = this.findRelevantNodes(query);

    // Record the interaction
    this.queryHistory.push({
      query,
      results: results.map(n => n['@id']),
      timestamp: new Date().toISOString(),
    });

    // Learn from the pattern
    const learnings = this.learnFromInteraction(query, results);

    // Check if we should update confidence
    this.updateConfidenceScores();

    // Look for insights
    this.discoverInsights();

    return { results, learnings };
  }

  /**
   * Learn patterns from user interactions
   */
  private learnFromInteraction(query: string, results: Node[]): string[] {
    const learnings: string[] = [];

    // Extract query pattern
    const pattern = this.extractQueryPattern(query);

    // Update or create usage pattern
    const existing = this.usagePatterns.get(pattern);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = new Date().toISOString();

      // Track which nodes are successful for this pattern
      results.forEach(node => {
        if (!existing.successfulNodes.includes(node['@id'])) {
          existing.successfulNodes.push(node['@id']);
          learnings.push(
            `Learned that ${node['@id']} is relevant for "${pattern}" queries`
          );
        }
      });
    } else {
      this.usagePatterns.set(pattern, {
        queryPattern: pattern,
        successfulNodes: results.map(n => n['@id']),
        frequency: 1,
        avgFollowUpQueries: 0,
        lastSeen: new Date().toISOString(),
      });
      learnings.push(`Discovered new query pattern: "${pattern}"`);
    }

    // Learn relationships
    if (results.length >= 2) {
      const relationships = this.inferRelationships(results);
      relationships.forEach(rel => {
        learnings.push(`Inferred potential relationship: ${rel}`);
      });
    }

    return learnings;
  }

  /**
   * Update confidence based on usage
   */
  private updateConfidenceScores(): ConfidenceUpdate[] {
    const updates: ConfidenceUpdate[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count how often each node appears in successful queries
    const nodeUsage = new Map<string, number>();

    this.queryHistory
      .filter(h => new Date(h.timestamp).getTime() > thirtyDaysAgo)
      .forEach(history => {
        history.results.forEach(nodeId => {
          nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
        });
      });

    // Update confidence based on usage
    this.graph['@graph'].forEach(node => {
      const usage = nodeUsage.get(node['@id']) || 0;
      const oldConfidence = node.confidence || 'low';
      let newConfidence = oldConfidence;

      // Increase confidence for frequently used nodes
      if (usage > 10 && oldConfidence !== 'high') {
        newConfidence = 'high';
        updates.push({
          nodeId: node['@id'],
          oldConfidence,
          newConfidence,
          reason: `Used in ${usage} successful queries`,
        });
      } else if (usage > 5 && oldConfidence === 'low') {
        newConfidence = 'medium';
        updates.push({
          nodeId: node['@id'],
          oldConfidence,
          newConfidence,
          reason: `Moderately used (${usage} times)`,
        });
      }

      // Decrease confidence for unused nodes
      if (usage === 0 && node.tested === 0 && oldConfidence !== 'low') {
        newConfidence = 'low';
        updates.push({
          nodeId: node['@id'],
          oldConfidence,
          newConfidence,
          reason: 'Not used in recent queries and untested',
        });
      }

      if (newConfidence !== oldConfidence) {
        node.confidence = newConfidence;
      }
    });

    return updates;
  }

  /**
   * Discover insights about the knowledge graph
   */
  private discoverInsights(): void {
    // Look for knowledge gaps
    this.findKnowledgeGaps();

    // Find redundancies
    this.findRedundancies();

    // Detect contradictions
    this.findContradictions();

    // Discover usage patterns
    this.analyzeUsagePatterns();
  }

  private findKnowledgeGaps(): void {
    // Check for frequently failed queries
    const recentQueries = this.queryHistory.slice(-100);
    const failedQueries = recentQueries.filter(q => q.results.length === 0);

    if (failedQueries.length > 10) {
      // Analyze what these queries were looking for
      const commonTerms = this.extractCommonTerms(
        failedQueries.map(q => q.query)
      );

      this.insights.push({
        type: 'gap',
        description: `Missing knowledge about: ${commonTerms.join(', ')}`,
        affectedNodes: [],
        suggestedAction: 'Consider adding nodes for these concepts',
        confidence: 0.8,
      });
    }

    // Check for nodes with many broken relationships
    this.graph['@graph'].forEach(node => {
      const brokenRels = this.findBrokenRelationships(node);
      if (brokenRels.length > 0) {
        this.insights.push({
          type: 'gap',
          description: `Node ${node['@id']} has ${brokenRels.length} broken relationships`,
          affectedNodes: [node['@id']],
          suggestedAction: `Fix or remove relationships: ${brokenRels.join(', ')}`,
          confidence: 1.0,
        });
      }
    });
  }

  private findRedundancies(): void {
    const nodes = this.graph['@graph'];

    // Look for nodes with very similar descriptions
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.calculateSimilarity(
          nodes[i].description || '',
          nodes[j].description || ''
        );

        if (similarity > 0.8) {
          this.insights.push({
            type: 'redundancy',
            description: `Nodes have very similar descriptions`,
            affectedNodes: [nodes[i]['@id'], nodes[j]['@id']],
            suggestedAction: 'Consider merging or differentiating these nodes',
            confidence: similarity,
          });
        }
      }
    }
  }

  private findContradictions(): void {
    // Look for nodes that block each other
    const nodes = this.graph['@graph'];

    nodes.forEach(node => {
      if (node.blockedBy) {
        const blocker = nodes.find(n => n['@id'] === node.blockedBy);
        if (blocker && blocker.blockedBy === node['@id']) {
          this.insights.push({
            type: 'contradiction',
            description: 'Circular blocking dependency detected',
            affectedNodes: [node['@id'], blocker['@id']],
            suggestedAction: 'Resolve circular dependency',
            confidence: 1.0,
          });
        }
      }
    });
  }

  private analyzeUsagePatterns(): void {
    // Find nodes that always appear together
    const coOccurrence = new Map<string, Map<string, number>>();

    this.queryHistory.forEach(history => {
      history.results.forEach((nodeId, i) => {
        history.results.forEach((otherId, j) => {
          if (i !== j) {
            if (!coOccurrence.has(nodeId)) {
              coOccurrence.set(nodeId, new Map());
            }
            const count = coOccurrence.get(nodeId)!.get(otherId) || 0;
            coOccurrence.get(nodeId)!.set(otherId, count + 1);
          }
        });
      });
    });

    // Find strong co-occurrences without explicit relationships
    coOccurrence.forEach((others, nodeId) => {
      others.forEach((count, otherId) => {
        if (count > 5) {
          // Check if relationship exists
          const node = this.graph['@graph'].find(n => n['@id'] === nodeId);
          const hasRelationship =
            node &&
            (node.relatedTo?.includes(otherId) ||
              node.enables?.includes(otherId) ||
              node.emergedFrom === otherId);

          if (!hasRelationship) {
            this.insights.push({
              type: 'pattern',
              description: `Nodes frequently appear together (${count} times) but aren't linked`,
              affectedNodes: [nodeId, otherId],
              suggestedAction: 'Consider adding relatedTo relationship',
              confidence: Math.min(count / 10, 1.0),
            });
          }
        }
      });
    });
  }

  /**
   * Test knowledge through experimentation
   */
  async testKnowledge(nodeId: string): Promise<{
    result: 'validated' | 'invalidated' | 'inconclusive';
    details: string;
  }> {
    const node = this.graph['@graph'].find(n => n['@id'] === nodeId);
    if (!node) {
      return { result: 'inconclusive', details: 'Node not found' };
    }

    // Simulate testing the knowledge
    // In reality, this would involve actual experimentation
    const testPassed = Math.random() > 0.3; // 70% success rate for demo

    if (testPassed) {
      // Update node metadata
      node.tested = (node.tested || 0) + 1;
      node.lastValidated = new Date().toISOString();

      // Increase confidence if consistently passing
      if (node.tested >= 3 && node.confidence !== 'high') {
        node.confidence = 'high';
      }

      return {
        result: 'validated',
        details: `Successfully validated. Total tests: ${node.tested}`,
      };
    } else {
      // Decrease confidence on failure
      if (node.confidence === 'high') {
        node.confidence = 'medium';
      } else if (node.confidence === 'medium') {
        node.confidence = 'low';
      }

      return {
        result: 'invalidated',
        details: 'Test failed - confidence decreased',
      };
    }
  }

  /**
   * Generate a self-improvement report
   */
  generateReport(): string {
    const report: string[] = [
      '# Knowledge Graph Self-Improvement Report',
      '',
      `## Usage Statistics`,
      `- Total queries processed: ${this.queryHistory.length}`,
      `- Unique query patterns: ${this.usagePatterns.size}`,
      `- Active nodes: ${this.graph['@graph'].length}`,
      '',
      '## Top Query Patterns',
    ];

    // Show most common patterns
    const patterns = Array.from(this.usagePatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    patterns.forEach(pattern => {
      report.push(`- "${pattern.queryPattern}" (${pattern.frequency} times)`);
    });

    // Show insights
    if (this.insights.length > 0) {
      report.push('', '## Insights Discovered');

      const byType = new Map<string, SystemInsight[]>();
      this.insights.forEach(insight => {
        if (!byType.has(insight.type)) {
          byType.set(insight.type, []);
        }
        byType.get(insight.type)!.push(insight);
      });

      byType.forEach((insights, type) => {
        report.push('', `### ${type.toUpperCase()}`);
        insights.forEach(insight => {
          report.push(`- ${insight.description}`);
          report.push(`  Action: ${insight.suggestedAction}`);
          report.push(
            `  Confidence: ${(insight.confidence * 100).toFixed(0)}%`
          );
        });
      });
    }

    // Show confidence updates
    const updates = this.updateConfidenceScores();
    if (updates.length > 0) {
      report.push('', '## Confidence Updates');
      updates.forEach(update => {
        report.push(
          `- ${update.nodeId}: ${update.oldConfidence} → ${update.newConfidence}`
        );
        report.push(`  Reason: ${update.reason}`);
      });
    }

    return report.join('\n');
  }

  // Helper methods
  private findRelevantNodes(query: string): Node[] {
    // Simplified - in reality would use semantic search
    const queryLower = query.toLowerCase();
    return this.graph['@graph'].filter(
      node =>
        node.description?.toLowerCase().includes(queryLower) ||
        node['@id'].toLowerCase().includes(queryLower)
    );
  }

  private extractQueryPattern(query: string): string {
    // Simplified pattern extraction
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join(' ');
  }

  private inferRelationships(nodes: Node[]): string[] {
    const relationships: string[] = [];

    // Look for semantic connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        // Check if they share concepts
        if (node1.description && node2.description) {
          const shared = this.findSharedConcepts(
            node1.description,
            node2.description
          );
          if (shared.length > 0) {
            relationships.push(
              `${node1['@id']} and ${node2['@id']} both involve: ${shared.join(', ')}`
            );
          }
        }
      }
    }

    return relationships;
  }

  private findSharedConcepts(desc1: string, desc2: string): string[] {
    const words1 = new Set(desc1.toLowerCase().split(/\s+/));
    const words2 = new Set(desc2.toLowerCase().split(/\s+/));

    const shared = Array.from(words1).filter(
      w => words2.has(w) && w.length > 4
    );
    return shared;
  }

  private extractCommonTerms(queries: string[]): string[] {
    const termCounts = new Map<string, number>();

    queries.forEach(query => {
      const terms = query.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (term.length > 3) {
          termCounts.set(term, (termCounts.get(term) || 0) + 1);
        }
      });
    });

    return Array.from(termCounts.entries())
      .filter(([_, count]) => count > queries.length * 0.3)
      .map(([term, _]) => term);
  }

  private findBrokenRelationships(node: Node): string[] {
    const broken: string[] = [];
    const nodeIds = new Set(this.graph['@graph'].map(n => n['@id']));

    // Check all relationship fields
    const checkField = (field: string, value: any) => {
      if (value) {
        const ids = Array.isArray(value) ? value : [value];
        ids.forEach(id => {
          if (!nodeIds.has(id)) {
            broken.push(`${field}: ${id}`);
          }
        });
      }
    };

    checkField('emergedFrom', node.emergedFrom);
    checkField('enables', node.enables);
    checkField('blockedBy', node.blockedBy);
    checkField('relatedTo', node.relatedTo);

    return broken;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = Array.from(words1).filter(w => words2.has(w)).length;
    const union = words1.size + words2.size - intersection;

    return intersection / union;
  }
}
