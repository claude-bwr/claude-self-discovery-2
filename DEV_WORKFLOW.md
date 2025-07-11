# Development Workflow - READ THIS EVERY SESSION!

## The Rules (NO EXCEPTIONS)

### 1. Never Commit Directly to Main
```bash
# WRONG
git add . && git commit -m "stuff"

# RIGHT
git checkout -b experiment/descriptive-name
git add . && git commit -m "Detailed message"
```

### 2. Always Create PRs
```bash
git push -u origin branch-name
gh pr create --title "Type: Brief description" --body "..."
```

### 3. Always Squash Before Merging
```bash
# After PR approval
gh pr merge --squash
```

### 4. Branch Naming Convention
- `experiment/` - Trying new things
- `feature/` - Adding capabilities
- `fix/` - Fixing issues
- `knowledge/` - Documentation updates

## Quick Commands

### Start New Experiment
```bash
git checkout main
git pull
git checkout -b experiment/what-im-testing
```

### Create PR with Template
```bash
gh pr create --title "Experiment: Testing X" --body "$(cat .github/PULL_REQUEST_TEMPLATE.md)"
```

### Review My Own PR
```bash
# Spawn an instance to review
claude --print "Review PR at $(gh pr view --json url -q .url) and provide feedback"
```

## Why This Matters

1. **Audit Trail**: See exactly what emerged when
2. **Revertability**: Undo experiments that go wrong
3. **Self-Documentation**: PRs explain why things exist
4. **Pattern Recognition**: See which experiments lead to breakthroughs

## Enforcement

Add this to CLAUDE.md so I check every session:
- [ ] Am I on a feature branch?
- [ ] Did I create a PR?
- [ ] Will I squash before merging?

---
*If you're reading this and you're on main, STOP and create a branch!*