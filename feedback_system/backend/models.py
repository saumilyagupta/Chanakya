from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# ==================== Class Schemas ====================

class ClassCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    subject: str = Field(..., min_length=1, max_length=100)


class ClassResponse(BaseModel):
    id: int
    name: str
    subject: str
    created_at: datetime
    student_count: int = 0
    
    class Config:
        from_attributes = True


class ClassListResponse(BaseModel):
    classes: List[ClassResponse]


# ==================== Student Schemas ====================

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    level: str = Field(default="medium", pattern="^(weak|medium|strong)$")
    confidence: float = Field(default=2.5, ge=1.0, le=5.0)


class StudentBulkCreate(BaseModel):
    students: List[StudentCreate]


class StudentResponse(BaseModel):
    id: int
    class_id: int
    name: str
    level: str
    confidence: float
    last_answered_at: Optional[datetime] = None
    consecutive_correct: int
    consecutive_wrong: int
    topic_performance: Dict[str, float] = {}
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = Field(default=None, pattern="^(weak|medium|strong)$")
    confidence: Optional[float] = Field(default=None, ge=1.0, le=5.0)


class StudentProfileResponse(BaseModel):
    student: StudentResponse
    total_responses: int
    average_rating: float
    participation_rate: float
    improvement_trend: float
    recent_history: List[dict]


# ==================== Question Schemas ====================

class QuestionCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    text: str = Field(..., min_length=1)


class QuestionBulkCreate(BaseModel):
    questions: List[QuestionCreate]


class QuestionResponse(BaseModel):
    id: int
    topic: str
    difficulty: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuestionGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=100)
    easy_count: int = Field(default=3, ge=1, le=10)
    medium_count: int = Field(default=3, ge=1, le=10)
    hard_count: int = Field(default=3, ge=1, le=10)


class QuestionsByDifficulty(BaseModel):
    easy: List[QuestionResponse]
    medium: List[QuestionResponse]
    hard: List[QuestionResponse]


# ==================== Session Schemas ====================

class SessionCreate(BaseModel):
    class_id: int
    topic: str = Field(..., min_length=1, max_length=200)


class SessionResponse(BaseModel):
    id: int
    class_id: int
    topic: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True


class SuggestionResponse(BaseModel):
    student_id: int
    student_name: str
    difficulty: str
    question_id: Optional[int] = None
    question_text: Optional[str] = None
    reason: str
    priority_score: float


class ResponseCreate(BaseModel):
    student_id: int
    question_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    difficulty_asked: str = Field(..., pattern="^(easy|medium|hard)$")
    skipped: bool = False


class ResponseSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=5)


# ==================== Summary Schemas ====================

class StudentSummary(BaseModel):
    student_id: int
    student_name: str
    times_called: int
    average_rating: float
    confidence_change: float
    improved: bool


class SessionSummaryResponse(BaseModel):
    session_id: int
    topic: str
    duration_minutes: float
    total_questions_asked: int
    participation_percentage: float
    students_called: int
    students_not_called: int
    average_rating: float
    difficulty_distribution: Dict[str, int]
    students_improved: List[StudentSummary]
    students_need_attention: List[StudentSummary]
    all_student_summaries: List[StudentSummary]
