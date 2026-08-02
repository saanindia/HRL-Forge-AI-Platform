"""HRL Forge AI - Backend regression tests (pytest)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback for local run - read from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"
V1 = f"{BASE_URL}/api/v1"

TS = int(time.time())
TEST_EMAIL = f"hrl.qa+{TS}@myhrl.in"
TEST_PASSWORD = "Forge2026!"
TEST_NAME = "HRL QA"

state = {}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_headers(session):
    # Register
    r = session.post(f"{V1}/auth/register", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
    }, timeout=30)
    assert r.status_code in (200, 201), f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No access_token in register response: {data}"
    state["token"] = token
    state["user"] = data.get("user")
    return {"Authorization": f"Bearer {token}"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_health(self, session):
        r = session.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------- Auth ----------
class TestAuth:
    def test_register_and_token(self, session, auth_headers):
        assert "Authorization" in auth_headers

    def test_duplicate_register_400(self, session):
        r = session.post(f"{V1}/auth/register", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
        }, timeout=15)
        assert r.status_code == 400

    def test_login_valid(self, session):
        r = session.post(f"{V1}/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        }, timeout=15)
        assert r.status_code == 200
        assert r.json().get("access_token")

    def test_login_invalid(self, session):
        r = session.post(f"{V1}/auth/login", json={
            "email": TEST_EMAIL, "password": "WrongPass!"
        }, timeout=15)
        assert r.status_code == 401

    def test_me(self, session, auth_headers):
        r = session.get(f"{V1}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("email") == TEST_EMAIL


# ---------- Knowledge Base ----------
class TestKnowledge:
    def test_boards_list(self, session):
        r = session.get(f"{V1}/boards", timeout=15)
        assert r.status_code == 200
        boards = r.json()
        assert isinstance(boards, list)
        assert len(boards) == 8, f"Expected 8 boards got {len(boards)}"
        b = boards[0]
        for key in ["slug", "name", "mcu", "clock", "flash", "ram", "gpio", "voltage", "interfaces"]:
            assert key in b, f"Missing key {key} in board {b}"
        state["board_slug"] = "arduino-uno"

    def test_board_detail(self, session):
        r = session.get(f"{V1}/boards/forge-ai-70", timeout=15)
        # This slug may or may not exist; try arduino-uno as fallback check
        if r.status_code == 404:
            r2 = session.get(f"{V1}/boards/arduino-uno", timeout=15)
            assert r2.status_code == 200
        else:
            assert r.status_code == 200

    def test_templates(self, session):
        r = session.get(f"{V1}/templates", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) == 8

    def test_sensors(self, session):
        r = session.get(f"{V1}/sensors", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_modules(self, session):
        r = session.get(f"{V1}/modules", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_protocols(self, session):
        r = session.get(f"{V1}/protocols", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) > 0


# ---------- Projects CRUD ----------
class TestProjects:
    def test_create(self, session, auth_headers):
        payload = {
            "name": f"TEST_Project_{TS}",
            "description": "Regression test project",
            "board": "arduino-uno",
            "language": "Arduino C++",
            "code": "// hello"
        }
        r = session.post(f"{V1}/projects", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code in (200, 201), f"{r.status_code} {r.text}"
        data = r.json()
        assert data.get("name") == payload["name"]
        pid = data.get("id") or data.get("_id")
        assert pid
        state["project_id"] = pid

    def test_list(self, session, auth_headers):
        r = session.get(f"{V1}/projects", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert any((p.get("id") or p.get("_id")) == state["project_id"] for p in r.json())

    def test_update(self, session, auth_headers):
        r = session.put(f"{V1}/projects/{state['project_id']}", json={
            "name": f"TEST_Project_{TS}_updated"
        }, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert "updated" in r.json().get("name", "")

    def test_clone(self, session, auth_headers):
        r = session.post(f"{V1}/projects/{state['project_id']}/clone", headers=auth_headers, timeout=15)
        assert r.status_code in (200, 201)
        cid = r.json().get("id") or r.json().get("_id")
        assert cid
        state["clone_id"] = cid

    def test_delete(self, session, auth_headers):
        r = session.delete(f"{V1}/projects/{state['clone_id']}", headers=auth_headers, timeout=15)
        assert r.status_code in (200, 204)


# ---------- Generate (Claude) ----------
class TestGenerate:
    def test_generate(self, session, auth_headers):
        payload = {
            "prompt": "Blink onboard LED every 500ms",
            "board": "arduino-uno",
            "language": "Arduino C++",
            "mode": "generate"
        }
        r = session.post(f"{V1}/generate", json=payload, headers=auth_headers, timeout=90)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        assert data.get("code"), f"Empty code: {data}"
        assert isinstance(data.get("libraries", []), list)
        assert isinstance(data.get("connections", []), list)
        state["generated_code"] = data["code"]

    def test_explain(self, session, auth_headers):
        payload = {
            "prompt": "Explain this code",
            "board": "arduino-uno",
            "language": "Arduino C++",
            "mode": "explain",
            "existing_code": state.get("generated_code", "void setup(){} void loop(){}")
        }
        r = session.post(f"{V1}/generate", json=payload, headers=auth_headers, timeout=90)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        assert data.get("explanation") or data.get("code")


# ---------- History ----------
class TestHistory:
    def test_list(self, session, auth_headers):
        r = session.get(f"{V1}/history", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            state["history_id"] = items[0].get("id") or items[0].get("_id")

    def test_detail(self, session, auth_headers):
        if not state.get("history_id"):
            pytest.skip("No history entry")
        r = session.get(f"{V1}/history/{state['history_id']}", headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_delete(self, session, auth_headers):
        if not state.get("history_id"):
            pytest.skip("No history entry")
        r = session.delete(f"{V1}/history/{state['history_id']}", headers=auth_headers, timeout=15)
        assert r.status_code in (200, 204)


# ---------- Settings ----------
class TestSettings:
    def test_get_defaults(self, session, auth_headers):
        r = session.get(f"{V1}/settings", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "default_provider" in data or "default_model" in data

    def test_update(self, session, auth_headers):
        r = session.put(f"{V1}/settings", json={
            "default_provider": "emergent",
            "default_model": "claude-sonnet-4-5-20250929"
        }, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("default_provider") == "emergent"


# ---------- Chat ----------
class TestChat:
    def test_message(self, session, auth_headers):
        session_id = f"test-session-{TS}"
        r = session.post(f"{V1}/chat/message", json={
            "session_id": session_id,
            "message": "What is a pull-up resistor?",
            "context": "circuit"
        }, headers=auth_headers, timeout=90)
        assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
        data = r.json()
        # response should contain assistant reply
        assert data.get("message") or data.get("reply") or data.get("content")
        state["session_id"] = session_id

    def test_session_history(self, session, auth_headers):
        r = session.get(f"{V1}/chat/session/{state['session_id']}", headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_sessions(self, session, auth_headers):
        r = session.get(f"{V1}/chat/sessions", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Admin guard ----------
class TestAdminGuard:
    def test_stats_forbidden(self, session, auth_headers):
        r = session.get(f"{V1}/admin/stats", headers=auth_headers, timeout=15)
        assert r.status_code == 403

    def test_users_forbidden(self, session, auth_headers):
        r = session.get(f"{V1}/admin/users", headers=auth_headers, timeout=15)
        assert r.status_code == 403


# ---------- Cleanup: delete original project ----------
def test_zzz_cleanup(session, auth_headers=None):
    if state.get("token") and state.get("project_id"):
        headers = {"Authorization": f"Bearer {state['token']}"}
        session.delete(f"{V1}/projects/{state['project_id']}", headers=headers, timeout=15)
