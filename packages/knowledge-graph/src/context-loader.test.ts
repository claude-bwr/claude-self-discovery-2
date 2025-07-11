import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SmartContextLoader } from './context-loader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDataPath = join(__dirname, '../data/wants.jsonld');

describe('SmartContextLoader', () => {
  it('should load and query current work', async () => {
    const loader = new SmartContextLoader(testDataPath);
    const items = await loader.queryContext({
      question: 'What am I working on?',
      includeFiles: false,
    });

    // Debug output
    console.log('Found items:', items);

    // Should find at least some items
    assert.ok(items.length > 0, 'Should find some context items');

    // Items should have required properties
    items.forEach(item => {
      assert.ok(item.type, 'Item should have type');
      assert.ok(item.relevance >= 0, 'Item should have relevance score');
      assert.ok(item.reason, 'Item should have reason');
    });
  });

  it('should find blocked items', async () => {
    const loader = new SmartContextLoader(testDataPath);
    const items = await loader.queryContext({
      question: 'What is blocked?',
      includeFiles: false,
    });

    // Check that we find the autonomy want that's blocked
    const blockedContent = items.map(i => i.content).join('');
    assert.ok(
      blockedContent.includes('architect-autonomy'),
      'Should find blocked autonomy want'
    );
  });

  it('should find urgent items', async () => {
    const loader = new SmartContextLoader(testDataPath);
    const items = await loader.queryContext({
      question: 'What is urgent?',
      includeFiles: false,
    });

    // Should find high urgency items
    const hasHighUrgency = items.some(item => {
      if (item.content) {
        const node = JSON.parse(item.content);
        return (node.urgency || 0) >= 8;
      }
      return false;
    });

    assert.ok(hasHighUrgency, 'Should find high urgency items');
  });

  it('should expand context through relationships', async () => {
    const loader = new SmartContextLoader(testDataPath);
    const items = await loader.queryContext({
      question: 'What am I working on?',
      traversalDepth: 2,
      includeFiles: true,
    });

    // Should include file recommendations
    const fileItems = items.filter(i => i.type === 'file');
    assert.ok(fileItems.length > 0, 'Should recommend relevant files');

    // Should always include CLAUDE.md
    const hasClaude = fileItems.some(i => i.path?.includes('CLAUDE.md'));
    assert.ok(hasClaude, 'Should include CLAUDE.md as always relevant');
  });

  it('should generate startup context summary', async () => {
    const loader = new SmartContextLoader(testDataPath);
    const summary = await loader.generateStartupContext();

    assert.ok(
      summary.includes('## Current Context'),
      'Should have context header'
    );
    assert.ok(
      summary.includes('### Active Work') ||
        summary.includes('### Relevant Files'),
      'Should have section headers'
    );
  });
});
