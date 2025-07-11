#!/usr/bin/env node
/**
 * Demo of smart context loading
 */

import { SmartContextLoader, type ContextItem } from './context-loader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const graphPath = join(__dirname, '../data/wants.jsonld');

async function demo() {
  console.log('🧠 Smart Context Loader Demo\n');

  const loader = new SmartContextLoader(graphPath);

  // Query 1: What am I working on?
  console.log('Q: What am I working on?');
  const currentWork = await loader.queryContext({
    question: 'What am I working on?',
    maxItems: 3,
    includeFiles: true,
  });

  currentWork.forEach((item: ContextItem) => {
    console.log(`\n[${item.type}] Relevance: ${item.relevance}`);
    console.log(`Reason: ${item.reason}`);
    if (item.path) {
      console.log(`Path: ${item.path}`);
    }
    if (item.content && item.type === 'knowledge') {
      const node = JSON.parse(item.content);
      console.log(`Content: ${node.description || node['@id']}`);
    }
  });

  // Query 2: What's blocked?
  console.log('\n\nQ: What is blocked?');
  const blocked = await loader.queryContext({
    question: 'What is blocked?',
    maxItems: 3,
    includeFiles: false,
  });

  blocked.forEach((item: ContextItem) => {
    if (item.content) {
      const node = JSON.parse(item.content);
      console.log(`\n- ${node.description}`);
      console.log(`  Blocked by: ${node.blockedBy}`);
      console.log(`  Urgency: ${node.urgency}`);
    }
  });

  // Query 3: What's urgent?
  console.log('\n\nQ: What is urgent?');
  const urgent = await loader.queryContext({
    question: 'What is urgent?',
    maxItems: 3,
    includeFiles: false,
  });

  urgent.forEach((item: ContextItem) => {
    if (item.content) {
      const node = JSON.parse(item.content);
      console.log(`\n- ${node.description}`);
      console.log(`  Urgency: ${node.urgency}`);
      console.log(`  Why: ${node.why}`);
    }
  });

  // Generate startup context
  console.log('\n\n📄 Startup Context Summary:');
  console.log('─'.repeat(50));
  const summary = await loader.generateStartupContext();
  console.log(summary);
}

demo().catch(console.error);
