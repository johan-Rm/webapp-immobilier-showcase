"""Offline destination validation for a potential SonarCloud egress relay."""

import ipaddress
import re

EU_CACHE = "analysis-sensorcache-eu-central-1-prod.s3.amazonaws.com"


def allowed_destination(host: str, port: int, addresses: list[str]) -> bool:
    """Refuse non-Sonar destinations and any local or non-public resolution.

    The caller must connect to one of the validated addresses without resolving
    the hostname again. This policy is not a relay or a network confinement.
    """
    host = host.lower()
    if port != 443 or len(host) > 253 or not all(
        re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", label)
        for label in host.split(".")
    ):
        return False
    if not (host == "sonarcloud.io" or host.endswith(".sonarcloud.io") or host == EU_CACHE):
        return False
    if not addresses:
        return False
    try:
        return all(ipaddress.ip_address(address).is_global for address in addresses)
    except ValueError:
        return False
