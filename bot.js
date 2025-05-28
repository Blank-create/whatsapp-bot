const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot running'));
app.listen(process.env.PORT || 10000, '0.0.0.0', () => console.log('Server on port', process.env.PORT || 10000));

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'whatsbot' }),
    webVersionCache: { type: 'none' },
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true }
});

client.on('qr', (qr) => {
    console.log('Scanne ce QR code avec ton WhatsApp :');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot connecté !');
});

client.on('message_create', async (msg) => {
    console.log('Message reçu :', msg.body, 'de :', msg.from);
    if (!msg.body || msg.body === 'Y’a kongossa pour vous @tagall') return;
    if (msg.body.toLowerCase().includes('@tagall')) {
        try {
            const chat = await msg.getChat();
            if (chat.isGroup) {
                const validMentions = chat.participants
                    .map(p => p.id._serialized)
                    .filter(id => id && (id.endsWith('@c.us') || id.endsWith('@lid')));
                if (!validMentions.length) {
                    await msg.reply('Erreur : Aucun membre valide.');
                    return;
                }
                await chat.sendMessage('Y’a kongossa pour vous @tagall', {
                    quotedMessageId: msg.id._serialized,
                    mentions: validMentions
                });
                console.log('Réponse envoyée avec', validMentions.length, 'mentions');
            } else {
                await msg.reply('Commande uniquement pour groupes !');
            }
        } catch (error) {
            console.log('Erreur @tagall :', error);
            await msg.reply('Erreur !');
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Déconnecté :', reason);
    setTimeout(() => client.initialize(), 5000);
});

client.initialize();
