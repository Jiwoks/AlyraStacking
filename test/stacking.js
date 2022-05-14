const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const Dai = artifacts.require("./Dai.sol");
const Xtz = artifacts.require("./Xtz.sol");
const { BN, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const {duration} = require("@openzeppelin/test-helpers/src/time");
const {web3} = require("@openzeppelin/test-helpers/src/setup");

contract("Stacking Test Suite", accounts => {

    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    let daiToken, dai, xtzToken, xtz;
    let daiAggregator;
    let mockOracle;
    let instance;
    let rewardToken;
    const rewardPerSecond = 10;
    const oracleDecimals = 12;

    async function buildNewInstance () {
        const i = await Stacking.new(rewardToken.address, {from: owner});
        await rewardToken.allowAdmin(i.address, {from: owner});
        mockOracle = await MockOracle.new( '12', '1', 'Mock Oracle');
        daiAggregator = mockOracle.address;
        return i;
    }

    function evalRewards (nbSeconds, coeff = 1, debug = false) {
        debug ? console.debug({
            nbSeconds: nbSeconds,
            rewardPerSecond: rewardPerSecond,
            coeff: coeff
        }) : undefined;
        return (new BN(nbSeconds * rewardPerSecond)).mul( new BN( coeff * 1e8)).div(new BN(1e8));
    }

    async function debugPool(token) {
        const pool = (await instance.pools(dai));
        console.debug('pool', {
            oracle: pool.oracle,
            balance: pool.balance.toNumber(),
            rewardPerShare: pool.rewardPerShare.toString(),
            rewardPerSecond: pool.rewardPerSecond.toNumber(),
            lastRewardBlock: pool.lastRewardBlock.toNumber()
        });
    }

    before(async () => {
        rewardToken = await CCCToken.new(new BN(1000000000000), {from: owner});
        daiToken = await Dai.deployed();
        xtzToken = await Xtz.deployed();
        dai = daiToken.address;
        xtz = xtzToken.address;
        await daiToken.transfer(user1, 1000000);
        await daiToken.transfer(user2, 1000000);
        await daiToken.transfer(user3, 1000000);
        await xtzToken.transfer(user1, 1000000);
        await xtzToken.transfer(user2, 1000000);
        await xtzToken.transfer(user3, 1000000);
    });

    // it('only for duration tests', async () => {
    //     instance = await buildNewInstance();
    //     await rewardToken.transfer(instance.address, new BN(1000000000));
    //     const tx = await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
    //     const jsPoolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
    //     await daiToken.approve(instance.address, 1000, {from: user1});
    //     await daiToken.approve(instance.address, 1000, {from: user2});
    //     await instance.deposit(dai, 1000, {from: user1});
    //     await instance.deposit(dai, 1000, {from: user2});
    //
    //     await time.increase(time.duration.hours(10));
    //     const solidityEndedAt = await instance.claimable(dai, user1);
    //     const jsEndedAt = (await web3.eth.getBlock('latest')).timestamp;
    //     const solidityPoolStartedAt = (await instance.pools(dai)).lastRewardBlock;
    //     console.log('eval duration from js:', {
    //         startedAt: jsPoolStartedAt,
    //         endedAt: jsEndedAt
    //     });
    //     console.log('eval duration from solidity:', {
    //         startedAt: solidityPoolStartedAt.toNumber(),
    //         endedAt: solidityEndedAt.toNumber()
    //     })
    //     expect(jsPoolStartedAt).to.be.equal(solidityPoolStartedAt.toNumber());
    //     expect(jsEndedAt).to.be.equal(solidityEndedAt.toNumber());
    // })

    describe('Test for basics mechanims', function () {
        it('should be valid to test basics mechanims', () => {
            expect(true).to.be.true;
        });
        it('should create a new contract instance', async function () {
            const instance = await buildNewInstance();
            expect(instance.address).to.be.not.null;
        });
    })

    describe('Owner: Test to attach tokens', function () {

        let result;

        before(async () => {
            instance = await buildNewInstance();
        });

        it('should reject for not owner caller', async function () {
            await expectRevert( instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: user1}), 'Ownable: caller is not the owner' );
        });
        it('should reject for token already added', async function () {
            result = await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, {from: owner});
            await expectRevert( instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner}), 'Token already attached' );
        });
        it('should emit PoolCreated event', async function () {
            expectEvent( result, 'PoolCreated', {token: dai, oracle: daiAggregator} );
        });
    });

    describe('Public: Test to deposit tokens', function () {

        before(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
        });

        it('should reject for negatif amount', async function () {
            await expectRevert( instance.deposit(dai, -10, {from: user1}), 'value out-of-bounds (argument="_amount", value=-10, code=INVALID_ARGUMENT' );
        });
        it('should reject for tokens not allowed', async function () {
            await expectRevert( instance.deposit(dai, 100, {from: user1}), 'Token not yet allowed' );
        });
        it('should reject for null amount', async function () {
            await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner});
            await expectRevert( instance.deposit(dai, 0, {from: user1}), 'Only not null amount' );
        });
        it('should accept uint parameter and previously allowed token addresses only', async function () {
            await daiToken.approve(instance.address, 100, {from: user1});
            const tx = await instance.deposit(dai, 100, {from: user1});
            expect(tx.address).to.be.not.null;
        });
        it('should deposit amount from account to sc', async function () {
            const balanceBefore = new BN(await daiToken.balanceOf(user1));
            await daiToken.approve(instance.address, 100, {from: user1});
            await instance.deposit(dai, 100, {from: user1});
            const balanceAfter = new BN(await daiToken.balanceOf(user1));
            expect(balanceBefore.sub(balanceAfter)).to.be.bignumber.equal(new BN(100));
        });
        it('should emit "Deposit" event', async function () {
            await daiToken.approve(instance.address, 100, {from: user1});
            expectEvent(
                await instance.deposit(dai, 100, {from: user1}),
                'Deposit',
                {token: dai, account: user1, amount: new BN(100)}
            );
        });

    });

    describe('Public: Test to withdraw tokens', function () {

        before(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 1000, {from: user1});
            await instance.deposit(dai, 1000, {from: user1});
        });

        it('should reject for negatif amount', async function () {
            await expectRevert( instance.withdraw(dai, -10, {from: user1}), 'value out-of-bounds (argument="_amount", value=-10, code=INVALID_ARGUMENT' );
        });
        it('should reject for token not yet attached', async function () {
            await expectRevert( instance.withdraw(xtz, 100, {from: user1}), 'Token not yet allowed' );
        });
        it('should reject for amount upper than user sold', async function () {
            await expectRevert( instance.withdraw(dai, 1001, {from: user1}), 'Insufficient balance' );
        });
        it('should decrease account balance', async function () {

            const user1AccDaiBefore = await instance.accounts(user1, daiToken.address);
            const user1AccDaiBalanceBefore = new BN(user1AccDaiBefore['balance']);

            await instance.withdraw(dai, 100, {from: user1});

            const user1AccDaiAfter = await instance.accounts(user1, daiToken.address);
            const user1AccDaiBalanceAfter = new BN(user1AccDaiAfter['balance']);

            expect(user1AccDaiBalanceBefore.sub(user1AccDaiBalanceAfter)).to.be.bignumber.equal(new BN(100));
        });
        it('should decrease tvl', async function () {
            const daiPoolBefore = await instance.pools(daiToken.address);
            const tvlBefore = new BN (daiPoolBefore['balance']);

            await instance.withdraw(dai, 100, {from: user1});

            const daiPoolAfter = await instance.pools(daiToken.address);
            const tvlAfter = new BN (daiPoolAfter['balance']);

            expect(tvlBefore.sub(tvlAfter)).to.be.bignumber.equal(new BN(100));
        });
        it('should withdraw amount from sc to account', async function () {
            const balanceBefore = new BN(await daiToken.balanceOf(user1));
            await instance.withdraw(dai, 100, {from: user1});
            const balanceAfter = new BN(await daiToken.balanceOf(user1));
            expect(balanceAfter.sub(balanceBefore)).to.be.bignumber.equal(new BN(100));
        });
        it('should emit "Withdraw" event', async function () {
            expectEvent(
                await instance.withdraw(dai, 100, {from: user1}),
                'Withdraw',
                {token: dai, account: user1, amount: new BN(100)}
            );
        });

    });

    describe('Public: Test for claimable rewards', function () {

        let previousBalance;
        let poolStartedAt;

        beforeEach(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 1000, {from: user1});
            await daiToken.approve(instance.address, 1000, {from: user2});

            const previousBalance = new BN(await rewardToken.balanceOf(user1));
        });


        describe('tvl: user1 (0%)', () => {
            it('should return null for user with null balance', async () => {
                expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            });
            it('should return null for user with null balance after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            });
            it('should return null for user with null balance after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            });

        });

        describe('tvl: user1 (100%)', () => {

            beforeEach(async () => {
                const tx = await instance.deposit(dai, 1000, {from: user1});
                poolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration));
            });
            it('should return rewards for user 2 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(0));
            });
            it('should return rewards for user 1 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration));
            });
            it('should return rewards for user 2 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(0));
            });
        });

        describe('tvl: user1 (50%) | user2 (50%)', () => {
            beforeEach(async () => {
                const tx = await instance.deposit(dai, 1000, {from: user1});
                await instance.deposit(dai, 1000, {from: user2});
                poolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, .5));
            });
            it('should return rewards for user 2 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, .5));
            });
            it('should return rewards for user 1 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, .5));
            });
            it('should return rewards for user 2 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, .5));
            });
        });

        describe('tvl: user1 (1/3) | user2 (2/3)', () => {

            beforeEach(async () => {
                const tx = await instance.deposit(dai, 333, {from: user1});
                await instance.deposit(dai, 666, {from: user2});
                poolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, 333 / 999));
            });
            it('should return rewards for user 2 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, 666 / 999));
            });
            it('should return rewards for user 1 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, 333 / 999));
            });
            it('should return rewards for user 2 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration, 666 / 999));
            });
        });

        describe('tvl: user1 (100%)', () => {
            beforeEach(async () => {
                const tx = await instance.deposit(dai, 1000, {from: user1});
                poolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
            });

            it('should decrease rewards remaining after a previous claimed', async () => {
                await time.increase(time.duration.hours(1));
                await instance.claim(dai, {from: user1});
                const latest = await time.latest();
                await time.increase(time.duration.hours(2));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - latest;
                expect(claimable).to.be.bignumber.equal(evalRewards(duration));
            });

        });
    });

    describe('Public: Test to claim rewards', function () {

        beforeEach(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 1000, {from: user1});
            await daiToken.approve(instance.address, 1000, {from: user2});
        });

        it('should transfer rewards for 1 hour with 1 account inside the pool', async () => {

            const previousBalance = new BN(await rewardToken.balanceOf(user1));
            await instance.deposit(dai, 1000, {from: user1});
            await time.increase(time.duration.hours(1));

            // expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600)));
            await instance.withdraw(dai, 1000, {from: user1});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600));
            await instance.claim(dai, {from: user1});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            const newBalance = new BN(await rewardToken.balanceOf(user1));
            expect(newBalance.sub(previousBalance)).to.be.bignumber.equal(evalRewards(3600));
        });


        it('should transfer rewards for 1 hour with 2 accounts inside the pool as equal percent', async function () {
            const previousBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const previousBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            await instance.deposit(dai, 1000, {from: user1});
            await instance.deposit(dai, 1000, {from: user2});
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600, .5));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600, .5));
            await instance.withdraw(dai, 1000, {from: user1});
            await instance.withdraw(dai, 1000, {from: user2});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600, .5));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600, .5));
            await instance.claim(dai, {from: user1});
            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            await instance.claim(dai, {from: user2});
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(evalRewards(3600, .5));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(evalRewards(3600, .5));
        });
        it('should transfer rewards for 1 hour with 2 accounts inside the pool as equal percent but with different deposit and withdraw timestamp', async function () {
            /*
                h0: user1 deposit 1000dai
                h1: user2 deposit 1000dai
                h2: user1 withdraw 1000dai
                h3: user2 withdraw 1000dai
             */
            const previousBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const previousBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            await instance.deposit(dai, 1000, {from: user1});
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600));
            await instance.deposit(dai, 1000, {from: user2});
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600 + 3600 / 2));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600 / 2));
            await instance.withdraw(dai, 1000, {from: user1});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600 + 3600 / 2));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600 / 2));
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600/2 + 3600));
            await instance.withdraw(dai, 1000, {from: user2});
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600/2 + 3600));
            await instance.claim(dai, {from: user1});
            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            await instance.claim(dai, {from: user2});
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(evalRewards(3600 + 3600 / 2));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(evalRewards(3600 + 3600 / 2));
        });
        it('should transfer rewards for 1 hour with 2 accounts inside the pool as different percent and different deposit and withdraw timestamp', async function () {
            /*
                h0: user1 deposit 1000dai   => tvl: 1000
                h1: user2 deposit 500dai    => tvl: 1500
                h2: user1 withdraw 500dai   => tvl: 1000
                h3: user2 withdraw 500dai   => tvl: 500
             */
            const previousBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const previousBalanceUser2 = new BN(await rewardToken.balanceOf(user2));

            // Deposit user1 1000
            await instance.deposit(dai, 1000, {from: user1});
            // user1 pendingReward 0
            // user1 balance 1000
            // user2 pendingReward 0
            // user2 balance 0

            // Forward 1 hour
            await time.increase(time.duration.hours(1));
            // user1 pendingReward 3600
            // user1 balance 1000
            // user2 pendingReward 0
            // user2 balance 0

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600));

            // Deposit user2 1500
            await instance.deposit(dai, 500, {from: user2});
            // user1 pendingReward 3600
            // user1 balance 1000
            // user2 pendingReward 0
            // user2 balance 500

            // Forward 1 hour
            await time.increase(time.duration.hours(1));
            // user1 pendingReward 3600 + 3600 * 2/3
            // user1 balance 1000
            // user2 pendingReward 3600 / 3
            // user2 balance 500

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(3600 + 3600 * 2 / 3));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3600 / 3));

            // Withdraw user 1 500
            await instance.withdraw(dai, 500, {from: user1});
            // user1 pendingReward
            // user1 balance 500
            // user2 pendingReward 3600 / 3
            // user2 balance 500

            // Forward 1 hour
            await time.increase(time.duration.hours(1));
            // user1 pendingReward 3600 / 2
            // user1 balance 500
            // user2 pendingReward 3600 / 3 + 3600 / 2
            // user2 balance 500

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(evalRewards(7800)); // 3600 + 3600 * 2 / 3 + 3600 / 2
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(evalRewards(3000)); // 3600 / 3 + 3600 / 2

            await instance.withdraw(dai, 500, {from: user2});
            // user1 pendingReward 3600 / 2
            // user1 balance 500
            // user2 pendingReward 0
            // user2 balance 0

            await instance.claim(dai, {from: user1});
            await instance.claim(dai, {from: user2});

            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));

            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(evalRewards(7800));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(evalRewards(3000));
        });
    });

    describe('Public: getDataFeed', function () {

        it('should return the correct oracle price', async function () {
            instance = await buildNewInstance();
            await instance.createPool(dai, daiAggregator, oracleDecimals, rewardPerSecond, 'DAI', {from: owner});
            await mockOracle.setData(web3.utils.toWei('2000'));
            const result = await instance.getDataFeed(dai);
            expect(result.price).to.be.bignumber.equal(web3.utils.toWei('2000'));
            expect(result.decimals).to.be.bignumber.equal('12');
        });
    });
});
