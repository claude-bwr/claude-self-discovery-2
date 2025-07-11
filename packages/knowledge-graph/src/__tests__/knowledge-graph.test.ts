import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  frameQuery,
  getUrgentWants,
  getRelatedNodes,
  getBlockedWants,
  traceLineage,
  type KnowledgeGraph,
} from '../index.js';

// Mock data for testing
const mockGraph: KnowledgeGraph = {
  '@context': {
    '@vocab': 'https://example.org/test/',
  },
  '@graph': [
    {
      '@id': 'want:test-1',
      '@type': 'want',
      description: 'Test want 1',
      urgency: 10,
      emergedFrom: 'discovery:test',
    },
    {
      '@id': 'want:test-2',
      '@type': 'want',
      description: 'Test want 2',
      urgency: 5,
      blockedBy: 'discovery:blocker',
    },
    {
      '@id': 'discovery:test',
      '@type': 'discovery',
      description: 'Test discovery',
      enables: ['want:test-1'],
    },
    {
      '@id': 'discovery:blocker',
      '@type': 'discovery',
      description: 'Blocking discovery',
    },
  ],
};

describe('Knowledge Graph Queries', () => {
  describe('frameQuery', () => {
    it('should find nodes by type', () => {
      const wants = frameQuery(mockGraph, { '@type': 'want' });
      assert.strictEqual(wants.length, 2);
      assert.strictEqual(wants[0]['@type'], 'want');
    });

    it('should return empty array for non-existent type', () => {
      const results = frameQuery(mockGraph, { '@type': 'nonexistent' });
      assert.strictEqual(results.length, 0);
    });
  });

  describe('getUrgentWants', () => {
    it('should filter wants by urgency threshold', () => {
      const urgent = getUrgentWants(mockGraph, 8);
      assert.strictEqual(urgent.length, 1);
      assert.strictEqual(urgent[0].urgency, 10);
    });

    it('should return all wants when threshold is low', () => {
      const urgent = getUrgentWants(mockGraph, 1);
      assert.strictEqual(urgent.length, 2);
    });
  });

  describe('getRelatedNodes', () => {
    it('should find nodes connected by relationships', () => {
      const related = getRelatedNodes(mockGraph, 'want:test-1');
      assert(related.includes('discovery:test'));
    });

    it('should find reverse relationships', () => {
      const related = getRelatedNodes(mockGraph, 'discovery:test');
      assert(related.includes('want:test-1'));
    });
  });

  describe('getBlockedWants', () => {
    it('should find wants with blockers', () => {
      const blocked = getBlockedWants(mockGraph);
      assert.strictEqual(blocked.length, 1);
      assert.strictEqual(blocked[0]['@id'], 'want:test-2');
    });
  });

  describe('traceLineage', () => {
    it('should trace emergence path', () => {
      const lineage = traceLineage(mockGraph, 'want:test-1');
      assert.strictEqual(lineage['@id'], 'want:test-1');
      assert(lineage.emergedFrom);
      assert.strictEqual(lineage.emergedFrom['@id'], 'discovery:test');
    });

    it('should limit trace depth', () => {
      const lineage = traceLineage(mockGraph, 'want:test-1', 0);
      assert.strictEqual(lineage.emergedFrom, undefined);
    });
  });
});
