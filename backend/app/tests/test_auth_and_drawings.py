from io import BytesIO


def register_and_login(client, email: str, role: str = "Engineer"):
    register_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "role": role},
    )
    assert register_resp.status_code == 200

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "secret123"},
    )
    assert login_resp.status_code == 200
    return login_resp.json()


def test_login_and_refresh(client):
    tokens = register_and_login(client, "engineer@example.com")

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["access_token"]


def test_protected_me_requires_access_token(client):
    register_and_login(client, "admin@example.com", role="Admin")

    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401


def test_engineer_can_upload_image_drawing(client):
    tokens = register_and_login(client, "uploader@example.com")
    headers = {"Authorization": "Bearer " + tokens["access_token"]}

    upload_resp = client.post(
        "/api/v1/drawings/upload",
        headers=headers,
        files={"file": ("sample.png", BytesIO(b"fake-image"), "image/png")},
    )

    assert upload_resp.status_code == 200
    payload = upload_resp.json()
    assert payload["drawing"]["filename"] == "sample.png"
    assert payload["parsed_summary"]["file_type"] == "image"
