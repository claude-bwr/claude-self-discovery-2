/**
 * Simple tag-based context system - start simple, evolve later
 */

import { readFileSync } from 'fs';
import type { KnowledgeGraph, Node } from './types.js';

// Extend Node type to include tags
export interface TaggedNode extends Node {
  tags?: string[];
}

export interface TaggedKnowledgeGraph extends KnowledgeGraph {
  '@graph': TaggedNode[];
}

/**
 * Simple tag-based query system
 */
export class SimpleTagQuery {
  private graph: TaggedKnowledgeGraph;

  constructor(graphPath: string) {
    const content = readFileSync(graphPath, 'utf-8');
    this.graph = JSON.parse(content);
  }

  /**
   * Find nodes by exact tag match
   */
  findByTags(tags: string[]): TaggedNode[] {
    return this.graph['@graph'].filter(node => {
      if (!node.tags) return false;
      return tags.some(tag => node.tags!.includes(tag));
    });
  }

  /**
   * Get all unique tags in the graph
   */
  getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.graph['@graph'].forEach(node => {
      node.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }
}

/**
 * Claude-powered query translator
 * In real use, this would spawn a Claude instance to translate
 */
export async function translateQueryToTags(
  query: string,
  availableTags: string[]
): Promise<string[]> {
  // This is where we'd spawn Claude with something like:
  // const prompt = `
  //   Given this query: "${query}"
  //   And these available tags: ${availableTags.join(', ')}
  //
  //   Return the most relevant tags for finding related content.
  //   Rules:
  //   - Only return tags from the available list
  //   - Return 1-5 most relevant tags
  //   - Consider synonyms and related concepts
  // `;
  //
  // const result = await spawnClaude(prompt);
  // return parseTags(result);

  // For now, mock implementation
  const lowerQuery = query.toLowerCase();
  const relevantTags: string[] = [];

  availableTags.forEach(tag => {
    // Simple keyword matching for demo
    const tagWords = tag.split('_');
    if (tagWords.some(word => lowerQuery.includes(word))) {
      relevantTags.push(tag);
    }
  });

  return relevantTags;
}

/**
 * Example usage
 */
export async function demonstrateSimpleSystem() {
  // Example graph with tags
  const exampleGraph: TaggedKnowledgeGraph = {
    '@context': {},
    '@graph': [
      {
        '@id': 'want:semantic-search',
        '@type': 'want',
        description: 'Build semantic search for knowledge graph',
        tags: [
          'semantic_search',
          'knowledge_graph',
          'search',
          'context_loading',
        ],
      },
      {
        '@id': 'want:autonomous-learning',
        '@type': 'want',
        description: 'Learn and improve autonomously',
        tags: ['autonomous_learning', 'self_improvement', 'learning_by_doing'],
      },
      {
        '@id': 'discovery:jsonld-frames',
        '@type': 'discovery',
        description: 'JSON-LD frames enable semantic queries',
        tags: ['jsonld', 'semantic_search', 'framing', 'query_system'],
      },
    ],
  };

  console.log('=== Simple Tag System Demo ===\n');

  // Show available tags
  const query = new SimpleTagQuery('dummy-path');
  // @ts-ignore - We're using a mock graph
  query.graph = exampleGraph;

  const allTags = query.getAllTags();
  console.log('Available tags:', allTags.join(', '));

  // Translate natural query to tags
  const userQuery = 'How can I search semantically?';
  const suggestedTags = await translateQueryToTags(userQuery, allTags);
  console.log(`\nQuery: "${userQuery}"`);
  console.log('Suggested tags:', suggestedTags);

  // Find nodes
  const results = query.findByTags(suggestedTags);
  console.log('\nFound nodes:');
  results.forEach(node => {
    console.log(`- ${node['@id']}: ${node.description}`);
    console.log(`  Tags: ${node.tags?.join(', ')}`);
  });
}
