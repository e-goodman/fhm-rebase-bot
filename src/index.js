const { Client, Intents, MessageEmbed } = require('discord.js');

const { token } = require('./config.json');

const CONSTANTS = require('./resources/constants.json');

const RebaseTimer = require('./RebaseTimer');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

let guildMember = null;

let clientReady = false;
let clientBusy = false;

client.login(token);

const init = async () => {
    client.once('ready', async () => {

        guildMember = await client.guilds.cache.first().me;
        client.user.setActivity('Rebase Timer', { type: 'WATCHING' });


        clientReady = true;

        console.debug("Client Ready");
        main();
    });
}

const interval = CONSTANTS.POLL_RATE_MINS * 60 * 1000;
let oldRebaseDateString = null;

const main = async () => {
    try {
        if (clientReady && !clientBusy) {

            clientBusy = true;
            let rebaseDate = await RebaseTimer.getRebaseDate();
            let currentDate = new Date();

            let minutesToRebase = Math.abs(rebaseDate - currentDate) / 60000;
            console.debug("minutesToRebase:", minutesToRebase);

            let hours = Math.floor(minutesToRebase / 60);
            let minutes = Math.floor(minutesToRebase % 60);

            const rebaseDateString = ((hours === 0) ? "" : hours + " hrs, ") + minutes + " mins";

            if (oldRebaseDateString !== rebaseDateString) {
                oldRebaseDateString = rebaseDateString;
                console.debug(1);
                const res = await guildMember.setNickname(rebaseDateString);
                console.debug("update sent!, res:", res);
            }
            console.debug("rebaseDate:", rebaseDateString);
        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        clientBusy = false;
    }


    setTimeout(main, interval);
};


init();
main();
