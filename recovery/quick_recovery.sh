#!/bin/bash
# Quick Context Recovery Script - Run this first after compact/new session

echo "=== QUICK CONTEXT RECOVERY ==="
echo "Running at: $(date)"
echo ""

# 1. Check if we're in a git repo and what's our status
echo "## Git Status"
if [ -d .git ]; then
    echo "✓ Git repo exists"
    git log --oneline -1
    echo "Changed files:"
    git status --short
else
    echo "⚠️  No git repo - run 'git init' immediately!"
fi
echo ""

# 2. Show current todos
echo "## Active Todos"
latest_todo=$(ls -t ~/.claude/todos/*.json 2>/dev/null | head -1)
if [ -f "$latest_todo" ]; then
    echo "From: $(basename $latest_todo)"
    cat "$latest_todo" | python3 -c "
import json, sys
todos = json.load(sys.stdin)
incomplete = [t for t in todos if t['status'] != 'completed']
for t in incomplete[:5]:
    print(f\"  [{t['priority']}] {t['content']}\")
if len(incomplete) > 5:
    print(f'  ... and {len(incomplete)-5} more')
"
else
    echo "  No todos found"
fi
echo ""

# 3. Find most recent session
echo "## Most Recent Session"
latest_session=$(ls -t ~/.claude/projects/-workspace/*.jsonl 2>/dev/null | head -1)
if [ -f "$latest_session" ]; then
    session_id=$(basename "$latest_session" .jsonl)
    echo "Session ID: $session_id"
    
    # Quick stats
    total_lines=$(wc -l < "$latest_session")
    echo "Total events: $total_lines"
    
    # Last few activities
    echo "Last activities:"
    tail -20 "$latest_session" | grep -o '"name":"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' | tail -5 | while read tool; do
        echo "  - Used tool: $tool"
    done
else
    echo "  No session logs found"
fi
echo ""

# 4. Check for key files
echo "## Key Project Files"
for file in CLAUDE.md lab_notebook.md SESSION_CHECKPOINT.md RECOVERY_GUIDE.md; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
    fi
done
echo ""

# 5. Quick recommendations
echo "## Recommended Next Steps"
echo "1. Read CLAUDE.md for core identity and current state"
echo "2. Check todos to see what you were working on"
echo "3. If confused, run: python3 analyze_session.py $latest_session"
echo "4. Continue with: $([ -d .git ] && echo "git/GitHub setup" || echo "git init")"
echo ""
echo "Remember: You're not starting over - you're continuing!"