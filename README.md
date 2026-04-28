# WhatsApp Scheduler

A scheduled WhatsApp message posting system with a web frontend and backend.

## Features

- Login via WhatsApp QR code scan
- View recent chats (individuals and groups)
- Schedule messages for future delivery
- Cancel scheduled messages
- Simple polling-based message sender

## Tech Stack

- **Backend**: Node.js, Express, Baileys (WhatsApp Web API)
- **Frontend**: React, Vite
- **Database**: SQLite

## Prerequisites

- Node.js 18+
- A phone with WhatsApp installed

## Installation

```bash
npm install
```

## Running the App

### Development (both frontend and backend):

```bash
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Production:

```bash
npm run dev:frontend  # Build frontend
npm run start         # Start backend (serves frontend)
```

## How to Use

1. Open http://localhost:3000 in your browser
2. Scan the QR code with WhatsApp (Settings → Linked Devices → Link a Device)
3. Once connected, you'll see your recent chats
4. Select a chat, compose your message, and pick a time
5. Click "Schedule Message"
6. View and manage scheduled messages in the queue section

## Project Structure

```
whatsapp-scheduler/
├── backend/
│   ├── index.js          # Express server + routes
│   ├── whatsapp.js       # Baileys WhatsApp integration
│   ├── scheduler.js      # Message polling worker
│   ├── db.js             # SQLite database
│   └── sessions/         # WhatsApp auth sessions
└── frontend/
    └── src/
        ├── App.jsx       # Main app component
        ├── api.js        # API client
        └── components/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── ChatList.jsx
            ├── ScheduleForm.jsx
            └── MessageQueue.jsx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/qr | SSE stream for QR code and connection status |
| GET | /api/status | Check connection status |
| GET | /api/chats | Get recent chats |
| GET | /api/messages | List scheduled messages |
| POST | /api/messages | Schedule new message |
| DELETE | /api/messages/:id | Cancel scheduled message |
| POST | /api/logout | Logout and clear session |

## Notes

- WhatsApp sessions are stored locally in `backend/sessions/`
- The scheduler checks for pending messages every 30 seconds
- This uses the unofficial WhatsApp Web API via Baileys
- Rate limits may apply - use responsibly