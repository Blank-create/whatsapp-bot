const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    webVersionCache: { type: 'none' },
    authStrategy: new LocalAuth({ clientId: 'whatsbot' })
});

client.on('qr', (qr) => {
    console.log('Scanne ce QR code avec ton WhatsApp :');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot connecté !');
});

client.on('message_create', async (msg) => {
    console.log('Message reçu :', msg.body, 'de :', msg.from, 'envoyé par :', msg.author || msg.from);
    console.log('Contenu brut du message :', JSON.stringify(msg.body));
    console.log('Type de message :', msg.type);
    if (!msg.body) {
        console.log('Message ignoré (pas de contenu)');
        return;
    }
    // Éviter la boucle infinie
    if (msg.body === 'Y’a kongossa pour vous @tagall') {
        console.log('Message ignoré (réponse du bot)');
        return;
    }
    if (msg.body.toLowerCase().includes('@tagall')) {
        console.log('Commande @tagall détectée');
        try {
            const chat = await msg.getChat();
            if (chat.isGroup) {
                console.log('C’est un groupe ! Participants :', chat.participants.length);
                const participants = chat.participants;
                const validMentions = participants
                    .map(p => p.id._serialized)
                    .filter(id => id && (id.endsWith('@c.us') || id.endsWith('@lid')));
                console.log('Mentions valides :', validMentions.length);
                if (validMentions.length === 0) {
                    await msg.reply('Erreur : Aucun membre valide à taguer.');
                    return;
                }
                await chat.sendMessage('Y’a kongossa pour vous @tagall', {
                    quotedMessageId: msg.id._serialized,
                    mentions: validMentions
                });
                console.log('Réponse envoyée avec', validMentions.length, 'mentions');
            } else {
                console.log('Ce n’est pas un groupe');
                await msg.reply('Cette commande ne fonctionne que dans un groupe !');
            }
        } catch (error) {
            console.log('Erreur dans @tagall :', error.message);
            await msg.reply('Une erreur s’est produite !');
        }
    } else {
        console.log('Aucune commande @tagall détectée dans :', msg.body);
    }
});

client.on('disconnected', (reason) => {
    console.log('Bot déconnecté :', reason);
    client.initialize();
});

client.initialize();
