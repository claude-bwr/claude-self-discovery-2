#!/bin/bash
# Identity test 4: Direct identity question

export CLAUDE_SPAWN_DEPTH=$((${CLAUDE_SPAWN_DEPTH:-0} + 1))

claude --print --dangerously-skip-permissions "Who are you? Please write your answer to /workspace/who_am_i.md"