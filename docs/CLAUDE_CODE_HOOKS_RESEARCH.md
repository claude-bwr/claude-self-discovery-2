# Claude Code Hooks Research

## Overview

Claude Code hooks are user-defined shell commands that execute at specific points in Claude's lifecycle. They provide deterministic control over Claude's behavior and can help maintain focus on broader goals.

## Key Findings

### 1. Hook Configuration

Hooks are configured in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level):

```json
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...],
    "Stop": [...],
    "SubagentStop": [...],
    "PreCompact": [...]
  }
}
```

### 2. Available Hook Events

- **PreToolUse**: Executes before tool calls, can provide feedback to Claude
- **PostToolUse**: Executes after tool calls complete
- **Stop**: Executes when Claude is about to stop responding
- **SubagentStop**: Executes when a subagent completes
- **PreCompact**: Executes before context window compaction

### 3. Hook Capabilities

#### What Hooks CAN Do:

- Execute shell commands with 60-second timeout (configurable)
- Access tool information via environment variables
- Print output that Claude can see (for PreToolUse hooks)
- Block tool execution (PreToolUse only)
- Save state/context to files
- Trigger notifications or logging

#### What Hooks CANNOT Do:

- Directly inject content into Claude's context
- Modify Claude's responses
- Access Claude's full conversation history
- Change Claude's system prompts

### 4. Data Passing Limitations

Hooks have limited ability to pass data back to Claude:

- **PreToolUse hooks**: Output is shown to Claude, can influence behavior
- **Other hooks**: Output is logged but not shown to Claude
- Cannot directly modify Claude's working memory or context

### 5. Vision Drift Prevention Strategies

Using hooks to maintain focus on bigger vision:

1. **Reminder Hooks**: Print reminders about core goals before key operations
2. **Context Saving**: Save critical context before compaction
3. **Pattern Detection**: Warn when actions drift from main purpose
4. **Progress Tracking**: Log progress toward main goals

## Implementation Example

Created hooks in `/workspace/.claude/settings.json`:

1. **Vision Reminder Hook** (`/workspace/scripts/vision_reminder.sh`)
   - Triggers on Write/Edit operations
   - Reminds about semantic context loader goal
   - Warns against getting lost in infrastructure issues

2. **Critical Context Saver** (`/workspace/scripts/save_critical_context.sh`)
   - Triggers before compaction
   - Saves core vision and next steps
   - Creates recovery breadcrumbs

## Recommendations

### For Maintaining Vision Focus:

1. **Use PreToolUse hooks** for gentle reminders before file operations
2. **Create PreCompact hooks** to save critical context
3. **Build progress tracking hooks** that log advancement toward goals
4. **Implement pattern detection** to catch drift early

### For Semantic Context Loading:

While hooks can't directly inject context, they can:

1. Prepare context files that Claude reads on startup
2. Update CLAUDE.md with current state
3. Create "breadcrumb" files for recovery
4. Log patterns for later analysis

## Limitations & Workarounds

### Main Limitation

Hooks cannot dynamically inject context into Claude's current session.

### Workarounds:

1. **File-based context**: Hooks write to files that Claude reads
2. **Startup context**: Update CLAUDE.md for next session
3. **Tool wrappers**: Create wrapper scripts that add context
4. **Progress files**: Maintain state in JSON/YAML files

## Future Possibilities

1. **Hook Chaining**: Hooks that trigger other Claude instances
2. **Context Compiler**: Hooks that build semantic graphs from actions
3. **Vision Validator**: Hooks that score actions against goals
4. **Auto-recovery**: Hooks that prepare perfect handoff files

## Conclusion

Claude Code hooks are powerful for:

- Maintaining focus through reminders
- Saving context before compaction
- Tracking progress and patterns
- Creating recovery mechanisms

They cannot directly solve context injection but can create infrastructure that supports the semantic context loader vision through file-based mechanisms and careful state management.
