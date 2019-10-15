const { BN, constants, expectEvent, expectRevert, balance, time } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

const BabyToken = artifacts.require("BabyToken");
const TokenTimelock = artifacts.require("TokenTimelock");

const MINT_AMOUNT = new BN('10').pow(new BN('18')).mul(new BN('2100000000'));
const zero = new BN('0');
const one = new BN('1');

contract('TokenTimelock', ([owner, user1, user2, user3, user4, ...otherAccounts]) => {
    let babyToken;

    let ownerBalance;
    let user1Balance;
    let user2Balance;
    let user3Balance;
    let user4Balance;

    let totalSupply;
    before(async () => {
        babyToken = await BabyToken.deployed();
    });

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

    it('normal success flow', async () => {
        let startTs = await time.latest();

        let timelock = await TokenTimelock.new(babyToken.address, user1, startTs.add(new BN('100')));
        await babyToken.transfer(timelock.address, one, {from: owner});

        expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(one);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance);

        await time.increase(time.duration.seconds(100));
        await timelock.release();

        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(zero);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(one));
    });

    it('early release is not allowed', async () => {
        let startTs = await time.latest();

        let timelock = await TokenTimelock.new(babyToken.address, user1, startTs.add(new BN('100')));
        await babyToken.transfer(timelock.address, one, {from: owner});

        expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(one);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance);

        await time.increase(time.duration.seconds(90));
        await expectRevert(timelock.release(), 'TokenTimelock: current time is before release time');

        await time.increase(time.duration.seconds(10));
        await timelock.release();
        
        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(zero);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(one));
    });

    it('lazy release is allowed', async () => {
        let startTs = await time.latest();

        let timelock = await TokenTimelock.new(babyToken.address, user1, startTs.add(new BN('100')));
        await babyToken.transfer(timelock.address, one, {from: owner});

        expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(one);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance);

        await time.increase(time.duration.years(10000));
        await timelock.release();

        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(zero);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(one));
    });

    it('everybody can release', async () => {

        function getRandomUser() {
            let users = [owner, user1, user2, user3, user4];
            return users[Math.floor(Math.random()*users.length)];
        }

        let startTs = await time.latest();

        let timelock = await TokenTimelock.new(babyToken.address, user1, startTs.add(new BN('100')));
        await babyToken.transfer(timelock.address, one, {from: owner});

        expect(await babyToken.balanceOf(owner)).to.be.bignumber.equal(ownerBalance.sub(one));
        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(one);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance);

        await time.increase(time.duration.seconds(100));
        await timelock.release({from: getRandomUser()});

        expect(await babyToken.balanceOf(timelock.address)).to.be.bignumber.equal(zero);
        expect(await babyToken.balanceOf(user1)).to.be.bignumber.equal(user1Balance.add(one));
    });
});
