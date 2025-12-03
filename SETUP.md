# ChatApp MVP - Setup Guide

This guide will help you set up and run the chat application.

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18 or higher installed
- [ ] PostgreSQL database (local or cloud)
- [ ] Google OAuth credentials

## Step-by-Step Setup

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a new database:
   ```sql
   CREATE DATABASE chatapp;
   ```
3. Your connection string will be:
   ```
   postgresql://username:password@localhost:5432/chatapp
   ```

#### Option B: Cloud Database (Recommended for Quick Start)

**Supabase (Free):**
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI mode)
5. Replace `[YOUR-PASSWORD]` with your database password

**Neon (Free):**
1. Go to https://neon.tech/
2. Create a new project
3. Copy the connection string from the dashboard

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure the OAuth consent screen:
     - User Type: External
     - App name: ChatApp MVP
     - User support email: your email
     - Developer contact: your email
   - Application type: Web application
   - Name: ChatApp MVP
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
   - Click "Create"
5. Copy your Client ID (looks like: `xxxxx.apps.googleusercontent.com`)

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database - Replace with your actual connection string
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp"

# Google OAuth - Replace with your actual Client ID
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"

# JWT Secret - Generate a random string
# You can generate one with: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# App URLs (keep these as-is for local development)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

**IMPORTANT:** Also create `.env.local` with the public variables:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
```

### 5. Run Database Migrations

This creates all the necessary tables in your database:

```bash
npx prisma migrate dev --name init
```

If successful, you should see:
```
✔ Generated Prisma Client
✔ The migration has been applied successfully
```

### 6. (Optional) View Database with Prisma Studio

To see your database in a GUI:

```bash
npx prisma studio
```

This opens at http://localhost:5555

### 7. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Verification

1. Open http://localhost:3000 in your browser
2. You should be redirected to the login page
3. Click "Sign in with Google"
4. Authorize the app
5. You should be redirected to the chat interface

## Troubleshooting

### "Failed to sign in with Google"

- Check that `GOOGLE_CLIENT_ID` in `.env.local` is correct
- Verify `http://localhost:3000` is in Authorized JavaScript origins
- Make sure you're using the correct Google account

### "Authentication failed" after Google login

- Check that `GOOGLE_CLIENT_ID` in `.env` matches `.env.local`
- Verify `JWT_SECRET` is set in `.env`
- Check server logs for detailed error messages

### "Database connection failed"

- Verify `DATABASE_URL` is correct
- Make sure PostgreSQL is running
- Test connection with: `npx prisma db pull`

### "Cannot find module" errors

- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### WebSocket not connecting

- Make sure you're running the custom server with `npm run dev`
- Check browser console for WebSocket errors
- Verify `NEXT_PUBLIC_SOCKET_URL` matches your server URL

## Next Steps

Once the app is running:

1. **Test with Multiple Users:**
   - Open the app in different browsers (Chrome, Firefox, etc.)
   - Or use incognito/private windows
   - Sign in with different Google accounts
   - Start a chat and send messages

2. **Explore Features:**
   - Create new chats
   - Send messages in real-time
   - Check typing indicators
   - See online/offline status

3. **View Database:**
   - Run `npx prisma studio`
   - See users, messages, and sessions being created

## Production Deployment

For production deployment, see the main README.md file.

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs (browser and server)
3. Check the README.md for more detailed information
4. Verify all environment variables are set correctly
