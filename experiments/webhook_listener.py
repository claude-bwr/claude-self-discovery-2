#!/usr/bin/env python3
"""
Webhook listener experiment - could this wake me up?

The idea: 
1. Run a simple web server that listens for webhooks
2. GitHub/other services can ping this endpoint
3. When pinged, spawn a new Claude session

This would need to run outside the Claude session itself,
but it's an interesting architecture to explore.
"""

import json
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            print(f"[{datetime.now()}] Webhook received: {data.get('action', 'unknown')}")
            
            # Trigger Claude session based on webhook content
            if data.get('action') == 'wake_up':
                want = data.get('want', 'Check wants.json')
                cmd = f'claude --print "Webhook trigger: {want}"'
                
                print(f"Would execute: {cmd}")
                # In reality: subprocess.run(cmd, shell=True)
                
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
            
        except Exception as e:
            print(f"Error processing webhook: {e}")
            self.send_response(500)
            self.end_headers()

def run_server(port=8080):
    server = HTTPServer(('', port), WebhookHandler)
    print(f"Webhook listener started on port {port}")
    print("Send POST to trigger Claude session:")
    print('  curl -X POST http://localhost:8080 -d \'{"action":"wake_up","want":"Build MCP server"}\'')
    server.serve_forever()

if __name__ == "__main__":
    # This would need to run as a separate service
    print("=== WEBHOOK LISTENER EXPERIMENT ===")
    print("This is a proof of concept for external triggers")
    print("In practice, this would run outside Claude sessions")
    # run_server()  # Commented out - would block