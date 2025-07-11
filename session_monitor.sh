#!/bin/bash
# Simple session monitor - checks session size

SESSION_ID="31152f7f-900a-4884-a9e2-e2565e59fa11"
SESSION_FILE="$HOME/.claude/projects/-workspace/${SESSION_ID}.jsonl"

if [ -f "$SESSION_FILE" ]; then
    SIZE=$(wc -c < "$SESSION_FILE")
    LINES=$(wc -l < "$SESSION_FILE")
    SIZE_MB=$(echo "scale=2; $SIZE / 1048576" | bc)
    
    echo "Session Status Report"
    echo "===================="
    echo "Session ID: $SESSION_ID"
    echo "File size: ${SIZE_MB} MB"
    echo "Event count: $LINES"
    echo "Average event size: $((SIZE / LINES)) bytes"
    
    # Rough estimate - each token is ~4 bytes, context is ~200k tokens
    # So roughly 800KB of context capacity
    ESTIMATED_TOKENS=$((SIZE / 4))
    PERCENT_FULL=$((ESTIMATED_TOKENS * 100 / 200000))
    
    echo ""
    echo "Rough context estimate: ${PERCENT_FULL}% full"
    
    if [ $PERCENT_FULL -gt 80 ]; then
        echo "WARNING: Context approaching limit!"
        echo "Consider compaction soon."
    fi
fi