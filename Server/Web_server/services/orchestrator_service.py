"""
Orchestrator service for handling queries with ChanakyaOrchestrator.
"""
import sys
import os
import time
from datetime import datetime

# Add parent directory to path to import orchestrator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from orchestrator import ChanakyaOrchestrator
from orchestrator.schemas import OrchestratorInput
import structlog
from fastapi import HTTPException
from config import settings
from schemas.query import QueryRequest, QueryResponse

logger = structlog.get_logger(__name__)


class OrchestratorService:
    """Service for processing queries using ChanakyaOrchestrator."""
    
    def __init__(self):
        """Initialize the orchestrator service."""
        self.orchestrator = None
        self.initialized = False
        
    def initialize(self):
        """Initialize the ChanakyaOrchestrator with API key."""
        try:
            if not settings.GEMINI_API_KEY:
                logger.error("GEMINI_API_KEY not found in configuration")
                raise ValueError("GEMINI_API_KEY is required for orchestrator initialization")
            
            logger.info("Initializing ChanakyaOrchestrator")
            self.orchestrator = ChanakyaOrchestrator(api_key=settings.GEMINI_API_KEY)
            self.initialized = True
            logger.info("ChanakyaOrchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize orchestrator: {str(e)}")
            raise
    
    async def process_query(self, query_request: QueryRequest) -> QueryResponse:
        """
        Process a query using the orchestrator.
        
        Args:
            query_request: The query request containing query text and context
            
        Returns:
            QueryResponse with the orchestrator's response
            
        Raises:
            HTTPException: If orchestrator is not initialized or processing fails
        """
        if not self.initialized or not self.orchestrator:
            logger.error("Orchestrator not initialized")
            raise HTTPException(
                status_code=503,
                detail="Orchestrator service not initialized. Please try again later."
            )
        
        start_time = time.time()
        
        try:
            logger.info(
                "Processing query",
                query=query_request.query[:100],  # Log first 100 chars
                session_id=query_request.session_id
            )
            
            # Create orchestrator input
            orchestrator_input = OrchestratorInput(
                query=query_request.query,
                context=query_request.context or {},
                session_id=query_request.session_id or "default"
            )
            
            # Process the query
            result = await self.orchestrator.process(orchestrator_input)
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            logger.info(
                "Query processed successfully",
                tool_used=result.tool_used,
                confidence=result.confidence,
                processing_time_ms=processing_time_ms
            )
            
            # Convert orchestrator result to QueryResponse
            # OrchestratorOutput doesn't have 'success' field - determine from error
            success = result.error is None
            
            return QueryResponse(
                success=success,
                tool_used=result.tool_used,
                reasoning=result.reasoning,
                result=result.result,
                confidence=result.confidence,
                processing_time_ms=processing_time_ms,
                timestamp=datetime.utcnow(),
                error=result.error
            )
            
        except Exception as e:
            processing_time_ms = (time.time() - start_time) * 1000
            error_msg = f"Error processing query: {str(e)}"
            
            logger.error(
                "Query processing failed",
                error=str(e),
                processing_time_ms=processing_time_ms
            )
            
            # Return error response instead of raising exception
            return QueryResponse(
                success=False,
                tool_used="error",
                reasoning="An error occurred during processing",
                result={"error": str(e)},
                confidence=0.0,
                processing_time_ms=processing_time_ms,
                timestamp=datetime.utcnow(),
                error=error_msg
            )
    
    def get_available_tools(self) -> list[dict]:
        """
        Get list of available tools from orchestrator.
        
        Returns:
            List of tool information dictionaries
        """
        if not self.initialized or not self.orchestrator:
            logger.warning("Orchestrator not initialized, returning empty tool list")
            return []
        
        try:
            tools = []
            if hasattr(self.orchestrator, 'tools'):
                for tool in self.orchestrator.tools:
                    tools.append({
                        "name": tool.__class__.__name__,
                        "description": getattr(tool, 'description', 'No description available')
                    })
            return tools
        except Exception as e:
            logger.error(f"Error getting available tools: {str(e)}")
            return []
    
    def is_ready(self) -> bool:
        """Check if orchestrator is initialized and ready."""
        return self.initialized and self.orchestrator is not None


# Global instance
orchestrator_service = OrchestratorService()
