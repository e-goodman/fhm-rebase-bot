const { ethers } = require("ethers");
const fhmDaiSpookyLpABI = require('./resources/abi/fhmDaiSpookyLpABI.json');
const CONSTANTS = require('./resources/constants.json');
const CONTRACT_ADDRESSES = require('./resources/contractAddresses.json');

const provider = new ethers.providers.JsonRpcBatchProvider(CONSTANTS.FTM_RPC_URL);
const fhmDaiSpookyLpContract = new ethers.Contract(CONTRACT_ADDRESSES.FHM_DAI_SPOOKY_LP, fhmDaiSpookyLpABI, provider);

const getPrice = async () => {
    const res = await fhmDaiSpookyLpContract.getReserves();
    const r0 = res._reserve0;
    const r1 = res._reserve1;
    return Math.round(((r0.div(r1).toNumber() / Math.pow(10, CONSTANTS.DECIMALS_NINE)) + Number.EPSILON) * 100) / 100;
}

module.exports = { getPrice };