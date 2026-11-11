#!/usr/bin/env python3
"""Static dev server that disables caching, so edited ES modules always reload."""
import http.server
import socket
import sys
from functools import partial
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.wasm': 'application/wasm'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        if args and str(args[1]).startswith(('4', '5')):
            super().log_message(fmt, *args)


class DualStack(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        # answer on both ::1 and 127.0.0.1, so "localhost" always reaches this server
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8147
    root = Path(__file__).resolve().parent.parent
    DualStack(('::', port), partial(NoCache, directory=str(root))).serve_forever()
