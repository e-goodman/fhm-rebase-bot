const { ethers } = require("ethers");
const Fantom = require('./Fantom');
const CONSTANTS = require('./resources/constants.json');
const CONTRACT_ADDRESSES = require('./resources/contractAddresses.json');

const fhmStakingABI = require('./resources/abi/fhmStakingABI.json');

const provider = new ethers.providers.JsonRpcBatchProvider(CONSTANTS.FTM_RPC_URL);
const fhmStakingContract = new ethers.Contract(CONTRACT_ADDRESSES.FHM_STAKING, fhmStakingABI, provider);

const getRebaseDate = async () => {
    let rebaseDate = null;

    const epoch = await fhmStakingContract.epoch();
    const endBlock = (epoch['endBlock']).toNumber();

    const currentBlock = await Fantom.getCurrentBlockNumber();

    const blocksAway = endBlock - currentBlock;

    const secondsToRebase = (blocksAway * await Fantom.getAverageBlockTime());

    rebaseDate = new Date();
    rebaseDate.setSeconds(rebaseDate.getSeconds() + secondsToRebase);

    return rebaseDate;
}

module.exports = { getRebaseDate };
