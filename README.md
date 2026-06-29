# 🌍 CivicAI Global — World-wide Civic Assistant

An AI-powered civic chatbot that helps users with **government services for any city or country in the world** — Tamil Nadu, India, USA, UK, and beyond. Powered by **Google Gemini 2.5 Flash**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Features

- 🌍 **Global coverage** — answers for any city, state, or country
- 🇮🇳 **India-specific** — Tamil Nadu (TNEB, TNPDS, CMWSSB, e-Sevai), Aadhaar, PAN, ration cards
- 🗣️ **12+ languages** — responds in Tamil, Hindi, Arabic, and more
- ⚡ **Gemini 2.5 Flash** — real AI responses, not scripted answers
- 📱 **Fully responsive** — works on mobile, tablet, desktop
- 🔒 **Secure** — rate limiting, helmet, CORS protection

---

## 🚀 Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/CivicChatbot.git
cd CivicChatbot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
PORT=3000
NODE_ENV=development
```

> Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 4. Run locally
```bash
npm run dev
```
Visit: **http://localhost:3000**

---

## 🌐 Deploy to Vercel

### Option A — Vercel Dashboard (Recommended)

1. Push this repo to GitHub (see below)
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. In **Environment Variables**, add:
   - `GEMINI_API_KEY` = your key
   - `NODE_ENV` = `production`
5. Click **Deploy** ✅

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```
When prompted, add `GEMINI_API_KEY` as an environment variable.

---

## 📂 Project Structure

```
CivicChatbot/
├── server.js          # Express backend + Gemini AI
├── app.js             # Frontend JavaScript
├── index.html         # Main UI
├── styles.css         # Styling
├── data/
│   └── civic_knowledge.js  # Global system prompt for Gemini
├── vercel.json        # Vercel deployment config
├── .env.example       # Environment variable template
└── package.json
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |

---

## 💬 Example Queries

- *"How to get ration card in Tamil Nadu?"*
- *"TNEB electricity bill payment helpline"*
- *"Chennai Corporation road complaint number"*
- *"How to apply for Aadhaar card?"*
- *"How to report a pothole in London?"*
- *"Emergency numbers in India"*

---

## 📄 License

MIT © 2024 CivicAI Global
