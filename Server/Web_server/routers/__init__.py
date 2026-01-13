"""
API routers.
"""
from .auth import router as auth_router
from .users import router as users_router
from .query import router as query_router

__all__ = ["auth_router", "users_router", "query_router"]
from .sarvam import router as sarvam_router

__all__ = ["auth_router", "users_router", "sarvam_router"]
