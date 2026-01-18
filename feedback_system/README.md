# Sahayak Pro - Smart Question Personalization System

A classroom support system that helps teachers personalize questioning for students based on their ability and confidence level. Designed specifically for rural classrooms in India.

## Features

- **Smart Student Selection**: Prioritizes weak students while ensuring fair participation
- **Adaptive Difficulty**: Adjusts question difficulty based on student performance
- **Confidence Tracking**: Monitors and updates student confidence levels
- **AI Question Generation**: Generates topic-specific questions using OpenAI
- **Session Summaries**: Detailed analytics after each class session
- **Student Profiles**: Track individual student progress over time

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy
- **AI**: Google Gemini for question generation

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
powershell =>>> .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# (Optional) Set up Gemini API key for AI question generation
# Create a .env file with: GEMINI_API_KEY=your_api_key_here
# Get your key from https://aistudio.google.com/apikey

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage Flow

### 1. Cold Start Setup
- Create a class with subject
- Add students with initial levels (Weak/Medium/Strong)
- Set initial confidence ratings

### 2. Question Setup
- Enter today's topic
- Generate questions using AI or add manually
- Review and edit Easy/Medium/Hard questions
- Click "Start Class"

### 3. Live Session
- System suggests which student to ask
- Shows recommended difficulty and question
- Ask the question, then rate the answer (1-5 stars)
- System updates student confidence and picks next student
- Keyboard shortcuts: Enter (Ask), S (Skip), Esc (End)

### 4. Class Summary
- View participation percentage
- See students who improved
- Identify students needing attention
- Review difficulty distribution

### 5. Student Profiles
- View individual student progress
- Topic-wise performance breakdown
- Recent activity timeline

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classes` | Create new class |
| GET | `/api/classes` | List all classes |
| POST | `/api/students/class/{id}/bulk` | Add students to class |
| POST | `/api/questions/generate` | AI-generate questions |
| POST | `/api/sessions/start` | Start live class session |
| GET | `/api/sessions/{id}/next` | Get next student suggestion |
| POST | `/api/sessions/{id}/respond` | Submit rating |
| GET | `/api/analytics/session/{id}/summary` | Get session summary |

## Selection Algorithm

The student selection uses a priority scoring system:

```
priority_score = 
  + (5 - confidence) × 3     # Low confidence boost
  + level_bonus              # Weak: 5, Medium: 2, Strong: 0
  + days_since_answer × 2    # Time penalty
  + consecutive_wrong × 1.5  # Struggling students
  + topic_weakness_bonus     # Weak in current topic
  - times_called × 5         # Already answered penalty
```

## Confidence Update

After each answer rating:
- ⭐⭐⭐⭐⭐ (5): +0.5
- ⭐⭐⭐⭐ (4): +0.3
- ⭐⭐⭐ (3): +0.1
- ⭐⭐ (2): -0.1
- ⭐ (1): -0.3

Confidence is clamped between 1.0 and 5.0.

## Project Structure

```
feedback_system/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLAlchemy models
│   ├── models.py            # Pydantic schemas
│   ├── routers/             # API endpoints
│   │   ├── classes.py
│   │   ├── students.py
│   │   ├── questions.py
│   │   ├── sessions.py
│   │   └── analytics.py
│   └── engines/             # Core logic
│       ├── selection.py     # Student selection algorithm
│       ├── confidence.py    # Confidence updates
│       └── ai_questions.py  # AI question generation
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   └── api/             # API client
│   └── package.json
└── README.md
```

## License

MIT License
