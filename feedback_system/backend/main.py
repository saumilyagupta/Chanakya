from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import classes, students, questions, sessions, analytics

app = FastAPI(
    title="Sahayak Pro API",
    description="Smart Question Personalization System for Rural Classrooms",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "message": "Welcome to Sahayak Pro API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
