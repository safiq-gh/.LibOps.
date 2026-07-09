from fastapi.testclient import TestClient

def test_get_access_token(client: TestClient) -> None:
    # Ensure user exists
    client.post("/api/v1/users/", json={
        "email": "login_test@example.com",
        "full_name": "Login Test",
        "password": "testpassword123",
        "role": "member"
    })

    login_data = {
        "username": "login_test@example.com",
        "password": "testpassword123",
    }
    r = client.post("/api/v1/login/access-token", data=login_data)
    assert r.status_code == 200
    tokens = r.json()
    assert "access_token" in tokens
    assert tokens["access_token"]
    assert tokens["token_type"] == "bearer"

def test_use_access_token(client: TestClient) -> None:
    login_data = {
        "username": "login_test@example.com",
        "password": "testpassword123",
    }
    r = client.post("/api/v1/login/access-token", data=login_data)
    tokens = r.json()
    token = tokens["access_token"]

    r = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200
    user = r.json()
    assert user["email"] == "login_test@example.com"

