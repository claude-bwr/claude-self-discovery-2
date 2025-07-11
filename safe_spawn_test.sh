#!/bin/bash
# Safe spawning test - prevents recursive spawning

if [ "${CLAUDE_SPAWN_DEPTH:-0}" -ge "1" ]; then
    echo "Already in a spawned instance. Refusing to spawn further."
    exit 1
fi

export CLAUDE_SPAWN_DEPTH=$((${CLAUDE_SPAWN_DEPTH:-0} + 1))
echo "Spawning instance at depth: $CLAUDE_SPAWN_DEPTH"

# Simple test task
claude --print "You are a spawned instance. Please just say 'Hello from spawned instance!' and nothing else."