const { ethers } = require("ethers");
const CONSTANTS = require('./resources/constants.json');

const provider = new ethers.providers.JsonRpcBatchProvider(CONSTANTS.FTM_RPC_URL);

const getCurrentBlockNumber = async () => {
    return provider.getBlockNumber();
}

const getAverageBlockTime = async () => {
    const currentBlockNumber = await getCurrentBlockNumber();

    const currentBlock = await provider.getBlock(currentBlockNumber);

    const oldBlock = await provider.getBlock(currentBlockNumber - 40000);

    return (currentBlock.timestamp - oldBlock.timestamp) / 40000;
}

module.exports = { getCurrentBlockNumber, getAverageBlockTime };