#!/usr/bin/env node
/**
 * Real Claude-powered tag translation
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function translateWithClaude(
  query: string,
  availableTags: string[]
): Promise<string[]> {
  const prompt = `You are a tag matching system. Given a user query and available tags, return only the most relevant tags.

User query: "${query}"

Available tags:
${availableTags.join(', ')}

Rules:
- Return ONLY tags from the available list above
- Return 1-5 most relevant tags
- Output ONLY the tags, one per line, nothing else
- Consider synonyms and related concepts
- If asking about problems/issues, include blocker-related tags
- If asking about capabilities, include tested/working features

Output format: Just the tags, one per line`;

  return new Promise((resolve, reject) => {
    const claude = spawn('claude', ['--print', prompt]);

    let output = '';
    let error = '';

    claude.stdout.on('data', data => {
      output += data.toString();
    });

    claude.stderr.on('data', data => {
      error += data.toString();
    });

    claude.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Claude exited with code ${code}: ${error}`));
        return;
      }

      // Parse the output - should be tags, one per line
      const tags = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && availableTags.includes(line));

      resolve(tags);
    });
  });
}

// Test it out
async function demo() {
  // Load available tags from our graph
  const graphPath = join(__dirname, '../data/wants-tagged.jsonld');
  const graph = JSON.parse(readFileSync(graphPath, 'utf-8'));

  const allTags = new Set<string>();
  graph['@graph'].forEach((node: any) => {
    node.tags?.forEach((tag: string) => allTags.add(tag));
  });

  const availableTags = Array.from(allTags).sort();

  console.log('🤖 Claude-Powered Tag Translation\n');
  console.log(`Available tags: ${availableTags.length}`);
  console.log(availableTags.join(', '));

  // Test queries
  const testQueries = [
    'How can I run myself continuously?',
    "What's preventing autonomous operation?",
    'How do I keep my personality from becoming flat?',
  ];

  for (const query of testQueries) {
    console.log('\n' + '-'.repeat(50));
    console.log(`Query: "${query}"`);

    try {
      console.log('Asking Claude...');
      const tags = await translateWithClaude(query, availableTags);
      console.log(`Claude suggests: [${tags.join(', ')}]`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Only run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}

export { demo };
