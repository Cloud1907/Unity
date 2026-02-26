import os
import sys
import uvicorn
import importlib

# Set environment variable 
uri = "sqlite:///letta.db"
os.environ["LETTA_PG_URI"] = uri
print(f"🔄 Setting env var LETTA_PG_URI={uri}")

# --- Monkey Patching Start ---
try:
    # 1. Patch database_utils to support sqlite+aiosqlite
    import letta.database_utils
    original_convert = letta.database_utils.convert_to_async_uri
    
    def patched_convert_to_async_uri(uri: str) -> str:
        if "sqlite" in uri:
            return uri.replace("sqlite://", "sqlite+aiosqlite://")
        return original_convert(uri)
    
    letta.database_utils.convert_to_async_uri = patched_convert_to_async_uri
    print("✅ Monkey-patched convert_to_async_uri")

    # 2. Patch create_async_engine to strip Postgres args for SQLite
    import sqlalchemy.ext.asyncio
    from sqlalchemy.ext.asyncio import create_async_engine as original_create_engine

    def patched_create_async_engine(url, **kwargs):
        if "sqlite" in str(url):
            print("🔧 Intercepted create_async_engine for SQLite. Cleaning kwargs...")
            # Remove postgres-specific connect_args
            if "connect_args" in kwargs:
                ca = kwargs["connect_args"]
                keys_to_remove = ["prepared_statement_name_func", "statement_cache_size", "prepared_statement_cache_size", "ssl"]
                for k in keys_to_remove:
                    if k in ca:
                        del ca[k]
                # Also remove pool args that might be invalid for sqlite?
                # Aiosqlite supports some pool args via SQLAlchemy, but let's be safe.
                # Actually, NullPool is safer for sqlite in some cases, but sticking to default is fine if args are valid.
                pass
        return original_create_engine(url, **kwargs)

    sqlalchemy.ext.asyncio.create_async_engine = patched_create_async_engine
    print("✅ Monkey-patched create_async_engine")

except ImportError as e:
    print(f"❌ Failed to patch modules: {e}")
    sys.exit(1)
# --- Monkey Patching End ---

try:
    # Import app after configuration and patching
    from letta.server.rest_api.app import app
    print("✅ Successfully imported Letta app")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"❌ Failed to import Letta app: {e}")
    sys.exit(1)

if __name__ == "__main__":
    print(f"🚀 Starting Letta Server on port 8283 with SQLite backend...")
    uvicorn.run(app, host="0.0.0.0", port=8283)
