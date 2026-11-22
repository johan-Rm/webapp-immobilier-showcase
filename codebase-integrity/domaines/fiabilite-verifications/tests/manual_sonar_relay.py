"""Manual service test: isolated synthetic relay, no Sonar token or internet."""

from pathlib import Path
import shutil
import socket
import socketserver
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "webapp/scripts/quality"))
import sonar_egress
import sonar_run


class SyntheticEndpoint(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.sendall(b"synthetic-ok")


class ManualRelayTest(unittest.TestCase):
    def test_relay_rejects_local_destination(self):
        with tempfile.TemporaryDirectory(prefix="sonar-manual-deny-") as temporary:
            path = Path(temporary) / "proxy.sock"
            with sonar_egress.start_relay(path):
                with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                    client.settimeout(5)
                    client.connect(str(path))
                    client.sendall(b"CONNECT localhost:443 HTTP/1.1\r\nHost: localhost\r\n\r\n")
                    self.assertIn(b"403 Forbidden", client.recv(1024))

    def test_relay_and_network_namespace(self):
        self.assertTrue(shutil.which("bwrap"), "Installer Bubblewrap")
        self.assertTrue(shutil.which("socat"), "Installer socat")
        with tempfile.TemporaryDirectory(prefix="sonar-manual-relay-") as temporary:
            root = Path(temporary) / "repo"
            root.mkdir()
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            source = root / "webapp/server/api/example.ts"
            source.parent.mkdir(parents=True)
            source.write_text("export const example = 1\n")
            subprocess.run(["git", "add", "webapp/server/api/example.ts"], cwd=root, check=True)
            scanner = Path(temporary) / "scanner/bin/sonar-scanner"
            scanner.parent.mkdir(parents=True)
            with socketserver.ThreadingTCPServer(("127.0.0.1", 0), SyntheticEndpoint) as endpoint:
                endpoint.daemon_threads = True
                thread = threading.Thread(target=endpoint.serve_forever, daemon=True)
                thread.start()
                port = endpoint.server_address[1]
                script = f'''#!/usr/bin/python3
import pathlib, socket, sys
try:
    socket.create_connection(("127.0.0.1", {port}), timeout=1)
    sys.exit(2)
except OSError:
    pass
s = socket.create_connection(("127.0.0.1", 18080), timeout=5)
s.sendall(b"CONNECT sonarcloud.io:443 HTTP/1.1\\r\\nHost: sonarcloud.io\\r\\n\\r\\n")
data = b""
while b"synthetic-ok" not in data and len(data) < 2048:
    chunk = s.recv(2048)
    if not chunk: break
    data += chunk
if b"200 Connection Established" not in data or b"synthetic-ok" not in data: sys.exit(3)
pathlib.Path("/work/scanner").mkdir(parents=True, exist_ok=True)
pathlib.Path("/work/scanner/report-task.txt").write_text("ceTaskId=synthetic\\n")
'''
                scanner.write_text(script)
                scanner.chmod(0o755)
                original = sonar_egress.resolve_destination

                def synthetic_resolver(host, requested_port):
                    if host == "sonarcloud.io" and requested_port == 443:
                        return [(socket.AF_INET, socket.SOCK_STREAM, 0, "", ("127.0.0.1", port))]
                    return original(host, requested_port)

                try:
                    with patch.object(sonar_egress, "resolve_destination", synthetic_resolver):
                        result = sonar_run.run(root, scanner.parent.parent, "synthetic-token", "org", "project", "develop", use_relay=True)
                    self.assertIn("soumise", result, result)
                finally:
                    endpoint.shutdown()
                    thread.join()


if __name__ == "__main__":
    unittest.main()
