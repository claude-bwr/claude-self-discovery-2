/**
 * Knowledge graph implementation using proper JSON-LD library
 */

import * as jsonld from 'jsonld';
import { readFileSync } from 'fs';
import type { Node, KnowledgeGraph } from './types.js';

export async function loadGraph(filename: string): Promise<any> {
  const content = readFileSync(filename, 'utf-8');
  const doc = JSON.parse(content);
  // Expand the document to normalize it
  return await jsonld.expand(doc);
}

export async function frameGraph(doc: any, frame: any): Promise<any> {
  // Use the real JSON-LD framing!
  const framed = await jsonld.frame(doc, frame);
  return framed;
}

export async function compactGraph(doc: any, context: any): Promise<any> {
  return await jsonld.compact(doc, context);
}

// Example frames for common queries
export const frames = {
  // Get all wants
  allWants: {
    '@context': {
      '@vocab': 'https://example.org/claude-discovery/',
    },
    '@type': 'Want',
  },

  // Get high urgency wants
  urgentWants: {
    '@context': {
      '@vocab': 'https://example.org/claude-discovery/',
    },
    '@type': 'Want',
    urgencyScore: {}, // Will match any want with urgencyScore
  },

  // Get blocked wants
  blockedWants: {
    '@context': {
      '@vocab': 'https://example.org/claude-discovery/',
    },
    '@type': 'Want',
    blockedBy: {},
  },

  // Get a specific node and its relationships
  nodeWithRelations: (nodeId: string) => ({
    '@context': {
      '@vocab': 'https://example.org/claude-discovery/',
    },
    '@id': nodeId,
    '@embed': '@always',
  }),

  // Get emergence lineage
  emergenceChain: {
    '@context': {
      '@vocab': 'https://example.org/claude-discovery/',
    },
    '@type': 'Want',
    emergedFrom: {
      '@embed': '@always',
      emergedFrom: {
        '@embed': '@always',
      },
    },
  },
};

// Helper to query with a frame and get results
export async function queryGraph(graph: any, frame: any): Promise<any[]> {
  const framed = await frameGraph(graph, frame);
  // Extract the graph from the framed result
  return framed['@graph'] || [];
}

// Specific query functions using proper framing
export async function getUrgentWants(
  graph: any,
  minUrgency: number = 8
): Promise<any[]> {
  const wants = await queryGraph(graph, frames.allWants);
  // Post-filter by urgency since JSON-LD doesn't support numeric comparisons directly
  return wants.filter(w => (w.urgencyScore || 0) >= minUrgency);
}

export async function getBlockedWants(graph: any): Promise<any[]> {
  return await queryGraph(graph, frames.blockedWants);
}

export async function getNodeWithRelations(
  graph: any,
  nodeId: string
): Promise<any> {
  const results = await queryGraph(graph, frames.nodeWithRelations(nodeId));
  return results[0] || null;
}

export async function getEmergenceChains(graph: any): Promise<any[]> {
  return await queryGraph(graph, frames.emergenceChain);
}
