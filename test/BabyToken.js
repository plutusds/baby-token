const BabyToken = artifacts.require("BabyToken");

function strToBN(n) {
    return new web3.utils.BN(n.toString());
}
/*
toBN(99, 1)  => 990
toBN(99, 0)  => 99
toBN(0, 0)   => 0
toBN(99, 18) => 99000000000000000000
*/
function toBN(n, unit=0) {
    if (n == 0) {
        unit = 0;
    }

    return strToBN(n.toString() + "0".repeat(unit));
}

function eq(bn1, bn2) {
    if (bn1.eq(bn2)) {
        return true;
    } else {
        return false;
    }
}

async function assertThrow(promise, includedMessage, message="Not throwing exception") {
    let errorMessage;

    try {
        await promise;
    } catch(e) {
        errorMessage = e.toString();
        // console.log(errorMessage);
    }
    if (errorMessage && errorMessage.includes(includedMessage))
        return;
    else
        assert(false, message);
}

contract('Utils', (accounts) => {
    it('toBN', () => {
        assert(eq(toBN(99, 1), strToBN("990")));
        assert(eq(toBN(99, 0), strToBN("99")));
        assert(eq(toBN(0, 0), strToBN("0")));
        assert(eq(toBN(0, 1), strToBN("0")));
        assert(eq(toBN(99, 18), strToBN("99000000000000000000")));

        assert.throws(() => toBN(99,-1));
    });    
});

const one = toBN(1);
const two = toBN(2);
const zero = toBN(0);
const uintMax = strToBN("115792089237316195423570985008687907853269984665640564039457584007913129639935");

const MINT_AMOUNT = toBN(2100000000, 18);

contract('BabyToken', (accounts) => {
    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const user4 = accounts[4];

    var babyToken;

    let ownerBalance;
    let user1Balance;
    let user2Balance;
    let user3Balance;
    let user4Balance;

    let balanceSum;

    before(async () => {
        babyToken = await BabyToken.deployed();
    });

    beforeEach(async () => {
        [ownerBalance, user1Balance, user2Balance, user3Balance, user4Balance] = 
            await Promise.all([
                babyToken.balanceOf(owner),
                babyToken.balanceOf(user1),
                babyToken.balanceOf(user2),
                babyToken.balanceOf(user3),
                babyToken.balanceOf(user4)
            ]);
        balanceSum = ownerBalance.add(user1Balance.add(user2Balance.add(user3Balance.add(user4Balance))));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });

    it('should be successfuly deployed', async () => {
        assert(babyToken != null);
        assert(eq(ownerBalance, MINT_AMOUNT));
        assert(eq(await babyToken.totalSupply(), MINT_AMOUNT));
    });

    /*
        detail
    */
    it('should be set details correctly', async () => {
        assert.equal(await babyToken.name(), "BABYToken");
        assert.equal(await babyToken.symbol(), "BABY");
        assert(eq(await babyToken.decimals(), toBN("18")));
    });

    /*
        mint
    */
    it('should not be able to mint', async () => {
        assert(! babyToken.mint);
        assert(! babyToken._mint);
    });

    /*
        pause
    */
    it('should pause correctly', async () => {
        assert(! await babyToken.paused());
        await babyToken.pause({from: owner});
        assert(await babyToken.paused());

        await assertThrow(
            babyToken.transfer(user1, one, {from: owner}),
            "Pausable: paused");

        await babyToken.unpause({from: owner});
        assert(! await babyToken.paused());
    });

    it('should not be paused by non pauser ', async () => {
        await assertThrow(
            babyToken.pause({from: user4}),
            "PauserRole: caller does not have the Pauser role");

        assert(! await babyToken.paused());
    });

    it('should NOT change pauser by non pauser', async () => {
        await assertThrow(
            babyToken.addPauser(user4, {from: user1}),
            "PauserRole: caller does not have the Pauser role");
    });

    it('should add pauser correctly', async () => {
        await babyToken.addPauser(user4, {from: owner});
        await babyToken.pause({from: user4})
        assert(await babyToken.paused());
    });

    it('should remove pauser correctly', async () => {
        await babyToken.renouncePauser({from: user4});
        await assertThrow(
            babyToken.unpause({from: user4}),
            "PauserRole: caller does not have the Pauser role");

        assert(await babyToken.paused());

        await babyToken.unpause({from: owner});
        assert(! await babyToken.paused());        
    });

    /*
        transfer
    */
    it('should transfer token correctly', async () => {
        await babyToken.transfer(user1, one, {from: owner});
        assert(eq(await babyToken.balanceOf(owner), ownerBalance.sub(one)));
        assert(eq(await babyToken.balanceOf(user1), user1Balance.add(one)));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });

    it('should NOT transfer token more than balance', async () => {
        await assertThrow(
            babyToken.transfer(user2, user1Balance.add(one), {from: user1}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.transfer(user2, uintMax, {from: user1}),
            "SafeMath: subtraction overflow"
        );
        
        await assertThrow(
            babyToken.transfer(user2, uintMax.sub(one), {from: user1}),
            "SafeMath: subtraction overflow"
        );
        
        assert(eq(await babyToken.balanceOf(user1), user1Balance));
        assert(eq(await babyToken.balanceOf(user2), user2Balance));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });

    it('should transfer from approved user', async () =>{
        await babyToken.approve(user2, one, {from: owner});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));

        await babyToken.transferFrom(owner, user3, one, {from: user2});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), zero));

        assert(eq(await babyToken.balanceOf(user2), user2Balance));
        assert(eq(await babyToken.balanceOf(owner), ownerBalance.sub(one)));
        assert(eq(await babyToken.balanceOf(user3), user3Balance.add(one)));
    });

    it('should NOT transfer from approved user more than allowances', async () =>{
        await babyToken.approve(user2, one, {from: owner});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));

        await assertThrow(
            babyToken.transferFrom(owner, user3, two, {from: user2}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.transferFrom(owner, user3, uintMax, {from: user2}),
            "SafeMath: subtraction overflow"
        );
        
        await assertThrow(
            babyToken.transferFrom(owner, user3, uintMax.sub(one), {from: user2}),
            "SafeMath: subtraction overflow"
        );
        
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));
    });

    it('should success to transfer token twice', async () =>{
        await Promise.all([
            babyToken.transfer(user1, one, {from: owner}),
            babyToken.transfer(user1, one, {from: owner})
        ]);
        assert(eq(await babyToken.balanceOf(owner), ownerBalance.sub(two)));
        assert(eq(await babyToken.balanceOf(user1), user1Balance.add(two)));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });

    /*
        burn
    */
    
    it('should burn correctly', async () => {
        await babyToken.burn(one, {from: owner});
        assert(eq(await babyToken.balanceOf(owner), ownerBalance.sub(one)));
        assert(eq(await babyToken.totalSupply(), balanceSum.sub(one)));
    });

    it('should NOT burn more than balance', async () => {
        await assertThrow(
            babyToken.burn(ownerBalance.add(one), {from: owner}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.burn(uintMax, {from: owner}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.burn(uintMax.sub(one), {from: owner}),
            "SafeMath: subtraction overflow"
        );

        assert(eq(await babyToken.balanceOf(owner), ownerBalance));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });
    
    it('should burn from approved user', async () =>{
        await babyToken.approve(user2, one, {from: owner});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));

        await babyToken.burnFrom(owner, one, {from: user2});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), zero));
        assert(eq(await babyToken.balanceOf(owner), ownerBalance.sub(one)));
        assert(eq(await babyToken.totalSupply(), balanceSum.sub(one)));
    });

    it('should NOT burn from approved user more than allowances', async () =>{
        await babyToken.approve(user2, one, {from: owner});
        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));

        await assertThrow(
            babyToken.burnFrom(owner, two, {from: user2}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.burnFrom(owner, uintMax, {from: user2}),
            "SafeMath: subtraction overflow"
        );

        await assertThrow(
            babyToken.burnFrom(owner, uintMax.sub(one), {from: user2}),
            "SafeMath: subtraction overflow"
        );

        assert(eq(await babyToken.allowance(owner, user2, {from: owner}), one));
        assert(eq(await babyToken.balanceOf(owner), ownerBalance));
        assert(eq(await babyToken.totalSupply(), balanceSum));
    });
});



