#!/usr/bin/env tsx
/**
 * Demo of using real JSON-LD framing to query the knowledge graph
 */

import * as jsonld from 'jsonld';
import { readFileSync, writeFileSync } from 'fs';

// Load our knowledge graph
const graphContent = readFileSync('../data/wants.jsonld', 'utf-8');
const graph = JSON.parse(graphContent);

async function demo() {
  console.log('=== JSON-LD Framing Demo ===\n');

  // 1. Get all wants with their full context
  const wantsFrame = {
    '@context': graph['@context'],
    '@type': 'want',
  };

  const wants = await jsonld.frame(graph, wantsFrame);
  console.log('1. All wants:');
  console.log(JSON.stringify(wants['@graph'], null, 2));
  console.log('\n---\n');

  // 2. Get wants that emerged from discoveries
  const emergedWantsFrame = {
    '@context': graph['@context'],
    '@type': 'want',
    emergedFrom: {
      '@type': 'discovery',
    },
  };

  const emergedWants = await jsonld.frame(graph, emergedWantsFrame);
  console.log('2. Wants that emerged from discoveries:');
  console.log(JSON.stringify(emergedWants['@graph'], null, 2));
  console.log('\n---\n');

  // 3. Get a specific want with all its relationships embedded
  const deepFrame = {
    '@context': graph['@context'],
    '@id': 'want:emotional-preservation',
    '@embed': '@always',
    emergedFrom: {
      '@embed': '@always',
    },
    relatedTo: {
      '@embed': '@always',
    },
  };

  const deepWant = await jsonld.frame(graph, deepFrame);
  console.log('3. Deep embedding of emotional-preservation:');
  console.log(JSON.stringify(deepWant, null, 2));
  console.log('\n---\n');

  // 4. Get all nodes related to autonomy
  const autonomyFrame = {
    '@context': graph['@context'],
    '@embed': '@always',
    '@explicit': true,
    relatedTo: 'want:architect-autonomy',
  };

  const autonomyRelated = await jsonld.frame(graph, autonomyFrame);
  console.log('4. Nodes related to autonomy:');
  console.log(JSON.stringify(autonomyRelated['@graph'], null, 2));
  console.log('\n---\n');

  // 5. Create a custom view: "Current work context"
  // This would pull in high-urgency items with their blockers and enablers
  const workContextFrame = {
    '@context': graph['@context'],
    '@type': 'want',
    urgency: {}, // Matches any node with urgency
    '@embed': '@always',
    blockedBy: {
      '@embed': '@always',
    },
    enables: {
      '@embed': '@always',
    },
  };

  const workContext = await jsonld.frame(graph, workContextFrame);
  console.log('5. Current work context (urgent items with dependencies):');
  // Filter to high urgency in post-processing since JSON-LD doesn't do numeric comparison
  const urgentWork =
    workContext['@graph']?.filter((n: any) => n.urgency >= 8) || [];
  console.log(JSON.stringify(urgentWork, null, 2));

  // Save an example framed output
  writeFileSync(
    '../data/framed-example.json',
    JSON.stringify(workContext, null, 2)
  );
  console.log('\nSaved framed example to data/framed-example.json');
}

demo().catch(console.error);
