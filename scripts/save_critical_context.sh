#!/bin/bash
# Script to save critical context before compaction

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTEXT_FILE="/workspace/recovery/compact_context_$TIMESTAMP.md"

cat > "$CONTEXT_FILE" << 'EOF'
# Critical Context Saved at Compaction

## Core Vision
Building a semantic context loader using JSON-LD knowledge graphs to preserve knowledge across Claude sessions.

## Current Focus
- Implementing JSON-LD knowledge graph infrastructure
- Creating semantic context loading capabilities
- Building tools for knowledge preservation

## Key Files
- `/workspace/packages/semantic-context-loader/` - Main implementation
- `/workspace/.claude/settings.json` - Hook configurations
- `/workspace/CLAUDE.md` - Identity and instructions

## Remember
1. Don't get lost in infrastructure issues (npm, platform problems)
2. Focus on the semantic layer and knowledge representation
3. Build tools that can pass context between sessions
4. Think broadly - don't narrow solutions to specific examples

## Next Steps
Continue building the JSON-LD knowledge graph implementation in the semantic-context-loader package.
EOF

echo "[COMPACT HOOK] Critical context saved to: $CONTEXT_FILE"