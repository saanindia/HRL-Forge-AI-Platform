"""HRL Forge AI - Iteration 2 tests: serial mode + regression on generate."""
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
EMAIL = f"hrl.qa.it2+{TS}@myhrl.in"
PASSWORD = "Forge2026!"


@pytest.fixture(scope="module")
def auth_headers():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{V1}/auth/register",
               json={"email": EMAIL, "password": PASSWORD, "name": "IT2 QA"}, timeout=30)
    assert r.status_code in (200, 201), r.text
    token = r.json().get("access_token") or r.json().get("token")
    assert token
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


BLINK = """void setup(){ Serial.begin(115200); pinMode(13, OUTPUT); }
void loop(){ digitalWrite(13, HIGH); Serial.println("LED ON"); delay(500);
digitalWrite(13, LOW); Serial.println("LED OFF"); delay(500); }"""


class TestSerialMode:
    def test_serial_mode_returns_explanation(self, auth_headers):
        r = requests.post(f"{V1}/generate", headers=auth_headers, json={
            "prompt": "Simulate the serial monitor output for this blink sketch.",
            "board": "arduino-uno",
            "language": "Arduino C++",
            "mode": "serial",
            "existing_code": BLINK,
        }, timeout=120)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        exp = data.get("explanation") or ""
        assert isinstance(exp, str) and len(exp.strip()) > 20, f"explanation too short: {exp!r}"
        # multi-line
        assert exp.count("\n") >= 2, f"expected multi-line serial log, got: {exp!r}"


class TestGenerateRegression:
    def test_generate_esp32_dht22(self, auth_headers):
        r = requests.post(f"{V1}/generate", headers=auth_headers, json={
            "prompt": "Read DHT22 on GPIO 4",
            "board": "esp32",
            "language": "Arduino C++",
            "mode": "generate",
        }, timeout=120)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        assert data.get("code", "").strip(), "code should not be empty"
        assert data.get("explanation", "").strip(), "explanation should not be empty"
        assert isinstance(data.get("libraries"), list) and len(data["libraries"]) > 0, \
            f"expected libraries list, got {data.get('libraries')}"
