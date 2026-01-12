"""
Configuration for the Chanakya Web Server.
"""
import os
from typing import Optional

class Settings:
    """Application settings."""
    
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv(
        "MONGODB_URL", 
        "mongodb+srv://kautilyasrivastava07:4V16P4rd7cBDrbaF@cluster0.5leoy.mongodb.net/Chanakya?retryWrites=true&w=majority"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "Chanakya")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
    
    # CORS Configuration
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:5173,http://localhost:3000"
    ).split(",")
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

settings = Settings()
