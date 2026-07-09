from fastapi import APIRouter

from app.api.endpoints import login, users, books, borrow

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(borrow.router, prefix="/borrow", tags=["borrow"])


