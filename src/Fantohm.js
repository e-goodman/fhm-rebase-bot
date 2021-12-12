const puppeteer = require('puppeteer');
const CONSTANTS = require('./resources/constants.json');

const getProtocolMetricsFromWebUI = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(CONSTANTS.FHM_STATS_DASHBOARD_URL,
        {
            waitUntil: 'networkidle0',

        });

    //await delay(3);

    await page.screenshot({ path: "res.png" });

    const dashboardMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.metric")).map(x => x.textContent)
    });

    const metrics = {};

    dashboardMetrics.forEach(x => {
        if (!metrics.price && x.startsWith("Market Price")) {
            metrics.price = x.replace("Market Price", "");
        }
        else if (!metrics.apy && x.startsWith("APY")) {
            metrics.apy = x.replace("APY", "");
        }
        else if (!metrics.marketCap && x.startsWith("Market Cap")) {
            metrics.marketCap = x.replace("Market Cap", "");
        }
        else if (!metrics.totalCircSupply && x.startsWith("Circulating Supply (total)")) {
            metrics.totalCircSupply = x.replace("Circulating Supply (total)", "")
        }
        else if (!metrics.tvl && x.startsWith("TVL")) {
            metrics.tvl = x.replace("TVL", "");
        }
        else if (!metrics.fiveDayRate && x.startsWith("5-Day Rate")) {
            metrics.fiveDayRate = x.replace("5-Day Rate", "");
        }
        else if (!metrics.stakedFHM && x.startsWith("Staked FHM")) {
            metrics.stakedFHM = x.replace("Staked FHM", "");
        }
        else if (!metrics.globalMarketcap && x.startsWith("Global Market Cap")) {
            metrics.globalMarketcap = x.replace("Global Market Cap", "");
        }
    });

    await page.goto(CONSTANTS.FHM_STAKING_URL,
        {
            waitUntil: 'networkidle0',

        });

    const stakingMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.rebase-timer")).map(x => x.textContent)
    });

    metrics.rebaseEta = stakingMetrics[0].replace(" to next rebase", "");

    await browser.close();
    return metrics;
};

getProtocolMetricsFromWebUI();

module.exports = { getProtocolMetricsFromWebUI };