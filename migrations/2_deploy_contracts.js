const BabyToken = artifacts.require("BabyToken");

module.exports = function(deployer, network, accounts) {
    const owner = accounts[0];

    const name  = "BABYToken";
    const symbol= "BABY";
    const decimals = 18;

    const cap = new web3.utils.BN((2100000000).toString() + "0".repeat(decimals));

    deployer.deploy(BabyToken, name, symbol, decimals, cap, {from: owner});
};

