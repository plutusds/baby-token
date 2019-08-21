const { BN, constants, expectEvent, expectRevert, balance } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

const BabyToken = artifacts.require("BabyToken");

const MINT_AMOUNT = new BN('10').pow(new BN('18')).mul(new BN('2100000000'));
const zero = new BN('0');
const one = new BN('1');
const two = new BN('2');

contract('BabyToken', ([owner, user1, user2, user3, user4, ...otherAccounts]) => {
    var babyToken;

    before(async () => {
        babyToken = await BabyToken.deployed();
    });

    describe('deploy', function() {
        it('should be successfuly deployed', async () => {
            expect(babyToken).to.not.be.null;
            expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(MINT_AMOUNT);
            expect(await babyToken.totalSupply()).to.be.bignumber.equal(MINT_AMOUNT);
        });
    });

    describe('detail', function() {
        it('should be set details correctly', async () => {
            expect(await babyToken.name()).to.equal('BABYToken');
            expect(await babyToken.symbol()).to.equal('BABY');
            expect(await babyToken.decimals()).to.be.bignumber.equal(new BN("18"));
        });
    });

    describe('mint', function() {
        it('mint should be undefined', async () => {
            expect(babyToken.mint).to.be.undefined;
            expect(babyToken._mint).to.be.undefined;
        });
    });

    describe('pause', function() {
        it('should pause correctly', async () => {
            expect(await babyToken.paused()).to.be.false;
            await babyToken.pause({from: owner});
            expect(await babyToken.paused()).to.be.true;

            await expectRevert(
                babyToken.transfer(user1, one, {from: owner}),
                "Pausable: paused"
            );

            await babyToken.unpause({from: owner});
            expect(await babyToken.paused()).to.be.false;
        });

        it('should not be paused by non pauser ', async () => {
            await expectRevert(
                babyToken.pause({from: user4}),
                "PauserRole: caller does not have the Pauser role");

            expect(await babyToken.paused()).to.be.false;
        });

        it('should NOT change pauser by non pauser', async () => {
            await expectRevert(
                babyToken.addPauser(user4, {from: user1}),
                "PauserRole: caller does not have the Pauser role");
        });

        it('should add pauser correctly', async () => {
            await babyToken.addPauser(user4, {from: owner});
            await babyToken.pause({from: user4});
            expect(await babyToken.paused()).to.be.true;
        });

        it('should remove pauser correctly', async () => {
            await babyToken.renouncePauser({from: user4});
            await expectRevert(
                babyToken.unpause({from: user4}),
                "PauserRole: caller does not have the Pauser role");

            expect(await babyToken.paused()).to.be.true;

            await babyToken.unpause({from: owner});
            expect(await babyToken.paused()).to.be.false;
        });
    });

    describe('transfer', function() {
        let ownerBalance;
        let user1Balance;
        let user2Balance;
        let user3Balance;
        let user4Balance;

        let totalSupply;

        beforeEach(async () => {
            [ownerBalance, user1Balance, user2Balance, user3Balance, user4Balance, totalSupply] = 
                await Promise.all([
                    babyToken.balanceOf(owner),
                    babyToken.balanceOf(user1),
                    babyToken.balanceOf(user2),
                    babyToken.balanceOf(user3),
                    babyToken.balanceOf(user4),
                    babyToken.totalSupply()
                ]);
        });

        afterEach(async () => {
            expect(await babyToken.totalSupply()).to.be.bignumber.equal(totalSupply);
        });

        describe('basic', function() {
            it('should transfer token correctly', async () => {
                await babyToken.transfer(user1, one, {from: owner});
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
                expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(one));
            });

            it('should NOT transfer token more than balance', async () => {
                await expectRevert(
                    babyToken.transfer(user2, user1Balance.add(one), {from: user1}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.transfer(user2, MAX_UINT256, {from: user1}),
                    "SafeMath: subtraction overflow"
                );
                
                await expectRevert(
                    babyToken.transfer(user2, MAX_UINT256.sub(one), {from: user1}),
                    "SafeMath: subtraction overflow"
                );
                
                expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance);
                expect(await babyToken.balanceOf(user2)).to.be.bignumber.equal(user2Balance);
            });

            it('should transfer from approved user', async () =>{
                await babyToken.approve(user2, one, {from: owner});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);

                await babyToken.transferFrom(owner, user3, one, {from: user2});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(zero);

                expect(await babyToken.balanceOf(user2)).to.be.bignumber.equal(user2Balance);
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
                expect(await babyToken.balanceOf(user3)).to.be.bignumber.equal(user3Balance.add(one));
            });

            it('should NOT transfer from approved user more than allowances', async () =>{
                await babyToken.approve(user2, one, {from: owner});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);

                await expectRevert(
                    babyToken.transferFrom(owner, user3, two, {from: user2}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.transferFrom(owner, user3, MAX_UINT256, {from: user2}),
                    "SafeMath: subtraction overflow"
                );
                
                await expectRevert(
                    babyToken.transferFrom(owner, user3, MAX_UINT256.sub(one), {from: user2}),
                    "SafeMath: subtraction overflow"
                );
                
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);
            });

            it('should success to transfer token twice', async () =>{
                await Promise.all([
                    babyToken.transfer(user1, one, {from: owner}),
                    babyToken.transfer(user1, one, {from: owner})
                ]);
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(two));
                expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(two));
            });
        });

        describe('burn', function() {
            it('should burn correctly', async () => {
                await babyToken.burn(one, {from: owner});
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
                
                totalSupply = totalSupply.sub(one);
            });

            it('should NOT burn more than balance', async () => {
                await expectRevert(
                    babyToken.burn(ownerBalance.add(one), {from: owner}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.burn(MAX_UINT256, {from: owner}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.burn(MAX_UINT256.sub(one), {from: owner}),
                    "SafeMath: subtraction overflow"
                );

                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance);
            });

            it('should burn from approved user', async () =>{
                await babyToken.approve(user2, one, {from: owner});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);

                await babyToken.burnFrom(owner, one, {from: user2});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(zero);
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
                totalSupply = totalSupply.sub(one);
            });

            it('should NOT burn from approved user more than allowances', async () =>{
                await babyToken.approve(user2, one, {from: owner});
                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);

                await expectRevert(
                    babyToken.burnFrom(owner, two, {from: user2}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.burnFrom(owner, MAX_UINT256, {from: user2}),
                    "SafeMath: subtraction overflow"
                );

                await expectRevert(
                    babyToken.burnFrom(owner, MAX_UINT256.sub(one), {from: user2}),
                    "SafeMath: subtraction overflow"
                );

                expect(await babyToken.allowance(owner, user2, {from: owner})).to.be.bignumber.equal(one);
                expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance);
            });        

        });
    });

});



