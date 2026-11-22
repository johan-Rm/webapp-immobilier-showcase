import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "webapp/scripts/quality"))
from sonar_egress_policy import allowed_destination


class SonarEgressPolicy(unittest.TestCase):
    def test_allows_only_known_https_destinations(self):
        for hostname in ("sonarcloud.io", "api.sonarcloud.io", "analysis-sensorcache-eu-central-1-prod.s3.amazonaws.com"):
            with self.subTest(hostname=hostname):
                self.assertTrue(allowed_destination(hostname, 443, ["8.8.8.8"]))

    def test_refuses_other_hosts_and_ports(self):
        for host, port in (("sonarcloud.io.evil.invalid", 443), ("evil.invalid", 443),
                           ("sonarcloud.io", 80), ("127.0.0.1", 443), (".sonarcloud.io", 443),
                           ("api..sonarcloud.io", 443)):
            with self.subTest(host=host, port=port):
                self.assertFalse(allowed_destination(host, port, ["8.8.8.8"]))

    def test_refuses_local_private_and_mixed_resolution(self):
        for addresses in ([], ["127.0.0.1"], ["::1"], ["::ffff:127.0.0.1"], ["10.0.0.2"], ["169.254.169.254"],
                          ["8.8.8.8", "192.168.1.1"], ["not-an-ip"]):
            with self.subTest(addresses=addresses):
                self.assertFalse(allowed_destination("sonarcloud.io", 443, addresses))


if __name__ == "__main__":
    unittest.main()
