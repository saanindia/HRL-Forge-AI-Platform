"""HRL Forge AI - Iteration 5 tests: Emergent vendor-lockin removal."""
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

API = f"{BASE_URL}/api"
V1 = f"{BASE_URL}/api/v1"

TS = int(time.time())
EMAIL = f"iter5.qa+{TS}@myhrl.in"
PWD = "Forge2026!"
NAME = "Iter5 QA"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{V1}/auth/register", json={"email": EMAIL, "password": PWD, "name": NAME}, timeout=30)
    assert r.status_code in (200, 201), f"register: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"no token in {data}"
    return {"Authorization": f"Bearer {token}"}


# ---------- Startup / health ----------
def test_root_ok(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j.get("name") and j.get("version") and j.get("status") == "ok"


def test_health_ok(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "healthy"


# ---------- Auth regression ----------
def test_login_ok(session):
    r = session.post(f"{V1}/auth/register", json={"email": f"login.{TS}@myhrl.in", "password": PWD, "name": "L"}, timeout=30)
    assert r.status_code in (200, 201)
    r = session.post(f"{V1}/auth/login", json={"email": f"login.{TS}@myhrl.in", "password": PWD}, timeout=30)
    assert r.status_code == 200
    assert (r.json().get("token") or r.json().get("access_token"))


def test_me_ok(session, auth):
    r = session.get(f"{V1}/auth/me", headers=auth, timeout=15)
    assert r.status_code == 200
    assert r.json().get("email") == EMAIL


def test_google_endpoint_removed(session):
    r = session.post(f"{V1}/auth/google", json={"credential": "x"}, timeout=15)
    assert r.status_code in (404, 405), f"expected 404/405, got {r.status_code}"


# ---------- Providers endpoint ----------
def test_providers(session, auth):
    r = session.get(f"{V1}/generate/providers", headers=auth, timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "active" in j and "default" in j
    default = j["default"]
    assert default.get("provider") == "openrouter"
    assert default.get("model") == "anthropic/claude-sonnet-4.5"
    expected = {"openrouter": True, "gemini": True, "groq": True, "huggingface": True, "ollama": False}
    active = j["active"]
    providers = {p.get("provider") or p.get("id"): p for p in active}
    assert set(providers.keys()) == set(expected.keys()), f"providers mismatch: {list(providers.keys())}"
    for name, req_key in expected.items():
        p = providers[name]
        assert p.get("requires_key") == req_key, f"{name} requires_key mismatch"
        assert isinstance(p.get("models"), list) and len(p["models"]) > 0, f"{name} missing models"
        assert p.get("key_env"), f"{name} missing key_env"


# ---------- Generate without key -> 502 ProviderError ----------
def test_generate_missing_key(session, auth):
    # Use local backend directly - preview ingress replaces 502 body with HTML gateway page
    payload = {"prompt": "Design a two-hand pushbutton press circuit", "board": "generic-plc", "language": "ladder", "mode": "generate"}
    r = requests.post("http://localhost:8001/api/v1/generate", json=payload, headers=auth, timeout=60)
    assert r.status_code == 502, f"expected 502, got {r.status_code}: {r.text[:300]}"
    detail = (r.json().get("detail") or "").lower()
    assert ("missing api key" in detail) or ("provider" in detail), f"unexpected error detail: {detail}"


# ---------- Regression: other endpoints ----------
def test_projects_list(session, auth):
    r = session.get(f"{V1}/projects", headers=auth, timeout=15)
    assert r.status_code == 200


def test_templates_list(session, auth):
    r = session.get(f"{V1}/templates", headers=auth, timeout=15)
    assert r.status_code == 200


def test_boards_list(session, auth):
    r = session.get(f"{V1}/boards", headers=auth, timeout=15)
    assert r.status_code == 200


def test_history_list(session, auth):
    r = session.get(f"{V1}/history", headers=auth, timeout=15)
    assert r.status_code == 200


def test_settings_get(session, auth):
    r = session.get(f"{V1}/settings", headers=auth, timeout=15)
    assert r.status_code in (200, 404)


def test_admin_forbidden(session, auth):
    # Non-admin user should get 403
    r = session.get(f"{V1}/admin/users", headers=auth, timeout=15)
    assert r.status_code in (401, 403)


def test_search(session, auth):
    r = session.get(f"{V1}/search", params={"q": "test"}, headers=auth, timeout=15)
    assert r.status_code == 200


def test_wiring_share_public(session, auth):
    # Create share -> get public
    r = session.post(f"{V1}/wiring/shares", json={"title": "t", "content": "x", "board": "generic-plc"}, headers=auth, timeout=15)
    if r.status_code not in (200, 201):
        pytest.skip(f"share create not supported: {r.status_code}")
    sid = r.json().get("id") or r.json().get("share_id") or r.json().get("slug")
    if not sid:
        pytest.skip("no share id returned")
    r2 = requests.get(f"{V1}/wiring/shares/{sid}", timeout=15)
    assert r2.status_code == 200


# ---------- Vendor cleanup verification ----------
def test_no_emergentintegrations_installed():
    import subprocess
    r = subprocess.run(["pip", "show", "emergentintegrations"], capture_output=True, text=True)
    assert r.returncode != 0, "emergentintegrations still installed"


def test_no_emergent_imports_in_backend():
    import subprocess
    r = subprocess.run(["grep", "-rli", "--include=*.py", "emergentintegrations", "/app/backend"], capture_output=True, text=True)
    files = [f for f in r.stdout.strip().split("\n") if f and "tests/" not in f and "test_reports" not in f]
    assert not files, f"emergentintegrations found in backend source: {files}"
