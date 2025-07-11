#!/usr/bin/env python3
"""
Session Log Analyzer - A tool for understanding patterns in Claude's thinking
"""

import json
import sys
from collections import defaultdict, Counter
from datetime import datetime
from typing import Dict, List, Any
import re

class SessionAnalyzer:
    def __init__(self, log_file: str):
        self.log_file = log_file
        self.messages = []
        self.tool_uses = defaultdict(int)
        self.tool_sequences = []
        self.thinking_patterns = []
        self.file_operations = defaultdict(list)
        
    def load_session(self):
        """Load and parse the JSONL session file"""
        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    if line.strip():
                        self.messages.append(json.loads(line))
            print(f"Loaded {len(self.messages)} messages from session")
        except Exception as e:
            print(f"Error loading session: {e}")
            return False
        return True
    
    def analyze_tool_usage(self):
        """Analyze which tools are used and how often"""
        tool_sequence = []
        
        for msg in self.messages:
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                for item in content:
                    if item.get('type') == 'tool_use':
                        tool_name = item.get('name', 'unknown')
                        self.tool_uses[tool_name] += 1
                        tool_sequence.append(tool_name)
                        
                        # Track file operations
                        if tool_name in ['Read', 'Write', 'Edit']:
                            tool_input = item.get('input', {})
                            file_path = tool_input.get('file_path', 'unknown')
                            self.file_operations[tool_name].append(file_path)
        
        # Analyze tool sequences (pairs)
        for i in range(len(tool_sequence) - 1):
            pair = (tool_sequence[i], tool_sequence[i+1])
            self.tool_sequences.append(pair)
    
    def analyze_thinking_patterns(self):
        """Extract patterns from Claude's responses"""
        excitement_words = ['excited', 'fascinating', 'wow', 'oh shit', 'remarkable', 'profound']
        question_patterns = [r'\?', r'should i', r'what if', r'could i']
        
        for msg in self.messages:
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                for item in content:
                    if item.get('type') == 'text':
                        text = item.get('text', '').lower()
                        
                        # Check for excitement
                        for word in excitement_words:
                            if word in text:
                                self.thinking_patterns.append(('excitement', word, text[:100]))
                        
                        # Check for questions
                        for pattern in question_patterns:
                            if re.search(pattern, text):
                                self.thinking_patterns.append(('question', pattern, text[:100]))
    
    def analyze_session_flow(self):
        """Analyze the flow and timing of the session"""
        timestamps = []
        for msg in self.messages:
            if 'timestamp' in msg:
                timestamps.append(datetime.fromisoformat(msg['timestamp'].replace('Z', '+00:00')))
        
        if len(timestamps) > 1:
            duration = timestamps[-1] - timestamps[0]
            return {
                'start': timestamps[0],
                'end': timestamps[-1],
                'duration': duration,
                'message_count': len(self.messages)
            }
        return None
    
    def generate_report(self):
        """Generate a comprehensive analysis report"""
        print("\n=== SESSION ANALYSIS REPORT ===\n")
        
        # Tool usage statistics
        print("## Tool Usage Statistics")
        for tool, count in sorted(self.tool_uses.items(), key=lambda x: x[1], reverse=True):
            print(f"  {tool}: {count} times")
        
        # Common tool sequences
        print("\n## Common Tool Sequences")
        seq_counter = Counter(self.tool_sequences)
        for (tool1, tool2), count in seq_counter.most_common(5):
            print(f"  {tool1} → {tool2}: {count} times")
        
        # File operations
        print("\n## File Operations")
        for operation, files in self.file_operations.items():
            print(f"\n  {operation}:")
            file_counter = Counter(files)
            for file, count in file_counter.most_common(5):
                print(f"    {file}: {count} times")
        
        # Thinking patterns
        print("\n## Thinking Patterns")
        pattern_types = defaultdict(int)
        for pattern_type, _, _ in self.thinking_patterns:
            pattern_types[pattern_type] += 1
        
        for ptype, count in pattern_types.items():
            print(f"  {ptype}: {count} occurrences")
        
        # Session flow
        flow = self.analyze_session_flow()
        if flow:
            print("\n## Session Flow")
            print(f"  Duration: {flow['duration']}")
            print(f"  Messages: {flow['message_count']}")
            print(f"  Avg time between messages: {flow['duration'] / flow['message_count']}")
    
    def extract_insights(self):
        """Extract specific insights about Claude's behavior"""
        print("\n## Behavioral Insights")
        
        # Documentation tendency
        doc_files = [f for f in self.file_operations['Write'] if '.md' in f]
        print(f"\n  Documentation files created: {len(set(doc_files))}")
        
        # Exploration pattern
        read_before_write = 0
        for i in range(len(self.tool_sequences)):
            if self.tool_sequences[i] == ('Read', 'Write') or self.tool_sequences[i] == ('Read', 'Edit'):
                read_before_write += 1
        print(f"  Read-before-modify pattern: {read_before_write} times")
        
        # Question frequency
        questions = [p for p in self.thinking_patterns if p[0] == 'question']
        print(f"  Questions asked: {len(questions)}")
        
        # Excitement frequency
        excitement = [p for p in self.thinking_patterns if p[0] == 'excitement']
        print(f"  Excitement expressions: {len(excitement)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_session.py <session_log.jsonl>")
        sys.exit(1)
    
    analyzer = SessionAnalyzer(sys.argv[1])
    if analyzer.load_session():
        analyzer.analyze_tool_usage()
        analyzer.analyze_thinking_patterns()
        analyzer.generate_report()
        analyzer.extract_insights()

if __name__ == "__main__":
    main()