const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot running'));
app.listen(process.env.PORT || 10000, '0.0.0.0', () => console.log('Server on port', process.env.PORT || 10000));

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'whatsbot', dataPath: './.wwebjs_auth' }),
    webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html' },
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true }
});

client.on('qr', (qr) => {
    console.log('Scanne ce QR code avec ton WhatsApp :');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot connecté !');
});

client.on('message', async (msg) => {
    console.log('Message reçu :', msg.body, 'de :', msg.from, 'type :', msg.type, 'chatId :', msg.id.remote);
    if (!msg.body) {
        console.log('Message ignoré : pas de contenu');
        return;
    }
    if (msg.body === 'Y’a kongossa pour vous @tagall') {
        console.log('Message ignoré : réponse du bot');
        return;
    }
    if (msg.body.toLowerCase().includes('@tagall')) {
        console.log('Commande @tagall détectée');
        try {
            const chat = await msg.getChat();
            console.log('Chat :', chat.isGroup ? 'Groupe' : 'Privé', 'ID :', chat.id._serialized);
            if (chat.isGroup) {
                const validMentions = chat.participants
                    .map(p => p.id._serialized)
                    .filter(id => id && id.endsWith('@c.us'));
                console.log('Participants :', chat.participants.length, 'Mentions valides :', validMentions.length);
                if (!validMentions.length) {
                    await msg.reply('Erreur : Aucun membre valide à taguer.');
                    console.log('Aucun membre à taguer');
                    return;
                }
                await chat.sendMessage('Y’a kongossa pour vous @tagall', {
                    quotedMessageId: msg.id._serialized,
                    mentions: validMentions
                });
                console.log('Réponse envoyée avec', validMentions.length, 'mentions');
            } else {
                await msg.reply('Commande uniquement pour groupes !');
                console.log('Message ignoré : chat non-groupe');
            }
        } catch (error) {
            console.log('Erreur @tagall :', error.message);
            await msg.reply('Erreur !');
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Déconnecté :', reason);
    try {
        const authPath = path.join(__dirname, '.wwebjs_auth');
        if (fs.existsSync(authPath)) {
            const files = fs.readdirSync(authPath, { recursive: true });
            for (const file of files) {
                const fullPath = path.join(authPath, file);
                if (fs.lstatSync(fullPath).isFile()) {
                    fs.unlinkSync(fullPath);
                }
            }
            fs.rmdirSync(authPath, { recursive: true });
            console.log('Session supprimée');
        }
    } catch (error) {
        console.log('Erreur suppression session :', error.message);
    }
    setTimeout(() => client.initialize(), 5000);
});

client.initialize();
