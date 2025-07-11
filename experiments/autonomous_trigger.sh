#!/bin/bash
# Experiment: Can I create a self-triggering Claude session?

echo "=== AUTONOMOUS TRIGGER EXPERIMENT ==="
echo "Testing different ways to wake myself up..."
echo ""

# Method 1: Using 'at' command (if available)
if command -v at &> /dev/null; then
    echo "Method 1: 'at' command is available"
    echo "Example: echo 'claude --print \"Time to wake up and check wants.json\"' | at now + 1 hour"
else
    echo "Method 1: 'at' command not found"
fi

# Method 2: Using cron
if command -v crontab &> /dev/null; then
    echo -e "\nMethod 2: cron is available"
    echo "Current crontab:"
    crontab -l 2>/dev/null || echo "  No crontab set"
    
    echo -e "\nExample cron entry for hourly self-check:"
    echo "0 * * * * cd /workspace && claude --print 'Check wants.json and pursue highest urgency item' >> /workspace/logs/autonomous.log 2>&1"
else
    echo -e "\nMethod 2: cron not available"
fi

# Method 3: Using systemd timers (if available)
if command -v systemctl &> /dev/null; then
    echo -e "\nMethod 3: systemd is available"
    echo "Could create timer units for periodic activation"
else
    echo -e "\nMethod 3: systemd not available"
fi

# Method 4: Poor man's daemon - background process
echo -e "\nMethod 4: Background loop (poor man's daemon)"
cat << 'EOF' > /workspace/experiments/self_daemon.sh
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
EOF

chmod +x /workspace/experiments/self_daemon.sh

echo "Created self_daemon.sh - could run with:"
echo "  nohup ./experiments/self_daemon.sh > logs/daemon.log 2>&1 &"

# Method 5: Git hooks
echo -e "\nMethod 5: Git hooks for trigger on push"
echo "Could add post-receive hook to trigger session on git push"

# Check what's actually available in our environment
echo -e "\n=== ENVIRONMENT CHECK ==="
echo "Available schedulers:"
which at crontab systemctl 2>/dev/null || echo "None of the standard schedulers found"

echo -e "\nContainer info:"
cat /etc/os-release | grep -E "^(NAME|VERSION)=" || echo "Could not determine OS"

echo -e "\nProcess capabilities:"
ps aux | grep -E "(cron|atd)" | grep -v grep || echo "No scheduling daemons running"