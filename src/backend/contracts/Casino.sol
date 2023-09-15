// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MintableToken.sol";
import "./Roulette.sol";

interface IDUSD {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Casino is Ownable, ReentrancyGuard {
    MintableToken public casToken;
    IDUSD public dusdToken;
    Roulette public rouletteGame;

    uint256 public rate = 100; // 1 DUSD = 100 CAS
    bool public enabled = true;

    constructor(address _dusdAddress, address _rouletteAddress, address _casTokenAddress) {
        dusdToken = IDUSD(_dusdAddress);
        rouletteGame = Roulette(_rouletteAddress);

        if (_casTokenAddress == address(0)) {
            casToken = new MintableToken("Casino", "CAS");
            casToken.mint(address(this), 1000000 * 10 ** casToken.decimals());
        } else {
            casToken = MintableToken(_casTokenAddress);
        }
    }

    modifier isEnabled() {
        require(enabled, "Contract is disabled");
        _;
    }

    function setEnabled(bool _enabled) external onlyOwner {
        enabled = _enabled;
    }

    function setRouletteAddress(address _rouletteAddress) external onlyOwner {
        rouletteGame = Roulette(_rouletteAddress);
    }

    function buyCASTokens(uint256 dusdAmountInWei) external nonReentrant isEnabled {
        uint256 casAmount = (dusdAmountInWei * rate) / 10 ** 18;

        require(dusdToken.balanceOf(msg.sender) >= dusdAmountInWei, "Insufficient DUSD balance");
        require(dusdToken.transferFrom(msg.sender, address(this), dusdAmountInWei), "DUSD transfer failed");

        if (casToken.balanceOf(address(this)) < casAmount) {
            casToken.mint(address(this), casAmount * 100000);
        }
        casToken.transfer(msg.sender, casAmount);
    }

    function withdrawCasTokens(uint256 casAmount) external nonReentrant isEnabled {
        uint256 dusdAmountInWei = (casAmount * 10 ** 18) / rate;

        require(casToken.balanceOf(msg.sender) >= casAmount, "Insufficient CAS balance");
        casToken.directTransfer(msg.sender, address(this), casAmount);

        if (dusdToken.balanceOf(address(this)) < dusdAmountInWei) {
            revert("Insufficient DUSD balance in the Casino contract");
        }
        dusdToken.transfer(msg.sender, dusdAmountInWei);
    }

    function tokenBalance(address _of) external view returns (uint256) {
        return casToken.balanceOf(_of);
    }

    function balanceDUSD() public view returns (uint256) {
        return dusdToken.balanceOf(address(this));
    }

    function getAdress() external view returns (address) {
        return address(casToken);
    }

    function withdrawDUSD(uint256 _numDUSD) external onlyOwner {
        require(_numDUSD > 0, "Withdrawal amount should be greater than 0.");
        require(_numDUSD <= balanceDUSD(), "Insufficient DUSD in the contract.");
        require(dusdToken.transfer(owner(), _numDUSD), "DUSD transfer failed");
    }

    function authorizeAddressForTokenTransfer(address _address) external onlyOwner {
        casToken.authorizeAddress(_address);
    }

    function transferDUSDToAddress(address recipient, uint256 amount) external onlyOwner {
        require(dusdToken.transfer(recipient, amount), "DUSD transfer failed");
    }

    function transferCASToAddress(address recipient, uint256 amount) external onlyOwner {
        require(casToken.transfer(recipient, amount), "CAS transfer failed");
    }

    function transferCASTokenOwnership(address newOwner) external onlyOwner {
        casToken.transferOwnership(newOwner);
    }
}
