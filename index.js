const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, // Indispensable pour détecter les départs
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ] 
});

// --- CONFIGURATION ---
const TOKEN = process.env.DISCORD_TOKEN; 
const MAIN_GUILD_ID = '1481781602508869775'; 

const ROLE_BIENVENUE_ID = '1481786857879634083'; 
const ROLE_ACCES_SALON = '1482132121635262534'; 

const WELCOME_CHANNELS = ['1481783282130747402', '1481783371133747280', '1481783380948418663'];
const SALON_ACCES_ID = '1481786737683333172'; 
const SALON_PURGE_ID = '1481786737683333172';

const REQUIRED_GUILDS = [
    '1348424569861570651', 
    '1480270184056098839', 
    '1452756361011134496'  
];
// ---------------------

client.once('ready', () => {
    console.log(`✅ Protect#0311 est opérationnel ! Surveillance des départs activée.`);
});

// GESTION DES ARRIVÉES
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== MAIN_GUILD_ID) return;

    // Rôle de base
    const welcomeRole = member.guild.roles.cache.get(ROLE_BIENVENUE_ID);
    if (welcomeRole) await member.roles.add(welcomeRole).catch(() => null);

    // Triple ping
    WELCOME_CHANNELS.forEach(id => {
        const ch = member.guild.channels.cache.get(id);
        if (ch) ch.send(`Bienvenue ${member} !`).then(m => setTimeout(() => m.delete().catch(() => null), 3000));
    });

    await checkAndGiveRole(member);
});

// --- NOUVEAU : GESTION DES DÉPARTS ---
client.on('guildMemberRemove', async (member) => {
    // Si le membre quitte l'un des serveurs requis
    if (REQUIRED_GUILDS.includes(member.guild.id)) {
        console.log(`⚠️ ${member.user.tag} a quitté un serveur partenaire (${member.guild.name}).`);
        
        const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
        if (!mainGuild) return;

        try {
            // On cherche le membre sur ton serveur principal
            const mainMember = await mainGuild.members.fetch(member.id).catch(() => null);
            
            if (mainMember && mainMember.roles.cache.has(ROLE_ACCES_SALON)) {
                await mainMember.roles.remove(ROLE_ACCES_SALON);
                console.log(`🚫 Rôle retiré à ${member.user.tag} car il n'est plus sur tous les serveurs.`);
            }
        } catch (e) {
            console.error("Erreur lors du retrait du rôle :", e);
        }
    }
});

// GESTION DES MESSAGES
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.channel.id === SALON_PURGE_ID) {
        setTimeout(() => message.delete().catch(() => null), 5000);
    }

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
