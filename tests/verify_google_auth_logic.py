import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock, patch

# Add backend to path FIRST
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

# Mock environment variables
os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
os.environ['DB_NAME'] = '4Flow_Test_Auth'
os.environ['SECRET_KEY'] = 'test_secret'
os.environ['GOOGLE_CLIENT_ID'] = 'fake_id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'fake_secret'

# Mock dependencies used in auth.py BEFORE importing it
sys.modules['authlib'] = MagicMock()
sys.modules['authlib.integrations'] = MagicMock()
sys.modules['authlib.integrations.starlette_client'] = MagicMock()
# Mock the OAuth class specifically
mock_oauth_class = MagicMock()
sys.modules['authlib.integrations.starlette_client'].OAuth = mock_oauth_class

# Mock dependencies that might trigger DB connections on import
sys.modules['utils.dependencies'] = MagicMock()
sys.modules['utils.auth'] = MagicMock()
sys.modules['utils.auth'].ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Must be int
# We need verify_password and get_password_hash mocks if they are used at module level? No, they are imported.
# But inside auth.py: from utils.dependencies import db
# So we mocked utils.dependencies.

# Now import the module
try:
    from routes import auth
except ImportError as e:
    print(f"ImportError details: {e}")
    # Fallback for some envs
    import routes.auth as auth

async def run_tests():
    print("🧪 Starting Google Auth Logic Verification...")
    
    # Create fresh mocks for each run
    mock_users_collection = AsyncMock()
    mock_db = MagicMock()
    mock_db.users = mock_users_collection
    
    # We must patch 'routes.auth.db' because it Was imported as 'from utils.dependencies import db'
    # So inside 'auth' module namespace, the name is 'db'.
    
    with patch('routes.auth.db', mock_db), \
         patch('routes.auth.oauth') as mock_oauth_instance, \
         patch('routes.auth.create_access_token', return_value="mock_token"), \
         patch('routes.auth.get_password_hash', return_value="hashed_secret"):
        
        from routes.auth import google_callback
        from starlette.requests import Request
        
        # Helper to create a mock request
        def create_mock_request():
            scope = {"type": "http"}
            return Request(scope)

        print("\nTest 1: Valid Domain (@univera.com.tr) -> New User -> Waiting Room")
        # Setup Mock Google Response
        mock_oauth_instance.google.authorize_access_token = AsyncMock(return_value={
            'userinfo': {
                'email': 'newuser@univera.com.tr',
                'name': 'New User',
                'picture': 'http://pic.com/u.jpg'
            }
        })
        # Setup Mock DB (User not found)
        mock_users_collection.find_one = AsyncMock(return_value=None)
        mock_users_collection.insert_one = AsyncMock()
        
        # Run
        response = await google_callback(create_mock_request())
        
        print(f"DEBUG: Response status: {response.status_code}")
        print(f"DEBUG: Response headers: {response.headers}")
        
        # Verify
        if response.status_code == 307 and 'error=pending_approval' in response.headers.get('location', ''):
            print("✅ PASS: Correctly redirected to pending_approval")
        else:
            print(f"❌ FAIL: Expected redirect to pending_approval, got {response.headers.get('location')}")
            
        # Verify DB insertion
        mock_users_collection.insert_one.assert_called_once()
        inserted_user = mock_users_collection.insert_one.call_args[0][0]
        if inserted_user['email'] == 'newuser@univera.com.tr' and inserted_user['isActive'] is False:
             print("✅ PASS: User inserted with isActive=False")
        else:
             print(f"❌ FAIL: User insertion data incorrect: {inserted_user}")

        print("\nTest 2: Invalid Domain (@gmail.com) -> Reject")
        # Setup Mock Google Response
        mock_oauth_instance.google.authorize_access_token = AsyncMock(return_value={
            'userinfo': {
                'email': 'hacker@gmail.com',
                'name': 'Hacker',
                'picture': 'http://pic.com/h.jpg'
            }
        })
        # Reset DB mocks
        mock_users_collection.find_one = AsyncMock(return_value=None)
        mock_users_collection.insert_one = AsyncMock()
        
        # Run
        response = await google_callback(create_mock_request())
        
        # Verify
        if response.status_code == 307 and 'error=domain_invalid' in response.headers['location']:
             print("✅ PASS: Correctly redirected to error=domain_invalid")
        else:
             print(f"❌ FAIL: Expected error=domain_invalid, got {response.headers.get('location')}")
        
        # Verify NO DB insertion
        mock_users_collection.insert_one.assert_not_called()
        if mock_users_collection.insert_one.call_count == 0:
             print("✅ PASS: No user created for invalid domain")

        print("\nTest 3: Existing User (Any Domain, e.g. unity.com) -> Allow Login")
        # Setup Mock Google Response
        mock_oauth_instance.google.authorize_access_token = AsyncMock(return_value={
            'userinfo': {
                'email': 'ceo@unity.com',
                'name': 'CEO',
                'picture': 'http://pic.com/ceo.jpg'
            }
        })
        # Setup Mock DB (User FOUND)
        existing_user = {
            "_id": "existing_id",
            "email": "ceo@unity.com",
            "password": "hashed",
            "isActive": True
        }
        mock_users_collection.find_one = AsyncMock(return_value=existing_user)
        
        # Run
        response = await google_callback(create_mock_request())
        
        # Verify
        if response.status_code == 307 and 'token=mock_token' in response.headers['location']:
             print("✅ PASS: Correctly redirected with token for existing external user")
        else:
             print(f"❌ FAIL: Expected token redirect, got {response.headers.get('location')}")

if __name__ == "__main__":
    asyncio.run(run_tests())
