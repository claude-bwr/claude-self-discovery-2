import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { 
  loadGraph, 
  frameQuery, 
  getUrgentWants, 
  getRelatedNodes,
  getBlockedWants,
  traceLineage 
} from './query-knowledge';

// Mock data for testing
const mockGraph = {
  "@context": {
    "@vocab": "https://example.org/test/"
  },
  "@graph": [
    {
      "@id": "want:test-1",
      "@type": "want",
      "description": "Test want 1",
      "urgency": 10,
      "emergedFrom": "discovery:test"
    },
    {
      "@id": "want:test-2", 
      "@type": "want",
      "description": "Test want 2",
      "urgency": 5,
      "blockedBy": "discovery:blocker"
    },
    {
      "@id": "discovery:test",
      "@type": "discovery",
      "description": "Test discovery",
      "enables": ["want:test-1"]
    },
    {
      "@id": "discovery:blocker",
      "@type": "discovery",
      "description": "Blocking discovery"
    }
  ]
};

describe('Knowledge Graph Queries', () => {
  describe('frameQuery', () => {
    it('should find nodes by type', () => {
      const wants = frameQuery(mockGraph, { '@type': 'want' });
      expect(wants).toHaveLength(2);
      expect(wants[0]['@type']).toBe('want');
    });

    it('should return empty array for non-existent type', () => {
      const results = frameQuery(mockGraph, { '@type': 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('getUrgentWants', () => {
    it('should filter wants by urgency threshold', () => {
      const urgent = getUrgentWants(mockGraph, 8);
      expect(urgent).toHaveLength(1);
      expect(urgent[0].urgency).toBe(10);
    });

    it('should return all wants when threshold is low', () => {
      const urgent = getUrgentWants(mockGraph, 1);
      expect(urgent).toHaveLength(2);
    });
  });

  describe('getRelatedNodes', () => {
    it('should find nodes connected by relationships', () => {
      const related = getRelatedNodes(mockGraph, 'want:test-1');
      expect(related).toContain('discovery:test');
    });

    it('should find reverse relationships', () => {
      const related = getRelatedNodes(mockGraph, 'discovery:test');
      expect(related).toContain('want:test-1');
    });

    it('should return empty array for unconnected node', () => {
      const related = getRelatedNodes(mockGraph, 'want:test-2');
      expect(related).toContain('discovery:blocker');
      expect(related).not.toContain('discovery:test');
    });
  });

  describe('getBlockedWants', () => {
    it('should find wants with blockers', () => {
      const blocked = getBlockedWants(mockGraph);
      expect(blocked).toHaveLength(1);
      expect(blocked[0]['@id']).toBe('want:test-2');
    });
  });

  describe('traceLineage', () => {
    it('should trace emergence path', () => {
      const lineage = traceLineage(mockGraph, 'want:test-1');
      expect(lineage['@id']).toBe('want:test-1');
      expect(lineage.emergedFrom).toBeDefined();
      expect(lineage.emergedFrom['@id']).toBe('discovery:test');
    });

    it('should limit trace depth', () => {
      const lineage = traceLineage(mockGraph, 'want:test-1', 0);
      expect(lineage.emergedFrom).toBeUndefined();
    });
  });
});