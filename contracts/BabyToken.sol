pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

contract BabyToken is ERC20, ERC20Detailed, ERC20Pausable, ERC20Burnable {

    constructor(string memory name, string memory symbol, uint8 decimals, uint256 cap)
        ERC20Pausable()
        ERC20Burnable()
        ERC20Detailed(name, symbol, decimals)
        ERC20()
        public
    {
        _mint(msg.sender, cap);
    }
}


