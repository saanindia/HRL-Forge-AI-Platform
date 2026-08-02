"""HRL Forge AI - Iteration 3 backend tests: wiring share + google auth."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

V1 = f"{BASE_URL}/api/v1"
TS = int(time.time())
EMAIL = f"hrl.qa.it3+{TS}@myhrl.in"
PWD = "Forge2026!"
NAME = "HRL QA IT3"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{V1}/auth/register",
                      json={"email": EMAIL, "password": PWD, "name": NAME}, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


SHARE_PAYLOAD = {
    "prompt": "Wire DHT22 to Arduino Uno",
    "board": "arduino-uno",
    "board_name": "Arduino Uno R3",
    "connections": [
        {"component": "DHT22", "pin": "DATA", "board_pin": "D2", "notes": "with 10k pull-up"}
    ],
    "bom": [{"name": "DHT22", "qty": 1, "notes": "Temp/Humidity"}],
    "libraries": ["DHT sensor library"],
    "notes": "Add a 10k pull-up between DATA and VCC.",
}


class TestWiringShare:
    def test_create_share_requires_auth(self):
        r = requests.post(f"{V1}/wiring/share", json=SHARE_PAYLOAD, timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_create_share_success(self, auth_headers):
        r = requests.post(f"{V1}/wiring/share", json=SHARE_PAYLOAD, headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("token")
        assert len(data["token"]) >= 8
        assert data["board"] == "arduino-uno"
        assert data["board_name"] == "Arduino Uno R3"
        assert data["view_count"] == 0
        assert len(data["connections"]) == 1
        pytest.share_token = data["token"]

    def test_public_get_share_no_auth_and_increments(self):
        tok = pytest.share_token
        # First public GET - no auth headers
        r1 = requests.get(f"{V1}/wiring/share/{tok}", timeout=15)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["token"] == tok
        assert d1["view_count"] == 1
        assert d1["prompt"] == SHARE_PAYLOAD["prompt"]

        # Second GET - view_count should increment
        r2 = requests.get(f"{V1}/wiring/share/{tok}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["view_count"] == 2

        # Should not leak _id (Pydantic will reject anyway, but confirm no mongodb _id)
        assert "_id" not in d1

    def test_unknown_token_404(self):
        r = requests.get(f"{V1}/wiring/share/nonexistenttoken123", timeout=15)
        assert r.status_code == 404


class TestGoogleAuth:
    def test_bogus_session_returns_401(self):
        r = requests.post(f"{V1}/auth/google", json={"session_id": "bogus"}, timeout=30)
        assert r.status_code == 401, f"Expected 401 got {r.status_code}: {r.text}"
        detail = r.json().get("detail", "")
        assert "Invalid or expired session_id" in detail, f"Unexpected detail: {detail}"

    def test_missing_session_id_422(self):
        r = requests.post(f"{V1}/auth/google", json={}, timeout=15)
        assert r.status_code == 422


# ---- Quick regression smoke ----
class TestRegression:
    def test_login(self):
        r = requests.post(f"{V1}/auth/login", json={"email": EMAIL, "password": PWD}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("access_token")

    def test_boards(self):
        r = requests.get(f"{V1}/boards", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_templates(self):
        r = requests.get(f"{V1}/templates", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_projects_and_history(self, auth_headers):
        r = requests.get(f"{V1}/projects", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{V1}/history", headers=auth_headers, timeout=15)
        assert r2.status_code == 200

    def test_sensors_modules(self):
        r = requests.get(f"{V1}/sensors", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 8
        r2 = requests.get(f"{V1}/modules", timeout=15)
        assert r2.status_code == 200 and len(r2.json()) >= 1
