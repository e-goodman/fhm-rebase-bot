const { Client, Intents, MessageEmbed, CommandInteractionOptionResolver } = require('discord.js');
const fs = require('fs');

const { token } = require('./config.json');

const CONSTANTS = require('./resources/constants.json');

const Fantohm = require('./Fantohm');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

let guildMember = null;

let clientReady = false;
let clientBusy = false;

const STATS_MSG_ID_FILE_PATH = './data/statsMsgId';

let statsMsgId;

client.login(token);


const getStatsMsgID = () => {

    try {
        if (fs.existsSync(STATS_MSG_ID_FILE_PATH)) {
            return fs.readFileSync(STATS_MSG_ID_FILE_PATH, 'utf8')
        }
    }
    catch (error) {
        console.error("error in getStatsMsgID(): " + error)
    }
};

const writeStatsMsgID = (msgID) => {
    fs.writeFile(STATS_MSG_ID_FILE_PATH, msgID, err => {
        if (err) {
            console.error("Error writing stats message id to " + STATS_MSG_ID_FILE_PATH
                + " " + err);
            return false;
        }
        return true;
    })
}


const prieDisplayUpdateInterval = CONSTANTS.POLL_RATE_MINS * 60 * 1000;
let oldRebaseEta = null;
let oldPrice = null;

const updatePriceBotDisplay = async () => {
    try {
        console.debug("\n updatePriceBotDisplay **************")
        if (clientReady && !clientBusy) {
            const metrics = await Fantohm.getProtocolMetricsFromWebUI();

            clientBusy = true;

            if (oldRebaseEta !== metrics.rebaseEta) {
                oldRebaseEta = metrics.rebaseEta;

                const res = client.user.setActivity('Rebase ' + metrics.rebaseEta, { type: 'WATCHING' });

                console.debug("update sent!, res:", res);
            }

            if (oldPrice !== metrics.price) {
                oldPrice = metrics.price;

                const res = await guildMember.setNickname(metrics.price + ghostEmoji + " FHM");
                console.debug("update sent!, res:", res);
            }

        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        clientBusy = false;
    }


    setTimeout(updatePriceBotDisplay, prieDisplayUpdateInterval);
};


const updatingStatsFeed = false;

const ghostEmoji = String.fromCodePoint(0x1F47B);
const pushPinEmoji = String.fromCodePoint(0x1F4CC);
const moneyMouthEmoji = String.fromCodePoint(0x1F911);
const moneyBagEmoji = String.fromCodePoint(0x1F4B0);

let statsChannel;

const statsFeedUpdateInterval = CONSTANTS.DASHBOARD_REFRESH_RATE_MINS * 60 * 1000;
const updateStatsFeedChannel = async () => {
    try {
        console.debug("\n updateStatsFeedChannel **************")

        if (clientReady && !updatingStatsFeed) {
            const metrics = await Fantohm.getProtocolMetricsFromWebUI();
            console.debug("metrics: ", metrics);

            const statsEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL('https://discord.js.org/')
                .setAuthor('Fantohm Dashboard (' + ghostEmoji + ',' + ghostEmoji + ')', 'https://www.fantohm.com/logo.png', 'https://discord.js.org')
                .setDescription('This data is updated every ' + CONSTANTS.DASHBOARD_REFRESH_RATE_MINS + " mins!")
                .setThumbnail('https://www.fantohm.com/logo.png')
                .addFields(
                    { name: pushPinEmoji + ' Overview', value: 'For more stats visit [Fantohm DAO Dashboard](' + CONSTANTS.FHM_STATS_DASHBOARD_URL + ')' },
                    { name: 'Market Cap', value: metrics.marketCap, inline: true },
                    { name: 'Price' + moneyMouthEmoji, value: metrics.price, inline: true },
                    { name: 'Circulating Supply', value: metrics.totalCircSupply, inline: true },
                    { name: pushPinEmoji + 'Staking(' + ghostEmoji + ',' + ghostEmoji + ')', value: 'How to stake on FantOHM DAO? easy  ,[Click here to read the official doc](' + CONSTANTS.FHM_STAKING_GUIDE_URL + ')', inline: false },
                    { name: 'APY ' + moneyBagEmoji, value: metrics.apy, inline: true },
                    { name: 'Total Value Locked', value: metrics.tvl, inline: true },
                    { name: 'ROI (5 Day Rate)', value: metrics.fiveDayRate, inline: true },
                    { name: pushPinEmoji + 'Bonding(1,1)', value: 'How to bond on FantOHM DAO? easy too ,[Click here to read the official doc](' + CONSTANTS.FHM_BONDING_GUIDE_URL + ')', inline: false },
                    { name: 'Staked FHM' + moneyBagEmoji, value: metrics.stakedFHM, inline: true },
                    { name: 'Price Chart', value: '[Click Here](' + CONSTANTS.CHART_URL + ')', inline: true },
                    { name: 'Global Market Cap', value: metrics.globalMarketcap, inline: true },
                )

                .setTimestamp()
                .setFooter('FHM DAO', 'https://www.fantohm.com/logo.png');

            if (statsMsgId) {
                const statsEmbedMsg = await statsChannel.messages.fetch(statsMsgId);
                console.debug("statsEmbedMsg:", statsEmbedMsg);

                await statsEmbedMsg.edit({ embeds: [statsEmbed] })
            }
            else {
                const statsMsgId = (await statsChannel.send({ embeds: [statsEmbed] })).id;
                writeStatsMsgID(statsMsgId);
            }

            setTimeout(updateStatsFeedChannel, statsFeedUpdateInterval);
        }
    }
    catch (error) {
        console.debug(error)
    }
}

const init = async () => {
    statsMsgId = getStatsMsgID();

    console.debug("statsMsgId:", statsMsgId);
    client.once('ready', async () => {

        guildMember = await client.guilds.cache.first().me;
        statsChannel = client.channels.cache.find(channel => channel.name === "stats-feed");
        console.debug("statsChannel:", statsChannel);

        clientReady = true;

        console.debug("Client Ready");
        updatePriceBotDisplay();
        if (statsChannel) {
            updateStatsFeedChannel();
        }
    });
}

init();
