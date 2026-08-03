"""Iteration 6: Google Sign-In button restoration (vendor-independent GSI)."""
import os
import subprocess
import uuid
import requests
import pytest

BASE_LOCAL = "http://localhost:8001"
BASE_PUBLIC = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or BASE_LOCAL


# ---- New endpoint /api/v1/auth/google ----
class TestGoogleAuthEndpoint:
    def test_google_endpoint_exists_and_returns_503_when_unconfigured(self):
        r = requests.post(
            f"{BASE_LOCAL}/api/v1/auth/google",
            json={"id_token": "bogus"},
            timeout=10,
        )
        assert r.status_code != 404, "Endpoint missing"
        assert r.status_code == 503, f"Expected 503 got {r.status_code}: {r.text}"
        detail = (r.json().get("detail") or "").lower()
        assert "not configured" in detail or "google_client_id" in detail

    def test_google_endpoint_validates_body(self):
        r = requests.post(
            f"{BASE_LOCAL}/api/v1/auth/google", json={}, timeout=10
        )
        # Missing id_token → 422 validation error
        assert r.status_code in (422, 503)


# ---- Auth regression ----
class TestAuthRegression:
    def test_register_login_me_flow(self):
        email = f"TEST_it6_{uuid.uuid4().hex[:8]}@example.com"
        pw = "Passw0rd!"
        r = requests.post(
            f"{BASE_PUBLIC}/api/v1/auth/register",
            json={"email": email, "password": pw, "name": "It6 Tester"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        assert r.json()["user"]["email"].lower() == email.lower()
        email = email.lower()

        r2 = requests.post(
            f"{BASE_PUBLIC}/api/v1/auth/login",
            json={"email": email, "password": pw},
            timeout=15,
        )
        assert r2.status_code == 200
        token2 = r2.json()["access_token"]

        r3 = requests.get(
            f"{BASE_PUBLIC}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token2}"},
            timeout=15,
        )
        assert r3.status_code == 200
        assert r3.json()["email"] == email


# ---- Providers regression (vendor-independent) ----
class TestProvidersRegression:
    def test_providers_list_vendor_independent(self):
        # Need auth
        email = f"TEST_it6prov_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(
            f"{BASE_PUBLIC}/api/v1/auth/register",
            json={"email": email, "password": "Passw0rd!", "name": "Prov Tester"},
            timeout=15,
        )
        token = reg.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = requests.get(f"{BASE_PUBLIC}/api/v1/generate/providers", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # accept either list or dict-with-providers
        providers_str = str(data).lower()
        for p in ["openrouter", "gemini", "groq", "huggingface", "ollama"]:
            assert p in providers_str, f"Missing provider {p} in {data}"


# ---- No emergent references reintroduced ----
class TestNoEmergentImports:
    def test_no_emergentintegrations_in_backend(self):
        r = subprocess.run(
            ["grep", "-rli", "--include=*.py", "emergentintegrations", "/app/backend"],
            capture_output=True, text=True,
        )
        files = [f for f in r.stdout.strip().splitlines() if "/tests/" not in f]
        assert not files, f"emergentintegrations found in backend source: {files}"

    def test_no_emergent_in_frontend_src(self):
        r = subprocess.run(
            ["grep", "-rli", "emergent", "/app/frontend/src"],
            capture_output=True, text=True,
        )
        assert not r.stdout.strip(), f"'emergent' found in frontend/src: {r.stdout}"


# ---- index.html GSI script ----
class TestIndexHtmlGSI:
    def test_gsi_script_present_and_no_emergent_junk(self):
        with open("/app/frontend/public/index.html") as f:
            html = f.read()
        assert "accounts.google.com/gsi/client" in html
        assert "emergent-main.js" not in html
        assert "posthog" not in html.lower()
