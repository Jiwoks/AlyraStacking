const Dai = artifacts.require("./Dai.sol");
const { time, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Faucet Test Suite", accounts => {

    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];

    let instance;

    async function buildNewInstance () {
        instance = await Dai.new(web3.utils.toWei('100'), {from: owner});
    }

    describe('Test mint', function () {

        beforeEach(async () => {
            await buildNewInstance()
        });

        it('should mint', async () => {
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal('0');
            await instance.faucet({from: user1});
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal(web3.utils.toWei('1'));
        });

        it('should not allow to mint before 1 hour', async () => {
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal('0');
            await instance.faucet({from: user1});
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal(web3.utils.toWei('1'));
            expectRevert(instance.faucet({from: user1}), 'Can only mint 1 ether per hour');
            await time.increase(3500);
            expectRevert(instance.faucet({from: user1}), 'Can only mint 1 ether per hour');
            await instance.faucet({from: user2}); // Required to create a new block
            await time.increase(1000);
            await instance.faucet({from: user1});
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal(web3.utils.toWei('2'));
        });
    });
});
