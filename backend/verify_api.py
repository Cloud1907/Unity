import asyncio
import httpx
import os

BASE_URL = "http://localhost:8000"

async def login(client, email, password):
    response = await client.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {email}: {response.text}")
        return None
    return response.json()["access_token"]

async def verify_visibility():
    async with httpx.AsyncClient() as client:
        # 1. Admin Verification (Melih)
        print("\n--- Verifying ADMIN (melih.bulut@4flow.com) ---")
        token = await login(client, "melih.bulut@4flow.com", "test123")
        if token:
            resp = await client.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
            projects = resp.json()
            names = [p['name'] for p in projects]
            print(f"Visible Projects ({len(projects)}): {names}")
            # EXPECT: All projects (Public Sales, Private Sales, Public Marketing)

        # 2. Manager Verification (Ahmet - Sales Dept)
        print("\n--- Verifying MANAGER (ahmet@4flow.com) ---")
        token = await login(client, "ahmet@4flow.com", "test123")
        if token:
            resp = await client.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
            projects = resp.json()
            names = [p['name'] for p in projects]
            print(f"Visible Projects ({len(projects)}): {names}")
            # EXPECT: Public Sales Project ONLY (unless explicitly added to others)
            # Should NOT see Private Sales Project (owned by Melih)
            # Should NOT see Public Marketing Project

        # 3. Member Verification (Test Member - Sales Dept)
        print("\n--- Verifying MEMBER (test@4flow.com) ---")
        token = await login(client, "test@4flow.com", "test123")
        if token:
            resp = await client.get(f"{BASE_URL}/projects", headers={"Authorization": f"Bearer {token}"})
            projects = resp.json()
            names = [p['name'] for p in projects]
            print(f"Visible Projects ({len(projects)}): {names}")
            # EXPECT: Public Sales Project ONLY

if __name__ == "__main__":
    asyncio.run(verify_visibility())
