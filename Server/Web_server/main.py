"""
FastAPI application entry point.
"""
import sys
import os

# Load environment variables from .env file
from dotenv import load_dotenv

# Load .env from Server directory
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.dirname(current_dir)
env_path = os.path.join(server_dir, '.env')
load_dotenv(env_path)

# Also try loading from root directory
root_dir = os.path.dirname(server_dir)
root_env_path = os.path.join(root_dir, '.env')
load_dotenv(root_env_path)

# Add Web_server and Server directories to path
sys.path.insert(0, current_dir)
sys.path.insert(0, server_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from config import settings
from routers import auth_router, users_router, query_router, chat_router
from services import orchestrator_service
import structlog

logger = structlog.get_logger(__name__)
from routers import sarvam_router, module_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    await connect_to_mongo()
    
    # Initialize orchestrator
    try:
        logger.info("Initializing orchestrator service")
        orchestrator_service.initialize()
        logger.info("Orchestrator service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize orchestrator: {str(e)}")
        logger.warning("Continuing without orchestrator - /api/query endpoints will return 503")
    
    yield
    
    # Shutdown
    await close_mongo_connection()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Chanakya API",
    description="Backend API for Chanakya - AI-powered classroom companion",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(query_router, prefix="/api/query", tags=["Query"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat History"])
#app.include_router(sarvam_router, prefix="/api/sarvam", tags=["Sarvam AI"])
app.include_router(sarvam_router, prefix="/api/sarvam", tags=["Sarvam AI"])
app.include_router(module_router, prefix="/api/module", tags=["MODULE - Lesson Builder"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Chanakya API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "orchestrator_ready": orchestrator_service.is_ready()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
