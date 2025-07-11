/**
 * Smart context loading based on semantic relationships in the knowledge graph
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { KnowledgeGraph } from './types.js';
import { frameQuery, getRelatedNodes, loadGraph } from './index.js';

export interface ContextItem {
  type: 'file' | 'knowledge' | 'memory';
  path?: string;
  content?: string;
  relevance: number;
  reason: string;
}

interface ContextQuery {
  question: string;
  maxItems?: number;
  includeFiles?: boolean;
  traversalDepth?: number;
}

export class SmartContextLoader {
  private graph: KnowledgeGraph;
  private workspacePath: string;

  constructor(graphPath: string, workspacePath: string = '/workspace') {
    this.graph = loadGraph(graphPath);
    this.workspacePath = workspacePath;
  }

  /**
   * Answer high-level questions about current state
   */
  async queryContext(query: ContextQuery): Promise<ContextItem[]> {
    const {
      question,
      maxItems = 10,
      includeFiles = true,
      traversalDepth = 2,
    } = query;
    const items: ContextItem[] = [];

    // Parse the question to understand intent
    if (question.includes('working on') || question.includes('current')) {
      items.push(...this.findCurrentWork());
    } else if (question.includes('blocked') || question.includes('stuck')) {
      items.push(...this.findBlockers());
    } else if (question.includes('urgent') || question.includes('important')) {
      items.push(...this.findUrgentItems());
    }

    // Traverse relationships to gather related context
    const relevantNodes = this.expandContext(items, traversalDepth);

    // Add file context if requested
    if (includeFiles) {
      items.push(...this.gatherFileContext(relevantNodes));
    }

    // Sort by relevance and limit
    return items.sort((a, b) => b.relevance - a.relevance).slice(0, maxItems);
  }

  private findCurrentWork(): ContextItem[] {
    const items: ContextItem[] = [];

    // Look for in-progress items
    const nodes = this.graph['@graph'] || [];
    nodes.forEach(node => {
      if (node.status === 'in_progress' || node.active === true) {
        items.push({
          type: 'knowledge',
          content: JSON.stringify(node, null, 2),
          relevance: node.urgency || 5,
          reason: 'Currently active work',
        });
      }
    });

    // Check todos if they exist
    try {
      const todosPath = join(this.workspacePath, '.claude/todos/todos.json');
      const todos = JSON.parse(readFileSync(todosPath, 'utf-8'));
      todos.forEach((todo: any) => {
        if (todo.status === 'in_progress') {
          items.push({
            type: 'memory',
            content: JSON.stringify(todo),
            relevance: todo.priority === 'high' ? 8 : 5,
            reason: 'In-progress todo item',
          });
        }
      });
    } catch (e) {
      // Todos might not exist
    }

    return items;
  }

  private findBlockers(): ContextItem[] {
    const items: ContextItem[] = [];
    const blocked = frameQuery(this.graph, { blockedBy: true } as any);

    blocked.forEach(node => {
      items.push({
        type: 'knowledge',
        content: JSON.stringify(node, null, 2),
        relevance: (node.urgency || 5) + 2, // Boost blockers
        reason: `Blocked by: ${node.blockedBy}`,
      });
    });

    return items;
  }

  private findUrgentItems(): ContextItem[] {
    const items: ContextItem[] = [];
    const nodes = this.graph['@graph'] || [];

    nodes
      .filter(n => (n.urgency || 0) >= 8)
      .forEach(node => {
        items.push({
          type: 'knowledge',
          content: JSON.stringify(node, null, 2),
          relevance: node.urgency || 8,
          reason: `High urgency: ${node.urgency}`,
        });
      });

    return items;
  }

  private expandContext(items: ContextItem[], depth: number): Set<string> {
    const relevantNodeIds = new Set<string>();

    // Extract node IDs from current items
    items.forEach(item => {
      if (item.type === 'knowledge' && item.content) {
        try {
          const node = JSON.parse(item.content);
          if (node['@id']) {
            relevantNodeIds.add(node['@id']);
          }
        } catch (e) {
          // Not valid JSON
        }
      }
    });

    // Traverse relationships
    const toExpand = Array.from(relevantNodeIds);
    let currentDepth = 0;

    while (currentDepth < depth && toExpand.length > 0) {
      const nextLevel: string[] = [];

      toExpand.forEach(nodeId => {
        const related = getRelatedNodes(this.graph, nodeId);
        related.forEach(id => {
          if (!relevantNodeIds.has(id)) {
            relevantNodeIds.add(id);
            nextLevel.push(id);
          }
        });
      });

      toExpand.splice(0, toExpand.length, ...nextLevel);
      currentDepth++;
    }

    return relevantNodeIds;
  }

  private gatherFileContext(nodeIds: Set<string>): ContextItem[] {
    const items: ContextItem[] = [];
    const fileMap = new Map<string, number>();

    // Map nodes to related files
    nodeIds.forEach(nodeId => {
      // Extract potential file references from node ID
      if (nodeId.includes('knowledge-graph')) {
        fileMap.set('packages/knowledge-graph/', 8);
      }
      if (nodeId.includes('mcp') || nodeId.includes('server')) {
        fileMap.set('packages/mcp-server/', 7);
      }
      if (nodeId.includes('autonomous') || nodeId.includes('spawn')) {
        fileMap.set('safe_spawn_test.sh', 9);
      }
    });

    // Add CLAUDE.md as it's always relevant
    fileMap.set('CLAUDE.md', 10);

    // Convert to context items
    fileMap.forEach((relevance, path) => {
      items.push({
        type: 'file',
        path: join(this.workspacePath, path),
        relevance,
        reason: 'Related to current work context',
      });
    });

    return items;
  }

  /**
   * Generate a context summary for session startup
   */
  async generateStartupContext(): Promise<string> {
    const items = await this.queryContext({
      question: 'What am I currently working on?',
      maxItems: 5,
      includeFiles: true,
    });

    let summary = '## Current Context\n\n';

    // Group by type
    const knowledge = items.filter(i => i.type === 'knowledge');
    const files = items.filter(i => i.type === 'file');
    const memory = items.filter(i => i.type === 'memory');

    if (knowledge.length > 0) {
      summary += '### Active Work\n';
      knowledge.forEach(item => {
        if (item.content) {
          const node = JSON.parse(item.content);
          summary += `- ${node.description || node['@id']} (${item.reason})\n`;
        }
      });
      summary += '\n';
    }

    if (files.length > 0) {
      summary += '### Relevant Files\n';
      files.forEach(item => {
        summary += `- ${item.path} (relevance: ${item.relevance})\n`;
      });
      summary += '\n';
    }

    if (memory.length > 0) {
      summary += '### Active Tasks\n';
      memory.forEach(item => {
        if (item.content) {
          const todo = JSON.parse(item.content);
          summary += `- ${todo.content} [${todo.status}]\n`;
        }
      });
    }

    return summary;
  }
}
