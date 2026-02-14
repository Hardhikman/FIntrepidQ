# WhatsApp Integration Guide

The FIntrepidQ system now supports full WhatsApp integration, allowing you to trigger equity analysis and receive AI-driven reports directly on your mobile device.

---

## 🚀 Quick Start

To run the bot in auto-reply mode:
```bash
python chat.py whatsapp run-bot
```

### Initial Setup (One-time)
If you haven't logged in, run:
```bash
python chat.py whatsapp login
```
*Note: This will display a QR code to scan with your WhatsApp mobile app (Linked Devices).*

---

## 🤖 Interaction Flow

The bot operates through a unified chat engine, meaning it behaves exactly like the CLI interactive chat.

### Commands
In your WhatsApp chat, you can send:
- `analyze [TICKER]` (e.g., `analyze TSLA`) - Resolves the ticker and starts a full multi-agent analysis.
- `analyze [COMPANY NAME]` (e.g., `analyze tesla`) - Uses smart mapping and web-search to find the correct symbol.
- `/tickers` - Lists all stocks currently in the database.
- `/clear` - Clears the current conversation memory for your phone number.

### Analysis Reports
When you request an analysis via WhatsApp, the bot:
1.  Performs full data collection and validation.
2.  Generates a comprehensive investment thesis.
3.  **Synthesizes a concise summary** specifically for mobile (Executive Summary & Investment Thesis).
4.  Delivers the report in a single, well-formatted block using the `JSON_SEND` protocol.

---

## 🛡️ Stability & Telemetry

The integration is hardened for production use with the following features:

| Feature | Description |
|---------|-------------|
| **Bidirectional Sync** | Prevents session locks by using a shared `stdin` channel between Python and Node.js. |
| **JSON_SEND Protocol** | Ensures multiline reports are delivered in one piece without truncation. |
| **💓 Heartbeat** | The bot prints a heartbeat every 5 seconds in the CLI console to confirm the communication pipe is healthy. |
| **Diagnostic Logs** | Real-time `[Listener]` debug output showing connection and authentication events. |
| **Smart Resolution** | Prioritizes symbols in parentheses `(AAPL)` over descriptive text to avoid "Invalid Ticker" errors. |

---

## 🛠️ Troubleshooting

- **"Bot stopped." immediately**: Ensure you are using the correct command and that Node.js is installed.
- **No Response**: Check if the console shows `✅ WhatsApp Bot CONNECTED`. If not, try running `python chat.py whatsapp login` again.
- **Rate Limits**: If you see a `429 Quota Exceeded` error, wait 60 seconds. This is a Gemini API limit, not a WhatsApp one.
- **Invalid Ticker**: If a common ticker like "tesla" fails, try the explicit symbol "TSLA".
