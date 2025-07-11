#!/usr/bin/env tsx
/**
 * Quick test to show real JSON-LD library working
 */

import * as jsonld from 'jsonld';
import { readFileSync } from 'fs';

async function test() {
  console.log('=== Testing Real JSON-LD Library ===\n');

  // Load our knowledge graph
  const graph = JSON.parse(readFileSync('../data/wants.jsonld', 'utf-8'));

  // 1. Simple frame - get all wants
  const wantsFrame = {
    '@context': graph['@context'],
    '@type': 'want',
  };

  const wants = await jsonld.frame(graph, wantsFrame);
  console.log(`Found ${wants['@graph']?.length || 0} wants\n`);

  // 2. Frame with embedding - get a want and its relationships
  const embeddedFrame = {
    '@context': graph['@context'],
    '@id': 'want:architect-autonomy',
    '@embed': '@always',
  };

  const embedded = await jsonld.frame(graph, embeddedFrame);
  console.log('Architect autonomy want with relationships:');
  console.log(JSON.stringify(embedded, null, 2));
}

test().catch(console.error);
