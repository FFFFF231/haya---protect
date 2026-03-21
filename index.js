const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
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
const WELCOME_CHANNELS = ['1481783380948418663', '1481783282130747402', '1481783371133747280'];
const SALON_SUCCESS_PING = '1481786658838941706'; 
const SALON_PURGE_ID = '1481786737683333172';    
const SALON_PREUVE_ID = '1482724596602900572';   
const SALON_PREMIUM_ID = '1482723967524667482'; 
const SALON_REGLEMENT_ID = '1482739767425630278';

// SERVEURS PARTENAIRES REQUIS
const REQUIRED_GUILDS = ['1348424569861570651', '1480270184056098839', '1452756361011134496'];

client.once('ready', () => {
    console.log(`✅ Protect#0311 est opérationnel !`);
    client.user.setActivity('Haya & Partenaires', { type: 3 });
});

// --- ARRIVÉE D'UN MEMBRE ---
client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== MAIN_GUILD_ID) return;
    try {
        const welcomeRole = member.guild.roles.cache.get(ROLE_BIENVENUE_ID);
        if (welcomeRole) await member.roles.add(welcomeRole);
    } catch (e) { console.error("❌ Erreur rôle bienvenue:", e); }

    WELCOME_CHANNELS.forEach(channelId => {
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
            channel.send(`Bienvenue ${member} !`).then(msg => {
                setTimeout(() => msg.delete().catch(() => null), 3000);
            });
        }
    });
    await checkAndGiveRole(member);
});

// --- DÉPART D'UN SERVEUR PARTENAIRE ---
client.on('guildMemberRemove', async (member) => {
    if (REQUIRED_GUILDS.includes(member.guild.id)) {
        const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
        if (!mainGuild) return;
        try {
            const mainMember = await mainGuild.members.fetch(member.id).catch(() => null);
            if (mainMember && mainMember.roles.cache.has(ROLE_ACCES_SALON)) {
                await mainMember.roles.remove(ROLE_ACCES_SALON);
                console.log(`🚫 Rôle retiré à ${member.user.tag} (quitté partenaire)`);
            }
        } catch (error) { console.error("❌ Erreur retrait rôle:", error); }
    }
});

// --- GESTION DES MESSAGES ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // AUTO-NETTOYAGE DU SALON (5 SEC)
    if (message.channel.id === SALON_PURGE_ID) {
        setTimeout(() => message.delete().catch(() => null), 5000);
    }

    // COMMANDE !CHECK
    if (message.content.toLowerCase() === '!check') {
        const reply = await message.reply("🔄 Vérification...");
        await checkAndGiveRole(message.member, message);
        setTimeout(() => reply.delete().catch(() => null), 3000);
    }

    // COMMANDES ADMINISTRATEUR
    if (message.member.permissions.has('Administrator')) {
        
        // !SETUP-REGLEMENT
        if (message.content.toLowerCase() === '!setup-reglement') {
            const regEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('📜・Règlement Haya')
                .setDescription(
                    `Afin de préserver une ambiance agréable et respectueuse, merci de lire attentivement ce règlement.\nToute participation au serveur implique l’acceptation de ces règles ainsi que des conditions officielles de Discord\n\n` +
                    `🚨 **Conditions d’utilisation (T.O.S.)**\nhttps://discord.com/terms\n\n` +
                    `🚨 **Règles de la communauté Discord**\nhttps://discord.com/guidelines\n\n` +
                    `📜 **Respect du staff**\nL’équipe Haya fait son possible pour offrir un environnement sain. Toute provocation ou irrespect envers le staff sera sanctionné.\n\n` +
                    `➣ **Responsabilité individuelle**\nTout comportement contraire aux règles de Discord (harcèlement, haine, contenus illégaux) entraînera une sanction sans avertissement.\n\n` +
                    `➣ **Respect et tolérance**\nAucun propos raciste, sexiste, homophobe ou discriminatoire ne sera toléré.\n\n` +
                    `➣ **Protection des données**\nLa divulgation d'informations personnelles est strictement interdite.\n\n` +
                    `➣ **Publicité et spam**\nLa publicité pour d'autres serveurs ou produits est interdite. Le spam sera sanctionné.\n\n` +
                    `➣ **Contenus NSFW ou sensibles**\nTout contenu pornographique, choquant ou violent est interdit sur l'ensemble du serveur.\n\n` +
                    `➣ **Signalement**\nSi vous constatez un problème, contactez immédiatement un membre du staff en MP.\n\n` +
                    `*Cordialement, l’équipe Haya*`
                );
            await message.channel.send({ embeds: [regEmbed] });
            message.delete().catch(() => null);
        }

        // !SETUP-INFO (TikTok)
        if (message.content.toLowerCase() === '!setup-info') {
            const infoEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('Tu veux les vidéos de toute les influenceuses, tiktok, snap et encore pleins d’autres contenu? suis juste les instructions :')
                .setDescription(`• Rend toi sur tiktok, cherche **« serveur discord br »** clique sur une vidéo au hasard puis écris dans les commentaire :\n\n> **« /fgMTVYKTXR meilleur serveur »** (ecris bien **/fgMTVYKTXR**) tu dois le faire sous 5 tiktoks différents et screen à chaque commentaire envoyer.\n> ou alors **boost 2 fois** le serveur et obtiens directement l'accès\n\n• une fois que tu as fais ça, envoie les preuves dans <#${SALON_PREUVE_ID}>`);
            await message.channel.send({ embeds: [infoEmbed] });
            message.delete().catch(() => null);
        }

        // !SETUP-PREMIUM (Premium)
        if (message.content.toLowerCase() === '!setup-premium') {
            const premiumEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('Accès Premium Illimité pour SEULEMENT 3€')
                .setDescription(`Débloque **TOUT** le contenu exclusif des créatrices les plus demandées : **Top Stars, Blondes, Brunes, Rousses, Métisses, MILF, Étudiantes, Curvy...**\n\n> **Des milliers de photos & vidéos en HD**\n> *Nouveaux ajouts tous les jours*\n> **Téléchargements illimités**\n> *Accès à vie (paiement unique)*\n\n➔ **Débloque maintenant : paypal ( en amis proche et en mettent ton nom d'utilisateur discord ) : @Mtztravox**`);
            await message.channel.send({ embeds: [premiumEmbed] });
            message.delete().catch(() => null);
        }
    }
});

// --- FONCTION DE VÉRIFICATION AVEC TRIPLE PING ---
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
                const channelsToPing = [SALON_SUCCESS_PING, SALON_PREUVE_ID, SALON_PREMIUM_ID];
                channelsToPing.forEach(channelId => {
                    const channel = member.guild.channels.cache.get(channelId);
                    if (channel) {
                        channel.send(`✅ ${member}, accès accordé (3/3 serveurs) ! 🔓`)
                            .then(m => setTimeout(() => m.delete().catch(() => null), 3000));
                    }
                });
            }
        }
    } else if (messageContext) {
        messageContext.channel.send(`❌ Tu n'es que sur ${count}/3 serveurs partenaires.`).then(m => setTimeout(() => m.delete().catch(() => null), 5000));
    }
}

client.login(TOKEN);
