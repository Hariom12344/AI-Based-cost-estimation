from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings

def test_read_user_me(client: TestClient, normal_user) -> None:
    # Login to get access token
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": normal_user["password"]
        }
    )
    access_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Request profile details
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=headers
    )
    assert response.status_code == 200
    content = response.json()
    assert content["username"] == normal_user["username"]
    assert content["email"] == normal_user["email"]

def test_admin_list_users(client: TestClient, admin_user, normal_user) -> None:
    # 1. Test Engineer cannot list users
    login_eng = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": normal_user["password"]
        }
    )
    eng_token = login_eng.json()["access_token"]
    response_eng = client.get(
        f"{settings.API_V1_STR}/users/",
        headers={"Authorization": f"Bearer {eng_token}"}
    )
    assert response_eng.status_code == 403

    # 2. Test Admin can list users
    login_admin = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": admin_user["username"],
            "password": admin_user["password"]
        }
    )
    admin_token = login_admin.json()["access_token"]
    response_admin = client.get(
        f"{settings.API_V1_STR}/users/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_admin.status_code == 200
    users_list = response_admin.json()
    assert len(users_list) >= 2

def test_update_user_self(client: TestClient, normal_user) -> None:
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": normal_user["username"],
            "password": normal_user["password"]
        }
    )
    access_token = login_response.json()["access_token"]
    user_id = login_response.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Update own profile username
    response = client.put(
        f"{settings.API_V1_STR}/users/{user_id}",
        headers=headers,
        json={"username": "engineer_bob_updated"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "engineer_bob_updated"
