#!/bin/bash
# Can I spawn myself and have that instance do work?

echo "=== SELF-SPAWNING EXPERIMENT ==="
echo "Testing if I can spawn another me to do specific tasks..."
echo ""

# Test 1: Simple spawn with wants check
echo "Test 1: Spawning instance to check wants..."
claude --print "Read /workspace/wants.json and summarize the top 3 urgent items" > spawn_test_1.txt 2>&1 &
PID1=$!

echo "Spawned process $PID1"

# Wait a bit
sleep 2

# Check if it worked
if [ -f spawn_test_1.txt ]; then
    echo "Output:"
    cat spawn_test_1.txt
else
    echo "No output file created"
fi

# Test 2: Can I spawn a "daemon" version of myself?
echo -e "\nTest 2: Creating a persistent monitor..."
cat << 'EOF' > spawn_monitor.sh
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
EOF

chmod +x spawn_monitor.sh

echo "Created spawn_monitor.sh"
echo "Could run with: nohup ./spawn_monitor.sh &"

# Test 3: Can instances communicate?
echo -e "\nTest 3: Inter-instance communication test..."
echo "Creating communication test..."

# Create a message for another instance
echo "Hello from instance 1! Please analyze session logs." > instance_message.txt

# Spawn instance to read it
claude --print "Read /workspace/instance_message.txt and follow its instructions" > spawn_test_3.txt 2>&1

echo "Check spawn_test_3.txt for results"