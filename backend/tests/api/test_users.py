from fastapi.testclient import TestClient

def test_register_user(client: TestClient) -> None:
    data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "member"
    }
    r = client.post("/api/v1/users/", json=data)
    assert r.status_code == 200
    created_user = r.json()
    assert created_user["email"] == data["email"]
    assert "id" in created_user

def test_register_user_duplicate_email(client: TestClient) -> None:
    data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "member"
    }
    r = client.post("/api/v1/users/", json=data)
    assert r.status_code == 400
    assert r.json()["detail"] == "The user with this username already exists in the system."
