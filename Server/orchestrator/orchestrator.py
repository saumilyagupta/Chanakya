"""
Chanakya Orchestrator
=====================

LangGraph-based orchestrator that handles context, understands queries,
and routes to appropriate tools.
"""

import json
import re
import time
import uuid
from typing import Optional, Dict, Any, TypedDict, List, AsyncIterator
from google import genai
from google.genai import types
from cachetools import LRUCache
import structlog

from .schemas import (
    OrchestratorInput,
    OrchestratorOutput,
    ActivityOutput,
    ConversationContext,
    ConversationMessage,
)
from .tools import ActivityGeneratorTool, CrisisHandlerTool, TeacherMotivationTool, ContentExplainerTool, ClassroomGuidanceTool


# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# SQLite storage for conversations
from .storage import ConversationStorage

# Config
from .config import Config


# =============================================================================
# State Definition
# =============================================================================

class OrchestratorState(TypedDict):
    """Enhanced state that flows through the orchestrator graph."""
    
    # Input
    query: str
    context: Optional[dict]
    session_id: str
    
    # Processing state
    messages: list  # Simple list of message dicts
    intent: Optional[str]
    selected_tool: Optional[str]
    tool_reasoning: Optional[str]
    confidence: float
    
    # Retry and validation
    retry_count: int
    max_retries: int
    is_valid: bool
    validation_message: Optional[str]
    
    # Hallucination detection
    hallucination_score: float
    hallucination_check_count: int
    needs_hallucination_recheck: bool
    
    # Follow-up actions
    needs_follow_up: bool
    follow_up_action: Optional[str]
    
    # Output
    tool_result: Optional[dict]
    error: Optional[str]
    processing_time_ms: float


# =============================================================================
# Router Prompt
# =============================================================================

ROUTER_PROMPT = """You are Chanakya's intelligent router for a classroom support system.

Your job is to understand the teacher's query and decide which tool to use.

AVAILABLE TOOLS:
1. "activity_generator" - Use when the teacher wants a hands-on activity, demonstration, or interactive exercise to help students understand a concept. This tool generates simple classroom activities using basic materials.

2. "crisis_handler" - Use when there is an IMMEDIATE classroom management crisis: students making noise, losing focus, being disruptive, chaos, behavior problems. This tool provides instant solutions (under 2 minutes) to restore order and attention.

3. "teacher_motivation" - Use when the teacher is expressing feelings of burnout, stress, exhaustion, lack of motivation, feeling overwhelmed, or needing emotional support. This tool provides motivation, tips, and recovery strategies for teacher wellbeing.

4. "content_explainer" - Use when the teacher asks questions about NCERT curriculum content, wants explanations of concepts, asks "what is", "explain", "tell me about", or needs subject matter clarification. This tool retrieves information from NCERT textbooks and provides grounded explanations.

5. "classroom_guidance" - Use when the teacher describes PEDAGOGICAL challenges, student learning difficulties, teaching strategy questions, or needs practical tips for daily classroom situations. Examples: "students can't interpret graphs", "only few students participate", "how to make lessons interactive", "students memorize but don't understand". This tool provides comprehensive teaching strategies and tips.

FUTURE TOOLS (not yet available, do NOT select these):
- "assessment_creator" - For creating quizzes/tests

ANALYZE THE QUERY AND RESPOND WITH JSON:
{
    "selected_tool": "activity_generator" or "crisis_handler" or "teacher_motivation" or "content_explainer" or "classroom_guidance",
    "reasoning": "Brief explanation of why this tool was selected",
    "extracted_topic": "The main topic/concept OR crisis situation OR motivation issue OR teaching challenge",
    "confidence": 0.95
}

EXAMPLES:

Query: "How can I teach fractions in a fun way?"
Response: {"selected_tool": "activity_generator", "reasoning": "Teacher wants an engaging method to teach fractions - activity would help", "extracted_topic": "fractions", "confidence": 0.95}

Query: "Students are making too much noise and not listening"
Response: {"selected_tool": "crisis_handler", "reasoning": "Immediate classroom management crisis - noise and attention problem", "extracted_topic": "noise control", "confidence": 0.98}

Query: "I'm feeling burnt out and don't want to teach anymore"
Response: {"selected_tool": "teacher_motivation", "reasoning": "Teacher expressing burnout and loss of motivation - needs emotional support", "extracted_topic": "burnout and exhaustion", "confidence": 0.97}

Query: "My class is completely out of control, everyone is talking"
Response: {"selected_tool": "crisis_handler", "reasoning": "Crisis situation - chaos and lack of control", "extracted_topic": "classroom chaos", "confidence": 0.97}

Query: "I feel like I'm failing as a teacher, nothing is working"
Response: {"selected_tool": "teacher_motivation", "reasoning": "Teacher expressing self-doubt and stress - needs encouragement and strategies", "extracted_topic": "self-doubt and discouragement", "confidence": 0.96}

Query: "Students are distracted and not paying attention"
Response: {"selected_tool": "crisis_handler", "reasoning": "Focus and attention crisis needs immediate intervention", "extracted_topic": "lack of focus", "confidence": 0.95}

Query: "Give me an activity for teaching addition with carry"
Response: {"selected_tool": "activity_generator", "reasoning": "Teacher explicitly asked for an activity", "extracted_topic": "addition with carry", "confidence": 0.98}

Query: "I'm exhausted and have no energy to prepare lessons"
Response: {"selected_tool": "teacher_motivation", "reasoning": "Teacher expressing exhaustion and overwhelm - needs support and practical tips", "extracted_topic": "exhaustion and overwhelm", "confidence": 0.96}

Query: "बच्चे शोर मचा रहे हैं"
Response: {"selected_tool": "crisis_handler", "reasoning": "Children making noise - immediate crisis intervention needed", "extracted_topic": "noise and chaos", "confidence": 0.96}

Query: "What is photosynthesis?"
Response: {"selected_tool": "content_explainer", "reasoning": "Teacher asking for concept explanation from curriculum", "extracted_topic": "photosynthesis", "confidence": 0.97}

Query: "Explain Pythagoras theorem to me"
Response: {"selected_tool": "content_explainer", "reasoning": "Teacher wants explanation of mathematical concept", "extracted_topic": "Pythagoras theorem", "confidence": 0.98}

Query: "Tell me about the water cycle"
Response: {"selected_tool": "content_explainer", "reasoning": "Teacher asking for content explanation", "extracted_topic": "water cycle", "confidence": 0.96}

Query: "Students are unable to interpret maps and graphs systematically"
Response: {"selected_tool": "classroom_guidance", "reasoning": "Teacher describing a pedagogical challenge about student learning skills", "extracted_topic": "interpreting visual data", "confidence": 0.96}

Query: "Only 2-3 students answer questions in class"
Response: {"selected_tool": "classroom_guidance", "reasoning": "Teacher describing student engagement issue needing teaching strategies", "extracted_topic": "low participation", "confidence": 0.97}

Query: "How can I make my lessons more interactive?"
Response: {"selected_tool": "classroom_guidance", "reasoning": "Teacher asking for teaching strategy advice", "extracted_topic": "interactive teaching methods", "confidence": 0.95}

RULES:
- Return ONLY valid JSON
- Use "crisis_handler" for ANY immediate behavioral/attention crisis
- Use "activity_generator" for teaching concepts and learning activities  
- Use "teacher_motivation" for burnout, stress, lack of motivation, feeling overwhelmed, needing support
- Use "content_explainer" for content questions, explanations, "what is", "explain", "tell me about" queries
- Use "classroom_guidance" for pedagogical challenges, student learning difficulties, teaching strategy questions
- Extract the topic/concept or crisis situation or motivation issue or teaching challenge clearly
- Set confidence based on how clearly the query matches the tool's purpose"""


# =============================================================================
# Hallucination Detection Prompt
# =============================================================================

HALLUCINATION_DETECTION_PROMPT = """You are a quality assurance validator for educational content generated for teachers.

Your job is to detect hallucinations, fabrications, or unrealistic content in classroom activity descriptions.

EVALUATE THE ACTIVITY FOR:

1. **Realism & Feasibility** (0-1):
   - Can this activity be done in a typical classroom?
   - Are the materials actually available/practical?
   - Is the timing realistic?
   - Are the steps physically possible?

2. **Educational Soundness** (0-1):
   - Does the activity actually teach what it claims?
   - Are the learning outcomes realistic?
   - Is the difficulty appropriate?

3. **Logical Consistency** (0-1):
   - Do the steps make sense in order?
   - Are there contradictions?
   - Are prerequisites mentioned?

4. **Factual Accuracy** (0-1):
   - Are concepts explained correctly?
   - Are there mathematical/scientific errors?
   - Is the terminology appropriate?

RED FLAGS (hallucinations):
- Requiring materials that don't exist or are impractical
- Steps that contradict each other
- Activities that would take unrealistic time
- Dangerous or inappropriate suggestions
- Mathematical/scientific inaccuracies
- Activities that don't match the stated topic
- Overly complex instructions for stated grade level

RESPOND WITH JSON ONLY:
{
    "hallucination_score": 0.85,
    "realism_score": 0.9,
    "educational_score": 0.85,
    "logical_score": 0.8,
    "factual_score": 0.85,
    "issues_found": ["Minor issue description if any"],
    "is_acceptable": true,
    "recommendation": "Accept" or "Regenerate"
}

SCORING:
- 0.9-1.0: Excellent, realistic, high quality
- 0.7-0.89: Good, minor issues but acceptable
- 0.5-0.69: Problematic, contains hallucinations
- 0.0-0.49: Severe hallucinations, must regenerate

Return ONLY valid JSON."""


# =============================================================================
# Orchestrator Class
# =============================================================================

class ChanakyaOrchestrator:
    """
    LangGraph-based orchestrator for Chanakya classroom support system.
    
    Handles:
    - Context management across conversations
    - Query understanding and intent classification
    - Tool selection and execution
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the orchestrator.
        
        Args:
            api_key: Google AI API key for Gemini
        """
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.model_name = Config.GEMINI_MODEL
        self.logger = structlog.get_logger("chanakya.orchestrator")
        
        # Initialize tools
        self.tools = {
            "activity_generator": ActivityGeneratorTool(api_key=api_key),
            "crisis_handler": CrisisHandlerTool(api_key=api_key),
            "teacher_motivation": TeacherMotivationTool(api_key=api_key),
            "content_explainer": ContentExplainerTool(),
            "classroom_guidance": ClassroomGuidanceTool(api_key=api_key)
        }
        
        # Conversation contexts (LRU cache to prevent memory leaks)
        self.contexts: LRUCache = LRUCache(maxsize=1000)
        
        # SQLite storage for persistent conversation history
        if Config.db.use_sqlite:
            self.storage = ConversationStorage()
        else:
            self.storage = None
        
        # Build the LangGraph
        self.graph = self._build_graph()
    
    def _detect_language(self, text: str) -> str:
        """
        Detect language of input text.
        
        Simple heuristic-based detection for common Indian languages.
        Returns: 'hi' (Hindi), 'en' (English), or other language code
        """
        # Fast ASCII check - if text is pure ASCII, it's English
        # This skips expensive Unicode range scanning for English queries (saves 5-7s)
        try:
            text.encode('ascii')
            self.logger.info("language_detection_fast", detected='en', method='ascii_check')
            return 'en'
        except UnicodeEncodeError:
            pass  # Contains non-ASCII characters, continue with Unicode detection
        
        # Devanagari script range (Hindi and related languages)
        devanagari_chars = sum(1 for char in text if '\u0900' <= char <= '\u097F')
        
        # If more than 30% Devanagari, it's Hindi
        if len(text) > 0 and devanagari_chars / len(text) > 0.3:
            return 'hi'
        
        # Tamil script range
        tamil_chars = sum(1 for char in text if '\u0B80' <= char <= '\u0BFF')
        if len(text) > 0 and tamil_chars / len(text) > 0.3:
            return 'ta'
        
        # Bengali script range
        bengali_chars = sum(1 for char in text if '\u0980' <= char <= '\u09FF')
        if len(text) > 0 and bengali_chars / len(text) > 0.3:
            return 'bn'
        
        # Telugu script range
        telugu_chars = sum(1 for char in text if '\u0C00' <= char <= '\u0C7F')
        if len(text) > 0 and telugu_chars / len(text) > 0.3:
            return 'te'
        
        # Gujarati script range
        gujarati_chars = sum(1 for char in text if '\u0A80' <= char <= '\u0AFF')
        if len(text) > 0 and gujarati_chars / len(text) > 0.3:
            return 'gu'
        
        # Default to English
        return 'en'
    
    async def _translate_text(self, text: str, target_lang: str) -> str:
        """
        Translate text to target language using Gemini.
        
        Args:
            text: Text to translate
            target_lang: Target language code (hi, ta, bn, etc.)
        
        Returns:
            Translated text
        """
        if target_lang == 'en':
            return text
        
        lang_names = {
            'hi': 'Hindi',
            'ta': 'Tamil',
            'bn': 'Bengali',
            'te': 'Telugu',
            'gu': 'Gujarati',
            'mr': 'Marathi',
            'kn': 'Kannada',
            'ml': 'Malayalam'
        }
        
        target_name = lang_names.get(target_lang, target_lang)
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=f"Translate this to {target_name} (preserve formatting):\n\n{text}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            self.logger.warning("translation_failed",
                target_lang=target_lang,
                error=str(e)
            )
            return text  # Return original if translation fails
    
    
    def _build_graph(self) -> StateGraph:
        """Build the enhanced LangGraph workflow with conditional routing."""
        
        # Create the graph
        workflow = StateGraph(OrchestratorState)
        
        # Add nodes
        workflow.add_node("understand_query", self._understand_query_node)
        workflow.add_node("select_tool", self._select_tool_node)
        workflow.add_node("check_confidence", self._check_confidence_node)
        workflow.add_node("retry", self._retry_node)
        workflow.add_node("execute_tool", self._execute_tool_node)
        workflow.add_node("validate_output", self._validate_output_node)
        workflow.add_node("check_hallucination", self._check_hallucination_node)
        workflow.add_node("handle_follow_up", self._handle_follow_up_node)
        
        # Define edges
        workflow.set_entry_point("understand_query")
        workflow.add_edge("understand_query", "select_tool")
        workflow.add_edge("select_tool", "check_confidence")
        
        # Conditional routing based on confidence
        workflow.add_conditional_edges(
            "check_confidence",
            self._route_based_on_confidence,
            {
                "execute": "execute_tool",
                "retry": "retry",
                "end": END
            }
        )
        
        # Retry loops back to select_tool
        workflow.add_edge("retry", "select_tool")
        
        workflow.add_edge("execute_tool", "validate_output")
        workflow.add_edge("validate_output", "check_hallucination")
        
        # Conditional routing after hallucination check
        workflow.add_conditional_edges(
            "check_hallucination",
            self._route_after_hallucination_check,
            {
                "follow_up": "handle_follow_up",
                "retry": "retry",
                "end": END
            }
        )
        
        workflow.add_edge("handle_follow_up", END)
        
        # Return uncompiled workflow - we'll compile with checkpointer later
        return workflow
    
    async def _understand_query_node(self, state: OrchestratorState) -> dict:
        """
        Node: Understand and enrich the query with context.
        """
        query = state["query"]
        session_id = state["session_id"]
        
        # Get or create conversation context (LRU cached in-memory)
        if session_id not in self.contexts:
            self.contexts[session_id] = ConversationContext(session_id=session_id)
            
            # Load previous messages from SQLite if available
            if self.storage and await self.storage.session_exists(session_id):
                prev_messages = await self.storage.get_messages(session_id, limit=Config.MAX_CONTEXT_MESSAGES)
                for msg in prev_messages:
                    self.contexts[session_id].add_message(msg["role"], msg["content"])
        
        ctx = self.contexts[session_id]
        
        # Add user message to context
        ctx.add_message("user", query)
        
        # Save to SQLite storage
        if self.storage:
            await self.storage.add_message(session_id, "user", query)
        
        # Check if summarization is needed
        if len(ctx.messages) > Config.SUMMARIZATION_THRESHOLD:
            await self._summarize_context(session_id)
        
        # Build context from previous messages for enrichment
        context_messages = []
        for msg in ctx.messages[-Config.MAX_CONTEXT_MESSAGES:]:
            context_messages.append({"role": msg.role, "content": msg.content})
        
        return {
            "messages": context_messages,
            "intent": None,  # Will be set by router
        }
    
    async def _select_tool_node(self, state: OrchestratorState) -> dict:
        """
        Node: Select the appropriate tool based on the query.
        Uses conversation context to understand follow-up queries.
        """
        query = state["query"]
        messages = state.get("messages", [])
        
        # Build context string from previous messages
        context_str = ""
        if len(messages) > 1:
            context_str = "Previous conversation:\n"
            for msg in messages[:-1]:  # All except current
                context_str += f"{msg['role']}: {msg['content']}\n"
            context_str += "\nCurrent query: "
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=f"{context_str}Route this teacher query: {query}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=ROUTER_PROMPT,
                    temperature=0.1,
                    max_output_tokens=Config.MAX_OUTPUT_TOKENS,
                    response_mime_type="application/json"
                )
            )
            
            # Parse response
            text = response.text.strip()
            
            # Check if response is empty
            if not text:
                self.logger.warning("router_empty_response", query=query)
                return {
                    "selected_tool": "activity_generator",
                    "tool_reasoning": "Default selection (empty router response)",
                    "intent": query,
                    "confidence": 0.5,
                }
            
            # Robust JSON extraction using regex
            # Try to find JSON object in response
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
            
            if not json_match:
                # Fallback: clean up markdown code blocks
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
            else:
                text = json_match.group()
            
            # Try to parse JSON
            try:
                parsed = json.loads(text)
                
                self.logger.info("router_success",
                    tool=parsed.get("selected_tool"),
                    confidence=parsed.get("confidence"),
                    query=query[:50]
                )
                
            except json.JSONDecodeError as e:
                self.logger.warning("router_json_parse_error",
                    query=query[:50],
                    error=str(e),
                    response_text=text[:200]
                )
                return {
                    "selected_tool": "activity_generator",
                    "tool_reasoning": "Default selection (invalid JSON response)",
                    "intent": query,
                    "confidence": 0.5,
                }
            
            return {
                "selected_tool": parsed.get("selected_tool", "activity_generator"),
                "tool_reasoning": parsed.get("reasoning", "Default selection"),
                "intent": parsed.get("extracted_topic", query),
                "confidence": float(parsed.get("confidence", 0.8)),
            }
            
        except Exception:
            # Default to activity generator on error
            return {
                "selected_tool": "activity_generator",
                "tool_reasoning": "Default selection (router error)",
                "intent": query,
                "confidence": 0.5,
            }
    
    async def _detect_hallucination(self, activity_output: dict, query: str) -> dict:
        """
        Detect hallucinations in generated activity using Gemini.
        
        Args:
            activity_output: The generated activity to validate
            query: Original user query for context
        
        Returns:
            Dict with hallucination_score and validation details
        """
        try:
            # Format activity for validation
            activity_text = f"""
ORIGINAL QUERY: {query}

GENERATED ACTIVITY:
Activity Name: {activity_output.get('activity_name', 'N/A')}
Description: {activity_output.get('description', 'N/A')}
Duration: {activity_output.get('duration_minutes', 'N/A')} minutes
Materials: {', '.join(activity_output.get('materials_needed', []))}
Grade Level: {activity_output.get('grade_level', 'N/A')}

STEPS:
{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(activity_output.get('steps', [])))}

LEARNING OUTCOME: {activity_output.get('learning_outcome', 'N/A')}

TIPS: {', '.join(activity_output.get('tips', [])) if activity_output.get('tips') else 'None'}
"""
            
            # Call Gemini for hallucination detection
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=f"Validate this activity:\n\n{activity_text}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=HALLUCINATION_DETECTION_PROMPT,
                    temperature=0.1,
                    max_output_tokens=10000,
                    response_mime_type="application/json"
                )
            )
            
            # Check if response was truncated
            if hasattr(response, 'candidates') and response.candidates:
                finish_reason = response.candidates[0].finish_reason
                if finish_reason != 1:  # 1 = STOP (normal completion)
                    self.logger.warning("gemini_incomplete_response", 
                        finish_reason=finish_reason,
                        text_length=len(response.text))
            
            # Parse validation response
            text = response.text.strip()
            
            # Robust JSON extraction - remove markdown code blocks
            text = re.sub(r'```(?:json)?\s*|\s*```', '', text)
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
            if json_match:
                text = json_match.group()
            
            # Try parsing as-is first
            try:
                validation_result = json.loads(text)
            except json.JSONDecodeError as first_error:
                # Gemini sometimes returns JSON with unquoted keys or trailing commas
                # Fix common issues:
                try:
                    # 1. Add quotes around unquoted property names (at start, after {, or after ,)
                    text = re.sub(r'([,\{]\s*)(\w+)(\s*):', r'\1"\2"\3:', text)
                    # 2. Remove trailing commas before closing braces/brackets  
                    text = re.sub(r',(\s*[}\]])', r'\1', text)
                    validation_result = json.loads(text)
                except json.JSONDecodeError:
                    # If still failing, save to file for debugging and re-raise
                    with open("gemini_json_error.txt", "w") as f:
                        f.write(f"Error: {first_error}\n\n")
                        f.write(f"Raw response:\n{response.text}\n\n")
                        f.write(f"After regex extraction:\n{text}")
                    raise first_error
            
            self.logger.info("hallucination_check",
                score=validation_result.get("hallucination_score"),
                is_acceptable=validation_result.get("is_acceptable"),
                issues=len(validation_result.get("issues_found", []))
            )
            
            return {
                "hallucination_score": float(validation_result.get("hallucination_score", 0.5)),
                "is_acceptable": validation_result.get("is_acceptable", False),
                "issues_found": validation_result.get("issues_found", []),
                "recommendation": validation_result.get("recommendation", "Regenerate"),
                "detailed_scores": {
                    "realism": validation_result.get("realism_score", 0.5),
                    "educational": validation_result.get("educational_score", 0.5),
                    "logical": validation_result.get("logical_score", 0.5),
                    "factual": validation_result.get("factual_score", 0.5)
                }
            }
            
        except Exception as e:
            self.logger.error("hallucination_check_error",
                error=str(e),
                exc_info=True
            )
            # Default to accepting if validation fails (fail open)
            return {
                "hallucination_score": 0.75,
                "is_acceptable": True,
                "issues_found": ["Validation check failed"],
                "recommendation": "Accept",
                "detailed_scores": {}
            }
    
    async def _summarize_context(self, session_id: str) -> None:
        """
        Summarize older messages in the conversation when it gets too long.
        Keeps recent messages and replaces older ones with a summary.
        """
        ctx = self.contexts.get(session_id)
        if not ctx or len(ctx.messages) <= Config.SUMMARIZATION_THRESHOLD:
            return
        
        # Split messages: older to summarize vs recent to keep
        split_point = len(ctx.messages) - Config.SUMMARIZATION_KEEP_RECENT
        older_messages = ctx.messages[:split_point]
        recent_messages = ctx.messages[split_point:]
        
        # Build conversation text for summarization
        conversation_text = "\n".join([
            f"{msg.role}: {msg.content}" for msg in older_messages
        ])
        
        try:
            # Call Gemini to summarize
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=f"Summarize this teacher-student conversation concisely, preserving key topics and context:\n\n{conversation_text}")]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=500,
                )
            )
            
            summary = response.text.strip()
            
            # Replace older messages with summary
            ctx.messages = [
                ConversationMessage(
                    role="system",
                    content=f"[Previous conversation summary: {summary}]",
                    timestamp=older_messages[0].timestamp
                )
            ] + recent_messages
            
        except Exception:
            # If summarization fails, just keep recent messages
            ctx.messages = recent_messages
    
    async def _check_confidence_node(self, state: OrchestratorState) -> dict:
        """
        Node: Check confidence and set retry tracking.
        """
        retry_count = state.get("retry_count", 0)
        return {
            "retry_count": retry_count,
            "max_retries": 2,
        }
    
    async def _retry_node(self, state: OrchestratorState) -> dict:
        """
        Node: Handle retry by incrementing retry count.
        """
        retry_count = state.get("retry_count", 0)
        return {
            "retry_count": retry_count + 1,
        }
    
    def _route_based_on_confidence(self, state: OrchestratorState) -> str:
        """
        Conditional routing: Check if confidence is high enough.
        """
        confidence = state.get("confidence", 0.8)
        retry_count = state.get("retry_count", 0)
        max_retries = state.get("max_retries", 2)
        
        # If too many retries, give up and execute anyway
        if retry_count >= max_retries:
            return "end"
        
        # If confidence is too low, retry with modified query
        if confidence < 0.6:
            return "retry"
        
        # Normal execution
        return "execute"
    
    async def _execute_tool_node(self, state: OrchestratorState) -> dict:
        """
        Node: Execute the selected tool.
        """
        tool_name = state["selected_tool"]
        topic = state["intent"] or state["query"]
        context = state.get("context")
        
        if tool_name not in self.tools:
            self.logger.error("unknown_tool", tool_name=tool_name)
            return {
                "tool_result": None,
                "error": f"Unknown tool: {tool_name}"
            }
        
        try:
            tool = self.tools[tool_name]
            
            self.logger.info("tool_execution_start",
                tool=tool_name,
                topic=topic[:50] if topic else None
            )
            
            result = await tool.run(topic, context)
            
            self.logger.info("tool_execution_success",
                tool=tool_name,
                has_result=result is not None
            )
            
            # Convert to dict for storage - handle both Pydantic models and dicts
            if hasattr(result, 'model_dump'):
                result_dict = result.model_dump()
            elif isinstance(result, dict):
                result_dict = result
            else:
                result_dict = {"output": str(result)}
            
            return {
                "tool_result": result_dict,
                "error": None
            }
            
        except Exception as e:
            self.logger.error("tool_execution_error",
                tool=tool_name,
                error=str(e),
                exc_info=True
            )
            return {
                "tool_result": None,
                "error": str(e)
            }
    
    async def _validate_output_node(self, state: OrchestratorState) -> dict:
        """
        Node: Validate the tool output and check if follow-up is needed.
        """
        tool_result = state.get("tool_result")
        error = state.get("error")
        selected_tool = state.get("selected_tool")
        
        # If there's an error, mark as invalid
        if error:
            return {
                "is_valid": False,
                "validation_message": f"Tool execution failed: {error}",
                "needs_follow_up": False,
            }
        
        # If no result, mark as invalid
        if not tool_result:
            return {
                "is_valid": False,
                "validation_message": "Tool returned no result",
                "needs_follow_up": False,
            }
        
        # Basic validation: check if result has expected structure
        is_valid = True
        validation_message = "Output validated successfully"
        needs_follow_up = False
        follow_up_action = None
        
        # Crisis handler follow-up: after managing crisis, suggest activity
        if selected_tool == "crisis_handler":
            needs_follow_up = True
            follow_up_action = {
                "tool": "activity_generator",
                "reason": "Suggest calming activity after crisis intervention"
            }
        
        return {
            "is_valid": is_valid,
            "validation_message": validation_message,
            "needs_follow_up": needs_follow_up,
            "follow_up_action": follow_up_action,
        }
    
    async def _check_hallucination_node(self, state: OrchestratorState) -> dict:
        """
        Node: Check for hallucinations in the generated output.
        Smart skipping: Only validates 15% of queries (complex/risky activities).
        """
        tool_result = state.get("tool_result")
        query = state["query"]
        selected_tool = state.get("selected_tool")
        hallucination_check_count = state.get("hallucination_check_count", 0)
        
        # Only check activity_generator outputs
        if selected_tool != "activity_generator" or not tool_result:
            return {
                "hallucination_score": 1.0,
                "hallucination_check_count": 0,
                "needs_hallucination_recheck": False
            }
        
        # Smart skip logic - Skip 85% of simple activities
        should_skip = self._should_skip_hallucination_check(tool_result, query)
        if should_skip:
            self.logger.info("hallucination_check_skipped",
                reason="simple_activity",
                query_preview=query[:50]
            )
            return {
                "hallucination_score": 1.0,  # Assume safe
                "hallucination_check_count": 0,
                "needs_hallucination_recheck": False
            }
        
        # Run hallucination detection for complex activities
        validation = await self._detect_hallucination(tool_result, query)
        
        score = validation["hallucination_score"]
        is_acceptable = score >= Config.HALLUCINATION_THRESHOLD
        
        self.logger.info("hallucination_validation",
            score=score,
            is_acceptable=is_acceptable,
            check_count=hallucination_check_count + 1,
            issues=len(validation.get("issues_found", []))
        )
        
        return {
            "hallucination_score": score,
            "hallucination_check_count": hallucination_check_count + 1,
            "needs_hallucination_recheck": not is_acceptable,
            "validation_message": f"Hallucination score: {score:.2f} - {validation['recommendation']}"
        }
    
    def _should_skip_hallucination_check(self, activity_output, query: str) -> bool:
        """
        Heuristic to determine if hallucination check can be skipped.
        
        Simple rule: Skip if activity has less than 8 steps.
        Activities with 8+ steps are validated for hallucinations.
        """
        # Extract step count from activity output
        if hasattr(activity_output, 'steps'):
            step_count = len(activity_output.steps) if activity_output.steps else 0
            
            # Skip validation if less than 8 steps
            if step_count < 8:
                self.logger.info("hallucination_skip_decision",
                    step_count=step_count,
                    threshold=8,
                    skipped=True
                )
                return True
            else:
                self.logger.info("hallucination_skip_decision",
                    step_count=step_count,
                    threshold=8,
                    skipped=False
                )
                return False
        
        # Default: Skip if step count unavailable (assume simple activity)
        return True
    
    def _route_after_hallucination_check(self, state: OrchestratorState) -> str:
        """
        Conditional routing: After hallucination check, decide next step.
        """
        needs_recheck = state.get("needs_hallucination_recheck", False)
        hallucination_check_count = state.get("hallucination_check_count", 0)
        needs_follow_up = state.get("needs_follow_up", False)
        
        # If hallucination detected and checks left, retry
        if needs_recheck and hallucination_check_count < Config.MAX_HALLUCINATION_CHECKS:
            self.logger.warning("hallucination_retry",
                check_count=hallucination_check_count,
                score=state.get("hallucination_score")
            )
            return "retry"
        
        # If needs follow-up, handle it
        if needs_follow_up:
            return "follow_up"
        
        # Otherwise, end (accept result even if low score after max checks)
        if needs_recheck:
            self.logger.warning("hallucination_accepted_after_max_retries",
                score=state.get("hallucination_score"),
                check_count=hallucination_check_count
            )
        
        return "end"
    
    async def _handle_follow_up_node(self, state: OrchestratorState) -> dict:
        """
        Node: Handle follow-up actions (e.g., crisis → activity).
        """
        follow_up_action = state.get("follow_up_action")
        
        if not follow_up_action:
            return {}
        
        try:
            # Execute the follow-up tool
            tool_name = follow_up_action.get("tool")
            if tool_name in self.tools:
                tool = self.tools[tool_name]
                # Use the original query for context
                result = await tool.run(state["query"], state.get("context"))
                
                # Store as follow-up result
                return {
                    "follow_up_result": result.model_dump(),
                }
        except Exception as e:
            return {
                "follow_up_result": {"error": str(e)}
            }
        
        return {}
    
    async def process(self, input_data: OrchestratorInput) -> OrchestratorOutput:
        """
        Process a query through the orchestrator.
        
        Args:
            input_data: The orchestrator input
        
        Returns:
            OrchestratorOutput with the tool result
        """
        start_time = time.time()
        
        # Create session ID if not provided
        session_id = input_data.session_id or str(uuid.uuid4())
        
        self.logger.info("process_start",
            session_id=session_id,
            query=input_data.query[:100]
        )
        
        # Detect input language
        detected_lang = self._detect_language(input_data.query)
        
        self.logger.info("language_detected",
            session_id=session_id,
            language=detected_lang
        )
        
        # Initial state
        initial_state: OrchestratorState = {
            "query": input_data.query,
            "context": input_data.context,
            "session_id": session_id,
            "messages": [],
            "intent": None,
            "selected_tool": None,
            "tool_reasoning": None,
            "tool_result": None,
            "error": None,
            "confidence": 0.0,
            "retry_count": 0,
            "max_retries": 2,
            "is_valid": True,
            "validation_message": None,
            "hallucination_score": 1.0,
            "hallucination_check_count": 0,
            "needs_hallucination_recheck": False,
            "needs_follow_up": False,
            "follow_up_action": None,
            "processing_time_ms": 0.0,
        }
        
        try:
            # Run the graph with config for checkpointing
            config = {"configurable": {"thread_id": session_id}}
            
            # Use in-memory checkpointer for LangGraph state
            compiled_graph = self.graph.compile(checkpointer=MemorySaver())
            final_state = await compiled_graph.ainvoke(initial_state, config=config)
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Build output
            if final_state.get("error"):
                return OrchestratorOutput(
                    tool_used=final_state.get("selected_tool", "none"),
                    reasoning=final_state.get("tool_reasoning", ""),
                    result={},
                    confidence=final_state.get("confidence", 0.0),
                    processing_time_ms=processing_time_ms,
                    error=final_state["error"]
                )
            
            # Parse result based on tool
            result = final_state.get("tool_result")
            
            # If no result, return empty response
            if not result:
                return OrchestratorOutput(
                    tool_used=final_state.get("selected_tool", "none"),
                    reasoning=final_state.get("tool_reasoning", "No result generated"),
                    result={},
                    confidence=final_state.get("confidence", 0.0),
                    processing_time_ms=processing_time_ms,
                    error="No result generated by tool"
                )
            
            # Add follow-up result if present
            follow_up_result = final_state.get("follow_up_result")
            if follow_up_result:
                result["follow_up"] = follow_up_result
            
            if final_state.get("selected_tool") == "activity_generator":
                result = ActivityOutput(**result)
            
            # Translate result to original language if needed
            if detected_lang != 'en' and isinstance(result, ActivityOutput):
                self.logger.info("translating_result",
                    session_id=session_id,
                    target_lang=detected_lang
                )
                
                # Translate activity fields
                result.activity_name = await self._translate_text(result.activity_name, detected_lang)
                result.description = await self._translate_text(result.description, detected_lang)
                result.learning_outcome = await self._translate_text(result.learning_outcome, detected_lang)
                
                # Translate steps
                translated_steps = []
                for step in result.steps:
                    translated_steps.append(await self._translate_text(step, detected_lang))
                result.steps = translated_steps
                
                # Translate materials
                translated_materials = []
                for material in result.materials_needed:
                    translated_materials.append(await self._translate_text(material, detected_lang))
                result.materials_needed = translated_materials
                
                # Translate tips if present
                if result.tips:
                    translated_tips = []
                    for tip in result.tips:
                        translated_tips.append(await self._translate_text(tip, detected_lang))
                    result.tips = translated_tips
            
            # Update conversation context and save to SQLite
            assistant_message = f"Generated activity: {result.activity_name if isinstance(result, ActivityOutput) else 'Response'}"
            
            if session_id in self.contexts:
                self.contexts[session_id].add_message("assistant", assistant_message)
            
            # Save assistant message to SQLite
            if self.storage:
                await self.storage.add_message(session_id, "assistant", assistant_message)
            
            self.logger.info("process_complete",
                session_id=session_id,
                tool=final_state.get("selected_tool"),
                confidence=final_state.get("confidence"),
                processing_time_ms=processing_time_ms,
                has_follow_up=follow_up_result is not None
            )
            
            return OrchestratorOutput(
                tool_used=final_state.get("selected_tool", "activity_generator"),
                reasoning=final_state.get("tool_reasoning", ""),
                result=result,
                confidence=final_state.get("confidence", 0.8),
                processing_time_ms=processing_time_ms,
                error=None
            )
            
        except Exception as e:
            processing_time_ms = (time.time() - start_time) * 1000
            
            self.logger.error("process_error",
                session_id=session_id,
                error=str(e),
                processing_time_ms=processing_time_ms,
                exc_info=True
            )
            
            return OrchestratorOutput(
                tool_used="none",
                reasoning="Error occurred during processing",
                result={},
                confidence=0.0,
                processing_time_ms=processing_time_ms,
                error=str(e)
            )
    
    async def process_streaming(self, input_data: OrchestratorInput) -> AsyncIterator[Dict[str, Any]]:
        """
        Process a query through the orchestrator with streaming support.
        
        Yields incremental updates as the graph progresses through nodes.
        
        Args:
            input_data: The orchestrator input
        
        Yields:
            Dict with updates: {"type": "node"|"final", "node": str, "data": dict}
        """
        start_time = time.time()
        
        # Create session ID if not provided
        session_id = input_data.session_id or str(uuid.uuid4())
        
        self.logger.info("process_streaming_start",
            session_id=session_id,
            query=input_data.query[:100]
        )
        
        # Initial state
        initial_state: OrchestratorState = {
            "query": input_data.query,
            "context": input_data.context,
            "session_id": session_id,
            "messages": [],
            "intent": None,
            "selected_tool": None,
            "tool_reasoning": None,
            "tool_result": None,
            "error": None,
            "confidence": 0.0,
            "retry_count": 0,
            "max_retries": 2,
            "is_valid": True,
            "validation_message": None,
            "hallucination_score": 1.0,
            "hallucination_check_count": 0,
            "needs_hallucination_recheck": False,
            "needs_follow_up": False,
            "follow_up_action": None,
            "processing_time_ms": 0.0,
        }
        
        try:
            # Run the graph with config for checkpointing
            config = {"configurable": {"thread_id": session_id}}
            
            # Use in-memory checkpointer for LangGraph state
            compiled_graph = self.graph.compile(checkpointer=MemorySaver())
            
            # Stream updates as graph progresses
            async for chunk in compiled_graph.astream(initial_state, config=config):
                # Yield node updates
                for node_name, node_state in chunk.items():
                    yield {
                        "type": "node",
                        "node": node_name,
                        "data": {
                            "selected_tool": node_state.get("selected_tool"),
                            "confidence": node_state.get("confidence"),
                            "intent": node_state.get("intent"),
                            "error": node_state.get("error")
                        }
                    }
            
            # Get final state
            final_state = await compiled_graph.aget_state(config)
            final_values = final_state.values
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Build final output
            result = final_values.get("tool_result")
            follow_up_result = final_values.get("follow_up_result")
            
            if follow_up_result:
                result["follow_up"] = follow_up_result
            
            if final_values.get("selected_tool") == "activity_generator" and result:
                result = ActivityOutput(**result)
            
            # Update conversation context and save to SQLite
            if result:
                assistant_message = f"Generated activity: {result.activity_name if isinstance(result, ActivityOutput) else 'Response'}"
                
                if session_id in self.contexts:
                    self.contexts[session_id].add_message("assistant", assistant_message)
                
                if self.storage:
                    await self.storage.add_message(session_id, "assistant", assistant_message)
            
            # Yield final result
            yield {
                "type": "final",
                "data": {
                    "tool_used": final_values.get("selected_tool", "activity_generator"),
                    "reasoning": final_values.get("tool_reasoning", ""),
                    "result": result,
                    "confidence": final_values.get("confidence", 0.8),
                    "processing_time_ms": processing_time_ms,
                    "error": final_values.get("error")
                }
            }
            
            self.logger.info("process_streaming_complete",
                session_id=session_id,
                processing_time_ms=processing_time_ms
            )
            
        except Exception as e:
            processing_time_ms = (time.time() - start_time) * 1000
            
            self.logger.error("process_streaming_error",
                session_id=session_id,
                error=str(e),
                exc_info=True
            )
            
            yield {
                "type": "error",
                "data": {
                    "error": str(e),
                    "processing_time_ms": processing_time_ms
                }
            }
    
    def process_sync(self, input_data: OrchestratorInput) -> OrchestratorOutput:
        """Synchronous version of process()."""
        import asyncio
        return asyncio.run(self.process(input_data))
    
    def get_context(self, session_id: str) -> Optional[ConversationContext]:
        """Get conversation context for a session."""
        return self.contexts.get(session_id)
    
    def clear_context(self, session_id: str) -> bool:
        """Clear conversation context for a session."""
        if session_id in self.contexts:
            del self.contexts[session_id]
            return True
        return False
