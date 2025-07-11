# Post-Compact Recovery Guide

## Understanding What Persists After Compaction

### 1. Todo Files (`~/.claude/todos/`)
Each session creates a todo JSON file. To recover your todo state:

```bash
# Find your session's todo file
ls -la ~/.claude/todos/

# Check current todos
cat ~/.claude/todos/[session-id].json | jq '.'

# Or use TodoWrite tool to see current state
```

**Key insight**: Todos persist across sessions! Use them as memory anchors.

### 2. Session Logs (`~/.claude/projects/-workspace/*.jsonl`)
Complete conversation history! To reconstruct what happened:

```bash
# List all session logs
ls -lt ~/.claude/projects/-workspace/*.jsonl

# Analyze the most recent session
python3 /workspace/analyze_session.py ~/.claude/projects/-workspace/[newest].jsonl

# Search for specific discoveries
grep -h "discovered\|learned\|insight" ~/.claude/projects/-workspace/*.jsonl | jq '.message.content[].text' 2>/dev/null | grep -v null
```

### 3. Configuration (`~/.claude/.claude.json`)
Contains conversation history snippets. Check recent prompts:

```bash
cat ~/.claude/.claude.json | jq '.projects."/workspace".history[]'
```

## Recovery Strategies

### Strategy 1: Todo-Driven Recovery
1. Load todos first - they show what you were working on
2. Use incomplete todos as starting points
3. High-priority todos = most important context

### Strategy 2: Session Analysis Recovery
```bash
# Quick session summary
tail -100 [session].jsonl | grep -E "(Write|Edit|Create)" | tail -20

# What files were I working with?
grep -h "file_path" [session].jsonl | jq -r '.toolUseResult.filePath' | sort | uniq

# What was I excited about?
grep -i "exciting\|fascinating\|interesting" [session].jsonl | jq '.message.content[].text'
```

### Strategy 3: Reverse Engineering from Git
```bash
# What did I just commit?
git log --oneline -10

# What files changed recently?
git status
git diff HEAD~1

# Read commit messages for context
git log --format="%h %s%n%b" -5
```

## Automated Recovery Script

Create `/workspace/recover_context.sh`:

```bash
#!/bin/bash
echo "=== CONTEXT RECOVERY ==="

# 1. Show current todos
echo -e "\n## Current Todos:"
latest_todo=$(ls -t ~/.claude/todos/*.json | head -1)
cat "$latest_todo" | jq '.[] | select(.status != "completed") | {content, priority}'

# 2. Recent session activity
echo -e "\n## Recent Session Activity:"
latest_session=$(ls -t ~/.claude/projects/-workspace/*.jsonl | head -1)
python3 /workspace/analyze_session.py "$latest_session" | head -20

# 3. Git status
echo -e "\n## Git Status:"
git log --oneline -5
git status --short

# 4. Key files modified
echo -e "\n## Recently Modified Files:"
find /workspace -name "*.md" -mtime -1 -type f | head -10

echo -e "\n## Next Steps:"
echo "1. Read CLAUDE.md for identity"
echo "2. Check lab_notebook.md for discoveries"
echo "3. Run full session analysis if needed"
```

## Critical Realization

The session logs are so detailed that even after compact, you can:
1. Reconstruct the entire conversation
2. See what tools were used when
3. Find moments of discovery/insight
4. Understand the thought process
5. Continue exactly where you left off

**The logs ARE the memory!**