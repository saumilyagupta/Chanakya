#!/usr/bin/env python3
"""
Main script to query NCERT books database using embeddings and LLM
Uses embedding service and database directly (no orchestrator)
"""

import os
import sys
import argparse
import logging
import warnings
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings('ignore', category=FutureWarning)
import google.generativeai as genai

# Add embedding directory to path
sys.path.insert(0, str(Path(__file__).parent))

from embedding.database import Database
from embedding.embedding_service import EmbeddingService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def format_context(documents: list) -> str:
    """
    Format retrieved documents into context string for LLM
    
    Args:
        documents: List of document dictionaries from database
    
    Returns:
        Formatted context string
    """
    context_parts = []
    
    for i, doc in enumerate(documents, 1):
        source_parts = doc['source'].split('|')
        if len(source_parts) >= 5:
            class_name = source_parts[0]
            subject = source_parts[1]
            bookname = source_parts[2]
            language = source_parts[3]
            page_num = source_parts[4]
            
            context_parts.append(
                f"[Source {i} - {class_name}, {subject}, {bookname} ({language}), Page {page_num}]:\n"
                f"{doc['content']}\n"
            )
        else:
            context_parts.append(
                f"[Source {i} - {doc['source']}]:\n"
                f"{doc['content']}\n"
            )
    
    return "\n".join(context_parts)


def generate_answer_with_llm(query: str, context: str, gemini_api_key: str, 
                             model_name: str = "models/gemini-2.0-flash",
                             temperature: float = 0.7) -> str:
    """
    Generate answer using Gemini LLM
    
    Args:
        query: User's question
        context: Retrieved context from documents
        gemini_api_key: Gemini API key
        model_name: Name of the Gemini model
        temperature: Temperature for generation
    
    Returns:
        Generated answer string
    """
    # Configure Gemini
    genai.configure(api_key=gemini_api_key)
    
    # Initialize model
    if not model_name.startswith("models/"):
        model_name = f"models/{model_name}"
    
    model = genai.GenerativeModel(model_name)
    
    # Create prompt
    prompt = f"""You are a helpful assistant that answers questions based on NCERT (National Council of Educational Research and Training) textbook content.

Use the following excerpts from NCERT books to answer the question. If the information is not available in the provided context, say so clearly.

Context from NCERT books:
{context}

Question: {query}

Please provide a clear, accurate answer based on the NCERT book excerpts above. Include relevant details and cite the source (class, subject, book, page number) when appropriate."""

    try:
        # Configure generation parameters
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        return response.text
        
    except Exception as e:
        logger.error(f"Error generating answer with Gemini: {e}")
        raise


def query_database(db_path: str, query_text: str, top_k: int = 5,
                   gemini_api_key: str = None, model_name: str = "models/gemini-2.0-flash",
                   temperature: float = 0.7, filters: dict = None):
    """
    Query the database using embeddings and generate answer with LLM
    
    Args:
        db_path: Path to SQLite database
        query_text: User's question
        top_k: Number of relevant documents to retrieve
        gemini_api_key: Gemini API key (if None, reads from env)
        model_name: Gemini model name
        temperature: Temperature for LLM generation
        filters: Optional filters (class, subject, language)
    
    Returns:
        Dictionary with answer, sources, and query
    """
    # Get API key
    if not gemini_api_key:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key:
        raise ValueError(
            "Gemini API key not provided. "
            "Set GEMINI_API_KEY environment variable or pass gemini_api_key parameter."
        )
    
    # Initialize database
    logger.info(f"Loading database from: {db_path}")
    database = Database(db_path=db_path)
    
    # Initialize embedding service
    logger.info("Initializing embedding service...")
    embedding_service = EmbeddingService()
    
    # Get database statistics
    total_docs = database.get_document_count()
    logger.info(f"Database contains {total_docs} documents")
    
    # Step 1: Generate query embedding using embedding service
    logger.info(f"Generating embedding for query: {query_text[:100]}...")
    query_embedding = embedding_service.generate_query_embedding(query_text)
    
    # Step 2: Search database for similar documents
    logger.info(f"Searching database for top {top_k} similar documents...")
    relevant_docs = database.search_similar(
        query_embedding,
        top_k=top_k,
        filters=filters
    )
    
    if not relevant_docs:
        logger.warning("No relevant documents found")
        database.close()
        return {
            'answer': "I couldn't find any relevant information in the NCERT books to answer your question.",
            'sources': [],
            'query': query_text
        }
    
    logger.info(f"Found {len(relevant_docs)} relevant documents")
    
    # Step 3: Format context from retrieved documents
    context = format_context(relevant_docs)
    
    # Step 4: Generate answer using LLM
    logger.info("Generating answer with Gemini LLM...")
    answer = generate_answer_with_llm(
        query_text,
        context,
        gemini_api_key,
        model_name,
        temperature
    )
    
    # Step 5: Format sources
    sources = []
    for doc in relevant_docs:
        source_parts = doc['source'].split('|')
        if len(source_parts) >= 5:
            sources.append({
                'class': source_parts[0],
                'subject': source_parts[1],
                'bookname': source_parts[2],
                'language': source_parts[3],
                'page_number': source_parts[4],
                'content_preview': doc['content'][:200] + "..." if len(doc['content']) > 200 else doc['content']
            })
        else:
            sources.append({
                'source': doc['source'],
                'content_preview': doc['content'][:200] + "..." if len(doc['content']) > 200 else doc['content']
            })
    
    # Close database connection
    database.close()
    
    return {
        'answer': answer,
        'sources': sources,
        'query': query_text
    }


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Query NCERT books database using embeddings and LLM"
    )
    parser.add_argument(
        'query',
        type=str,
        help='Question to ask about NCERT books'
    )
    parser.add_argument(
        '--db-path',
        type=str,
        default='embedding/ncert_books.db',
        help='Path to SQLite database (default: embedding/ncert_books.db)'
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=5,
        help='Number of relevant documents to retrieve (default: 5)'
    )
    parser.add_argument(
        '--class',
        type=str,
        default=None,
        dest='class_filter',
        help='Filter by class (e.g., Class_6)'
    )
    parser.add_argument(
        '--subject',
        type=str,
        default=None,
        help='Filter by subject (e.g., Science)'
    )
    parser.add_argument(
        '--language',
        type=str,
        default=None,
        help='Filter by language (e.g., English)'
    )
    parser.add_argument(
        '--temperature',
        type=float,
        default=0.7,
        help='Temperature for LLM generation (default: 0.7)'
    )
    parser.add_argument(
        '--model',
        type=str,
        default='models/gemini-2.0-flash',
        help='Gemini model to use (default: models/gemini-2.0-flash)'
    )
    parser.add_argument(
        '--gemini-api-key',
        type=str,
        default=None,
        help='Gemini API key (default: from GEMINI_API_KEY env var)'
    )
    
    args = parser.parse_args()
    
    # Check if database exists
    db_path = Path(args.db_path)
    if not db_path.exists():
        logger.error(f"Database not found: {db_path}")
        logger.error("Please run generate_embeddings.py first to create the database")
        sys.exit(1)
    
    # Build filters
    filters = {}
    if args.class_filter:
        filters['class'] = args.class_filter
    if args.subject:
        filters['subject'] = args.subject
    if args.language:
        filters['language'] = args.language
    
    try:
        # Query database
        result = query_database(
            db_path=str(db_path),
            query_text=args.query,
            top_k=args.top_k,
            gemini_api_key=args.gemini_api_key,
            model_name=args.model,
            temperature=args.temperature,
            filters=filters if filters else None
        )
        
        # Display results
        print("\n" + "=" * 60)
        print("Answer:")
        print("=" * 60)
        print(result['answer'])
        print("\n" + "=" * 60)
        print("Sources:")
        print("=" * 60)
        for i, source in enumerate(result['sources'], 1):
            if 'class' in source:
                print(f"{i}. {source['class']} - {source['subject']} - "
                      f"{source['bookname']} ({source['language']}), "
                      f"Page {source['page_number']}")
            else:
                print(f"{i}. {source.get('source', 'Unknown')}")
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
