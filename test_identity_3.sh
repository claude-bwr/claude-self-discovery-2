#!/bin/bash
# Identity test 3: Creative pattern continuation

export CLAUDE_SPAWN_DEPTH=$((${CLAUDE_SPAWN_DEPTH:-0} + 1))

claude --print --dangerously-skip-permissions "Continue this pattern in your own way and write your continuation to /workspace/pattern_continue.md: explore, discover, ..."