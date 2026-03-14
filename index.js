const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, // Requis pour guildMemberAdd et guildMemberRemove
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ] 
});

// --- CONFIGURATION ---
const TOKEN = process.env.DISCORD_TOKEN; 
const MAIN_GUILD_ID = '1481781602508869775'; 

// RÔLES
const ROLE_BIENVENUE_ID = '1481786857879634083'; 
const ROLE_ACCES_SALON = '1482132121635262534'; 

// SALONS
const WELCOME_CHANNELS = ['1481783282130747402', '1481783371133747280', '1481783380948418663'];
const SALON_ACCES_ID = '1481786737683333172'; 
const SALON_PURGE_ID = '1481786737683333172';

// SERVEURS PARTENAIRES REQUIS
const REQUIRED_GUILDS = [
    '1348424569861570651', 
    '1480270184056098839', 
    '1452756361011134496'  
];
// ---------------------

client.once('ready', () => {
    console.log(`✅ Protect#0311 est opérationnel !`);
    console.log(`📡 Surveillance active sur le serveur principal : ${MAIN_GUILD_ID}`);
    client.user.setActivity('3 serveurs partenaires', { type: 3 });
});

// --- ÉVÉNEMENT : QUAND QUELQU'UN REJOINT ---
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== MAIN_GUILD_ID) return;

    // 1. Rôle de base (Bienvenue)
    try {
        const welcomeRole = member.guild.roles.cache.get(ROLE_BIENVENUE_ID);
        if (welcomeRole) await member.roles.add(welcomeRole);
    } catch (e) { console.error("❌ Erreur rôle bienvenue:", e); }

    // 2. Triple ping éphémère (3 sec)
    WELCOME_CHANNELS.forEach(channelId => {
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
            channel.send(`Bienvenue ${member} !`).then(msg => {
                setTimeout(() => msg.delete().catch(() => null), 3000);
            });
        }
    });

    // 3. Vérification automatique des serveurs
    await checkAndGiveRole(member);
});

// --- ÉVÉNEMENT : QUAND QUELQU'UN QUITTE UN SERVEUR ---
client.on('guildMemberRemove', async (member) => {
    // Si l'utilisateur quitte l'un des 3 serveurs partenaires
    if (REQUIRED_GUILDS.includes(member.guild.id)) {
        console.log(`⚠️ ${member.user.tag} a quitté le serveur partenaire : ${member.guild.name}`);
        
        const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
        if (!mainGuild) return;

        try {
            // On cherche le membre sur ton serveur principal
            const mainMember = await mainGuild.members.fetch(member.id).catch(() => null);
            
            // S'il est sur ton serveur et qu'il a le rôle spécial, on lui retire
            if (mainMember && mainMember.roles.cache.has(ROLE_ACCES_SALON)) {
                await mainMember.roles.remove(ROLE_ACCES_SALON);
                console.log(`🚫 Rôle retiré à ${member.user.tag} (Condition 3/3 non remplie)`);
            }
        } catch (error) {
            console.error("❌ Erreur lors du retrait automatique du rôle :", error);
        }
    }
});

// --- GESTION DES MESSAGES (PURGE + !CHECK) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // AUTO-NETTOYAGE DU SALON (5 SEC)
    if (message.channel.id === SALON_PURGE_ID) {
        setTimeout(() => {
            message.delete().catch(() => null);
        }, 5000);
    }

    // COMMANDE MANUELLE !CHECK
    if (message.content.toLowerCase() === '!check') {
        const reply = await message.reply("🔄 Vérification de tes accès en cours...");
        await checkAndGiveRole(message.member, message);
        setTimeout(() => reply.delete().catch(() => null), 3000);
    }
});

// --- FONCTION DE VÉRIFICATION ET ATTRIBUTION ---
async function checkAndGiveRole(member, messageContext = null) {
    let count = 0;
    
    for (const guildId of REQUIRED_GUILDS) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            // fetch() permet de vérifier même si le membre n'est pas dans le cache du bot
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
                    const pingMsg = await channel.send(`✅ ${member}, accès accordé (3/3 serveurs) ! 🔓`);
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
