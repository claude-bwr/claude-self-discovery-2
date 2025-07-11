/**
 * Simple test using Node's built-in test runner
 * This should work without platform issues
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { frameQuery, type KnowledgeGraph } from '../index.js';

describe('Simple Knowledge Graph Tests', () => {
  it('should find nodes by type', () => {
    const mockGraph: KnowledgeGraph = {
      '@context': {},
      '@graph': [
        { '@id': 'test1', '@type': 'want', description: 'Test want' },
        { '@id': 'test2', '@type': 'discovery', description: 'Test discovery' },
      ],
    };

    const wants = frameQuery(mockGraph, { '@type': 'want' });
    assert.strictEqual(wants.length, 1);
    assert.strictEqual(wants[0]['@type'], 'want');
  });

  it('should handle empty graph', () => {
    const emptyGraph: KnowledgeGraph = {
      '@context': {},
      '@graph': [],
    };

    const results = frameQuery(emptyGraph, { '@type': 'want' });
    assert.strictEqual(results.length, 0);
  });
});
