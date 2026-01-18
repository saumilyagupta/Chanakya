from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./sahayak_pro.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    students = relationship("Student", back_populates="class_ref", cascade="all, delete-orphan")
    sessions = relationship("ClassSession", back_populates="class_ref", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    name = Column(String(100), nullable=False)
    level = Column(String(20), default="medium")  # weak, medium, strong
    confidence = Column(Float, default=2.5)  # 1-5 scale
    last_answered_at = Column(DateTime, nullable=True)
    consecutive_correct = Column(Integer, default=0)
    consecutive_wrong = Column(Integer, default=0)
    topic_performance = Column(JSON, default=dict)  # {"topic": score}
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_ref = relationship("Class", back_populates="students")
    responses = relationship("StudentResponse", back_populates="student", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(200), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False)  # easy, medium, hard
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    responses = relationship("StudentResponse", back_populates="question")


class ClassSession(Base):
    __tablename__ = "class_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    topic = Column(String(200), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    class_ref = relationship("Class", back_populates="sessions")
    responses = relationship("StudentResponse", back_populates="session", cascade="all, delete-orphan")


class StudentResponse(Base):
    __tablename__ = "student_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    difficulty_asked = Column(String(20), nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)
    skipped = Column(Boolean, default=False)
    
    session = relationship("ClassSession", back_populates="responses")
    student = relationship("Student", back_populates="responses")
    question = relationship("Question", back_populates="responses")


class ClassReflection(Base):
    """Stores post-class reflection sessions with AI-generated feedback."""
    __tablename__ = "class_reflections"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    class_level = Column(String(50), nullable=False)  # e.g., "Class 6", "Class 10"
    transcript = Column(Text, nullable=False)
    feedback_json = Column(JSON, nullable=True)  # Stores the AI-generated feedback
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
