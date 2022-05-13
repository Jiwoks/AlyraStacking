const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
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
    const daiAggregator = accounts[2];
    const xtzAggregator = accounts[4];
    let instance;
    let rewardToken;
    const rewardPerSecond = 10;

    async function buildNewInstance () {
        const i = await Stacking.new(rewardToken.address, {from: owner});
        await rewardToken.allowAdmin(i.address, {from: owner});
        return i;
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
            await expectRevert( instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: user1}), 'Ownable: caller is not the owner' );
        });
        it('should reject for token already added', async function () {
            result = await instance.createPool(dai, daiAggregator, rewardPerSecond, {from: owner});
            await expectRevert( instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner}), 'Token already attached' );
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
            await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
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

    describe('Public: Test address balance', function () {

        before(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 1000, {from: user3});
            await instance.deposit(dai, 1000, {from: user3});
        });

        it('should reject for token not yet attached', async function () {
            await expectRevert( instance.balanceOf(xtz, {from: user1}), 'Token not yet allowed' );
        });
        it('should return 0 for token not yet deposited', async function () {
            const balance = await instance.balanceOf(dai, {from: user1});
            expect(new BN(balance)).to.be.bignumber.equal(new BN(0));
        });
        it('should return 0 for new account', async function () {
            const balance = await instance.balanceOf(dai, {from: user2});
            expect(new BN(balance)).to.be.bignumber.equal(new BN(0));
        });
        it('should return account balance', async function () {
            const balance = await instance.balanceOf(dai, {from: user3});
            expect(new BN(balance)).to.be.bignumber.equal(new BN(1000));
        });

    });

    describe('Public: Test for tvl by token', function () {

        before(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 100000, {from: user1});
            await daiToken.approve(instance.address, 100000, {from: user2});
            await instance.deposit(dai, 1000, {from: user1});
        });

        it('should return 0 tvl for new token attached', async function () {
            const tvl = await instance.tvlOf(xtz);
            expect(new BN(tvl)).to.be.bignumber.equal(new BN(0));
        });
        it('should return real tvl for token with tokens with deposits', async function () {
            const tvl = await instance.tvlOf(dai);
            expect(new BN(tvl)).to.be.bignumber.equal(new BN(1000));
        });
        it('should return real tvl for token with multiple deposits', async function () {
            await instance.deposit(dai, 500, {from: user1});
            const tvl1 = await instance.tvlOf(dai, {from: owner});
            await instance.deposit(dai, 2000, {from: user2});
            const tvl2 = await instance.tvlOf(dai, {from: owner});
            expect(new BN(tvl1)).to.be.bignumber.equal(new BN(1500));
            expect(new BN(tvl2)).to.be.bignumber.equal(new BN(3500));
        });
    });

    describe('Public: Test to withdraw tokens', function () {

        before(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
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
            const balanceBefore = new BN(await instance.balanceOf(dai, {from: user1}));
            await instance.withdraw(dai, 100, {from: user1});
            const balanceAfter = new BN(await instance.balanceOf(dai, {from: user1}));
            expect(balanceBefore.sub(balanceAfter)).to.be.bignumber.equal(new BN(100));
        });
        it('should decrease tvl', async function () {
            const tvlBefore = new BN(await instance.tvlOf(dai));
            await instance.withdraw(dai, 100, {from: user1});
            const tvlAfter = new BN(await instance.tvlOf(dai));
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

    describe.only('Public: Test for claimable rewards', function () {

        let previousBalance;
        let poolStartedAt;

        function evalRewards (nbSeconds) {
            return nbSeconds * rewardPerSecond;
        }

        beforeEach(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            const tx = await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
            poolStartedAt = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
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
                await instance.deposit(dai, 1000, {from: user1});
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                console.log('poolStartedAt', poolStartedAt, 'duration', duration);
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration)));
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
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration)));
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
                await instance.deposit(dai, 1000, {from: user1});
                await instance.deposit(dai, 1000, {from: user2});
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 2));
            });
            it('should return rewards for user 2 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 2));
            });
            it('should return rewards for user 1 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 2));
            });
            it('should return rewards for user 2 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 2));
            });
        });

        describe('tvl: user1 (1/3) | user2 (2/3)', () => {
            beforeEach(async () => {
                await instance.deposit(dai, 333, {from: user1});
                await instance.deposit(dai, 666, {from: user2});
            });

            it('should return rewards for user 1 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 3));
            });
            it('should return rewards for user 2 after 1 hour', async () => {
                await time.increase(time.duration.hours(1));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) * 2 / 3));
            });
            it('should return rewards for user 1 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user1);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) / 3));
            });
            it('should return rewards for user 2 after 10 hours', async () => {
                await time.increase(time.duration.hours(10));
                const claimable = await instance.claimable(dai, user2);
                const duration = await time.latest() - poolStartedAt;
                expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration) * 2 / 3 ));
            });
        });

        describe('tvl: user1 (100%)', () => {
            beforeEach(async () => {
                await instance.deposit(dai, 1000, {from: user1});
            });

            it('should decrease rewards remaining after a previous claimed', async () => {
                await time.increase(time.duration.hours(1));

                const i = await instance.accounts(user1, dai);

                // console.log({balance : new BN(i.balance).toString(), rewardDebt: new BN(i.rewardDebt).toString(), rewardPending: new BN(i.rewardPending).toString()});

                // await instance.claim(dai);
                // const latest = await time.latest();
                // await time.increase(time.duration.hours(2));
                // const claimable = await instance.claimable(dai, user1);
                // const duration = await time.latest() - latest;
                // expect(claimable).to.be.bignumber.equal(new BN(evalRewards(duration)));
            });

        });
    });

    describe('Public: Test to claim rewards', function () {

        beforeEach(async () => {
            instance = await buildNewInstance();
            await rewardToken.transfer(instance.address, new BN(1000000000));
            await instance.createPool(dai, daiAggregator, rewardPerSecond, 'DAI', {from: owner});
            await daiToken.approve(instance.address, 1000, {from: user1});
            await daiToken.approve(instance.address, 1000, {from: user2});
        });

        function evalRewards (nbSeconds) {
            return nbSeconds * rewardPerSecond;
        }

        describe('should transfer rewards for 1 hour with 1 account inside the pool', () => {

            before(async () => {
                const previousBalance = new BN(await rewardToken.balanceOf(user1));
                await instance.deposit(dai, 1000, {from: user1});
                await time.increase(time.duration.hours(1));
            })

            it('should claimable', async function () {

                // expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600)));
                await instance.withdraw(dai, 1000, {from: user1});
                const newBalance = new BN(await rewardToken.balanceOf(user1));
                expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
                expect(newBalance.sub(previousBalance)).to.be.bignumber.equal(new BN(evalRewards(3600) ));
            });
        });


        it('should transfer rewards for 1 hour with 2 accounts inside the pool as equal percent', async function () {
            const previousBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const previousBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            await instance.deposit(dai, 1000, {from: user1});
            await instance.deposit(dai, 1000, {from: user2});
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600)/2));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600)/2));
            await instance.withdraw(dai, 1000, {from: user1});
            await instance.withdraw(dai, 1000, {from: user2});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(0)));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(0)));
            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(new BN(evalRewards(3600) / 2 ));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(new BN(evalRewards(3600) / 2 ));
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
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600)));
            await instance.deposit(dai, 1000, {from: user2});
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600 + 3600 / 2)));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600 / 2)));
            await instance.withdraw(dai, 1000, {from: user1});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600 / 2)));
            await time.increase(time.duration.hours(1));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600/2 + 3600)));
            await instance.withdraw(dai, 1000, {from: user2});
            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(0));
            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));
            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(new BN(evalRewards(3600) + evalRewards(3600) / 2 ));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(new BN(evalRewards(3600) + evalRewards(3600) / 2 ));
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

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600)));

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

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600 + 3600 * 2 / 3)));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600 / 3)));

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

            expect(await instance.claimable(dai, user1)).to.be.bignumber.equal(new BN(evalRewards(3600 / 2)));
            expect(await instance.claimable(dai, user2)).to.be.bignumber.equal(new BN(evalRewards(3600 / 3 + 3600 / 2)));

            await instance.withdraw(dai, 500, {from: user2});
            // user1 pendingReward 3600 / 2
            // user1 balance 500
            // user2 pendingReward 0
            // user2 balance 0

            const newBalanceUser1 = new BN(await rewardToken.balanceOf(user1));
            const newBalanceUser2 = new BN(await rewardToken.balanceOf(user2));

            expect(newBalanceUser1.sub(previousBalanceUser1)).to.be.bignumber.equal(
                new BN(
                        evalRewards(3600)                        // h0->h1: user1 = 100%                user2 = 0
                        + (evalRewards(3600) * 2 / 3)            // h1->h2: user1 = 2/3                 user2 = 1/3
                        + (0)                                             // h2->h3: user1 = 1/2 (not claimed)   user2 = 1/2    => rewards are not claimed
            ));
            expect(newBalanceUser2.sub(previousBalanceUser2)).to.be.bignumber.equal(
                new BN(
                        0                                                 // h0->h1: user1 = 100%                user2 = 0
                        + (evalRewards(3600) * 1 / 3)            // h1->h2: user1 = 2/3                 user2 = 1/3
                        + (evalRewards(3600)  / 2 )              // h2->h3: user1 = 1/2 (not claimed)   user2 = 1/2
                        + (0 )              // h3->h4: user1 = 1/2                 user2 = 1/2 (not claimed)
            ));
        });
    })
});
