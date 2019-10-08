# Baby Token (BABY)

[![Build Status](https://travis-ci.org/bruce-plutusds/baby-token.svg?branch=master)](https://travis-ci.org/bruce-plutusds/baby-token)

A token for Pregnancy Tracker application which is an application with blockchain-based healthcare, shopping and employment for expectant mothers and families.

## Token Information
- Name: Baby Token
- Symbol: BABY
- Decimal Points: 18
- Contract Address: TBD
- Total Supply: TBD

## Contract Specification
Baby Token (BABY) is an ERC20 token that is centrally minted and burned by Pregnancy Tracker.

### ERC20 Token
The public interface of Baby Token is the ERC20 interface specified by [EIP-20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) using [Open Zeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts) smart contract library.
- `name()`
- `symbol()`
- `decimals()`
- `totalSupply()`
- `balanceOf(address who)`
- `transfer(address to, uint256 value)`
- `approve(address spender, uint256 value)`
- `allowance(address owner, address spender)`
- `transferFrom(address from, address to, uint256 value)`

And the events:-
 - `event Transfer(address indexed from, address indexed to, uint256 value)`
 - `event Approval(address indexed owner, address indexed spender, uint256 value)`

## Running tests
Tests are ran with [Ganache](https://www.trufflesuite.com/ganache) running on the test environment using the following commands:-

```
$ npm install
$ npm run test
```