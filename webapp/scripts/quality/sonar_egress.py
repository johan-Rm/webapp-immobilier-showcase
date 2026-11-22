"""Ephemeral CONNECT relay; destinations are checked before connecting."""

from contextlib import contextmanager
import os
from pathlib import Path
import re
import select
import socket
import socketserver
import threading

from sonar_egress_policy import allowed_destination

MAX_HEADER = 8192


def parse_connect(header: bytes) -> tuple[str, int]:
    if len(header) > MAX_HEADER or not header.endswith(b"\r\n\r\n"):
        raise ValueError("requête proxy invalide")
    try:
        first = header.split(b"\r\n", 1)[0].decode("ascii")
    except UnicodeDecodeError as error:
        raise ValueError("requête proxy invalide") from error
    match = re.fullmatch(r"CONNECT ([A-Za-z0-9.-]+):(443) HTTP/1\.[01]", first)
    if not match:
        raise ValueError("destination proxy invalide")
    return match.group(1).lower(), int(match.group(2))


def resolve_destination(host: str, port: int, resolver=socket.getaddrinfo):
    if not allowed_destination(host, port, ["8.8.8.8"]):
        raise ValueError("destination interdite")
    records = resolver(host, port, type=socket.SOCK_STREAM)
    addresses = [record[4][0] for record in records]
    if not allowed_destination(host, port, addresses):
        raise ValueError("adresse non publique")
    return records


def relay_data(first: socket.socket, second: socket.socket) -> None:
    sockets = (first, second)
    while True:
        readable, _, _ = select.select(sockets, [], [], 60)
        if not readable:
            return
        for source in readable:
            data = source.recv(65536)
            if not data:
                return
            (second if source is first else first).sendall(data)


def connect_destination(records, socket_factory=socket.socket):
    for family, kind, protocol, _, address in records:
        try:
            upstream = socket_factory(family, kind, protocol)
        except OSError:
            continue
        try:
            upstream.settimeout(10)
            upstream.connect(address)
            return upstream
        except OSError:
            upstream.close()
    raise OSError("destinations injoignables")


class RelayHandler(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.settimeout(10)
        header = b""
        try:
            while b"\r\n\r\n" not in header and len(header) <= MAX_HEADER:
                chunk = self.request.recv(1024)
                if not chunk:
                    return
                header += chunk
            boundary = header.find(b"\r\n\r\n") + 4
            host, port = parse_connect(header[:boundary])
            records = resolve_destination(host, port)
            with connect_destination(records) as upstream:
                self.request.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
                if header[boundary:]:
                    upstream.sendall(header[boundary:])
                self.request.settimeout(30)
                upstream.settimeout(30)
                relay_data(self.request, upstream)
        except (OSError, ValueError):
            try:
                self.request.sendall(b"HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n")
            except OSError:
                pass


class RelayServer(socketserver.ThreadingUnixStreamServer):
    daemon_threads = True


@contextmanager
def start_relay(path: Path):
    """Bind only a newly created socket in the caller's private temporary directory."""
    if path.exists() or path.is_symlink():
        raise ValueError("socket déjà présente")
    with RelayServer(str(path), RelayHandler) as server:
        os.chmod(path, 0o600)
        thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.1}, daemon=True)
        thread.start()
        try:
            yield
        finally:
            server.shutdown()
            thread.join()
            path.unlink()
