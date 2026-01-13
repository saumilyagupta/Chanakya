"""
Query router for orchestrator integration.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.responses import JSONResponse
import structlog
import json
from typing import List
from services.orchestrator_service import orchestrator_service
from schemas.query import QueryRequest, QueryResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def process_query(query_request: QueryRequest) -> QueryResponse:
    """
    Process a query using the orchestrator.
    
    Args:
        query_request: The query request with query text and context
        
    Returns:
        QueryResponse with the orchestrator's response
    """
    try:
        logger.info("Received query request", query=query_request.query[:100])
        
        if not orchestrator_service.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Orchestrator service is not ready. Please try again later."
            )
        
        response = await orchestrator_service.process_query(query_request)
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for streaming query responses.
    
    Client sends JSON: {"query": "...", "context": {...}, "session_id": "..."}
    Server streams back JSON responses with partial results.
    """
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                # Parse the incoming message
                message = json.loads(data)
                query_request = QueryRequest(**message)
                
                logger.info("WebSocket query received", query=query_request.query[:100])
                
                # Check if orchestrator is ready
                if not orchestrator_service.is_ready():
                    await websocket.send_json({
                        "error": "Orchestrator service not ready",
                        "success": False
                    })
                    continue
                
                # Process the query
                response = await orchestrator_service.process_query(query_request)
                
                # Send complete response
                await websocket.send_json({
                    "success": response.success,
                    "tool_used": response.tool_used,
                    "reasoning": response.reasoning,
                    "result": response.result,
                    "confidence": response.confidence,
                    "processing_time_ms": response.processing_time_ms,
                    "timestamp": response.timestamp.isoformat(),
                    "error": response.error
                })
                
                logger.info("WebSocket response sent", tool_used=response.tool_used)
                
            except json.JSONDecodeError:
                await websocket.send_json({
                    "error": "Invalid JSON format",
                    "success": False
                })
                logger.error("Invalid JSON received on WebSocket")
                
            except Exception as e:
                await websocket.send_json({
                    "error": f"Error processing query: {str(e)}",
                    "success": False
                })
                logger.error(f"Error processing WebSocket query: {str(e)}")
                
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.close()
        except:
            pass


@router.get("/tools")
async def get_tools() -> JSONResponse:
    """
    Get list of available tools from the orchestrator.
    
    Returns:
        JSON response with list of available tools and their descriptions
    """
    try:
        if not orchestrator_service.is_ready():
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Orchestrator service not ready",
                    "tools": []
                }
            )
        
        tools = orchestrator_service.get_available_tools()
        
        logger.info(f"Retrieved {len(tools)} available tools")
        
        return JSONResponse(
            content={
                "success": True,
                "count": len(tools),
                "tools": tools
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting tools: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving tools: {str(e)}"
        )


@router.get("/status")
async def get_status() -> JSONResponse:
    """
    Get orchestrator service status.
    
    Returns:
        JSON response with service status and availability
    """
    is_ready = orchestrator_service.is_ready()
    
    return JSONResponse(
        content={
            "status": "ready" if is_ready else "not_ready",
            "initialized": orchestrator_service.initialized,
            "available": is_ready
        }
    )
