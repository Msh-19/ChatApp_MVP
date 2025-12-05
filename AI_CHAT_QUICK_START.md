# AI Chat Feature - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new project or select existing
5. Copy your API key (starts with `AIzaSy...`)

### Step 2: Add to Environment
Add this line to your `.env` file:
```env
GEMINI_API_KEY="your-api-key-here"
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Test It
1. Log in to your chat app
2. Click the **"AI Chat"** tab in the sidebar
3. Send a message!

## ✅ That's It!

The AI Chat feature is now ready to use. For detailed documentation, troubleshooting, and advanced configuration, see [AI_CHAT_SETUP.md](./AI_CHAT_SETUP.md).

## 📋 What You Need to Provide

- **GEMINI_API_KEY**: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
  - Free tier available
  - No credit card required for free tier
  - Generous limits (60 requests/min, 1500/day)

## 🎯 Features

- ✅ Separate tab in sidebar (doesn't interfere with normal chat)
- ✅ Conversation context (remembers last 10 messages)
- ✅ Real-time responses
- ✅ Error handling
- ✅ Beautiful UI matching your app design

## ⚠️ Important Notes

- API key is **server-side only** (secure)
- Conversations are **session-only** (not stored in database)
- Free tier has rate limits (check Google's current limits)
- See [AI_CHAT_SETUP.md](./AI_CHAT_SETUP.md) for full details

