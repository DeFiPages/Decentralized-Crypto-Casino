// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDUSD is ERC20 {
    constructor() ERC20("Mock DUSD", "DUSD") {}

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
