const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ] 
});

// --- CONFIGURATION ---
const TOKEN = process.env.DISCORD_TOKEN; // Plus sécurisé ! = 'MTQ4MjEzMDczMDUyNzIzMjAwMA.GhE136.COH0bn0cm8V1NeamOiyblNPKeXbSZZmAgty5BI'; 
const MAIN_GUILD_ID = '1481781602508869775'; 

// RÔLES
const ROLE_BIENVENUE_ID = '1481786857879634083'; 
const ROLE_ACCES_SALON = '1482132121635262534'; 

// SALONS PING BIENVENUE (3 SEC)
const WELCOME_CHANNELS = [
    '1481783282130747402',
    '1481783371133747280',
    '1481783380948418663'
];

// SALON RÉUSSITE VÉRIF (3 SEC)
const SALON_ACCES_ID = '1481786737683333172'; 

// SALON AUTO-NETTOYAGE (5 SEC)
const SALON_PURGE_ID = '1481786737683333172';

// SERVEURS PARTENAIRES
const REQUIRED_GUILDS = [
    '1348424569861570651', 
    '1480270184056098839', 
    '1452756361011134496'  
];
// ---------------------

client.once('clientReady', () => {
    console.log(`✅ Protect#0311 est prêt et surveille les salons !`);
});

// GESTION DES ARRIVÉES
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== MAIN_GUILD_ID) return;

    // 1. Rôle de base
    try {
        const welcomeRole = member.guild.roles.cache.get(ROLE_BIENVENUE_ID);
        if (welcomeRole) await member.roles.add(welcomeRole);
    } catch (e) { console.error("Erreur rôle bienvenue:", e); }

    // 2. Triple ping éphémère
    WELCOME_CHANNELS.forEach(channelId => {
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
            channel.send(`Bienvenue ${member} !`).then(msg => {
                setTimeout(() => msg.delete().catch(() => null), 3000);
            });
        }
    });

    // 3. Vérification automatique
    await checkAndGiveRole(member);
});

// GESTION DES MESSAGES (COMMANDES + AUTO-PURGE)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // ACTION : AUTO-NETTOYAGE DU SALON SPÉCIFIQUE (5 SEC)
    if (message.channel.id === SALON_PURGE_ID) {
        setTimeout(() => {
            message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
        }, 5000);
    }

    // COMMANDE !CHECK
    if (message.content.toLowerCase() === '!check') {
        const reply = await message.reply("🔄 Vérification en cours...");
        await checkAndGiveRole(message.member, message);
        setTimeout(() => reply.delete().catch(() => null), 3000);
    }
});

async function checkAndGiveRole(member, messageContext = null) {
    let count = 0;
    for (const guildId of REQUIRED_GUILDS) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            const isPresent = await guild.members.fetch(member.id).catch(() => null);
            if (isPresent) count++;
        }
    }

    if (count === REQUIRED_GUILDS.length) {
        if (!member.roles.cache.has(ROLE_ACCES_SALON)) {
            const role = member.guild.roles.cache.get(ROLE_ACCES_SALON);
            if (role) {
                await member.roles.add(role);
                const channel = member.guild.channels.cache.get(SALON_ACCES_ID);
                if (channel) {
                    const pingMsg = await channel.send(`✅ ${member}, accès accordé !`);
                    setTimeout(() => pingMsg.delete().catch(() => null), 3000);
                }
            }
        }
    } else if (messageContext) {
        messageContext.channel.send(`❌ Tu n'es que sur ${count}/3 serveurs partenaires.`)
            .then(m => setTimeout(() => m.delete().catch(() => null), 5000));
    }
}

client.login(TOKEN);