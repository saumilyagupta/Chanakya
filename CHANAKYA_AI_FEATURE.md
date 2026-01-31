# @chanakya AI Assistant in Discussion Forum

## Overview
The discussion forum now includes an AI assistant feature that allows users to ask questions and get intelligent responses powered by Gemini AI. When you mention `@chanakya` followed by your query, the AI analyzes the entire conversation context and provides helpful, context-aware responses.

## How to Use

### In the Discussion Forum

1. **Navigate to any discussion post** at `/discuss/:id`

2. **Type your reply** starting with `@chanakya` followed by your question:
   ```
   @chanakya How can I teach fractions to struggling students?
   ```

3. **The system will:**
   - Save your query as a regular reply
   - Analyze the entire conversation (original post + all replies)
   - Generate a contextual AI response from Chanakya
   - Post the AI response automatically

### Visual Indicators

- **AI responses** are highlighted with:
  - Light blue background (`bg-[#DBEAFE]`)
  - Blue border (`border-[#2563EB]`)
  - "🤖 Chanakya AI" label
  - "AI Assistant" badge

- **Input hint**: When you start typing `@chanakya`, a helpful notice appears showing that the AI will respond with conversation context

## Backend Architecture

### New Files

1. **`Server/Web_server/services/chanakya_ai_service.py`**
   - Core AI service using Gemini 2.0 Flash
   - Builds conversation context from post history
   - Generates educational responses

### API Endpoints

**POST `/api/discuss/{post_id}/chanakya`**
- Requires authentication
- Request body: `{ "body": "@chanakya your question here" }`
- Creates two replies:
  1. User's query (with `@chanakya` prefix)
  2. AI-generated response (with special `author_id: "chanakya_ai"`)

### Database

Replies from Chanakya AI use a special identifier:
- `author_id: "chanakya_ai"` (instead of a real user ID)
- This allows the frontend to style them differently

## Frontend Changes

### Files Modified

1. **`Client_F/front_chanak/src/pages/DiscussPost.jsx`**
   - Detects `@chanakya` in replies
   - Routes to appropriate API endpoint
   - Displays AI responses with special styling
   - Shows real-time hint when typing `@chanakya`

2. **`Client_F/front_chanak/src/utils/apiClient.js`**
   - Added `askChanakya(postId, query)` method

### User Experience

- Seamless integration - no mode switching required
- Real-time feedback when typing `@chanakya`
- Clear visual distinction between human and AI responses
- Preserves full conversation context

## Configuration

### Environment Variables

Ensure your `.env` file contains:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The system uses the same Gemini API key as other Chanakya features.

## Example Conversation Flow

```
Original Post: "My students struggle with multiplication tables"

Reply 1 (User): "Have you tried flash cards?"
Reply 2 (User): "What about songs or rhymes?"

User types: "@chanakya What are research-backed methods for teaching multiplication?"

AI Response: "Based on educational research and your discussion context, 
here are effective strategies for teaching multiplication tables:

1. Spaced Repetition: Practice a few tables at a time...
2. Visual Arrays: Show multiplication as rectangular grids...
3. Real-world Applications: Connect to everyday situations...

Since flash cards and songs were mentioned, you could combine these 
approaches for multi-sensory learning..."
```

## Technical Details

### AI Model
- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 0.7 (balanced creativity)
- **Max tokens**: 1024
- **Context**: Full conversation history included

### System Prompt
Chanakya is instructed to:
- Focus on educational content and teaching strategies
- Consider Indian educational context
- Provide practical, actionable advice
- Reference conversation history when relevant
- Stay supportive and constructive

## Testing

Run the test script:
```bash
cd Server
python tests/test_chanakya_ai.py
```

This verifies:
- AI service initialization
- Context building from conversation
- Response generation
- Error handling

## Future Enhancements

Potential improvements:
- [ ] Add @chanakya autocomplete
- [ ] Allow users to upvote/downvote AI responses
- [ ] Track most helpful AI responses
- [ ] Add regenerate button for AI responses
- [ ] Support for attachments/images in context
- [ ] Rate limiting to prevent abuse
- [ ] Analytics on AI usage patterns

## Troubleshooting

### AI not responding
- Check `GEMINI_API_KEY` is set correctly
- Verify API quota hasn't been exceeded
- Check server logs for errors

### Wrong context provided
- Ensure replies are sorted by `created_at`
- Verify post_id is valid
- Check database contains expected replies

### Styling issues
- Verify `author_id === "chanakya_ai"` check in frontend
- Clear browser cache if styles not updating
