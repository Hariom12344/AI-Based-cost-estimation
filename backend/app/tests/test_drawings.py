import io
import os
from fastapi.testclient import TestClient
from app.core.config import settings

def get_auth_headers(client: TestClient, user_credentials: dict) -> dict:
    """Helper to authenticate and retrieve access token headers."""
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": user_credentials["username"],
            "password": user_credentials["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_upload_drawing_success(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # Mock a small DXF file
    file_content = b"SECTION\nHEADER\nENDSEC\nEOF"
    file_payload = {"file": ("part.dxf", io.BytesIO(file_content), "application/octet-stream")}
    
    response = client.post(
        f"{settings.API_V1_STR}/drawings/upload",
        headers=headers,
        files=file_payload
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "part.dxf"
    assert data["file_type"] == "dxf"
    assert data["status"] == "pending"
    assert "id" in data

def test_upload_drawing_invalid_extension(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # Mock a text file which is not allowed
    file_content = b"some text content"
    file_payload = {"file": ("part.txt", io.BytesIO(file_content), "text/plain")}
    
    response = client.post(
        f"{settings.API_V1_STR}/drawings/upload",
        headers=headers,
        files=file_payload
    )
    
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_get_drawings_list(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # 1. List initially empty
    response = client.get(f"{settings.API_V1_STR}/drawings/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    # 2. Upload file
    file_payload = {"file": ("part.png", io.BytesIO(b"imagebytes"), "image/png")}
    client.post(f"{settings.API_V1_STR}/drawings/upload", headers=headers, files=file_payload)
    
    # 3. Verify it is listed
    response = client.get(f"{settings.API_V1_STR}/drawings/", headers=headers)
    assert response.status_code == 200
    drawings = response.json()
    assert len(drawings) == 1
    assert drawings[0]["original_filename"] == "part.png"

def test_download_drawing_file(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # Upload file
    file_payload = {"file": ("part.pdf", io.BytesIO(b"pdfcontent"), "application/pdf")}
    upload_res = client.post(f"{settings.API_V1_STR}/drawings/upload", headers=headers, files=file_payload)
    drawing_id = upload_res.json()["id"]
    
    # Download file
    download_res = client.get(f"{settings.API_V1_STR}/drawings/{drawing_id}/file", headers=headers)
    assert download_res.status_code == 200
    assert download_res.content == b"pdfcontent"

def test_drawing_ownership_isolation(client: TestClient, normal_user, admin_user) -> None:
    # 1. User A (normal_user) uploads a file
    headers_a = get_auth_headers(client, normal_user)
    file_payload = {"file": ("part.dxf", io.BytesIO(b"dxfbytes"), "application/octet-stream")}
    upload_res = client.post(f"{settings.API_V1_STR}/drawings/upload", headers=headers_a, files=file_payload)
    drawing_id = upload_res.json()["id"]
    
    # 2. User B (admin_user) tries to fetch User A's file metadata
    headers_b = get_auth_headers(client, admin_user)
    response = client.get(f"{settings.API_V1_STR}/drawings/{drawing_id}", headers=headers_b)
    
    # User B should receive 404 Not Found since it checks ownership isolation
    assert response.status_code == 404

def test_delete_drawing(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # Upload file
    file_payload = {"file": ("part.jpg", io.BytesIO(b"jpgbytes"), "image/jpeg")}
    upload_res = client.post(f"{settings.API_V1_STR}/drawings/upload", headers=headers, files=file_payload)
    drawing_id = upload_res.json()["id"]
    
    # Verify metadata exists in listings
    list_res = client.get(f"{settings.API_V1_STR}/drawings/", headers=headers)
    assert len(list_res.json()) == 1
    
    # Delete file
    delete_res = client.delete(f"{settings.API_V1_STR}/drawings/{drawing_id}", headers=headers)
    assert delete_res.status_code == 204
    
    # Verify removed from listing
    list_res = client.get(f"{settings.API_V1_STR}/drawings/", headers=headers)
    assert len(list_res.json()) == 0
