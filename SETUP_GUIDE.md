# 🚀 Chanakya - Setup and Run Guide

> Real-time classroom decision-support system for Indian primary school teachers

This guide will help you set up and run the Chanakya application locally.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | Any | [mongodb.com](https://www.mongodb.com/try/download/community) or use MongoDB Atlas |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |

---

## 🔑 Required API Keys

| Service | Purpose | Get Key From |
|---------|---------|--------------| 
| **Google Gemini API** | AI/LLM capabilities | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Sarvam AI API** | Indian language STT/TTS | [Sarvam AI](https://www.sarvam.ai/) |
| **LlamaParse API** (Optional) | PDF text extraction | [LlamaIndex Cloud](https://cloud.llamaindex.ai/) |

---

## ⚡ Method 1: One-Command Setup (Recommended)

The fastest and easiest way to set up the project.

### Windows

```cmd
# 1. Clone repository
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya

# 2. Run setup script (installs everything)
setup.bat

# 3. Configure environment
# Edit .env file with your API keys

# 4. Start the application
run.bat
```

### Unix/Linux/Mac

```bash
# 1. Clone repository
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya

# 2. Make scripts executable
chmod +x setup.sh run.sh

# 3. Run setup script (installs everything)
./setup.sh

# 4. Configure environment
# Edit .env file with your API keys

# 5. Start the application
./run.sh
```

### What the Setup Script Does

1. ✅ Checks for Python 3.9+ and Node.js 18+
2. ✅ Creates Python virtual environment (`venv/`)
3. ✅ Installs Python dependencies from `requirements.txt` and `Server/requirements.txt`
4. ✅ Installs frontend npm packages
5. ✅ Creates `.env` file from template if missing

### What the Run Script Does

1. ✅ Activates the Python virtual environment
2. ✅ Starts the backend server (port 3000)
3. ✅ Starts the frontend dev server (port 5173)
4. ✅ Opens two terminal windows for easy monitoring

---

## 🔧 Method 2: Manual Setup (Step-by-Step)

For users who prefer manual control over each step.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya
```

### Step 2: Create Python Virtual Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Windows CMD)
.\venv\Scripts\activate.bat

# Activate (Unix/Linux/Mac)
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```powershell
# Upgrade pip
pip install --upgrade pip

# Install root dependencies
pip install -r requirements.txt

# Install server dependencies
pip install -r Server/requirements.txt
```

### Step 4: Install Frontend Dependencies

```powershell
cd Client_F\front_chanak
npm install
cd ..\..
```

### Step 5: Configure Environment Variables

Edit the `.env` file in the project root with your credentials:

```env
# ==================== Required ====================
GEMINI_API_KEY=your-gemini-api-key-here

# ==================== Sarvam AI (Voice Features) ====================
SARVAM_API_KEY=your-sarvam-api-key-here
VITE_SARVAM_API_KEY=your-sarvam-api-key-here
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech

# ==================== API Configuration ====================
VITE_API_URL=http://localhost:3000

# ==================== MongoDB ====================
MONGODB_URL=mongodb+srv://your-connection-string
DATABASE_NAME=Chanakya

# ==================== JWT Configuration ====================
SECRET_KEY=your-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_DAYS=7

# ==================== Environment ====================
ENV=development
DEBUG=true
LOG_LEVEL=INFO

# ==================== Twilio (Optional) ====================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=

# ==================== CORS Configuration ====================
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### Step 6: Run the Application

**Terminal 1 - Backend Server:**

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# OR
source venv/bin/activate       # Unix/Linux/Mac

# Run the backend server
python Server/Web_server/main.py
```

**Terminal 2 - Frontend Server:**

```powershell
cd Client_F\front_chanak
npm run dev
```

---

## ✅ Verify Setup

### 1. Backend Health Check

Open http://localhost:3000/health in your browser. You should see:

```json
{
  "status": "healthy",
  "orchestrator_ready": true
}
```

### 2. API Documentation

Open http://localhost:3000/docs to view the Swagger API documentation.

### 3. Frontend

Open http://localhost:5173 to access the Chanakya web interface.

### Quick Reference

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
├── setup.bat / setup.sh       # One-command setup scripts
├── run.bat / run.sh           # One-command run scripts
├── .env                       # Unified environment configuration
├── venv/                      # Python virtual environment (created by setup)
│
├── Client_F/                  # Frontend Application
│   └── front_chanak/          # React + Vite Application
│       ├── src/               # React source files
│       ├── public/            # Static assets
│       └── vite.config.js     # Vite config (loads .env from root)
│
├── Server/                    # Backend Server
│   ├── Web_server/            # FastAPI Application
│   │   ├── main.py            # Entry point (port 3000)
│   │   ├── routers/           # API route handlers
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Business logic
│   ├── nlp/                   # NLP Pipeline
│   ├── orchestrator/          # LangGraph Orchestration
│   ├── module/                # Lesson Builder Module
│   └── requirements.txt       # Python dependencies
│
├── embedding/                 # RAG System
│   ├── generate_embeddings.py # Generate embeddings from PDFs
│   ├── query_books.py         # Query the RAG system
│   └── ncert_books.db         # SQLite embeddings database
│
├── Finaldata/                 # NCERT PDF Books
└── main.py                    # Direct query script for RAG
```

---

## 🛠️ Available Commands

### Setup & Run Scripts

| Command | Description |
|---------|-------------|
| `setup.bat` (Windows) | Install all dependencies and set up project |
| `setup.sh` (Unix) | Install all dependencies and set up project |
| `run.bat` (Windows) | Start both backend and frontend servers |
| `run.sh` (Unix) | Start both backend and frontend servers |

### Backend Commands (with venv activated)

```powershell
# Run the web server
python Server/Web_server/main.py

# Run tests
cd Server && pytest

# Test NLP pipeline
python Server/tests/test_nlp.py

# Test orchestrator
python Server/tests/test_orchestrator.py
```

### Frontend Commands

```powershell
cd Client_F/front_chanak

npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### RAG System Commands

```powershell
# Generate embeddings from NCERT books
python embedding/generate_embeddings.py

# Query the RAG system
python main.py "What is photosynthesis?" --db-path embedding/ncert_books.db

# Interactive mode
python embedding/query_books.py --interactive
```

---

## 🌐 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User authentication |
| `POST /api/auth/register` | User registration |
| `POST /api/query` | AI-powered query processing |
| `GET /api/chat/history` | Chat history retrieval |
| `POST /api/sarvam/stt` | Speech-to-text conversion |
| `POST /api/sarvam/tts` | Text-to-speech conversion |
| `GET /api/classes` | Class management |
| `GET /api/students` | Student management |
| `GET /api/analytics` | Teaching analytics |

Full API documentation available at: http://localhost:3000/docs

---

## 🔧 Troubleshooting

### Common Issues

**1. "Python/Node not found" during setup**
- Ensure Python 3.9+ and Node.js 18+ are installed
- Add them to your system PATH
- Restart your terminal after installation

**2. MongoDB Connection Error**
```
Error: Could not connect to MongoDB
```
- Ensure MongoDB is running: `mongod`
- Check if MongoDB is listening on port 27017
- Verify the `MONGODB_URL` in your `.env` file

**3. Module Not Found Error**
```
ModuleNotFoundError: No module named 'xxx'
```
- Ensure virtual environment is activated
- Run `pip install -r Server/requirements.txt` again

**4. CORS Error in Browser**
```
Access to fetch has been blocked by CORS policy
```
- Check that backend is running on port 3000
- Verify `CORS_ORIGINS` in `.env` includes your frontend URL

**5. API Key Errors**
```
Error: Invalid API key
```
- Double-check your API keys in `.env` file
- Ensure no extra spaces or quotes around keys

**6. Port Already in Use**
```
Error: Address already in use
```
- Kill the process using the port: `npx kill-port 3000` or `npx kill-port 5173`
- Or use a different port

---

## 📞 Support

For issues or questions:
- Check the detailed [README.md](README.md) for more information
- Review the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment

---

## 📄 License

This project is provided for educational purposes. Please respect NCERT's terms of service and copyright policies when using downloaded materials.
