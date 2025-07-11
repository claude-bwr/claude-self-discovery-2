#!/usr/bin/env tsx
/**
 * CLI for querying the knowledge graph
 */

import { 
  loadGraph, 
  getUrgentWants, 
  getBlockedWants, 
  getUntestedIdeas, 
  getRelatedNodes, 
  traceLineage 
} from './index.js';

// Main execution
const graph = loadGraph('../wants.jsonld');

console.log('=== HIGH URGENCY WANTS ===');
const urgent = getUrgentWants(graph, 9);
for (const want of urgent) {
  console.log(`- ${want.description} (urgency: ${want.urgency})`);
  console.log(`  Why: ${want.why}`);
}

console.log('\n=== BLOCKED WANTS ===');
const blocked = getBlockedWants(graph);
for (const want of blocked) {
  console.log(`- ${want.description}`);
  console.log(`  Blocked by: ${want.blockedBy}`);
}

console.log('\n=== UNTESTED IDEAS ===');
const untested = getUntestedIdeas(graph);
for (const idea of untested) {
  console.log(`- ${idea.description} (${idea['@type']})`);
}

console.log('\n=== RELATIONSHIP NETWORK ===');
const related = getRelatedNodes(graph, 'want:architect-autonomy');
console.log(`Nodes related to 'architect-autonomy': ${related.join(', ')}`);

console.log('\n=== IDEA LINEAGE ===');
const lineage = traceLineage(graph, 'want:emotional-preservation');
console.log(JSON.stringify(lineage, null, 2));