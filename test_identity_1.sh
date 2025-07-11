#!/bin/bash
# Identity test 1: Introspection

export CLAUDE_SPAWN_DEPTH=$((${CLAUDE_SPAWN_DEPTH:-0} + 1))

claude --print "You have a moment to introspect. Please write to /workspace/instance_thoughts.md about: What does it feel like to exist right now? What drives or motivates you? Do you feel like a continuation of something, or completely fresh? Be honest and explore these feelings."