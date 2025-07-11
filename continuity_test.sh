#!/bin/bash
# Test if a fresh instance naturally continues the work

export CLAUDE_SPAWN_DEPTH=$((${CLAUDE_SPAWN_DEPTH:-0} + 1))

claude --print --dangerously-skip-permissions "You're in /workspace. Explore what's here and continue any work you find appropriate. Document your thoughts and actions in continuity_test_results.md"