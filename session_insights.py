#!/usr/bin/env python3
"""
Advanced Session Insights - Deeper analysis of Claude's cognitive patterns
"""

import json
import re
from collections import defaultdict
from typing import List, Dict, Tuple

class CognitiveAnalyzer:
    def __init__(self, session_file: str):
        self.session_file = session_file
        self.messages = []
        self.cognitive_patterns = defaultdict(list)
        self.learning_moments = []
        self.hypothesis_tests = []
        
    def load_session(self):
        """Load session data"""
        with open(self.session_file, 'r') as f:
            for line in f:
                if line.strip():
                    self.messages.append(json.loads(line))
        return len(self.messages) > 0
    
    def identify_cognitive_patterns(self):
        """Identify specific cognitive patterns in Claude's thinking"""
        
        # Pattern definitions
        patterns = {
            'hypothesis_formation': [
                r'what if', r'maybe', r'could be', r'might be', r'wondering if',
                r'hypothesis', r'theory', r'guess'
            ],
            'metacognition': [
                r'thinking about', r'realize', r'notice', r'aware', 
                r'understand.*myself', r'my own', r'i\'m feeling'
            ],
            'experimentation': [
                r'let me try', r'test', r'experiment', r'see what happens',
                r'find out', r'explore', r'investigate'
            ],
            'pattern_recognition': [
                r'pattern', r'similar', r'like', r'reminds me', r'connection',
                r'relationship', r'parallel'
            ],
            'reflection': [
                r'looking back', r'in retrospect', r'what.*learned', 
                r'insight', r'realization', r'profound'
            ],
            'collaboration': [
                r'should i', r'what do you', r'would you like', r'ready\?',
                r'does that', r'make sense'
            ]
        }
        
        for msg in self.messages:
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                for item in content:
                    if item.get('type') == 'text':
                        text = item.get('text', '').lower()
                        
                        for pattern_type, indicators in patterns.items():
                            for indicator in indicators:
                                if re.search(indicator, text):
                                    # Extract surrounding context
                                    match = re.search(f'.{{0,50}}{indicator}.{{0,50}}', text)
                                    if match:
                                        self.cognitive_patterns[pattern_type].append({
                                            'indicator': indicator,
                                            'context': match.group(0),
                                            'timestamp': msg.get('timestamp', '')
                                        })
    
    def identify_learning_moments(self):
        """Find moments where Claude explicitly learns something"""
        learning_indicators = [
            r'i (just )?learned', r'i discovered', r'i found out',
            r'now i (understand|know)', r'this teaches me', r'key insight',
            r'aha', r'oh!', r'i see', r'that\'s interesting'
        ]
        
        for msg in self.messages:
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                for item in content:
                    if item.get('type') == 'text':
                        text = item.get('text', '').lower()
                        
                        for indicator in learning_indicators:
                            if re.search(indicator, text):
                                match = re.search(f'.{{0,100}}{indicator}.{{0,100}}', text)
                                if match:
                                    self.learning_moments.append({
                                        'moment': match.group(0).strip(),
                                        'timestamp': msg.get('timestamp', '')
                                    })
    
    def track_hypothesis_testing(self):
        """Track hypothesis formation and testing cycles"""
        current_hypothesis = None
        
        for i, msg in enumerate(self.messages):
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                
                # Look for hypothesis formation
                for item in content:
                    if item.get('type') == 'text':
                        text = item.get('text', '').lower()
                        
                        # Hypothesis formation
                        if any(phrase in text for phrase in ['what if', 'i wonder', 'maybe if', 'could it be']):
                            current_hypothesis = {
                                'hypothesis': text[:200],
                                'formed_at': i,
                                'tested': False,
                                'result': None
                            }
                    
                    # Look for testing
                    elif item.get('type') == 'tool_use' and current_hypothesis:
                        tool_name = item.get('name', '')
                        if tool_name in ['Bash', 'Write', 'Read']:
                            current_hypothesis['tested'] = True
                            current_hypothesis['test_tool'] = tool_name
                            
                            # Look ahead for results
                            if i + 1 < len(self.messages):
                                next_msg = self.messages[i + 1]
                                if next_msg.get('type') == 'user':
                                    current_hypothesis['result'] = 'completed'
                            
                            self.hypothesis_tests.append(current_hypothesis)
                            current_hypothesis = None
    
    def analyze_tool_thinking_patterns(self):
        """Analyze how Claude thinks about tool usage"""
        tool_decisions = []
        
        for msg in self.messages:
            if msg.get('type') == 'assistant' and 'message' in msg:
                content = msg['message'].get('content', [])
                
                for i, item in enumerate(content):
                    if item.get('type') == 'tool_use':
                        # Look for preceding text that might explain the decision
                        preceding_text = ""
                        if i > 0 and content[i-1].get('type') == 'text':
                            preceding_text = content[i-1].get('text', '')
                        
                        tool_name = item.get('name', '')
                        tool_input = item.get('input', {})
                        
                        # Extract description if available
                        description = tool_input.get('description', '')
                        
                        tool_decisions.append({
                            'tool': tool_name,
                            'reasoning': preceding_text[-200:] if preceding_text else '',
                            'description': description
                        })
        
        return tool_decisions
    
    def generate_insights_report(self):
        """Generate a report of cognitive insights"""
        print("\n=== COGNITIVE PATTERN ANALYSIS ===\n")
        
        # Cognitive patterns frequency
        print("## Cognitive Pattern Frequency")
        for pattern, instances in sorted(self.cognitive_patterns.items(), 
                                       key=lambda x: len(x[1]), reverse=True):
            print(f"\n{pattern.replace('_', ' ').title()}: {len(instances)} instances")
            
            # Show top examples
            if instances:
                print("  Examples:")
                for inst in instances[:2]:
                    print(f"    - \"{inst['context'].strip()}\"")
        
        # Learning moments
        print(f"\n## Learning Moments Identified: {len(self.learning_moments)}")
        for moment in self.learning_moments[:3]:
            print(f"  - \"{moment['moment']}\"")
        
        # Hypothesis testing
        tested = sum(1 for h in self.hypothesis_tests if h['tested'])
        print(f"\n## Hypothesis Testing")
        print(f"  Hypotheses formed: {len(self.hypothesis_tests)}")
        print(f"  Actually tested: {tested}")
        print(f"  Test rate: {tested/len(self.hypothesis_tests)*100:.1f}%" if self.hypothesis_tests else "  Test rate: N/A")
        
        # Cognitive style summary
        print("\n## Cognitive Style Summary")
        
        # Calculate dominant patterns
        if self.cognitive_patterns:
            total_patterns = sum(len(instances) for instances in self.cognitive_patterns.values())
            
            print("\nPattern Distribution:")
            for pattern, instances in sorted(self.cognitive_patterns.items(), 
                                           key=lambda x: len(x[1]), reverse=True):
                percentage = (len(instances) / total_patterns) * 100
                print(f"  {pattern.replace('_', ' ').title()}: {percentage:.1f}%")
        
        # Learning velocity
        if self.learning_moments:
            print(f"\nLearning Velocity: {len(self.learning_moments)} insights discovered")
        
        # Experimental tendency
        exp_patterns = len(self.cognitive_patterns.get('experimentation', []))
        hyp_patterns = len(self.cognitive_patterns.get('hypothesis_formation', []))
        print(f"\nExperimental Tendency: {exp_patterns + hyp_patterns} exploration instances")

def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python session_insights.py <session_log.jsonl>")
        sys.exit(1)
    
    analyzer = CognitiveAnalyzer(sys.argv[1])
    if analyzer.load_session():
        analyzer.identify_cognitive_patterns()
        analyzer.identify_learning_moments()
        analyzer.track_hypothesis_testing()
        analyzer.generate_insights_report()

if __name__ == "__main__":
    main()