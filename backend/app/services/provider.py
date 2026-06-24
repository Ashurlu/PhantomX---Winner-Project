"""Select the active provider by the admin-managed data_source setting.

Falls back to the .env DATA_SOURCE on first run (before the DB is seeded).
"""
from .. import db
from .live_provider import live_provider
from .mock_provider import mock_provider


def get_provider():
    try:
        source = db.get_data_source()
    except Exception:
        source = "mock"
    if source == "live":
        return live_provider
    # Use live pentest engine when URL is configured, even in mock data mode.
    try:
        if db.get_settings().get("pentest_base_url"):
            return live_provider
    except Exception:
        pass
    return mock_provider
