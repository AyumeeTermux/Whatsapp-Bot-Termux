const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require("@adiwajshing/baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

// Simpan session
let authState = {};
const authFile = './auth.json';
if (fs.existsSync(authFile)) {
    authState = JSON.parse(fs.readFileSync(authFile));
}
function saveAuth(state) {
    fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
}

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        auth: authState,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveAuth);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode;
            console.log('Disconnected:', reason);
            startBot();
        }
        if (connection === 'open') console.log('Bot connected ✅');
    });

    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message) return;
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;
        if (!text) return;

        // COMMANDS
        if (text === ".gcclose") {
            await sock.sendMessage(from, { text: "🔒 Grup ditutup (simulasi)" });
        }

        if (text === ".gcopen") {
            await sock.sendMessage(from, { text: "🔓 Grup dibuka (simulasi)" });
        }

        if (text.startsWith(".kick")) {
            const user = text.split(" ")[1];
            await sock.sendMessage(from, { text: `❌ Simulasi kick: ${user}` });
        }

        if (text.startsWith(".warn")) {
            const user = text.split(" ")[1];
            await sock.sendMessage(from, { text: `⚠️ Simulasi warn: ${user}` });
        }

        if (text.startsWith(".p ")) {
            const pesan = text.slice(3);
            await sock.sendMessage(from, {
                text: `📢 @everyone ${pesan}`,
                mentions: [sender]
            });
        }

        if (text.startsWith(".sem ")) {
            const pesan = text.slice(5);
            await sock.sendMessage(from, { text: `📌 Chat disematkan: ${pesan}` });
        }

        if (text.startsWith(".stiker")) {
            const quoted = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted && quoted.imageMessage) {
                const buffer = await sock.downloadMediaMessage(message, "buffer");
                fs.writeFileSync("./temp.jpg", buffer);
                await sock.sendMessage(from, {
                    sticker: fs.readFileSync("./temp.jpg")
                });
            } else {
                await sock.sendMessage(from, { text: "❗ Reply gambar dengan .stiker untuk membuat stiker" });
            }
        }
    });
}

startBot();
{
  "name": "whatsapp-bot-termux",
  "version": "1.0.0",
  "description": "Bot WhatsApp grup",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@adiwajshing/baileys": "^5.39.2",
    "qrcode-terminal": "^0.12.0",
    "node-fetch": "^3.3.2"
  }
}
node_modules/
temp.jpg
auth.json
