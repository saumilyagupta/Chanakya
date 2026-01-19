# 🚀 Chanakya - Setup and Run Guide

> Real-time classroom decision-support system for Indian primary school teachers

This guide will help you set up and run the Chanakya application locally.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3.11+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **MongoDB** - [Download MongoDB](https://www.mongodb.com/try/download/community) (or use MongoDB Atlas)
- **Git** - [Download Git](https://git-scm.com/)

---

## 🔑 Required API Keys

You'll need the following API keys:

| Service | Purpose | Get Key From |
|---------|---------|--------------|
| **Google Gemini API** | AI/LLM capabilities | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Sarvam AI API** | Indian language STT/TTS | [Sarvam AI](https://www.sarvam.ai/) |
| **LlamaParse API** (Optional) | PDF text extraction | [LlamaIndex Cloud](https://cloud.llamaindex.ai/) |

---

## ⚙️ Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kautilya346/Chanakya.git
cd Chanakya
```

### Step 2: Backend Setup (Server)

```powershell
# Navigate to Server directory
cd Server

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# OR for Command Prompt
.\venv\Scripts\activate.bat

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Configure Backend Environment Variables

Create a `.env` file in the `Server` directory:

```powershell
# Copy the example file
copy .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Google Gemini API Key (Required)
GEMINI_API_KEY=your-gemini-api-key-here

# Environment
ENVIRONMENT=development

# Logging
LOG_LEVEL=INFO

# Sarvam AI Configuration
SARVAM_API_KEY=your-sarvam-api-key-here

# MongoDB URI (Optional - defaults to localhost)
MONGODB_URI=mongodb://localhost:27017/chanakya
```

### Step 4: Frontend Setup

```powershell
# Navigate to Frontend directory
cd ..\Client_F\front_chanak

# Install Node.js dependencies
npm install
```

### Step 5: Configure Frontend Environment Variables

Create or edit the `.env` file in `Client_F/front_chanak`:

```env
# Sarvam AI Configuration
VITE_SARVAM_API_KEY=your-sarvam-api-key-here
VITE_SARVAM_API_URL=https://api.sarvam.ai/speech-to-text
VITE_SARVAM_TTS_API_URL=https://api.sarvam.ai/text-to-speech

# API Configuration (Backend URL)
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Running the Application

### Start MongoDB (if running locally)

```powershell
# Make sure MongoDB is running
# Default is usually: mongod --dbpath "C:\data\db"
```

### Start the Backend Server

```powershell
# Navigate to Server/Web_server directory
cd Server\Web_server

# Activate virtual environment if not already activated
..\venv\Scripts\Activate.ps1

# Run the FastAPI server
python main.py
```

The backend will start at: **http://localhost:3000**

- API Documentation: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

### Start the Frontend (New Terminal Window)

```powershell
# Navigate to Frontend directory
cd Client_F\front_chanak

# Start the development server
npm run dev
```

The frontend will start at: **http://localhost:5173** (default Vite port)

---

## ✅ Verify Setup

1. **Backend Health Check:**
   Open http://localhost:3000/health in your browser. You should see:
   ```json
   {
     "status": "healthy",
     "orchestrator_ready": true
   }
   ```

2. **API Documentation:**
   Open http://localhost:3000/docs to view the Swagger API documentation.

3. **Frontend:**
   Open http://localhost:5173 to access the Chanakya web interface.

---

## 📁 Project Structure

```
Chanakya/
├── Client_F/                    # Frontend Application
│   └── front_chanak/           # React + Vite Application
│       ├── src/                # React source files
│       ├── public/             # Static assets
│       ├── .env                # Environment variables
│       └── package.json        # Node.js dependencies
│
├── Server/                      # Backend Server
│   ├── Web_server/             # FastAPI Application
│   │   ├── main.py             # Entry point (port 3000)
│   │   ├── routers/            # API route handlers
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   ├── nlp/                    # NLP Pipeline
│   ├── orchestrator/           # LangGraph Orchestration
│   ├── module/                 # Lesson Builder Module
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
│
├── embedding/                   # RAG System
│   ├── generate_embeddings.py  # Generate embeddings from PDFs
│   ├── query_books.py          # Query the RAG system
│   └── ncert_books.db          # SQLite embeddings database
│
├── feedback_system/             # Sahayak Pro Feedback System
├── Finaldata/                   # NCERT PDF Books
├── main.py                      # Direct query script for RAG
└── README.md                    # Detailed documentation
```

---

## 🛠️ Available Scripts

### Backend Commands

```powershell
# From Server directory (with venv activated)

# Run the web server
cd Web_server && python main.py

# Run tests
pytest

# Test NLP pipeline
python test_nlp.py

# Test orchestrator
python test_orchestrator.py
```

### Frontend Commands

```powershell
# From Client_F/front_chanak directory

npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### RAG System Commands

```powershell
# From root Chanakya directory

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

**1. MongoDB Connection Error**
```
Error: Could not connect to MongoDB
```
- Ensure MongoDB is running: `mongod`
- Check if MongoDB is listening on port 27017
- Verify the `MONGODB_URI` in your `.env` file

**2. Module Not Found Error**
```
ModuleNotFoundError: No module named 'xxx'
```
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

**3. CORS Error in Browser**
```
Access to fetch has been blocked by CORS policy
```
- Check that backend is running on port 3000
- Verify `VITE_API_URL` in frontend `.env` file

**4. API Key Errors**
```
Error: Invalid API key
```
- Double-check your API keys in `.env` files
- Ensure no extra spaces or quotes around keys

---

## 📞 Support

For issues or questions:
- Check the detailed [README.md](README.md) for more information
- Review the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment

---

## 📄 License

This project is provided for educational purposes. Please respect NCERT's terms of service and copyright policies when using downloaded materials.
