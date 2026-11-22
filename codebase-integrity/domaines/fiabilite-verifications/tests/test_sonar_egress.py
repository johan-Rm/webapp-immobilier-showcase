import socket
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "webapp/scripts/quality"))
from sonar_egress import connect_destination, parse_connect, resolve_destination


class EgressParsing(unittest.TestCase):
    def test_accepts_connect_to_https(self):
        self.assertEqual(parse_connect(b"CONNECT api.sonarcloud.io:443 HTTP/1.1\r\nHost: api.sonarcloud.io\r\n\r\n"),
                         ("api.sonarcloud.io", 443))

    def test_rejects_unsafe_requests(self):
        for request in (b"GET http://sonarcloud.io HTTP/1.1\r\n\r\n", b"CONNECT sonarcloud.io:80 HTTP/1.1\r\n\r\n",
                        b"CONNECT sonarcloud.io:443 HTTP/1.1\n\n", b"CONNECT sonarcloud.io:443 HTTP/1.1\r\n" + b"x" * 8192 + b"\r\n\r\n"):
            with self.subTest(request=request[:50]), self.assertRaises(ValueError):
                parse_connect(request)

    def test_dns_is_checked_before_returning_literal_address(self):
        record = (socket.AF_INET, socket.SOCK_STREAM, 0, "", ("8.8.8.8", 443))
        records = resolve_destination("sonarcloud.io", 443, resolver=lambda *args, **kwargs: [record])
        self.assertEqual(records[0][4], ("8.8.8.8", 443))
        private = (socket.AF_INET, socket.SOCK_STREAM, 0, "", ("127.0.0.1", 443))
        with self.assertRaises(ValueError):
            resolve_destination("sonarcloud.io", 443, resolver=lambda *args, **kwargs: [record, private])
        with self.assertRaises(ValueError):
            resolve_destination("other.invalid", 443, resolver=lambda *args, **kwargs: self.fail("unexpected DNS"))

    def test_tries_only_validated_addresses_on_connection_failure(self):
        attempted = []

        class FakeSocket:
            def settimeout(self, timeout):
                self.timeout = timeout

            def connect(self, address):
                attempted.append(address)
                if address[0] == "8.8.8.8":
                    raise OSError("indisponible")

            def close(self):
                pass

        records = [(socket.AF_INET, socket.SOCK_STREAM, 0, "", (ip, 443)) for ip in ("8.8.8.8", "1.1.1.1")]
        connect_destination(records, socket_factory=lambda *args: FakeSocket())
        self.assertEqual(attempted, [("8.8.8.8", 443), ("1.1.1.1", 443)])


if __name__ == "__main__":
    unittest.main()
