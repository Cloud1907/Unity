import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# Add backend to path FIRST
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

# Mock env
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = '4Flow_Test_Auth'
os.environ['SECRET_KEY'] = 'test_secret'

# Mock dependencies
sys.modules['utils.dependencies'] = MagicMock()
sys.modules['utils.auth'] = MagicMock()
# Mock ACCESS_TOKEN_EXPIRE_MINUTES
sys.modules['utils.auth'].ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Mock hash functions
sys.modules['utils.auth'].verify_password = MagicMock(return_value=True)
sys.modules['utils.auth'].get_password_hash = MagicMock(return_value="hashed")
sys.modules['utils.auth'].create_access_token = MagicMock(return_value="mock_token")

# Import auth route
try:
    from routes import auth
except ImportError:
    import routes.auth as auth

async def run_tests():
    print("🧪 Starting Username Login Verification...")
    
    mock_users = AsyncMock()
    mock_db = MagicMock()
    mock_db.users = mock_users
    
    with patch('routes.auth.db', mock_db):
        from routes.auth import login, LoginRequest
        
        # Scenario 1: Login with Email
        print("\nTest 1: Login with Email")
        mock_users.find_one = AsyncMock(return_value={
            "_id": "user1",
            "email": "melih.bulut@univera.com.tr",
            "username": "melih.bulut",
            "password": "hashed",
            "isActive": True
        })
        
        req = LoginRequest(email="melih.bulut@univera.com.tr", password="pass")
        resp = await login(req)
        
        if resp['access_token'] == "mock_token":
            print("✅ PASS: Login with Email successful")
        else:
             print("❌ FAIL: Login with Email failed")

        # Scenario 2: Login with Username
        print("\nTest 2: Login with Username")
        # Reset mock
        mock_users.find_one = AsyncMock(return_value={
            "_id": "user1",
            "email": "melih.bulut@univera.com.tr",
            "username": "melih.bulut",
            "password": "hashed",
            "isActive": True
        })
        
        req = LoginRequest(email="melih.bulut", password="pass")
        # Ensure the query used $or with username
        resp = await login(req)
        
        # Verify the query structure
        call_args = mock_users.find_one.call_args[0][0]
        if "$or" in call_args and {"username": "melih.bulut"} in call_args["$or"]:
             print("✅ PASS: Used $or query for username")
        else:
             print(f"❌ FAIL: Query did not check username. Args: {call_args}")
             
        if resp['access_token'] == "mock_token":
             print("✅ PASS: Login with Username successful")

if __name__ == "__main__":
    asyncio.run(run_tests())
