# WhatsApp Bot CRM - Investigalo Detectives

A comprehensive WhatsApp Business API integration with a React-based CRM for managing conversations, cases, and automated responses.

## ✨ Features

- 💬 **WhatsApp Integration** - Send/receive messages via Meta WhatsApp Business API
- 🤖 **AI Bot** - Automated responses with toggle control
- 📋 **Case Management** - Kanban board (urgentes, revisión, aceptado)
- 🔄 **Real-time Sync** - Socket.io for instant message updates
- 👥 **Conversation Management** - View all conversations with contact info
- ⚙️ **Bot Control** - Toggle globally or per-conversation
- 📱 **WhatsApp-style UI** - Modern chat interface

## 🛠️ Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Socket.io, Meta API v25.0  
**Frontend:** React 18, Chakra UI, Axios, Socket.io-client

## 📁 Project Structure

```
WP_BOT_DET/
├── backend/               # Express + Socket.io server
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/api.js
│   │   ├── models/db.js
│   │   └── services/meta.js
│   ├── schema.sql
│   ├── .env
│   └── package.json
├── frontend/              # React SPA
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   ├── .env
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
# Configure .env with PostgreSQL and WhatsApp credentials
npm run dev  # Runs on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start    # Runs on port 3000
```

### Database
```bash
createdb crm_whatsapp
psql -d crm_whatsapp -f schema.sql
```

## 🌐 Deployment

### To Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy!

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

## 📝 Environment Variables

**Backend (.env):**
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_whatsapp
DB_USER=postgres
DB_PASSWORD=your_password
WHATSAPP_TOKEN=your_meta_token
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

**Frontend (.env):**
```
REACT_APP_API_URL=https://your-backend-url
```

## 📡 API Endpoints

- `GET /api/conversations` - List conversations
- `POST /api/messages/send-whatsapp` - Send WhatsApp message
- `GET /api/cases` - List cases
- `PATCH /api/cases/:id/status` - Update case

## 🔌 WebSocket Events

- `new_message` - New incoming WhatsApp message

## 📚 For More Info

See backend/src/ and frontend/src/ for implementation details.

---

Created for Investigalo Detectives 🔍
