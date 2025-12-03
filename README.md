# ChatApp MVP - Real-time Chat Application

A modern, real-time chat application built with Next.js 15, Socket.IO, Prisma, PostgreSQL, and Google OAuth authentication.

## Features

- 🔐 **Google OAuth Authentication** with JWT tokens
- 💬 **Real-time Messaging** using WebSocket (Socket.IO)
- 📝 **Message Persistence** with PostgreSQL database
- 👥 **User Presence** - See who's online
- ⌨️ **Typing Indicators** - Know when someone is typing
- 🎨 **Modern UI** - Beautiful dark theme with glassmorphism effects
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Fast & Efficient** - Optimized for performance

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Custom Node.js server
- **Real-time**: Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth 2.0 with JWT

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google OAuth credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd ChatApp_MVP
npm install
```

### 2. Set Up PostgreSQL Database

You can use a local PostgreSQL instance or a cloud provider like:
- [Supabase](https://supabase.com/) (Free tier available)
- [Neon](https://neon.tech/) (Free tier available)
- [Railway](https://railway.app/)

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. For "Authorized JavaScript origins", add: `http://localhost:3000`
7. For "Authorized redirect URIs", add: `http://localhost:3000`
8. Copy your Client ID

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp"

# Google OAuth - Replace with your Google Client ID
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# JWT Secret - Generate a random string (you can use: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

Also create a `.env.local` file with the same content for Next.js to pick up the public variables.

### 5. Set Up Database

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login**: Click "Sign in with Google" on the login page
2. **Start a Chat**: Click "New Chat" button and select users
3. **Send Messages**: Type your message and press Enter
4. **Real-time Updates**: Messages appear instantly for all participants
5. **See Who's Online**: Green dot indicates online users

## Project Structure

```
ChatApp_MVP/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── messages/     # Message CRUD
│   │   ├── sessions/     # Chat session management
│   │   └── users/        # User listing
│   ├── chat/             # Main chat page
│   ├── login/            # Login page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (redirects to login)
├── components/           # React components
│   ├── ChatSidebar.tsx   # Sidebar with sessions
│   ├── MessageList.tsx   # Message display
│   ├── MessageInput.tsx  # Message input field
│   └── NewChatModal.tsx  # New chat modal
├── hooks/
│   └── useSocket.ts      # Socket.IO React hook
├── lib/
│   ├── auth.ts           # JWT utilities
│   ├── prisma.ts         # Prisma client
│   └── socket-client.ts  # Socket.IO client
├── prisma/
│   └── schema.prisma     # Database schema
├── server.js             # Custom Next.js server with Socket.IO
├── package.json
└── README.md
```

## Database Schema

- **User**: Stores user information from Google OAuth
- **ChatSession**: Represents a chat room/conversation
- **ChatSessionParticipant**: Many-to-many relationship between users and sessions
- **Message**: Stores all chat messages

## Development Tools

### Prisma Studio

View and edit your database:

```bash
npx prisma studio
```

### Database Migrations

Create a new migration after schema changes:

```bash
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Environment Variables

Make sure to set all environment variables in your production environment:
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SOCKET_URL`

### Build

```bash
npm run build
npm start
```

### Deployment Platforms

This app can be deployed to:
- **Vercel** (requires WebSocket support or external Socket.IO server)
- **Railway**
- **Render**
- **DigitalOcean App Platform**
- **AWS/GCP/Azure**

**Note**: For Vercel, you may need to deploy the Socket.IO server separately as Vercel doesn't support WebSocket on serverless functions.

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings if using cloud database

### Google OAuth Issues

- Verify `GOOGLE_CLIENT_ID` is correct
- Check authorized origins in Google Cloud Console
- Ensure you're using the correct environment (http://localhost:3000 for development)

### WebSocket Connection Issues

- Check that the custom server is running (not just Next.js dev server)
- Verify `NEXT_PUBLIC_SOCKET_URL` matches your server URL
- Check browser console for connection errors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
