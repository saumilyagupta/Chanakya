"""
Quick Database Check
====================

Simple script to verify your RAG database is ready.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from orchestrator.tools.RAG.database import Database


def check_database():
    """Check if database exists and has content."""
    
    print("=" * 70)
    print("RAG Database Check")
    print("=" * 70)
    
    db_path = "orchestrator/tools/RAG/ncert_books.db"
    
    # Check if file exists
    if not os.path.exists(db_path):
        print(f"\n❌ Database file not found at: {db_path}")
        print(f"\n📍 Current directory: {os.getcwd()}")
        print(f"\n💡 Tip: Make sure you're running from the Server folder")
        return False
    
    print(f"\n✅ Database file found: {db_path}")
    print(f"   Size: {os.path.getsize(db_path) / 1024 / 1024:.2f} MB")
    
    try:
        # Connect to database
        print(f"\n📊 Connecting to database...")
        db = Database(db_path)
        
        # Get document count
        count = db.get_document_count()
        print(f"✅ Connected successfully!")
        print(f"   Total documents: {count:,}")
        
        if count == 0:
            print(f"\n⚠️  Warning: Database is empty!")
            print(f"   You need to populate it with NCERT embeddings first.")
            return False
        
        # Sample a few documents
        print(f"\n📚 Sample documents:")
        all_docs = db.get_all_documents()
        
        for i, doc in enumerate(all_docs[:3], 1):
            source = doc['source']
            content_preview = doc['content'][:100] + "..."
            embedding_shape = doc['embedding'].shape
            
            print(f"\n   [{i}] Source: {source}")
            print(f"       Content: {content_preview}")
            print(f"       Embedding: {embedding_shape}")
        
        # Check unique sources
        sources = set(doc['source'].split('|')[0] for doc in all_docs[:100])
        print(f"\n🎯 Unique classes/subjects found (sample): {', '.join(list(sources)[:5])}")
        
        db.close()
        print(f"\n{'=' * 70}")
        print(f"✅ Database check PASSED - Ready for RAG integration!")
        print(f"{'=' * 70}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = check_database()
    
    if success:
        print(f"\n🚀 Next step: Run test_rag_integration.py to test the full system")
        print(f"   Command: python test_rag_integration.py")
    else:
        print(f"\n⚠️  Fix the database issues above before proceeding")
    
    sys.exit(0 if success else 1)
