#!/bin/bash
# Self-triggering daemon experiment

INTERVAL=3600  # 1 hour in seconds
WORKSPACE="/workspace"

while true; do
    echo "[$(date)] Daemon wake cycle starting..."
    
    # Check wants.json for highest urgency
    if [ -f "$WORKSPACE/wants.json" ]; then
        # This is where we'd trigger a new Claude session
        # For now, just log what we would do
        echo "[$(date)] Would trigger: claude --print 'Load wants.json and work on highest urgency task'"
    fi
    
    sleep $INTERVAL
done
