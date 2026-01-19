# 🎓 Chanakya

> **Real-time AI-powered classroom decision-support system for Indian primary school teachers**

Chanakya addresses the "implementation gap" in teacher training by providing just-in-time pedagogical support during live classroom moments. It combines multilingual NLP, RAG-based knowledge retrieval, and AI-powered feedback to help teachers deliver better learning outcomes.

---

## ✨ Key Features

- 🌐 **Multilingual Support** - Hindi, Bengali, Tamil, Telugu, and 12+ Indian languages
- 🤖 **AI-Powered Assistance** - Gemini 2.5 Flash integration for intelligent responses
- 📚 **NCERT RAG System** - Semantic search across NCERT textbooks
- 🎙️ **Voice Support** - Speech-to-text and text-to-speech via Sarvam AI
- 📊 **Teaching Analytics** - Real-time feedback and performance insights
- 👨‍🏫 **Sahayak Pro** - Smart student feedback system

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** | **Node.js 18+** | **MongoDB**
- API Keys: [Google Gemini](https://aistudio.google.com/apikey), [Sarvam AI](https://www.sarvam.ai/)

### 1. Clone & Setup Backend

```powershell
# Clone repository
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya

# Setup Python environment
cd Server
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows PowerShell
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your GEMINI_API_KEY and SARVAM_API_KEY
```

### 2. Setup Frontend

```powershell
cd ..\Client_F\front_chanak
npm install
```

Configure `Client_F/front_chanak/.env`:
```env
VITE_SARVAM_API_KEY=your-sarvam-key
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech
VITE_API_URL=http://localhost:3000
```

### 3. Run the Application

**Terminal 1 - Backend (Port 3000):**
```powershell
cd Server\Web_server
..\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 - Frontend (Port 5173):**
```powershell
cd Client_F\front_chanak
npm run dev
```

### 4. Verify Setup

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |
| Health Check | http://localhost:3000/health |

---

## 📁 Project Structure

```
Chanakya/
├── Client_F/front_chanak/      # React + Vite Frontend
│   ├── src/                    # React components & pages
│   └── .env                    # Frontend environment config
│
├── Server/                     # Python Backend
│   ├── Web_server/             # FastAPI Application (main.py)
│   ├── nlp/                    # NLP Pipeline (Gemini integration)
│   ├── orchestrator/           # LangGraph Orchestration
│   ├── module/                 # Lesson Builder (MODULE)
│   └── requirements.txt        # Python dependencies
│
├── embedding/                  # RAG System for NCERT Books
│   ├── generate_embeddings.py  # PDF → Embeddings pipeline
│   ├── query_books.py          # Semantic search interface
│   └── ncert_books.db          # SQLite vector database
│
├── feedback_system/            # Sahayak Pro Feedback Engine
├── Finaldata/                  # NCERT PDF Books
└── main.py                     # Direct RAG query script
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/register` | POST | User registration |
| `/api/query` | POST | AI-powered query processing |
| `/api/chat/history` | GET | Chat history retrieval |
| `/api/sarvam/stt` | POST | Speech-to-text (Indian languages) |
| `/api/sarvam/tts` | POST | Text-to-speech (Indian languages) |
| `/api/classes` | GET/POST | Class management |
| `/api/students` | GET/POST | Student management |
| `/api/questions` | GET/POST | Question bank |
| `/api/sessions` | GET/POST | Teaching sessions |
| `/api/analytics` | GET | Teaching analytics |
| `/api/reflection` | GET/POST | Teaching reflection analysis |

📚 **Full API documentation:** http://localhost:3000/docs

---

## 🌐 NLP Layer

The NLP layer converts teacher utterances in **any Indian language** to clear **English understanding** using **Gemini 2.5 Flash**.

### Supported Languages
Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Odia, Punjabi, Assamese, Urdu, and code-mixed speech (Hindi-English, etc.)

### Examples

| Input | Output |
|-------|--------|
| `"Bachche sun nahi rahe hain"` | `"The children are not listening"` |
| `"இந்த பாடம் புரியவில்லை அவர்களுக்கு"` | `"They are not understanding this lesson"` |
| `"Addition ka carry samajh nahi aa raha inko"` | `"They are not understanding the carry concept in addition"` |

### Usage

```python
from nlp.pipeline import NLPPipeline
from nlp.schemas import TeacherUtterance

pipeline = NLPPipeline(gemini_api_key="your-key")
utterance = TeacherUtterance(text="Bachche sun nahi rahe hain")
result = pipeline.process_sync(utterance)

print(result.english_understanding)  # "The children are not listening"
print(result.detected_language)      # "hi"
print(result.confidence)             # 0.95
```

---

## 📚 RAG System for NCERT Books

Retrieval-Augmented Generation (RAG) system for semantic search and question-answering over NCERT textbooks.

### Architecture

```
PDF Books → LlamaParse → Text Extraction → Embeddings → SQLite Database
                                                              ↓
User Query → Embedding → Similarity Search → Context → Gemini LLM → Answer
```

### Quick Usage

```powershell
# Generate embeddings (first time only)
python embedding/generate_embeddings.py

# Query the books
python main.py "What is photosynthesis?" --db-path embedding/ncert_books.db

# Interactive mode
python embedding/query_books.py --interactive

# With filters
python main.py "Explain cells" --class "Class_7" --subject "Science"
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--db-path` | SQLite database path | `embedding/ncert_books.db` |
| `--top-k` | Number of results | 5 |
| `--class` | Filter by class | All |
| `--subject` | Filter by subject | All |
| `--model` | Gemini model | `models/gemini-2.0-flash` |

---

## 📥 NCERT Books Downloader

Download all NCERT textbooks from the official website.

```powershell
# Download all books
python download_ncert_books.py

# Resume interrupted download
python download_ncert_books.py

# Start fresh
python download_ncert_books.py --no-resume

# Custom delay
python download_ncert_books.py --delay 3.0
```

### Downloaded Structure

```
books/
├── Class_1/
│   ├── Mathematics/
│   │   ├── English/
│   │   │   └── Mathematics_English.pdf
│   │   └── Hindi/
│   │       └── Mathematics_Hindi.pdf
│   └── Science/
└── Class_2/
    └── ...
```

---

## 🔧 Environment Variables

### Server (`Server/.env`)

```env
# Required
GEMINI_API_KEY=your-gemini-api-key

# Optional
ENVIRONMENT=development
LOG_LEVEL=INFO
SARVAM_API_KEY=your-sarvam-api-key
MONGODB_URI=mongodb://localhost:27017/chanakya

# Twilio (for voice/SMS)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```

### Frontend (`Client_F/front_chanak/.env`)

```env
VITE_SARVAM_API_KEY=your-sarvam-key
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech
VITE_API_URL=http://localhost:3000
```

---

## 🧪 Testing

```powershell
# Backend tests
cd Server
.\venv\Scripts\Activate.ps1
pytest

# Specific tests
python test_nlp.py                    # NLP pipeline
python test_orchestrator.py           # Orchestrator
python test_classroom_guidance.py     # Classroom guidance
python test_teaching_feedback.py      # Feedback system

# Frontend lint
cd Client_F\front_chanak
npm run lint
```

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment instructions.

### Quick Deploy

```powershell
# Build frontend
cd Client_F\front_chanak
npm run build

# Production server
cd Server\Web_server
python main.py  # Or use: uvicorn main:app --host 0.0.0.0 --port 3000
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **MongoDB connection error** | Ensure MongoDB is running: `mongod` |
| **ModuleNotFoundError** | Activate venv and run `pip install -r requirements.txt` |
| **CORS error** | Check backend is on port 3000, verify `VITE_API_URL` |
| **Invalid API key** | Check `.env` files for correct keys (no quotes/spaces) |
| **Orchestrator not ready** | Check `GEMINI_API_KEY` is set correctly |

### Check API Keys

```powershell
python embedding/check_api_keys.py
```

### List Available Gemini Models

```powershell
python embedding/list_gemini_models.py
```

---

## 📝 Available Scripts

### Backend

```powershell
cd Server\Web_server && python main.py     # Run server
cd Server && pytest                         # Run tests
python embedding/generate_embeddings.py    # Generate embeddings
python main.py "query"                     # Query RAG
```

### Frontend

```powershell
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is provided for educational purposes. Please respect NCERT's terms of service and copyright policies when using downloaded materials.

---

<div align="center">

**Made with ❤️ for Indian Teachers**

[Report Bug](https://github.com/Kautilya346/Chanakya/issues) · [Request Feature](https://github.com/Kautilya346/Chanakya/issues)

</div>
