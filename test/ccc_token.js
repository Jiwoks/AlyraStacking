const CCCToken = artifacts.require("./CCCToken.sol");
const { BN, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("CCCToken Test Suite", accounts => {

    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    let instance;
    const tokenConfig = {
        name: 'Caribou Crew Coin',
        symbol: 'CCC',
        decimal: 18
    }

    async function buildNewInstance () {
        instance = await CCCToken.new(new BN(10), {from: owner});
    }

    describe('Test for creation', function () {

        before(async () => {
            await buildNewInstance()
        });

        it('should create token with name ' + tokenConfig.name, async () => {
            expect( await instance.name() ).to.be.equal( tokenConfig.name );
        });
        it('should create token with symbol ' + tokenConfig.symbol, async () => {
            expect( await instance.symbol() ).to.be.equal( tokenConfig.symbol );
        });
        it('should create token with ' + tokenConfig.decimal + ' decimals', async () => {
            expect( await instance.decimals() ).to.be.bignumber.equal( new BN(tokenConfig.decimal) );
        });
        it('should create token with initial supply', async () => {
            expect (await instance.totalSupply() ).to.be.bignumber.equal( new BN(10) );
            expect( await instance.balanceOf(owner) ).to.be.bignumber.equal( new BN(10) );
        });
        it('should create token with initial supply transfered to owner', async () => {
            expect( await instance.balanceOf(owner) ).to.be.bignumber.equal( new BN(10) );
        });
    });

    describe('Test for allowed / revoked admins', function () {

        before(async () => {
            await buildNewInstance()
        });

        it('should revert allowAdmin from not owner caller', async () => {
            await expectRevert( instance.allowAdmin(user1, {from: user1}), 'Ownable: caller is not the owner' );
        });
        it('should revert revokeAdmin from not owner caller', async () => {
            await expectRevert( instance.revokeAdmin(user1, {from: user1}), 'Ownable: caller is not the owner' );
        });
        it('should reject for self revoked (owner)', async () => {
            await expectRevert( instance.revokeAdmin(owner, {from: owner}), 'Not allowed to self revoke');
        });
        it('should emit "AdminAllowed" event for new allowed admin', async () => {
            expectEvent( await instance.allowAdmin(user2, {from: owner}), 'AdminAllowed', {admin: user2} )
        });
        it('should emit "AdminRevoked" event for revoked admin', async () => {
            expectEvent( await instance.revokeAdmin(user2, {from: owner}), 'AdminRevoked', {admin: user2} )
        });
    });

    describe('Test minting', function () {

        before(async () => {
            await buildNewInstance()
        });

        it('should revert for not allowed admin', async () => {
            await expectRevert(instance.mint(20, {from: user1}), 'Not allowed');
        });

        it('should allow owner', async () => {
            const totalSupply = new BN(await instance.totalSupply());
            await instance.mint(20, {from: owner});
            expect(await instance.totalSupply()).to.be.bignumber.equal(totalSupply.add(new BN(20)));
            expect(await instance.balanceOf(owner)).to.be.bignumber.equal(new BN(30));
        });

        it('should allow admin', async () => {
            const totalSupply = new BN(await instance.totalSupply());
            await instance.allowAdmin(user1);
            await instance.mint(40, {from: user1});
            expect(await instance.totalSupply()).to.be.bignumber.equal(totalSupply.add(new BN(40)));
            expect(await instance.balanceOf(user1)).to.be.bignumber.equal(new BN(40));
        });

        it('should reject for revoked admin', async () => {
            await instance.revokeAdmin(user1);
            await expectRevert( instance.mint(20, {from: user1}), 'Not allowed' );
        });
    });
});
