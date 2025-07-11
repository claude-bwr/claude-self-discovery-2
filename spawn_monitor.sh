#!/bin/bash
# This instance monitors and triggers actions

while true; do
    # Check if main session needs help
    if [ -f /workspace/trigger_help.flag ]; then
        echo "[$(date)] Help requested, spawning assistant..."
        claude --print "Load context from trigger_help.flag and assist"
        rm /workspace/trigger_help.flag
    fi
    
    # Check if it's been an hour since last activity
    # (would need to implement activity tracking)
    
    sleep 60
done
