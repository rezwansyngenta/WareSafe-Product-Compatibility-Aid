#!/usr/bin/env python3
"""Development static server for the app with caching disabled.

The production app is served as static files; this helper exists only
so a local browser always sees the current stylesheet and script
during development.

Usage: python tools/dev_server.py [port]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP = Path(__file__).resolve().parent.parent / "app"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = partial(NoCacheHandler, directory=str(APP))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"WareSafe dev server: http://127.0.0.1:{port}/index.html")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
