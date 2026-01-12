# NCERT Books RAG System

A comprehensive system for downloading NCERT textbooks, generating embeddings, and querying them using Retrieval-Augmented Generation (RAG) with Gemini LLM.

## Overview

This project consists of two main components:

1. **Book Downloader**: Downloads NCERT textbooks from the official website
2. **RAG System**: Generates embeddings from PDFs and enables semantic search with LLM-powered answers

---

## Part 1: NCERT Books Downloader

A Python-based web scraper to download all NCERT textbooks (PDFs) from the official NCERT website (`https://ncert.nic.in/textbook.php`). The script automatically downloads books for all classes, subjects, and languages, organizing them in a structured directory format.

## Features

- **Comprehensive Coverage**: Downloads books for all classes (I-XII) and all available subjects
- **Multi-language Support**: Downloads books in all available languages (English, Hindi, Urdu)
- **Organized Storage**: Automatically organizes books by `Class/Subject/Language`
- **Resume Capability**: Can resume interrupted downloads from the last checkpoint
- **Error Handling**: Robust error handling with retries and detailed logging
- **Rate Limiting**: Respectful delays between downloads to avoid overwhelming the server
- **Progress Tracking**: Real-time progress updates and detailed logging

## Requirements

- Python 3.7 or higher
- Internet connection
- Required Python packages (see `requirements.txt`)

## Installation

1. Clone or download this repository

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Playwright browsers:
```bash
playwright install chromium
```

## Usage

### Basic Usage

Simply run the script to download all NCERT books:

```bash
python download_ncert_books.py
```

### Command Line Options

- `--no-resume`: Start fresh, ignoring any previous progress
  ```bash
  python download_ncert_books.py --no-resume
  ```

- `--delay SECONDS`: Set custom delay between downloads (default: 1.5 seconds)
  ```bash
  python download_ncert_books.py --delay 2.0
  ```

### Examples

Download all books with default settings:
```bash
python download_ncert_books.py
```

Start fresh download (ignore previous progress):
```bash
python download_ncert_books.py --no-resume
```

Download with longer delays (more respectful to server):
```bash
python download_ncert_books.py --delay 3.0
```

## Directory Structure

Downloaded books are organized in the following structure:

```
books/
├── Class_1/
│   ├── Mathematics/
│   │   ├── English/
│   │   │   └── Mathematics_English.pdf
│   │   ├── Hindi/
│   │   │   └── Mathematics_Hindi.pdf
│   │   └── Urdu/
│   │       └── Mathematics_Urdu.pdf
│   └── Science/
│       ├── English/
│       └── Hindi/
├── Class_2/
│   └── ...
└── ...
```

## Progress Tracking

The script maintains progress in two ways:

1. **Progress State File** (`progress_state.json`): Tracks which books have been successfully downloaded, allowing the script to resume from where it left off.

2. **Download Log** (`download_log.txt`): Detailed log file containing:
   - Timestamp of each operation
   - Success/failure status
   - Error messages (if any)
   - Download statistics

## How It Works

1. **Browser Automation**: Uses Playwright to navigate the NCERT website and interact with dynamic dropdowns
2. **Book Discovery**: Systematically iterates through all classes, subjects, and books
3. **Link Extraction**: Extracts download links for all available language versions
4. **PDF Download**: Downloads PDF files using the `requests` library
5. **Validation**: Verifies downloaded files are valid PDFs
6. **Organization**: Saves files in organized directory structure

## Configuration

You can modify the following constants in `download_ncert_books.py`:

- `DOWNLOAD_DELAY`: Delay between downloads (default: 1.5 seconds)
- `MAX_RETRIES`: Maximum retry attempts for failed downloads (default: 3)
- `TIMEOUT`: Timeout for browser operations in milliseconds (default: 30000)
- `BOOKS_DIR`: Directory name for downloaded books (default: "books")

## Error Handling

The script includes comprehensive error handling:

- **Network Errors**: Automatic retries with exponential backoff
- **Timeout Errors**: Configurable timeouts for all operations
- **Invalid Files**: Validation to ensure downloaded files are valid PDFs
- **Missing Books**: Gracefully skips books that are not available
- **Resume on Failure**: Can resume interrupted downloads

## Logging

All operations are logged to both:
- Console (real-time output)
- `download_log.txt` file (detailed log)

Log levels include:
- **INFO**: General progress information
- **WARNING**: Non-critical issues (e.g., book not available in a language)
- **ERROR**: Critical errors that prevent downloads

## Notes

- The script respects the NCERT website by including delays between requests
- Some books may not be available in all languages
- The download process may take several hours depending on:
  - Number of books available
  - Internet connection speed
  - Server response times
- The script can be safely interrupted and resumed later

## Troubleshooting

### Playwright Installation Issues

If you encounter issues with Playwright:

```bash
# Reinstall Playwright
pip uninstall playwright
pip install playwright
playwright install chromium
```

### Download Failures

If downloads fail:

1. Check your internet connection
2. Verify the NCERT website is accessible
3. Check `download_log.txt` for specific error messages
4. Try running with `--no-resume` to start fresh
5. Increase the delay with `--delay` option

### Missing Books

Some books may not be available in all languages. This is normal and the script will log warnings for missing books.

## License

This script is provided as-is for educational purposes. Please respect the NCERT website's terms of service and use responsibly.

## Disclaimer

This tool is for personal/educational use only. Please ensure you comply with NCERT's terms of service and copyright policies when using downloaded materials.

---

## Part 2: RAG System for NCERT Books

A Retrieval-Augmented Generation (RAG) system that enables semantic search and question-answering over NCERT textbooks using embeddings and Gemini LLM.

### Features

- **PDF Processing**: Extracts text from PDFs using LlamaParse Fast model
- **Embedding Generation**: Creates embeddings using `sentence-transformers/sentence-t5-large`
- **Semantic Search**: Finds relevant content using cosine similarity
- **LLM Integration**: Generates answers using Google Gemini models
- **Source Citations**: Provides page-level citations with class, subject, book, and page number

### Architecture

```
PDF Books → LlamaParse → Text Extraction → Embeddings → SQLite Database
                                                              ↓
User Query → Embedding → Similarity Search → Context → Gemini LLM → Answer
```

### Requirements

- Python 3.7 or higher
- API Keys:
  - LlamaParse API key (from https://cloud.llamaindex.ai/)
  - Google Gemini API key (from https://makersuite.google.com/app/apikey)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the project root:
```bash
LLAMA_CLOUD_API_KEY=your_llama_parse_api_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Verify API keys:
```bash
python embedding/check_api_keys.py
```

### Quick Start

#### 1. Generate Embeddings

Process all PDFs and generate embeddings:

```bash
python embedding/generate_embeddings.py
```

**Options:**
- `--books-dir`: Directory containing PDFs (default: `Finaldata`)
- `--db-path`: Database path (default: `embedding/ncert_books.db`)
- `--max-files`: Process only N files (for testing)
- `--no-skip-existing`: Reprocess all files

**Example:**
```bash
# Process all books
python embedding/generate_embeddings.py

# Test with 5 files
python embedding/generate_embeddings.py --max-files 5
```

#### 2. Query the Books

**Using main.py (Direct approach - no orchestrator):**
```bash
python main.py "What is photosynthesis?" --db-path embedding/ncert_books.db
```

**Using query_books.py (With orchestrator):**
```bash
python embedding/query_books.py "What is photosynthesis?"
```

**Interactive mode:**
```bash
python embedding/query_books.py --interactive
```

### Main Scripts

#### `main.py` - Direct Query Script

Simplified query script that uses database and embedding service directly (no orchestrator).

**Usage:**
```bash
python main.py "Your question" [OPTIONS]
```

**Options:**
- `--db-path`: Path to SQLite database (default: `embedding/ncert_books.db`)
- `--top-k`: Number of documents to retrieve (default: 5)
- `--class`: Filter by class (e.g., `Class_7`)
- `--subject`: Filter by subject (e.g., `Science`)
- `--language`: Filter by language (e.g., `English`)
- `--model`: Gemini model name (default: `models/gemini-2.0-flash`)
- `--temperature`: LLM temperature (default: 0.7)

**Examples:**
```bash
# Basic query
python main.py "What is photosynthesis?"

# With filters
python main.py "Explain cells" --class "Class_7" --subject "Science"

# Custom model and temperature
python main.py "Your question" --model models/gemini-2.5-flash --temperature 0.5
```

#### `embedding/generate_embeddings.py` - Embedding Generation

Processes PDFs, extracts text, generates embeddings, and stores in SQLite.

**Usage:**
```bash
python embedding/generate_embeddings.py [OPTIONS]
```

#### `embedding/query_books.py` - Query with Orchestrator

Full-featured query script using the RAG orchestrator.

**Usage:**
```bash
python embedding/query_books.py "Your question" [OPTIONS]
```

### Embedding System Components

#### `embedding/database.py`
- SQLite database operations
- Stores documents with embeddings (BLOB)
- Implements cosine similarity search
- Supports filtering by class, subject, language

#### `embedding/embedding_service.py`
- Generates embeddings using `sentence-transformers/sentence-t5-large`
- Handles both document and query embeddings
- Batch processing support

#### `embedding/pdf_extractor.py`
- Extracts text from PDFs using LlamaParse Fast model
- Page-level text extraction
- Extracts metadata from file paths

#### `embedding/process_books.py`
- Main processing pipeline
- Coordinates PDF extraction, embedding generation, and database storage

#### `embedding/rag_orchestrator.py`
- RAG orchestrator (optional, used by query_books.py)
- Retrieves relevant documents
- Generates answers using Gemini LLM

### Database Schema

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    source TEXT NOT NULL  -- Format: "class|subject|bookname|language|page_number"
);
```

### Example Workflow

1. **Generate embeddings:**
   ```bash
   python embedding/generate_embeddings.py
   ```

2. **Query using main.py:**
   ```bash
   python main.py "What is the water cycle?" --top-k 5
   ```

3. **Query using orchestrator:**
   ```bash
   python embedding/query_books.py "Explain photosynthesis" --interactive
   ```

### Available Gemini Models

- `models/gemini-2.0-flash` (default) - Fast and efficient
- `models/gemini-2.5-flash` - Newer, faster version
- `models/gemini-2.5-pro` - Most capable model

List available models:
```bash
python embedding/list_gemini_models.py
```

### Troubleshooting

#### API Key Issues
```bash
# Check API keys
python embedding/check_api_keys.py
```

#### Database Not Found
```bash
# Make sure embeddings are generated first
python embedding/generate_embeddings.py
```

#### Model Not Found
If you get model errors, check available models:
```bash
python embedding/list_gemini_models.py
```

### Directory Structure

```
.
├── main.py                          # Main query script (direct approach)
├── embedding/
│   ├── database.py                 # Database operations
│   ├── embedding_service.py        # Embedding generation
│   ├── pdf_extractor.py            # PDF text extraction
│   ├── process_books.py            # Processing pipeline
│   ├── rag_orchestrator.py         # RAG orchestrator
│   ├── generate_embeddings.py      # Generate embeddings script
│   ├── query_books.py              # Query script (with orchestrator)
│   ├── check_api_keys.py           # API key checker
│   ├── list_gemini_models.py       # List available Gemini models
│   └── ncert_books.db              # SQLite database
├── Finaldata/                       # PDF books directory
└── .env                             # API keys (not in git)
```

### Notes

- The embedding system uses `sentence-transformers/sentence-t5-large` for embeddings
- LlamaParse Fast model is used for PDF extraction
- All embeddings are stored as BLOB in SQLite
- Source format: `"class|subject|bookname|language|page_number"`
- The system supports filtering by class, subject, and language

### License

This project is provided as-is for educational purposes. Please respect NCERT's terms of service and copyright policies.
