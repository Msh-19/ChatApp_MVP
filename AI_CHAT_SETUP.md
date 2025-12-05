# AI Chat Feature Setup Guide

This document provides detailed instructions for setting up and using the AI Chat feature powered by Google's Gemini API.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Your Gemini API Key](#getting-your-gemini-api-key)
4. [Environment Configuration](#environment-configuration)
5. [How It Works](#how-it-works)
6. [Features](#features)
7. [Troubleshooting](#troubleshooting)
8. [API Details](#api-details)

---

## Overview

The AI Chat feature allows users to have conversations with an AI assistant powered by Google's Gemini Pro model. This feature is completely separate from the regular chat functionality and does not interfere with existing chat logic.

### Key Features:
- **Separate Tab**: AI Chat has its own dedicated tab in the sidebar
- **Conversation History**: Maintains context from previous messages in the session
- **Real-time Responses**: Streams AI responses in real-time
- **Error Handling**: Graceful error handling with user-friendly messages
- **No Database Storage**: AI conversations are not stored in the database (session-only)

---

## Prerequisites

Before setting up the AI Chat feature, ensure you have:

1. ✅ Node.js 18+ installed
2. ✅ The ChatApp MVP project set up and running
3. ✅ A Google account
4. ✅ Access to Google AI Studio (free)

---

## Getting Your Gemini API Key

### Step 1: Visit Google AI Studio

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create an API Key

1. Click on **"Get API Key"** in the top right corner
2. You may be prompted to create a new Google Cloud project or select an existing one
   - If creating a new project, give it a name (e.g., "ChatApp AI")
   - Click **"Create API Key"**
3. Copy the generated API key immediately
   - ⚠️ **Important**: You won't be able to see this key again, so save it securely
   - The key will look something like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

### Step 3: Understand API Limits

- **Free Tier**: Google provides a generous free tier for Gemini API
- **Rate Limits**: Check the [Google AI Studio documentation](https://ai.google.dev/pricing) for current limits
- **Quota**: Free tier typically includes:
  - 60 requests per minute
  - 1,500 requests per day
  - Subject to change - check Google's current pricing

### Step 4: Security Best Practices

- ⚠️ **Never commit your API key to version control**
- ⚠️ **Never expose your API key in client-side code**
- ✅ Store API keys only in environment variables
- ✅ Use different keys for development and production
- ✅ Rotate keys if they're accidentally exposed

---

## Environment Configuration

### Step 1: Add API Key to Environment Variables

Add your Gemini API key to your `.env` file in the project root:

```env
# Existing environment variables...
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Add this line for AI Chat feature
GEMINI_API_KEY="AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567"
```

### Step 2: Update `.env.local` (if using)

If you're using `.env.local` for Next.js public variables, you don't need to add `GEMINI_API_KEY` there since it's a server-side only variable.

### Step 3: Restart Your Development Server

After adding the environment variable, restart your development server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Verify Configuration

1. Start your application
2. Log in to the chat app
3. Click on the **"AI Chat"** tab in the sidebar
4. Try sending a message
5. If configured correctly, you should receive an AI response

---

## How It Works

### Architecture Overview

```
User Input → Frontend (AIChatView.tsx)
           ↓
           API Route (/api/ai/chat)
           ↓
           Gemini API (Google Cloud)
           ↓
           AI Response → Frontend
           ↓
           Display to User
```

### Component Structure

1. **AIChatView.tsx** (`components/AIChatView.tsx`)
   - Main component for AI chat interface
   - Handles message display and user input
   - Manages conversation history (in-memory, per session)
   - Sends requests to the API route

2. **API Route** (`app/api/ai/chat/route.ts`)
   - Server-side endpoint that handles AI requests
   - Authenticates the user
   - Communicates with Gemini API
   - Returns AI responses

3. **ChatSidebar.tsx** (Modified)
   - Added tab switcher for "Chats" and "AI Chat"
   - Conditionally shows chat sessions or AI chat interface

4. **Chat Page** (`app/chat/page.tsx`)
   - Manages tab state
   - Conditionally renders either normal chat or AI chat view

### Data Flow

1. **User sends a message**:
   - Message is added to local state immediately
   - Request is sent to `/api/ai/chat` with conversation history

2. **API Route processes request**:
   - Verifies user authentication
   - Formats conversation history for Gemini
   - Sends request to Gemini API with context (last 10 messages)

3. **AI responds**:
   - Response is received from Gemini
   - Returned to frontend as JSON

4. **Frontend displays response**:
   - AI message is added to conversation
   - User can continue the conversation

### Conversation History

- **Storage**: Conversation history is stored in component state (not in database)
- **Context Window**: Last 10 messages are sent to Gemini for context
- **Persistence**: History is lost when:
  - User refreshes the page
  - User switches tabs and comes back
  - User logs out

**Note**: This is intentional to keep AI conversations private and not stored in the database. If you want persistent AI conversations, you would need to:
1. Create a database table for AI conversations
2. Store messages in the database
3. Load conversation history on component mount

---

## Features

### ✅ Implemented Features

1. **Tab-based Navigation**
   - Separate "Chats" and "AI Chat" tabs
   - Easy switching between modes
   - Visual indicators for active tab

2. **Conversation Context**
   - Maintains conversation history during the session
   - Sends last 10 messages for context
   - AI can reference previous messages

3. **Loading States**
   - Shows typing indicator while AI is processing
   - Disables input during processing
   - Visual feedback for user

4. **Error Handling**
   - Graceful error messages
   - Handles API key errors
   - Handles quota/rate limit errors
   - Network error handling

5. **UI Consistency**
   - Matches the design of regular chat
   - Same message styling
   - Responsive design
   - Dark theme support

### 🔄 Potential Enhancements

If you want to extend the feature, consider:

1. **Persistent Conversations**
   - Store AI conversations in database
   - Load conversation history on mount
   - Allow users to have multiple AI conversations

2. **Model Selection**
   - Allow users to choose between Gemini Pro, Gemini Pro Vision, etc.
   - Different models for different use cases

3. **Streaming Responses**
   - Stream AI responses token by token
   - Better user experience for long responses

4. **Message Editing**
   - Allow users to edit/regenerate AI responses
   - Edit user messages and get new responses

5. **Conversation Management**
   - Save/delete AI conversations
   - Export conversations
   - Share conversations

---

## Troubleshooting

### Issue: "AI service is not configured"

**Symptoms**: Error message appears when trying to use AI chat

**Solutions**:
1. Check that `GEMINI_API_KEY` is set in your `.env` file
2. Restart your development server after adding the key
3. Verify the key doesn't have extra spaces or quotes
4. Check that the key starts with `AIzaSy`

### Issue: "Invalid API key"

**Symptoms**: Error message about invalid API key

**Solutions**:
1. Verify your API key is correct
2. Check if the key has been revoked in Google AI Studio
3. Generate a new API key if needed
4. Ensure you're using the correct key (not a different Google API key)

### Issue: "API quota exceeded"

**Symptoms**: Rate limit or quota errors

**Solutions**:
1. Check your quota in [Google AI Studio](https://aistudio.google.com/)
2. Wait for the rate limit to reset (usually per minute)
3. Consider upgrading to a paid plan if you need higher limits
4. Implement rate limiting on your side to prevent hitting limits

### Issue: AI responses are slow

**Symptoms**: Long delays before receiving responses

**Solutions**:
1. Check your internet connection
2. Verify Gemini API status
3. Consider implementing streaming responses for better UX
4. Check if you're hitting rate limits (slower responses when throttled)

### Issue: AI responses are not relevant

**Symptoms**: AI gives unrelated or poor responses

**Solutions**:
1. Check if you're sending proper conversation history
2. Verify the conversation history format
3. Try clearing the conversation and starting fresh
4. Consider adjusting the context window size

### Issue: Tab switching doesn't work

**Symptoms**: Can't switch between Chats and AI Chat tabs

**Solutions**:
1. Check browser console for errors
2. Verify all components are properly imported
3. Ensure `onTabChange` prop is being passed to ChatSidebar
4. Check that tab state is being managed correctly

---

## API Details

### Endpoint: `POST /api/ai/chat`

**Authentication**: Required (JWT token via cookies)

**Request Body**:
```json
{
  "message": "Hello, how are you?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "What is JavaScript?"
    },
    {
      "role": "assistant",
      "content": "JavaScript is a programming language..."
    }
  ]
}
```

**Response (Success)**:
```json
{
  "message": "I'm doing well, thank you! How can I help you today?",
  "success": true
}
```

**Response (Error)**:
```json
{
  "error": "Error message here"
}
```

**Status Codes**:
- `200`: Success
- `400`: Bad request (missing message)
- `401`: Unauthorized (invalid/missing auth or API key)
- `429`: Rate limit exceeded
- `500`: Server error

### Gemini Model Configuration

Currently using: `gemini-pro`

To change the model, edit `app/api/ai/chat/route.ts`:

```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
```

Available models:
- `gemini-pro`: General purpose (default)
- `gemini-pro-vision`: For image understanding (requires image input)

### Context Window

- **Current**: Last 10 messages
- **Configurable**: Edit the slice in `AIChatView.tsx`:
  ```typescript
  conversationHistory: conversationHistory.slice(-10) // Change -10 to desired number
  ```

---

## Security Considerations

1. **API Key Protection**
   - ✅ API key is stored server-side only
   - ✅ Never exposed to client
   - ✅ Validated on every request

2. **Authentication**
   - ✅ All AI chat requests require user authentication
   - ✅ Uses same JWT authentication as regular chat

3. **Rate Limiting**
   - ⚠️ Currently relies on Gemini's rate limiting
   - 💡 Consider adding your own rate limiting middleware

4. **Input Validation**
   - ✅ Messages are validated before sending
   - ✅ Empty messages are rejected
   - ⚠️ Consider adding content filtering for inappropriate content

5. **Error Messages**
   - ✅ Generic error messages to users
   - ✅ Detailed errors logged server-side only

---

## Cost Considerations

### Free Tier Limits

Google provides a generous free tier, but be aware of:
- **Rate Limits**: 60 requests per minute
- **Daily Quota**: 1,500 requests per day
- **Pricing Changes**: Google may change pricing - check [current pricing](https://ai.google.dev/pricing)

### Monitoring Usage

1. Monitor usage in [Google AI Studio](https://aistudio.google.com/)
2. Set up billing alerts in Google Cloud Console
3. Consider implementing usage tracking in your app

### Optimization Tips

1. **Cache common responses** (if appropriate)
2. **Implement client-side rate limiting** to prevent accidental spam
3. **Use shorter context windows** for faster/cheaper responses
4. **Consider batching** if you need multiple responses

---

## Support and Resources

### Official Documentation

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Node.js SDK Documentation](https://ai.google.dev/tutorials/node_quickstart)

### Getting Help

1. Check this documentation first
2. Review error messages in browser console and server logs
3. Check Google AI Studio for API status
4. Review Gemini API documentation
5. Check project issues/forums

---

## Summary Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Google account created
- [ ] Google AI Studio account set up
- [ ] Gemini API key generated
- [ ] API key added to `.env` file
- [ ] `GEMINI_API_KEY` environment variable set
- [ ] Development server restarted
- [ ] AI Chat tab visible in sidebar
- [ ] Can send messages to AI
- [ ] Receiving AI responses
- [ ] Error handling working
- [ ] Conversation history working

---

**Last Updated**: December 2024
**Version**: 1.0.0

