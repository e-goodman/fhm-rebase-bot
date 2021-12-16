const { Client, Intents, MessageEmbed, CommandInteractionOptionResolver } = require('discord.js');
const fs = require('fs');
const _ = require('lodash');

const { token } = require('./config.json');

const CONSTANTS = require('./resources/constants.json');

const Fantohm = require('./Fantohm');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

let guildMember = null;

let clientReady = false;

const STATS_MSG_ID_FILE_PATH = './statsMsgId';

let statsMsgId;



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
let updatingPriceBotDisplay = false;

let priceBotDisplayErrCount = 0;
let oldFtmMetrics;
let oldMoonMetrics;


const checkValues = (obj, oldMetrics) => {
    Object.keys(obj).forEach((k) => {
        obj[k] = obj[k] ? obj[k] : (oldMetrics[k] ? oldMetrics[k] : 'N/A');
    });
    return obj;
};

const updatePriceBotDisplay = async () => {
    try {
        console.debug("\n" + new Date() + " updatePriceBotDisplay **************")

        if (clientReady && !updatingPriceBotDisplay) {
            let metrics;
            try {
                metrics = await Fantohm.getProtocolMetricsFromWebUI();
            }
            catch (error) {
                console.error("Error fetching metrics from web UI ", error);
                return;
            }

            const fantomMetrics = checkValues(metrics.ftm, oldFtmMetrics);
            oldFtmMetrics = _.cloneDeep(metrics.ftm);

            updatingPriceBotDisplay = true;

            if (oldRebaseEta !== fantomMetrics.rebaseEta) {
                oldRebaseEta = fantomMetrics.rebaseEta;

                await client.user.setActivity('Rebase ' + fantomMetrics.rebaseEta, { type: 'WATCHING' });

                console.debug("\n " + new Date() + " rebase eta update sent! \n");
            }

            if (oldPrice !== fantomMetrics.price) {
                oldPrice = fantomMetrics.price;

                return await guildMember.setNickname(fantomMetrics.price + ghostEmoji + " FHM");
            }

        }
        setTimeout(updatePriceBotDisplay, prieDisplayUpdateInterval);

    }
    catch (error) {
        console.error(new Date() + " " + error);
        priceBotDisplayErrCount++;
        if (priceBotDisplayErrCount < CONSTANTS.MAX_RETRY_COUNT + 1) {
            await new Promise((resolve) => setTimeout(resolve, CONSTANTS.ERROR_WAIT_MINS * 60 * 1000));
            setTimeout(updatePriceBotDisplay, prieDisplayUpdateInterval);
            console.debug("priceBotDisplayErrCount:" + priceBotDisplayErrCount + " max:" + CONSTANTS.MAX_RETRY_COUNT);
        }
    }
    finally {
        updatingPriceBotDisplay = false;
    }
};


let updatingStatsFeed = false;

const ghostEmoji = String.fromCodePoint(0x1F47B);
const pushPinEmoji = String.fromCodePoint(0x1F4CC);
const moneyMouthEmoji = String.fromCodePoint(0x1F911);
const moneyBagEmoji = String.fromCodePoint(0x1F4B0);

let statsChannel;

const statsFeedUpdateInterval = CONSTANTS.DASHBOARD_REFRESH_RATE_MINS * 60 * 1000;

let statsFeedDisplayErrCount = 0;
const updateStatsFeedChannel = async () => {
    try {
        console.debug("\n" + new Date() + " updateStatsFeedChannel **************")

        if (clientReady && !updatingStatsFeed) {
            updatingStatsFeed = true;
            let metrics;

            try {
                metrics = await Fantohm.getProtocolMetricsFromWebUI();
            }
            catch (error) {
                console.error("Error fetching metrics from web UI ", error);
                return;
            }

            const fantomMetrics = checkValues(metrics.ftm, oldFtmMetrics);
            const moonRiverMetrics = checkValues(metrics.moon, oldMoonMetrics);

            oldFtmMetrics = _.cloneDeep(metrics.ftm);
            oldMoonMetrics = _.cloneDeep(metrics.moon);

            const statsEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setURL('https://discord.js.org/')
                .setAuthor('Fantohm Dashboard (' + ghostEmoji + ',' + ghostEmoji + ')', 'https://www.fantohm.com/logo.png', 'https://www.fantohm.com/')
                .setDescription('This data is updated every ' + CONSTANTS.DASHBOARD_REFRESH_RATE_MINS + " mins!")
                .setThumbnail('https://www.fantohm.com/logo.png')
                .addFields(
                    {
                        name: pushPinEmoji + ' Overview', value: 'For more stats visit [Fantohm DAO Dashboard](' + CONSTANTS.FHM_STATS_DASHBOARD_URL + ')'
                            + ' \n\n(F)antom and (M)oonriver stats'
                    },
                    { name: 'Market Cap(F)', value: fantomMetrics.marketCap, inline: true },
                    { name: 'Price (F)' + moneyMouthEmoji, value: fantomMetrics.price, inline: true },
                    { name: 'Circulating Supply(F)', value: fantomMetrics.totalCircSupply, inline: true },
                    { name: 'Market Cap (M)', value: moonRiverMetrics.marketCap, inline: true },
                    { name: 'Price (M)' + moneyMouthEmoji, value: moonRiverMetrics.price, inline: true },
                    { name: 'Circulating Supply(M)', value: moonRiverMetrics.totalCircSupply, inline: true },
                    { name: pushPinEmoji + 'Staking(' + ghostEmoji + ',' + ghostEmoji + ')', value: 'How to stake on FantOHM DAO? easy  ,[Click here to read the official doc](' + CONSTANTS.FHM_STAKING_GUIDE_URL + ')', inline: false },
                    { name: 'APY (F)' + moneyBagEmoji, value: fantomMetrics.apy, inline: true },
                    { name: 'Total Value Locked (F)', value: fantomMetrics.tvl, inline: true },
                    { name: 'ROI (5 Day Rate) (F)', value: fantomMetrics.fiveDayRate, inline: true },
                    { name: 'APY (M)' + moneyBagEmoji, value: moonRiverMetrics.apy, inline: true },
                    { name: 'Total Value Locked (M)', value: moonRiverMetrics.tvl, inline: true },
                    { name: 'ROI (5 Day Rate) (M)', value: moonRiverMetrics.fiveDayRate, inline: true },
                    { name: pushPinEmoji + 'Bonding(1,1)', value: 'How to bond on FantOHM DAO? easy too ,[Click here to read the official doc](' + CONSTANTS.FHM_BONDING_GUIDE_URL + ')', inline: false },
                    { name: 'Staked FHM (F)' + moneyBagEmoji, value: fantomMetrics.stakedFHM, inline: true },
                    { name: 'Staked FHM (M)' + moneyBagEmoji, value: moonRiverMetrics.stakedFHM, inline: true },
                    { name: 'Price Chart ', value: '[Click Here](' + CONSTANTS.CHART_URL + ')', inline: true },
                    { name: 'Global Market Cap ', value: fantomMetrics.globalMarketcap, inline: true },
                )

                .setTimestamp()
                .setFooter('FHM DAO', 'https://www.fantohm.com/logo.png');

            if (statsMsgId) {
                const statsEmbedMsg = await statsChannel.messages.fetch(statsMsgId);
                await statsEmbedMsg.edit({ embeds: [statsEmbed] })
            }
            else {
                statsMsgId = (await statsChannel.send({ embeds: [statsEmbed] })).id;
                writeStatsMsgID(statsMsgId);
            }

            setTimeout(updateStatsFeedChannel, statsFeedUpdateInterval);
        }
    }
    catch (error) {
        console.debug(new Date() + " " + error);
        statsFeedDisplayErrCount++;
        if (statsFeedDisplayErrCount < CONSTANTS.MAX_RETRY_COUNT + 1) {
            await new Promise((resolve) => setTimeout(resolve, CONSTANTS.ERROR_WAIT_MINS * 60 * 1000));
            setTimeout(updatePriceBotDisplay, prieDisplayUpdateInterval);
            console.debug("\n statsFeedDisplayErrCount:" + statsFeedDisplayErrCount + " max:" + CONSTANTS.MAX_RETRY_COUNT);
        }
    }
    finally {
        updatingStatsFeed = false;
    }
}

client.login(token);

const init = async () => {

    statsMsgId = getStatsMsgID();

    console.debug(new Date() + " statsMsgId:", statsMsgId);
    client.once('ready', async () => {

        guildMember = await client.guilds.cache.first().me;
        statsChannel = client.channels.cache.find(channel => channel.name === CONSTANTS.DASH_CHANNEL_NAME);
        console.debug("\n" + new Date() + " statsChannel:", statsChannel + "\n");

        clientReady = true;

        console.debug(new Date() + "Client Ready");
        updatePriceBotDisplay();
        if (statsChannel) {
            updateStatsFeedChannel();
        }
    });
}

init();


