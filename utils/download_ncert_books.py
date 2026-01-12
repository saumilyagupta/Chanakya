#!/usr/bin/env python3
"""
NCERT Books Downloader
Downloads all NCERT textbooks from https://ncert.nic.in/textbook.php
Organizes books by Class/Subject/Language
"""

import os
import json
import time
import logging
import requests
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError
from urllib.parse import urljoin, urlparse
import re

# Configuration
BASE_URL = "https://ncert.nic.in/textbook.php"
DOWNLOAD_DELAY = 1.5  # seconds between downloads
MAX_RETRIES = 3
TIMEOUT = 60000  # milliseconds for Playwright operations (increased for slow connections)
TIMEOUT_SHORT = 30000  # shorter timeout for fallback operations
PROGRESS_FILE = "progress_state.json"
LOG_FILE = "download_log.txt"
BOOKS_DIR = "books"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class NCERTBookDownloader:
    """Main class for downloading NCERT books"""
    
    def __init__(self, resume: bool = True):
        self.resume = resume
        self.progress = self.load_progress() if resume else {}
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.downloaded_count = 0
        self.failed_count = 0
        self.skipped_count = 0
        
    def load_progress(self) -> Dict:
        """Load progress from JSON file"""
        if os.path.exists(PROGRESS_FILE):
            try:
                with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load progress file: {e}")
        return {}
    
    def save_progress(self):
        """Save current progress to JSON file"""
        try:
            with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.progress, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Could not save progress file: {e}")
    
    def sanitize_filename(self, filename: str) -> str:
        """Remove invalid characters from filename"""
        # Remove or replace invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = filename.strip('. ')
        # Limit length
        if len(filename) > 200:
            filename = filename[:200]
        return filename
    
    def get_book_key(self, class_num: str, subject: str, book: str, language: str) -> str:
        """Generate unique key for a book"""
        return f"{class_num}|{subject}|{book}|{language}"
    
    def is_already_downloaded(self, class_num: str, subject: str, book: str, language: str) -> bool:
        """Check if book is already downloaded"""
        key = self.get_book_key(class_num, subject, book, language)
        return self.progress.get(key, {}).get('downloaded', False)
    
    def mark_as_downloaded(self, class_num: str, subject: str, book: str, language: str, filepath: str):
        """Mark book as downloaded in progress"""
        key = self.get_book_key(class_num, subject, book, language)
        if key not in self.progress:
            self.progress[key] = {}
        self.progress[key]['downloaded'] = True
        self.progress[key]['filepath'] = filepath
        self.progress[key]['timestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')
        self.save_progress()
    
    def get_all_classes(self, page: Page) -> List[str]:
        """Extract all available classes from dropdown"""
        try:
            # Wait for class dropdown to be ready
            page.wait_for_selector('select[name="tclass"]', timeout=TIMEOUT)
            
            # Get all options from class dropdown
            class_options = page.query_selector_all('select[name="tclass"] option')
            classes = []
            
            for option in class_options:
                value = option.get_attribute('value')
                text = option.inner_text().strip()
                if value and value != '' and value != '-1' and value != '0':
                    classes.append(value)
                    logger.debug(f"Found class: {text} (value: {value})")
            
            logger.info(f"Found {len(classes)} classes")
            return classes
        except Exception as e:
            logger.error(f"Error getting classes: {e}")
            return []
    
    def get_subjects_for_class(self, page: Page, class_num: str) -> List[Tuple[str, str]]:
        """Select class and get all available subjects"""
        try:
            # Check if page is still valid
            if page.is_closed():
                raise Exception("Page has been closed")
            
            # Wait for class dropdown to be ready
            page.wait_for_selector('select[name="tclass"]', timeout=TIMEOUT)
            
            # Select the class and trigger change event
            page.select_option('select[name="tclass"]', class_num)
            logger.debug(f"Selected class: {class_num}")
            
            # Trigger change event manually - the JavaScript change() function updates option texts
            page.evaluate('''
                const select = document.querySelector('select[name="tclass"]');
                if (select && select.onchange) {
                    select.onchange();
                } else if (select) {
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
            ''')
            
            # Wait for JavaScript to update option texts
            # The JavaScript directly modifies option.text, so we wait for non-empty texts
            max_wait = 15
            found_subjects = False
            for i in range(max_wait):
                time.sleep(0.5)
                subject_options = page.query_selector_all('select[name="tsubject"] option')
                
                # Check for valid options by TEXT (not value, since JS updates text)
                for opt in subject_options:
                    text = opt.inner_text().strip()
                    # Look for actual subject names (not default/empty)
                    if text and text not in ['..Select Subject..', '..Select Subject......', '']:
                        found_subjects = True
                        break
                
                if found_subjects:
                    break
                logger.debug(f"Waiting for subjects... attempt {i+1}/{max_wait}")
            
            if not found_subjects:
                logger.warning(f"No subjects found after waiting for class {class_num}")
                return []
            
            # Get all subject options - use TEXT as identifier since values may be empty
            subject_options = page.query_selector_all('select[name="tsubject"] option')
            subjects = []
            
            # Debug: log all options
            logger.debug(f"All subject options for class {class_num}:")
            for idx, option in enumerate(subject_options[:15]):  # First 15 for debugging
                value = option.get_attribute('value')
                text = option.inner_text().strip()
                logger.debug(f"  Option {idx}: value='{value}', text='{text}'")
            
            for idx, option in enumerate(subject_options):
                text = option.inner_text().strip()
                value = option.get_attribute('value') or str(idx)  # Use index if value is empty
                
                # Filter out default/empty options - use TEXT as primary identifier
                if text and text not in ['..Select Subject..', '..Select Subject......', '']:
                    # Use text as the identifier since values may be empty
                    subjects.append((text, text))  # (identifier, display_name)
                    logger.debug(f"Found subject: {text} (index: {idx}, value: {value})")
            
            logger.info(f"Found {len(subjects)} subjects for class {class_num}")
            if len(subjects) == 0:
                logger.warning(f"No valid subjects found. Total options: {len(subject_options)}")
            return subjects
        except Exception as e:
            logger.error(f"Error getting subjects for class {class_num}: {e}", exc_info=True)
            return []
    
    def get_books_for_subject(self, page: Page, class_num: str, subject: str) -> List[Tuple[str, str]]:
        """Select subject and get all available books"""
        try:
            # Ensure class is still selected
            page.select_option('select[name="tclass"]', class_num)
            time.sleep(0.5)
            
            # Trigger change event for class to populate subjects
            page.evaluate('''
                const select = document.querySelector('select[name="tclass"]');
                if (select && select.onchange) {
                    select.onchange();
                } else if (select) {
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
            ''')
            time.sleep(1)
            
            # Find subject by text and select it by index
            subject_options = page.query_selector_all('select[name="tsubject"] option')
            subject_index = None
            for idx, opt in enumerate(subject_options):
                if opt.inner_text().strip() == subject:
                    subject_index = idx
                    break
            
            if subject_index is None:
                logger.warning(f"Subject '{subject}' not found in dropdown")
                return []
            
            # Select subject by index and trigger change1() function
            page.evaluate(f'''
                const select = document.querySelector('select[name="tsubject"]');
                if (select) {{
                    select.selectedIndex = {subject_index};
                    // Trigger change1 function with the selected index
                    if (typeof change1 === 'function') {{
                        change1({subject_index});
                    }}
                    // Also trigger change event
                    const event = new Event('change', {{ bubbles: true }});
                    select.dispatchEvent(event);
                }}
            ''')
            logger.debug(f"Selected subject: {subject} (index: {subject_index})")
            
            # Wait for book dropdown to populate (change1 function updates book options)
            max_wait = 15
            found_books = False
            for i in range(max_wait):
                time.sleep(0.5)
                book_options = page.query_selector_all('select[name="tbook"] option')
                
                # Check for valid options by TEXT
                for opt in book_options:
                    text = opt.inner_text().strip()
                    if text and text not in ['..Select Book Title..', '..Select Book Title...', '']:
                        found_books = True
                        break
                
                if found_books:
                    break
                logger.debug(f"Waiting for books... attempt {i+1}/{max_wait}")
            
            if not found_books:
                logger.warning(f"No books found after waiting for class {class_num}, subject {subject}")
                return []
            
            # Get all book options - use TEXT and VALUE
            book_options = page.query_selector_all('select[name="tbook"] option')
            books = []
            
            for idx, option in enumerate(book_options):
                text = option.inner_text().strip()
                value = option.get_attribute('value')
                
                if text and text not in ['..Select Book Title..', '..Select Book Title...', '']:
                    # Use value if available, otherwise use text
                    book_id = value if value and value not in ['-1', '0', ''] else text
                    books.append((book_id, text))
                    logger.debug(f"Found book: {text} (value: {value}, index: {idx})")
            
            logger.info(f"Found {len(books)} books for class {class_num}, subject {subject}")
            return books
        except Exception as e:
            logger.error(f"Error getting books for class {class_num}, subject {subject}: {e}", exc_info=True)
            return []
    
    def get_download_links(self, page: Page, class_num: str, subject: str, book: str) -> Dict[str, str]:
        """Navigate to book page and extract download links for all languages"""
        download_links = {}
        
        try:
            # Check if page is still valid
            if page.is_closed():
                logger.warning("Page is closed, cannot get download links")
                return {}
            
            # Ensure class is selected
            page.select_option('select[name="tclass"]', class_num)
            page.evaluate('''
                const select = document.querySelector('select[name="tclass"]');
                if (select && select.onchange) {
                    select.onchange();
                }
            ''')
            time.sleep(0.5)
            
            # Find and select subject by text
            if page.is_closed():
                logger.warning("Page closed during subject selection")
                return {}
            
            subject_options = page.query_selector_all('select[name="tsubject"] option')
            subject_idx = None
            for idx, opt in enumerate(subject_options):
                if opt.inner_text().strip() == subject:
                    subject_idx = idx
                    break
            
            if subject_idx is not None:
                page.evaluate(f'''
                    const select = document.querySelector('select[name="tsubject"]');
                    if (select) {{
                        select.selectedIndex = {subject_idx};
                        if (typeof change1 === 'function') {{
                            change1({subject_idx});
                        }}
                    }}
                ''')
            time.sleep(0.5)
            
            # Find book option to get its value (which is the URL to navigate to)
            if page.is_closed():
                logger.warning("Page closed during book selection")
                return {}
            
            book_options = page.query_selector_all('select[name="tbook"] option')
            book_url = None
            book_idx = None
            
            for idx, opt in enumerate(book_options):
                opt_text = opt.inner_text().strip()
                opt_value = opt.get_attribute('value')
                # Match by text or value
                if opt_text == book or opt_value == book:
                    book_idx = idx
                    book_url = opt_value  # The value is the URL to navigate to
                    break
            
            if book_url and book_url.startswith('textbook.php'):
                # Navigate directly to the book URL (more reliable than clicking button)
                book_full_url = urljoin(BASE_URL, book_url)
                logger.debug(f"Navigating directly to: {book_full_url}")
                
                # Retry navigation up to 2 times
                navigation_success = False
                for nav_attempt in range(2):
                    try:
                        if page.is_closed():
                            raise Exception("Page is closed")
                        page.goto(book_full_url, wait_until='networkidle', timeout=TIMEOUT)
                        navigation_success = True
                        time.sleep(2)
                        break
                    except Exception as e:
                        if nav_attempt < 1:
                            logger.debug(f"Navigation attempt {nav_attempt + 1} failed: {e}, retrying...")
                            time.sleep(1)
                            # Try with domcontentloaded as fallback
                            try:
                                if not page.is_closed():
                                    page.goto(book_full_url, wait_until='domcontentloaded', timeout=TIMEOUT_SHORT)
                                    navigation_success = True
                                    time.sleep(2)
                                    break
                            except:
                                pass
                        else:
                            logger.warning(f"Direct navigation failed after retries: {e}, trying button click...")
                            # Fallback to button click
                            if book_idx is not None and not page.is_closed():
                                try:
                                    page.evaluate(f'''
                                        const select = document.querySelector('select[name="tbook"]');
                                        if (select) {{
                                            select.selectedIndex = {book_idx};
                                        }}
                                    ''')
                                    time.sleep(0.5)
                                    go_button = page.query_selector('input[type="button"][value="Go"]')
                                    if go_button:
                                        try:
                                            with page.expect_navigation(timeout=TIMEOUT, wait_until='networkidle'):
                                                go_button.click()
                                        except:
                                            # Fallback to domcontentloaded
                                            with page.expect_navigation(timeout=TIMEOUT_SHORT, wait_until='domcontentloaded'):
                                                go_button.click()
                                        navigation_success = True
                                        time.sleep(2)
                                except Exception as e2:
                                    logger.debug(f"Button click fallback also failed: {e2}")
            else:
                # If no URL found, use button click method
                if book_idx is not None:
                    page.evaluate(f'''
                        const select = document.querySelector('select[name="tbook"]');
                        if (select) {{
                            select.selectedIndex = {book_idx};
                        }}
                    ''')
                time.sleep(0.5)
                
                # Click the "Go" button with retry logic
                navigation_success = False
                for nav_attempt in range(2):
                    try:
                        if page.is_closed():
                            raise Exception("Page is closed")
                        with page.expect_navigation(timeout=TIMEOUT, wait_until='networkidle'):
                            go_button = page.query_selector('input[type="button"][value="Go"]')
                            if go_button:
                                go_button.click()
                            else:
                                buttons = page.query_selector_all('input[type="button"], button')
                                for btn in buttons:
                                    text = btn.get_attribute('value') or btn.inner_text()
                                    if text and 'Go' in text:
                                        btn.click()
                                        break
                        navigation_success = True
                        break
                    except Exception as e:
                        if nav_attempt < 1:
                            logger.debug(f"Navigation attempt {nav_attempt + 1} failed: {e}, retrying with domcontentloaded...")
                            try:
                                if not page.is_closed():
                                    with page.expect_navigation(timeout=TIMEOUT_SHORT, wait_until='domcontentloaded'):
                                        go_button = page.query_selector('input[type="button"][value="Go"]')
                                        if go_button:
                                            go_button.click()
                                        else:
                                            buttons = page.query_selector_all('input[type="button"], button')
                                            for btn in buttons:
                                                text = btn.get_attribute('value') or btn.inner_text()
                                                if text and 'Go' in text:
                                                    btn.click()
                                                    break
                                    navigation_success = True
                                    break
                            except:
                                pass
                        else:
                            logger.debug(f"Navigation wait failed: {e}")
                            try:
                                if not page.is_closed():
                                    page.wait_for_load_state('domcontentloaded', timeout=TIMEOUT_SHORT)
                            except:
                                pass
                time.sleep(2)
            
            # Check if page is still valid after navigation
            if page.is_closed():
                logger.warning("Page was closed after navigation")
                return {}
            
            # Look for download links - especially "Download complete book" link
            # First look for the "Download complete book" link which is usually a ZIP
            all_links = page.query_selector_all('a[href]')
            for link in all_links:
                link_text = link.inner_text().strip().lower()
                if 'download complete book' in link_text or 'download' in link_text:
                    href = link.get_attribute('href')
                    if href:
                        full_url = urljoin(page.url, href)
                        # Determine language from URL or context
                        language = 'English'  # Default
                        if 'hindi' in full_url.lower() or 'hin' in full_url.lower():
                            language = 'Hindi'
                        elif 'urdu' in full_url.lower() or 'urd' in full_url.lower():
                            language = 'Urdu'
                        download_links[language] = full_url
                        logger.debug(f"Found complete book download: {language} - {full_url}")
                        break
            
            # Also look for other PDF/ZIP links
            links = page.query_selector_all('a[href*=".pdf"], a[href*=".zip"]')
            
            for link in links:
                href = link.get_attribute('href')
                text = link.inner_text().strip().lower()
                
                if href:
                    # Determine language from link text or URL
                    language = 'English'  # default
                    if 'hindi' in text or 'हिंदी' in text:
                        language = 'Hindi'
                    elif 'urdu' in text or 'اردو' in text:
                        language = 'Urdu'
                    elif 'english' in text:
                        language = 'English'
                    
                    # Make absolute URL
                    full_url = urljoin(page.url, href)
                    download_links[language] = full_url
                    logger.debug(f"Found {language} download link: {full_url}")
            
            # Also check for direct PDF links in page source
            page_content = page.content()
            pdf_pattern = r'href=["\']([^"\']*\.pdf[^"\']*)["\']'
            pdf_matches = re.findall(pdf_pattern, page_content, re.IGNORECASE)
            
            for pdf_url in pdf_matches:
                full_url = urljoin(page.url, pdf_url)
                # Try to determine language from URL or context
                language = 'English'
                if 'hindi' in full_url.lower() or 'hin' in full_url.lower():
                    language = 'Hindi'
                elif 'urdu' in full_url.lower() or 'urd' in full_url.lower():
                    language = 'Urdu'
                
                if language not in download_links:
                    download_links[language] = full_url
                    logger.debug(f"Found {language} PDF link from page source: {full_url}")
            
            # If no links found, try navigating to the book detail page
            if not download_links:
                # The form might navigate to a book detail page
                # Check current URL for book information
                current_url = page.url
                logger.debug(f"Current URL after form submission: {current_url}")
                
                # Look for any download buttons or links on the current page
                all_links = page.query_selector_all('a[href]')
                for link in all_links:
                    href = link.get_attribute('href')
                    if href and ('.pdf' in href.lower() or 'download' in href.lower()):
                        full_url = urljoin(page.url, href)
                        language = 'English'  # Default
                        if language not in download_links:
                            download_links[language] = full_url
            
            logger.info(f"Found {len(download_links)} download links for book {book}")
            return download_links
            
        except PlaywrightTimeoutError as e:
            logger.warning(f"Timeout getting download links for book {book}: {e}")
            return {}  # Return empty dict, don't raise - let caller continue
        except Exception as e:
            logger.warning(f"Error getting download links for book {book}: {e}")
            return {}  # Return empty dict, don't raise - let caller continue
    
    def download_file(self, url: str, filepath: str) -> bool:
        """Download file (PDF or ZIP) from URL"""
        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                # Determine file type from URL, content-type, or magic bytes
                content_type = response.headers.get('Content-Type', '').lower()
                url_lower = url.lower()
                
                # Check first bytes for file type
                first_bytes = response.content[:4]
                is_pdf = first_bytes == b'%PDF'
                is_zip = first_bytes[:2] == b'PK'  # ZIP files start with PK\x03\x04
                
                # Determine file type
                file_type = None
                if url_lower.endswith('.zip') or 'zip' in content_type or is_zip:
                    file_type = 'zip'
                elif url_lower.endswith('.pdf') or 'pdf' in content_type or is_pdf:
                    file_type = 'pdf'
                else:
                    # Default to PDF if we can't determine
                    if is_pdf:
                        file_type = 'pdf'
                    elif is_zip:
                        file_type = 'zip'
                    else:
                        logger.warning(f"URL {url} does not appear to be a PDF or ZIP file")
                        return False
                
                # Ensure filepath has correct extension
                if file_type == 'zip' and not filepath.lower().endswith('.zip'):
                    filepath = filepath.rsplit('.', 1)[0] + '.zip'
                elif file_type == 'pdf' and not filepath.lower().endswith('.pdf'):
                    filepath = filepath.rsplit('.', 1)[0] + '.pdf'
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                
                # Download file
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                # Verify file was downloaded and is valid
                if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                    # Check file header
                    with open(filepath, 'rb') as f:
                        header = f.read(4)
                        if (file_type == 'pdf' and header == b'%PDF') or \
                           (file_type == 'zip' and header[:2] == b'PK'):
                            logger.info(f"Successfully downloaded {file_type.upper()}: {filepath}")
                            return True
                        else:
                            logger.warning(f"Downloaded file does not have valid {file_type.upper()} header: {filepath}")
                            os.remove(filepath)
                            return False
                else:
                    logger.error(f"Downloaded file is empty or doesn't exist: {filepath}")
                    return False
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed for {url}: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error(f"Failed to download {url} after {MAX_RETRIES} attempts")
                    return False
            except Exception as e:
                logger.error(f"Unexpected error downloading {url}: {e}")
                return False
        
        return False
    
    def run(self):
        """Main execution method"""
        logger.info("Starting NCERT Books Downloader")
        logger.info(f"Resume mode: {self.resume}")
        
        with sync_playwright() as p:
            # Launch browser with more stable settings
            browser = p.chromium.launch(
                headless=True,
                args=['--disable-blink-features=AutomationControlled', '--no-sandbox']
            )
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            
            # Set longer timeout for page operations
            page.set_default_timeout(TIMEOUT)
            
            try:
                # Navigate to main page
                logger.info(f"Navigating to {BASE_URL}")
                page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                time.sleep(2)  # Additional wait for page to fully load
                
                # Get all classes
                classes = self.get_all_classes(page)
                if not classes:
                    logger.error("No classes found. Exiting.")
                    return
                
                # Iterate through classes
                for class_num in classes:
                    logger.info(f"\n{'='*60}")
                    logger.info(f"Processing Class: {class_num}")
                    logger.info(f"{'='*60}")
                    
                    # Check if browser/context/page is still valid, recreate if needed
                    try:
                        if not browser.is_connected():
                            logger.error("Browser disconnected, cannot continue")
                            break
                        if page.is_closed():
                            logger.warning("Page was closed, recreating...")
                            page = context.new_page()
                            page.set_default_timeout(TIMEOUT)
                            page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                            time.sleep(2)
                    except Exception as e:
                        logger.warning(f"Error checking page status: {e}, recreating page...")
                        try:
                            if not browser.is_connected():
                                logger.error("Browser disconnected, cannot continue")
                                break
                            page = context.new_page()
                            page.set_default_timeout(TIMEOUT)
                            page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                            time.sleep(2)
                        except Exception as e2:
                            logger.error(f"Failed to recreate page: {e2}")
                            continue
                    
                    # Navigate back to main page for each class (only if not already there)
                    try:
                        current_url = page.url
                        if BASE_URL not in current_url or 'aemr1' in current_url:
                            page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                            time.sleep(2)  # Wait for page to fully load
                    except Exception as e:
                        logger.warning(f"Error navigating to main page: {e}, trying to recreate...")
                        try:
                            page = context.new_page()
                            page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                            time.sleep(2)
                        except Exception as e2:
                            logger.error(f"Failed to navigate: {e2}")
                            continue
                    
                    # Reset dropdowns by selecting default
                    try:
                        page.select_option('select[name="tclass"]', '-1')
                        time.sleep(0.5)
                    except Exception as e:
                        logger.debug(f"Could not reset dropdown: {e}")
                    
                    # Get subjects for this class
                    subjects = self.get_subjects_for_class(page, class_num)
                    if not subjects:
                        logger.warning(f"No subjects found for class {class_num}")
                        continue
                    
                    # Iterate through subjects
                    for subject_value, subject_name in subjects:
                        logger.info(f"\nProcessing Subject: {subject_name} (Class {class_num})")
                        
                        # Check if page is still valid
                        try:
                            if not browser.is_connected():
                                logger.error("Browser disconnected, cannot continue")
                                break
                            if page.is_closed():
                                logger.warning("Page was closed, recreating...")
                                page = context.new_page()
                                page.set_default_timeout(TIMEOUT)
                                page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                time.sleep(2)
                        except Exception as e:
                            logger.warning(f"Error checking page: {e}, recreating...")
                            try:
                                if not browser.is_connected():
                                    logger.error("Browser disconnected, cannot continue")
                                    break
                                page = context.new_page()
                                page.set_default_timeout(TIMEOUT)
                                page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                time.sleep(2)
                            except Exception as e2:
                                logger.error(f"Failed to recreate page: {e2}")
                                continue
                        
                        # Navigate back to main page if needed
                        try:
                            current_url = page.url
                            if BASE_URL not in current_url or 'aemr1' in current_url:
                                page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                time.sleep(2)
                        except Exception as e:
                            logger.warning(f"Error navigating: {e}, recreating page...")
                            try:
                                page = context.new_page()
                                page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                time.sleep(2)
                            except Exception as e2:
                                logger.error(f"Failed to navigate: {e2}")
                                continue
                        
                        # Reset and reselect class
                        try:
                            page.select_option('select[name="tclass"]', class_num)
                            page.evaluate('''
                                const select = document.querySelector('select[name="tclass"]');
                                if (select && select.onchange) {
                                    select.onchange();
                                } else if (select) {
                                    const event = new Event('change', { bubbles: true });
                                    select.dispatchEvent(event);
                                }
                            ''')
                            time.sleep(1)
                        except Exception as e:
                            logger.debug(f"Error reselecting class: {e}")
                            pass
                        
                        # Get books for this subject
                        books = self.get_books_for_subject(page, class_num, subject_value)
                        if not books:
                            logger.warning(f"No books found for class {class_num}, subject {subject_name}")
                            continue
                        
                        # Iterate through books
                        for book_value, book_name in books:
                            logger.info(f"\nProcessing Book: {book_name}")
                            
                            # Check if page is still valid
                            try:
                                if not browser.is_connected():
                                    logger.error("Browser disconnected, cannot continue")
                                    break
                                if page.is_closed():
                                    logger.warning("Page was closed, recreating...")
                                    page = context.new_page()
                                    page.set_default_timeout(TIMEOUT)
                                    page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                    time.sleep(2)
                            except Exception as e:
                                logger.warning(f"Error checking page: {e}, recreating...")
                                try:
                                    if not browser.is_connected():
                                        logger.error("Browser disconnected, cannot continue")
                                        break
                                    page = context.new_page()
                                    page.set_default_timeout(TIMEOUT)
                                    page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                    time.sleep(2)
                                except Exception as e2:
                                    logger.error(f"Failed to recreate page: {e2}")
                                    continue
                            
                            # Navigate back to main page if needed
                            try:
                                current_url = page.url
                                if BASE_URL not in current_url or 'aemr1' in current_url:
                                    page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                    time.sleep(2)
                            except Exception as e:
                                logger.warning(f"Error navigating: {e}, recreating page...")
                                try:
                                    page = context.new_page()
                                    page.goto(BASE_URL, wait_until='networkidle', timeout=TIMEOUT)
                                    time.sleep(2)
                                except Exception as e2:
                                    logger.error(f"Failed to navigate: {e2}")
                                    continue
                            
                            # Reset and reselect class and subject
                            try:
                                page.select_option('select[name="tclass"]', class_num)
                                page.evaluate('''
                                    const select = document.querySelector('select[name="tclass"]');
                                    if (select && select.onchange) {
                                        select.onchange();
                                    } else if (select) {
                                        const event = new Event('change', { bubbles: true });
                                        select.dispatchEvent(event);
                                    }
                                ''')
                                time.sleep(1)
                                
                                # Find and select subject by text
                                subject_options = page.query_selector_all('select[name="tsubject"] option')
                                subject_idx = None
                                for idx, opt in enumerate(subject_options):
                                    if opt.inner_text().strip() == subject_name:
                                        subject_idx = idx
                                        break
                                
                                if subject_idx is not None:
                                    page.evaluate(f'''
                                        const select = document.querySelector('select[name="tsubject"]');
                                        if (select) {{
                                            select.selectedIndex = {subject_idx};
                                            if (typeof change1 === 'function') {{
                                                change1({subject_idx});
                                            }}
                                            const event = new Event('change', {{ bubbles: true }});
                                            select.dispatchEvent(event);
                                        }}
                                    ''')
                                time.sleep(1)
                            except Exception as e:
                                logger.debug(f"Error reselecting: {e}")
                                pass
                        
                            # Get download links for all languages
                            try:
                                download_links = self.get_download_links(page, class_num, subject_value, book_value)
                            except Exception as e:
                                logger.error(f"Error getting download links for {book_name}: {e}")
                                self.skipped_count += 1
                                continue
                        
                        if not download_links:
                            logger.warning(f"No download links found for book: {book_name}")
                            self.skipped_count += 1
                            continue
                        
                        # Download each language version
                        for language, url in download_links.items():
                            # Check if already downloaded
                            if self.is_already_downloaded(class_num, subject_name, book_name, language):
                                logger.info(f"Already downloaded: {book_name} ({language})")
                                continue
                            
                            # Create filepath with correct extension based on URL
                            safe_class = self.sanitize_filename(f"Class_{class_num}")
                            safe_subject = self.sanitize_filename(subject_name)
                            safe_language = self.sanitize_filename(language)
                            safe_book = self.sanitize_filename(book_name)
                            
                            # Determine file extension from URL
                            url_lower = url.lower()
                            if url_lower.endswith('.zip'):
                                file_ext = '.zip'
                            elif url_lower.endswith('.pdf'):
                                file_ext = '.pdf'
                            else:
                                # Default to .zip as most NCERT books are ZIPs
                                file_ext = '.zip'
                            
                            filepath = os.path.join(
                                BOOKS_DIR,
                                safe_class,
                                safe_subject,
                                safe_language,
                                f"{safe_book}_{safe_language}{file_ext}"
                            )
                            
                            # Download file
                            logger.info(f"Downloading: {book_name} ({language})")
                            if self.download_file(url, filepath):
                                self.mark_as_downloaded(class_num, subject_name, book_name, language, filepath)
                                self.downloaded_count += 1
                            else:
                                self.failed_count += 1
                            
                            # Rate limiting
                            time.sleep(DOWNLOAD_DELAY)
                        
                        # Small delay between books
                        time.sleep(0.5)
                
                # Final summary
                logger.info(f"\n{'='*60}")
                logger.info("Download Summary:")
                logger.info(f"  Downloaded: {self.downloaded_count}")
                logger.info(f"  Failed: {self.failed_count}")
                logger.info(f"  Skipped: {self.skipped_count}")
                logger.info(f"{'='*60}")
                
            except Exception as e:
                logger.error(f"Fatal error: {e}", exc_info=True)
            finally:
                try:
                    if not browser.is_connected():
                        logger.warning("Browser already disconnected")
                    else:
                        try:
                            browser.close()
                        except RuntimeError as e:
                            # Suppress event loop errors on shutdown
                            if "event loop" not in str(e).lower():
                                raise
                            logger.debug("Suppressed event loop error on shutdown")
                        except Exception as e:
                            logger.warning(f"Error closing browser: {e}")
                except Exception as e:
                    logger.warning(f"Error in browser cleanup: {e}")
                finally:
                    self.save_progress()


def main():
    """Entry point"""
    global DOWNLOAD_DELAY
    import argparse
    
    parser = argparse.ArgumentParser(description='Download all NCERT textbooks')
    parser.add_argument('--no-resume', action='store_true', help='Start fresh (ignore progress)')
    parser.add_argument('--delay', type=float, default=DOWNLOAD_DELAY, help='Delay between downloads (seconds)')
    
    args = parser.parse_args()
    
    # Update global delay if specified
    if args.delay:
        DOWNLOAD_DELAY = args.delay
    
    downloader = NCERTBookDownloader(resume=not args.no_resume)
    downloader.run()


if __name__ == '__main__':
    main()
