from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, users, departments, projects, tasks, subtasks, comments, timelogs, notifications, activity, analytics, labels, upload

ROOT_DIR = Path(__file__).parent
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Unity API",
    version="1.0.3",
    description="Unity Project Management API",
    redirect_slashes=False
)

# Mount uploads directory to serve files
# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "4Flow API is running", "version": "1.0.3"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(departments.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(subtasks.router)
api_router.include_router(comments.router)
api_router.include_router(timelogs.router)
api_router.include_router(notifications.router)
api_router.include_router(activity.router)
api_router.include_router(analytics.router)
api_router.include_router(labels.router)
api_router.include_router(upload.router)

# Include the router in the main app
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Unity API", "docs": "/docs"}

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
import traceback

class UnrestrictedCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "OPTIONS":
            response = Response()
        else:
            try:
                response = await call_next(request)
            except Exception as e:
                print(f"❌ INTERNAL SERVER ERROR: {str(e)}")
                traceback.print_exc()
                response = JSONResponse(
                    status_code=500,
                    content={"detail": str(e), "type": type(e).__name__}
                )
        
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response

app.add_middleware(UnrestrictedCORSMiddleware)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()