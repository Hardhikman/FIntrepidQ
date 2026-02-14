# 24/7 Persistence & Deployment Guide

To keep your FIntrepidQ WhatsApp bot running "always," you have two main options depending on whether you want to use your own computer or a cloud server.

---

## 🏠 Option 1: Local Persistence (Easy, Cost-Free)
Use this if you are okay with keeping your laptop/PC powered on 24/7.

### 1. Using PM2 (Professional)
PM2 is a process manager that ensures the bot restarts if it crashes.
- **Install:** `npm install -g pm2`
- **Start:** `pm2 start "python chat.py whatsapp run-bot" --name fintrepid-bot`
- **Check Status:** `pm2 list`

### 2. Windows Startup Folder (Simple)
- Create a `.bat` file that runs `python chat.py whatsapp run-bot`.
- Place a shortcut in `shell:startup`. This starts the bot as soon as you log in.

---

## ☁️ Option 2: Cloud Deployment (Recommended for 24/7)
Use this if you want the bot to run even when your computer is off. This requires "deploying your backend."

### 1. Where to Deploy?
- **Railway / Render:** Great for beginners. You connect your GitHub repo, and it builds/runs automatically.
- **Linux VPS (DigitalOcean / AWS):** Best for absolute control ($5/month).

### 2. Deployment Steps
1.  **Push to GitHub:** Ensure your code (minus `.env` and `equity_ai.db`) is in a private repo.
2.  **Environment Variables:** On your server/Railway dashboard, add your API keys (`GOOGLE_API_KEY`, etc.).
3.  **WhatsApp Authentication:** This is the tricky part for servers. You will need to copy your `mudslide` session folder to the server or scan the QR code via terminal logs once.
4.  **Persistent Storage:** Since the database (`equity_ai.db`) updates, you'll need "Persistent Volumes" if using Railway, so you don't lose data on every deploy.

---

## ⚖️ Which one should I choose?

| Feature | Local (PC) | Cloud (Deploy) |
| :--- | :--- | :--- |
| **Cost** | Free | ~$5/month |
| **Effort** | Low | Medium (Setup GitHub/CI) |
| **Reliability** | Depends on your PC/Power | 99.9% Uptime |
| **Scalability** | Limited | High |

**Recommendation:** Start with **Local (Method 1)** to verify everything works perfectly. Once you are comfortable, we can move to **Cloud Deployment**.
