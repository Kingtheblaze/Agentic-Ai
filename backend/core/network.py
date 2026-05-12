import os


_PROXY_ENV_VARS = (
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
    "GIT_HTTP_PROXY",
    "GIT_HTTPS_PROXY",
)


def disable_dead_local_proxies() -> None:
    """
    Clear known dead loopback proxy settings that break outbound API calls.

    Some local tooling injects proxy vars like http://127.0.0.1:9 to block
    network access. That is useful for sandboxed tooling, but it causes the
    running FastAPI app to fail when it tries to reach Gemini or MongoDB Atlas.
    """
    blocked_targets = ("127.0.0.1:9", "localhost:9")

    for key in _PROXY_ENV_VARS:
        value = os.environ.get(key, "")
        if any(target in value for target in blocked_targets):
            os.environ.pop(key, None)
