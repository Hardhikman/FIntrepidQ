const path = require('path');
const pino = require('pino');

// Import directly from the local mudslide installation to ensure compatibility
// Path relative to tools/whatsapp_listener.js -> ../node_modules/mudslide/build/whatsapp
const mudslidePath = path.resolve(__dirname, '..', 'node_modules', 'mudslide', 'build', 'whatsapp');
const { initWASocket, terminate } = require(mudslidePath);

async function startListener() {
    console.error("Debug: Starting listener using Mudslide internals...");

    try {
        const sock = await initWASocket();

        const startTime = Math.floor(Date.now() / 1000);
        console.error(`Debug: Listener started at ${startTime}`);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                console.error('Debug: Connection closed:', lastDisconnect?.error);
            } else if (connection === 'open') {
                console.error('Debug: Connection opened');
            }
        });

        sock.ev.on('messages.upsert', async m => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    const messageTimestamp = msg.messageTimestamp;

                    // Filter out messages that were received before the bot started
                    // Use a 5-second buffer to allow for slight clock drift or sync latency
                    if (messageTimestamp < startTime - 5) {
                        console.error(`Debug: Skipping old message from ${msg.key.remoteJid} (timestamp: ${messageTimestamp}, start: ${startTime})`);
                        continue;
                    }

                    console.error(`Debug: Received message from ${msg.key.remoteJid} (fromMe: ${msg.key.fromMe})`);

                    const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

                    if (content) {
                        console.error(`Debug: Content found: "${content.substring(0, 20)}..."`);

                        if (content.startsWith('🤖')) {
                            console.error("Debug: Ignoring bot reply.");
                            continue;
                        }

                        let sender = msg.key.remoteJid;
                        if (msg.key.fromMe) {
                            sender = 'me';
                        } else {
                            sender = sender.replace('@s.whatsapp.net', '');
                        }

                        const output = {
                            type: 'message',
                            sender: sender,
                            content: content,
                            raw: msg
                        };
                        // Use a specific prefix to make parsing easier and more reliable
                        console.log(`JSON_MSG:${JSON.stringify(output)}`);
                    } else {
                        console.error("Debug: No text content found.");
                    }
                }
            }
        });

        // Listen for outgoing messages on stdin
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            terminal: false
        });

        rl.on('line', async (line) => {
            if (line.startsWith('JSON_SEND:')) {
                try {
                    const data = JSON.parse(line.substring(10));
                    let { jid, text } = data;

                    if (jid === 'me') {
                        const me = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                        jid = me;
                    } else if (!jid.includes('@')) {
                        jid = jid + '@s.whatsapp.net';
                    }

                    console.error(`Debug: Sending JSON message to ${jid}: ${text.substring(0, 20)}...`);
                    try {
                        await sock.sendMessage(jid, { text: text });
                    } catch (sendErr) {
                        console.error(`Error sending JSON message to ${jid}:`, sendErr);
                    }
                } catch (err) {
                    console.error("Error parsing JSON_SEND:", err);
                }
            } else if (line.startsWith('SEND|')) {
                const parts = line.split('|');
                if (parts.length >= 3) {
                    let jid = parts[1];
                    const text = parts.slice(2).join('|');

                    if (jid === 'me') {
                        const me = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                        jid = me;
                    } else if (!jid.includes('@')) {
                        jid = jid + '@s.whatsapp.net';
                    }

                    console.error(`Debug: Sending simple message to ${jid}: ${text.substring(0, 20)}...`);
                    try {
                        await sock.sendMessage(jid, { text: text });
                    } catch (err) {
                        console.error(`Error sending simple message to ${jid}:`, err);
                    }
                }
            }
        });

        console.error("Debug: Listener and sender ready.");

        // Signal readiness to Python
        console.log("JSON_MSG:{\"type\":\"system\",\"content\":\"READY\"}");

        // Keep-alive heartbeat every 5 seconds to ensure pipe stays open
        setInterval(() => {
            console.log("JSON_MSG:{\"type\":\"system\",\"content\":\"HEARTBEAT\"}");
        }, 5000);

    } catch (error) {
        console.error("Fatal Error starting listener:", error);
        process.exit(1);
    }
}

startListener();
