'use strict';

require('dotenv').config();

const ganache = require('ganache-core');
const ethers = require('ethers');

const server = ganache.server({
    accounts: [{
        secretKey: Buffer.from(process.env.PRIVATE_KEY, 'hex'),
        balance: ethers.utils.parseEther('100').toString(),
    }],
    logger: console,
    // debug: true,
    // verbose: false,
    fork: process.env.RPC + process.env.INFURA_ID,
    //unlocked_accounts: ,
    port: 8546,
});

server.listen(process.env.GANACHE_PORT, (err, blockchain) => {
    if (err) {
        console.warn(err);
        process.exit();
    }

    console.log(`ganache listening on port ${process.env.GANACHE_PORT}...`);
});
