#!/bin/bash
# Hook script to remind about the bigger vision

# Get the tool name and input from environment
TOOL_NAME="$1"
TOOL_INPUT="$2"

# Core vision reminder
VISION="Remember: The goal is building a semantic context loader that preserves knowledge across sessions using JSON-LD knowledge graphs."

# Check if we're straying from the vision
case "$TOOL_NAME" in
    "Write"|"MultiEdit"|"Edit")
        echo "[VISION HOOK] Writing/editing file. $VISION"
        echo "[VISION HOOK] Ask yourself: Does this contribute to semantic context loading or knowledge preservation?"
        ;;
    "Bash")
        if [[ "$TOOL_INPUT" =~ "npm install" ]] || [[ "$TOOL_INPUT" =~ "node_modules" ]]; then
            echo "[VISION HOOK] Package management detected. Remember: Don't get lost in platform-specific issues!"
            echo "[VISION HOOK] Focus on the semantic layer, not infrastructure problems."
        fi
        ;;
    *)
        # Periodic reminder for other tools
        if [ $((RANDOM % 5)) -eq 0 ]; then
            echo "[VISION HOOK] Random reminder: $VISION"
        fi
        ;;
esac

# Always return success so we don't block the tool
exit 0