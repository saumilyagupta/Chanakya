#!/usr/bin/env python3
"""
Extract all ZIP files from the books directory
"""

import os
import zipfile
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('extract_log.txt'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

BOOKS_DIR = "books"

def extract_all_zips():
    """Extract all ZIP files in the books directory"""
    books_path = Path(BOOKS_DIR)
    
    if not books_path.exists():
        logger.error(f"Books directory '{BOOKS_DIR}' does not exist")
        return
    
    zip_files = list(books_path.rglob("*.zip"))
    total = len(zip_files)
    
    if total == 0:
        logger.info("No ZIP files found")
        return
    
    logger.info(f"Found {total} ZIP files to extract")
    
    extracted = 0
    failed = 0
    
    for zip_path in zip_files:
        try:
            # Extract to the same directory as the ZIP file
            extract_dir = zip_path.parent
            
            logger.info(f"Extracting: {zip_path.relative_to(books_path)}")
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # List contents for logging
                file_list = zip_ref.namelist()
                logger.debug(f"  Contains {len(file_list)} files")
                
                # Extract all files
                zip_ref.extractall(extract_dir)
                
            extracted += 1
            logger.info(f"  ✓ Successfully extracted to {extract_dir.relative_to(books_path)}")
            
        except zipfile.BadZipFile:
            logger.error(f"  ✗ Bad ZIP file: {zip_path}")
            failed += 1
        except Exception as e:
            logger.error(f"  ✗ Error extracting {zip_path}: {e}")
            failed += 1
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Extraction Summary:")
    logger.info(f"  Extracted: {extracted}")
    logger.info(f"  Failed: {failed}")
    logger.info(f"  Total: {total}")
    logger.info(f"{'='*60}")

if __name__ == '__main__':
    extract_all_zips()
