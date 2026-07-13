from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings

def test_user_registration(client: TestClient) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "username": "engineer_charlie",
            "email": "charlie@intellicam.ai",
            "password": "CharliePassword123!",
            "role": "engineer"
        }
    )
    assert response.status_code == 201
    content = response.json()
    assert content["username"] == "engineer_charlie"
    assert content["email"] == "charlie@intellicam.ai"
    assert content["role"] == "engineer"
    assert "id" in content

def test_user_registration_duplicate(client: TestClient, normal_user) -> None:
    # Attempting to register using an existing email
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "username": "engineer_bob_new",
            "email": normal_user["email"],
            "password": "AnotherPassword123!",
            "role": "engineer"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_user_login(client: TestClient, normal_user) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": normal_user["password"]
        }
    )
    assert response.status_code == 200
    content = response.json()
    assert "access_token" in content
    assert "refresh_token" in content
    assert content["token_type"] == "bearer"
    assert content["user"]["username"] == normal_user["username"]

def test_user_login_invalid_password(client: TestClient, normal_user) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]

def test_refresh_token(client: TestClient, normal_user) -> None:
    # 1. Login to get refresh token
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": normal_user["password"]
        }
    )
    refresh_token = login_response.json()["refresh_token"]

    # 2. Refresh the token
    refresh_response = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()
    assert refresh_response.json()["token_type"] == "bearer"
