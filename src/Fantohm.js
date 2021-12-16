const puppeteer = require('puppeteer');
const CONSTANTS = require('./resources/constants.json');

let launchMethod = 1;

const processDashboardMetrics = (dashboardMetrics) => {
    const metrics = {
        price: '',
        apy: '',
        marketCap: '',
        totalCircSupply: '',
        tvl: '',
        fiveDayRate: '',
        stakedFHM: '',
        globalMarketcap: ''
    };

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

    return metrics;
}


const getProtocolMetricsFromWebUI = async () => {
    let browser;

    if (launchMethod === 1) {
        try {
            browser = await puppeteer.launch();
        }
        catch (error) {
            console.error(new Date() + " " + error);
            launchMethod = 2;
        }
    }

    if (launchMethod === 2) {
        browser = await puppeteer.launch({ executablePath: 'chromium-browser' });
    }

    const page = await browser.newPage();
    await page.goto(CONSTANTS.FHM_STATS_DASHBOARD_URL,
        {
            waitUntil: 'networkidle0',
            timeout: CONSTANTS.SCRAPER_PAGE_LOAD_TIMEOUT_MINS * 60 * 1000
        });

    let dashboardMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.MuiBox-root")).map(x => x.textContent)
    });

    const metrics = {};

    metrics.ftm = processDashboardMetrics(dashboardMetrics);

    await page.goto(CONSTANTS.FHM_STAKING_URL,
        {
            waitUntil: 'networkidle0',
            timeout: CONSTANTS.SCRAPER_PAGE_LOAD_TIMEOUT_MINS * 60 * 1000
        });

    let stakingMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.rebase-timer")).map(x => x.textContent)
    });

    metrics.ftm.rebaseEta = stakingMetrics[0].replace(" to next rebase", "");

    //Moonriver stats
    await page.goto(CONSTANTS.FHM_STATS_DASHBOARD_URL,
        {
            waitUntil: 'networkidle0',
            timeout: CONSTANTS.SCRAPER_PAGE_LOAD_TIMEOUT_MINS * 60 * 1000
        });

    await page.evaluate(() => {
        localStorage.setItem('defaultNetworkId', '1285');
    });

    await page.goto(CONSTANTS.FHM_STATS_DASHBOARD_URL,
        {
            waitUntil: 'networkidle0',
            timeout: CONSTANTS.SCRAPER_PAGE_LOAD_TIMEOUT_MINS * 60 * 1000
        });

    dashboardMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.MuiBox-root")).map(x => x.textContent)
    });

    metrics.moon = processDashboardMetrics(dashboardMetrics);


    await page.goto(CONSTANTS.FHM_STAKING_URL,
        {
            waitUntil: 'networkidle0',
            timeout: CONSTANTS.SCRAPER_PAGE_LOAD_TIMEOUT_MINS * 60 * 1000

        });

    stakingMetrics = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div.rebase-timer")).map(x => x.textContent)
    });

    metrics.moon.rebaseEta = stakingMetrics[0].replace(" to next rebase", "");

    await browser.close();
    return metrics;
};



module.exports = { getProtocolMetricsFromWebUI };