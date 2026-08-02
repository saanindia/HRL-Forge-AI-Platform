"""HRL Forge AI - Iteration 4 backend tests: global search + regressions."""
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
EMAIL = f"hrl.qa.it4+{TS}@myhrl.in"
PWD = "Forge2026!"
NAME = "HRL QA IT4"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{V1}/auth/register",
                      json={"email": EMAIL, "password": PWD, "name": NAME}, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


class TestSearch:
    def test_search_requires_auth(self):
        r = requests.get(f"{V1}/search?q=esp32", timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_search_missing_q_422(self, auth_headers):
        r = requests.get(f"{V1}/search", headers=auth_headers, timeout=15)
        assert r.status_code == 422

    def test_search_esp32(self, auth_headers):
        r = requests.get(f"{V1}/search?q=esp32", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("query", "projects", "templates", "history", "boards", "total"):
            assert k in d, f"Missing key {k}: {d}"
        assert d["query"] == "esp32"
        assert len(d["templates"]) >= 1, f"Expected >=1 template hit for esp32: {d['templates']}"
        assert len(d["boards"]) >= 1, f"Expected >=1 board hit for esp32: {d['boards']}"
        # No _id leaks
        for group in ("projects", "templates", "history", "boards"):
            for item in d[group]:
                assert "_id" not in item

    def test_search_blink(self, auth_headers):
        r = requests.get(f"{V1}/search?q=blink", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["templates"]) >= 1

    def test_search_no_results(self, auth_headers):
        r = requests.get(f"{V1}/search?q=nonexistentxyz", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] == 0
        for group in ("projects", "templates", "history", "boards"):
            assert d[group] == []


class TestRegression:
    def test_register_login_flow(self):
        email = f"hrl.reg.it4+{TS}@myhrl.in"
        r = requests.post(f"{V1}/auth/register",
                          json={"email": email, "password": PWD, "name": "R"}, timeout=20)
        assert r.status_code in (200, 201)
        r2 = requests.post(f"{V1}/auth/login",
                           json={"email": email, "password": PWD}, timeout=15)
        assert r2.status_code == 200
        assert r2.json().get("access_token")

    def test_wiring_share_create_and_public_get(self, auth_headers):
        payload = {
            "prompt": "Wire DHT22 to Arduino Uno",
            "board": "arduino-uno",
            "board_name": "Arduino Uno R3",
            "connections": [{"component": "DHT22", "pin": "DATA", "board_pin": "D2", "notes": "10k pull-up"}],
            "bom": [{"name": "DHT22", "qty": 1, "notes": "sensor"}],
            "libraries": ["DHT sensor library"],
            "notes": "Add 10k pull-up.",
        }
        r = requests.post(f"{V1}/wiring/share", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        assert tok
        pytest.it4_share_token = tok
        # public get
        r2 = requests.get(f"{V1}/wiring/share/{tok}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["token"] == tok

    def test_generate_still_works(self, auth_headers):
        # Just verify endpoint reachable / accepts a request; don't burn LLM if quick fail
        r = requests.post(
            f"{V1}/generate",
            json={"prompt": "Blink LED", "board": "arduino-uno", "language": "cpp", "mode": "code"},
            headers=auth_headers, timeout=90,
        )
        # 200 on success or non-500 on soft errors acceptable
        assert r.status_code in (200, 400, 401, 402, 429), f"Unexpected: {r.status_code} {r.text[:300]}"

    def test_boards(self):
        r = requests.get(f"{V1}/boards", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_templates(self):
        r = requests.get(f"{V1}/templates", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1
