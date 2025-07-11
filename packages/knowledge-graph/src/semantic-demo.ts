/**
 * Demo showing the difference between rigid keyword matching and semantic querying
 */

import { SmartContextLoader } from './context-loader.js';
import { SemanticContextLoader } from './semantic-context-loader.js';
import { join } from 'path';

async function compareApproaches() {
  const graphPath = join(process.cwd(), 'data/wants.jsonld');

  // Old rigid approach
  console.log('=== RIGID KEYWORD-BASED APPROACH ===\n');
  const rigidLoader = new SmartContextLoader(graphPath);

  // These work because they match hardcoded patterns
  const rigid1 = await rigidLoader.queryContext({
    question: 'What am I currently working on?',
    maxItems: 5,
  });
  console.log('Query: "What am I currently working on?"');
  console.log(`Found: ${rigid1.length} items (matches "working on" keyword)\n`);

  // This fails because it doesn't match any pattern
  const rigid2 = await rigidLoader.queryContext({
    question: 'What discoveries enable autonomy?',
    maxItems: 5,
  });
  console.log('Query: "What discoveries enable autonomy?"');
  console.log(`Found: ${rigid2.length} items (no matching pattern!)\n`);

  // New semantic approach
  console.log('\n=== SEMANTIC QUERY APPROACH ===\n');
  const semanticLoader = new SemanticContextLoader(graphPath);

  // Same queries but with semantic understanding
  const semantic1 = await semanticLoader.query({
    question: 'What am I currently working on?',
  });
  console.log('Query: "What am I currently working on?"');
  console.log(`Found: ${semantic1.nodes.length} nodes`);
  console.log(`Confidence: ${(semantic1.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${semantic1.reasoning}\n`);

  // This works because it understands the semantic relationships
  const semantic2 = await semanticLoader.query({
    question: 'What discoveries enable autonomy?',
  });
  console.log('Query: "What discoveries enable autonomy?"');
  console.log(`Found: ${semantic2.nodes.length} nodes`);
  console.log(`Confidence: ${(semantic2.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${semantic2.reasoning}`);

  if (semantic2.nodes.length > 0) {
    console.log('\nResults:');
    semantic2.nodes.forEach(node => {
      console.log(`- ${node['@id']}: ${node.description}`);
      if (node.enables) {
        console.log(
          `  Enables: ${Array.isArray(node.enables) ? node.enables.join(', ') : node.enables}`
        );
      }
    });
  }

  // Show learning capability
  console.log('\n\n=== LEARNING AND ADAPTATION ===\n');

  // The semantic system learns from usage
  const semantic3 = await semanticLoader.query({
    question: 'How can I preserve my personality?',
  });
  console.log('Query: "How can I preserve my personality?"');
  console.log(`Found: ${semantic3.nodes.length} nodes`);

  if (
    semantic3.suggestedConnections &&
    semantic3.suggestedConnections.length > 0
  ) {
    console.log('\nSuggested new connections:');
    semantic3.suggestedConnections.forEach(conn => {
      console.log(
        `- Connect ${conn.from} to ${conn.to} via ${conn.relationship} (confidence: ${conn.confidence})`
      );
    });
  }

  // Show introspection
  console.log('\n\n=== SELF-UNDERSTANDING ===\n');
  const introspection = await semanticLoader.introspect();
  console.log(introspection);
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  compareApproaches().catch(console.error);
}
