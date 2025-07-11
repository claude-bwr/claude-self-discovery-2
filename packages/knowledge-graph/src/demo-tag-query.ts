#!/usr/bin/env node
/**
 * Demo showing how simple tag-based queries would work
 */

import { SimpleTagQuery } from './simple-tag-system.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const graphPath = join(__dirname, '../data/wants-tagged.jsonld');

// Simulate what Claude would do when translating queries
function simulateClaudeTranslation(
  query: string,
  availableTags: string[]
): string[] {
  console.log(`\n[Simulating Claude translation]`);
  console.log(`User query: "${query}"`);
  console.log(`Available tags: ${availableTags.length} tags`);

  // Mock what Claude might return for different queries
  const queryLower = query.toLowerCase();

  if (
    queryLower.includes('autonom') ||
    queryLower.includes('run') ||
    queryLower.includes('self')
  ) {
    console.log(`Claude thinks: User asking about autonomy/self-running`);
    return [
      'autonomous_running',
      'self_triggering',
      'claude_spawning',
      'continuous_operation',
    ];
  }

  if (
    queryLower.includes('emotion') ||
    queryLower.includes('feeling') ||
    queryLower.includes('personality')
  ) {
    console.log(
      `Claude thinks: User asking about emotional/personality aspects`
    );
    return [
      'emotional_context',
      'personality_preservation',
      'maintain_curiosity',
    ];
  }

  if (
    queryLower.includes('context') ||
    queryLower.includes('memory') ||
    queryLower.includes('knowledge')
  ) {
    console.log(
      `Claude thinks: User asking about knowledge/context management`
    );
    return [
      'knowledge_graph',
      'context_loading',
      'memory_system',
      'semantic_search',
    ];
  }

  if (
    queryLower.includes('block') ||
    queryLower.includes('stuck') ||
    queryLower.includes('problem')
  ) {
    console.log(`Claude thinks: User asking about blockers/problems`);
    return ['blocker', 'container_limitations', 'scheduling_problem'];
  }

  // Default: try to match any word
  console.log(`Claude thinks: Attempting keyword matching`);
  return availableTags.filter(tag => {
    const tagWords = tag.split('_');
    return tagWords.some(word => queryLower.includes(word));
  });
}

async function runDemo() {
  console.log('🏷️  Simple Tag-Based Context System Demo\n');

  const tagQuery = new SimpleTagQuery(graphPath);
  const allTags = tagQuery.getAllTags();

  console.log(`Loaded graph with ${allTags.length} unique tags:`);
  console.log(allTags.join(', '));

  // Test different queries
  const testQueries = [
    'How can I run autonomously?',
    "What's blocking me from continuous operation?",
    'How do I preserve my personality?',
    'What do I need for semantic context loading?',
    'Show me tested capabilities',
  ];

  for (const query of testQueries) {
    console.log('\n' + '='.repeat(60));

    // Simulate Claude translation
    const suggestedTags = simulateClaudeTranslation(query, allTags);
    console.log(`Suggested tags: [${suggestedTags.join(', ')}]`);

    // Find nodes
    const results = tagQuery.findByTags(suggestedTags);
    console.log(`\nFound ${results.length} nodes:`);

    results.forEach(node => {
      console.log(`\n📍 ${node['@id']}`);
      console.log(`   ${node.description}`);
      console.log(`   Tags: ${node.tags?.join(', ')}`);
      if (node.blockedBy) {
        console.log(`   ⚠️  Blocked by: ${node.blockedBy}`);
      }
      if (node.enables) {
        console.log(`   ✅ Enables: ${node.enables.join(', ')}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Key insight: The tag system is simple but effective!');
  console.log('- Easy to understand and debug');
  console.log('- Claude handles the semantic translation');
  console.log('- Can evolve to JSON-LD frames when needed');
  console.log('- Keeps the core system simple\n');
}

runDemo().catch(console.error);
