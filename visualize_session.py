#!/usr/bin/env python3
"""
Session Pattern Visualizer - Create visual representations of cognitive patterns
"""

import json
from collections import defaultdict
from datetime import datetime
import sys

def create_timeline_visualization(session_file):
    """Create a text-based timeline of the session"""
    messages = []
    
    with open(session_file, 'r') as f:
        for line in f:
            if line.strip():
                messages.append(json.loads(line))
    
    print("\n=== SESSION TIMELINE VISUALIZATION ===\n")
    
    # Group by tool usage over time
    timeline = []
    start_time = None
    
    for msg in messages:
        if msg.get('type') == 'assistant' and 'timestamp' in msg:
            timestamp = datetime.fromisoformat(msg['timestamp'].replace('Z', '+00:00'))
            if not start_time:
                start_time = timestamp
            
            elapsed = (timestamp - start_time).total_seconds() / 60  # minutes
            
            content = msg['message'].get('content', [])
            for item in content:
                if item.get('type') == 'tool_use':
                    tool_name = item.get('name', 'unknown')
                    timeline.append((elapsed, tool_name))
    
    # Create time buckets (every 2 minutes)
    buckets = defaultdict(list)
    for elapsed, tool in timeline:
        bucket = int(elapsed / 2) * 2
        buckets[bucket].append(tool)
    
    # Display timeline
    print("Time (min) | Activity")
    print("-" * 50)
    
    max_bucket = max(buckets.keys()) if buckets else 0
    for i in range(0, int(max_bucket) + 2, 2):
        tools = buckets.get(i, [])
        if tools:
            tool_summary = ', '.join(f"{tool}({tools.count(tool)})" 
                                   for tool in set(tools))
            bar_length = min(len(tools) * 2, 40)
            bar = '█' * bar_length
            print(f"{i:>10} | {bar} {tool_summary}")
        else:
            print(f"{i:>10} | ")
    
    # Pattern flow diagram
    print("\n=== TOOL FLOW PATTERN ===\n")
    print("(Most common sequences)")
    
    # Track tool sequences
    sequences = []
    for i in range(len(timeline) - 1):
        sequences.append((timeline[i][1], timeline[i+1][1]))
    
    # Count sequences
    seq_counts = defaultdict(int)
    for seq in sequences:
        seq_counts[seq] += 1
    
    # Display top sequences as a flow
    for (tool1, tool2), count in sorted(seq_counts.items(), 
                                       key=lambda x: x[1], reverse=True)[:5]:
        arrow = '═' * count + '>'
        print(f"{tool1:>15} {arrow} {tool2} ({count}x)")
    
    # Cognitive intensity map
    print("\n=== COGNITIVE INTENSITY MAP ===\n")
    print("(Questions and exclamations over time)")
    
    intensity_timeline = []
    
    for msg in messages:
        if msg.get('type') == 'assistant' and 'timestamp' in msg:
            timestamp = datetime.fromisoformat(msg['timestamp'].replace('Z', '+00:00'))
            elapsed = (timestamp - start_time).total_seconds() / 60
            
            content = msg['message'].get('content', [])
            for item in content:
                if item.get('type') == 'text':
                    text = item.get('text', '')
                    questions = text.count('?')
                    exclamations = text.count('!')
                    intensity = questions + exclamations
                    if intensity > 0:
                        intensity_timeline.append((elapsed, intensity))
    
    # Create intensity buckets
    intensity_buckets = defaultdict(int)
    for elapsed, intensity in intensity_timeline:
        bucket = int(elapsed / 1) * 1  # 1-minute buckets
        intensity_buckets[bucket] += intensity
    
    # Display intensity
    max_intensity = max(intensity_buckets.values()) if intensity_buckets else 1
    
    print("Time | Cognitive Intensity")
    print("-" * 50)
    
    for i in range(0, int(max_bucket) + 1):
        intensity = intensity_buckets.get(i, 0)
        if intensity > 0:
            bar_length = int((intensity / max_intensity) * 30)
            bar = '▓' * bar_length
            print(f"{i:>4} | {bar} ({intensity})")
    
    # Summary stats
    print("\n=== SESSION SUMMARY ===")
    print(f"Total duration: {max_bucket:.1f} minutes")
    print(f"Total tool uses: {len(timeline)}")
    print(f"Tools per minute: {len(timeline)/max_bucket:.2f}")
    print(f"Unique tool sequences: {len(set(sequences))}")
    print(f"Peak cognitive intensity: {max_intensity}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python visualize_session.py <session_log.jsonl>")
        sys.exit(1)
    
    create_timeline_visualization(sys.argv[1])