---
name: Sahayak Pro Implementation
overview: Build a teacher-controlled classroom personalization system using React frontend, FastAPI backend, and SQLite database, with AI-powered question generation for rural classroom support.
todos:
  - id: backend-setup
    content: Set up FastAPI project with SQLite database and SQLAlchemy models
    status: completed
  - id: crud-endpoints
    content: Implement CRUD endpoints for classes, students, and questions
    status: completed
    dependencies:
      - backend-setup
  - id: selection-engine
    content: Build student selection priority scoring algorithm
    status: completed
    dependencies:
      - crud-endpoints
  - id: confidence-engine
    content: Implement confidence update logic based on ratings
    status: completed
    dependencies:
      - crud-endpoints
  - id: ai-questions
    content: Add AI question generation endpoint with LLM integration
    status: completed
    dependencies:
      - crud-endpoints
  - id: session-endpoints
    content: Create live session management endpoints (start, next, respond, summary)
    status: completed
    dependencies:
      - selection-engine
      - confidence-engine
  - id: react-setup
    content: Initialize React project with Vite, routing, and API client
    status: completed
  - id: cold-start-page
    content: Build Cold Start Setup page (class + student entry)
    status: completed
    dependencies:
      - react-setup
      - crud-endpoints
  - id: question-setup-page
    content: Build Question Setup page with AI generation
    status: completed
    dependencies:
      - react-setup
      - ai-questions
  - id: live-session-page
    content: Build Live Session page with suggestion cards and rating
    status: completed
    dependencies:
      - react-setup
      - session-endpoints
  - id: summary-page
    content: Build Class Summary page with participation stats
    status: completed
    dependencies:
      - react-setup
      - session-endpoints
  - id: student-profile-page
    content: Build Student Profile page with history and trends
    status: completed
    dependencies:
      - react-setup
      - crud-endpoints
---

# Sahayak Pro - Implementation Plan

## Architecture Overview

```mermaid
flowchart TB
    subgraph frontend [React Frontend]
        ColdStart[Cold Start Setup]
        QuestionSetup[Question Setup]
        LiveCard[Live Suggestion Card]
        RatingPopup[Rating Popup]
        Summary[Class Summary]
        StudentProfile[Student Profile View]
    end
    
    subgraph backend [FastAPI Backend]
        API[API Routes]
        StudentEngine[Student Profile Engine]
        QuestionEngine[Question Bank Engine]
        SelectionLogic[Selection Logic Engine]
        ConfidenceEngine[Confidence Update Engine]
        SummaryGen[Summary Generator]
        AIGen[AI Question Generator]
    end
    
    subgraph database [SQLite Database]
        Students[(students)]
        Questions[(questions)]
        Classes[(classes)]
        Sessions[(class_sessions)]
        Responses[(student_responses)]
    end
    
    frontend --> API
    API --> StudentEngine
    API --> QuestionEngine
    API --> SelectionLogic
    API --> ConfidenceEngine
    API --> SummaryGen
    QuestionEngine --> AIGen
    StudentEngine --> database
    QuestionEngine --> database
    SelectionLogic --> database
    SummaryGen --> database
```

## Project Structure

```
feedback_system/
├── backend/
│   ├── main.py                 # FastAPI app entry
│   ├── database.py             # SQLite connection + models
│   ├── models.py               # Pydantic schemas
│   ├── routers/
│   │   ├── students.py         # Student CRUD
│   │   ├── classes.py          # Class management
│   │   ├── questions.py        # Question bank + AI generation
│   │   ├── sessions.py         # Live class session
│   │   └── analytics.py        # Summary endpoints
│   ├── engines/
│   │   ├── selection.py        # Student selection logic
│   │   ├── confidence.py       # Confidence update logic
│   │   └── ai_questions.py     # LLM question generation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudentCard.jsx
│   │   │   ├── SuggestionCard.jsx
│   │   │   ├── RatingPopup.jsx
│   │   │   └── StarRating.jsx
│   │   ├── pages/
│   │   │   ├── ColdStartSetup.jsx
│   │   │   ├── QuestionSetup.jsx
│   │   │   ├── LiveSession.jsx
│   │   │   ├── ClassSummary.jsx
│   │   │   └── StudentProfile.jsx
│   │   ├── api/
│   │   │   └── client.js       # API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
└── README.md
```

## Database Schema

```mermaid
erDiagram
    classes ||--o{ students : contains
    classes ||--o{ class_sessions : has
    class_sessions ||--o{ student_responses : records
    students ||--o{ student_responses : gives
    questions ||--o{ student_responses : answered
    
    classes {
        int id PK
        string name
        string subject
        datetime created_at
    }
    
    students {
        int id PK
        int class_id FK
        string name
        string level
        float confidence
        datetime last_answered_at
        int consecutive_correct
        int consecutive_wrong
        json topic_performance
    }
    
    questions {
        int id PK
        string topic
        string difficulty
        string text
        datetime created_at
    }
    
    class_sessions {
        int id PK
        int class_id FK
        string topic
        datetime started_at
        datetime ended_at
        bool is_active
    }
    
    student_responses {
        int id PK
        int session_id FK
        int student_id FK
        int question_id FK
        int rating
        string difficulty_asked
        datetime answered_at
    }
```

## Implementation Phases

### Phase 1: Backend Foundation

- Set up FastAPI with SQLite using SQLAlchemy
- Create database models for students, classes, questions, sessions, responses
- Implement basic CRUD endpoints for students and classes
- Add Pydantic schemas for request/response validation

### Phase 2: Core Engines

- **Selection Logic Engine**: Priority scoring algorithm
  ```python
  priority_score = (
      (5 - confidence) * 3 +           # Low confidence boost
      days_since_last_answer * 2 +      # Time penalty
      weak_topic_bonus -                 # Topic weakness
      just_answered_penalty              # Recent answer penalty
  )
  ```

- **Confidence Update Engine**: Rating to confidence delta mapping
- **AI Question Generator**: Integration with OpenAI/Anthropic API for topic-based question generation

### Phase 3: React Frontend Setup

- Initialize React project with Vite
- Set up routing (React Router)
- Create API client with fetch/axios
- Design system with CSS variables for consistent styling

### Phase 4: Screen Implementation

**Screen 1 - Cold Start Setup**

- Add class form
- Bulk student entry with initial rating (1-5 stars or Weak/Medium/Strong)
- Import from CSV option

**Screen 2 - Question Setup**

- Topic selection
- AI-generate questions button
- Easy/Medium/Hard categorized list
- Edit/Add/Remove functionality
- "Start Class" button

**Screen 3 - Live Suggestion Card (Core)**

- Single prominent card showing:
  - Student name + avatar
  - Difficulty badge
  - Suggested question text
  - Reason tooltip
- "Ask" and "Skip" buttons
- Progress indicator

**Screen 4 - Rating Popup**

- 5-star interactive rating
- Quick notes field (optional)
- Submit triggers next suggestion

**Screen 5 - Class Summary**

- Participation percentage chart
- Students who improved list
- Students skipped/not called
- Difficulty distribution
- Session duration

**Screen 6 - Student Profile**

- Confidence trend chart
- Level progression
- Topic performance breakdown
- Answer history

### Phase 5: Integration and Polish

- Connect all frontend screens to backend APIs
- Add loading states and error handling
- Implement session persistence
- Add keyboard shortcuts for fast rating

## Key API Endpoints

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/classes` | Create new class |

| POST | `/api/classes/{id}/students` | Add students to class |

| POST | `/api/questions/generate` | AI-generate questions for topic |

| POST | `/api/sessions/start` | Start live class session |

| GET | `/api/sessions/{id}/next` | Get next student suggestion |

| POST | `/api/sessions/{id}/respond` | Submit rating for response |

| GET | `/api/sessions/{id}/summary` | Get class summary |

| GET | `/api/students/{id}/profile` | Get student profile |

## UI Design Direction

- **Color Palette**: Warm, approachable colors (soft greens, yellows) suitable for education
- **Typography**: Clear, readable fonts (system fonts for performance)
- **Cards**: Large touch-friendly buttons for classroom use
- **Animations**: Subtle card transitions for suggestion flow