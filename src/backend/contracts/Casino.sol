// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MintableToken.sol";
import "./Roulette.sol";

interface IDUSD {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract Casino is Ownable, ReentrancyGuard {
    MintableToken public casToken;
    IDUSD public dusdToken;
    Roulette public rouletteGame;

    uint256 public rate = 100; // 1 DUSD = 100 CAS
    bool public enabled = true;

    constructor(
        address _dusdAddress,
        address _rouletteAddress,
        address _casTokenAddress
    ) {
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

    function buyCASTokens(
        uint256 dusdAmountInWei
    ) external nonReentrant isEnabled {
        uint256 casAmount = calculateCasAmount(dusdAmountInWei);

        requireDUSDBalance(dusdAmountInWei);
        transferDUSDToCasino(dusdAmountInWei);

        ensureCasinoHasSufficientCASTokens(casAmount);
        transferCASToUser(casAmount);
    }

    function withdrawCasTokens(
        uint256 casAmount
    ) external nonReentrant isEnabled {
        uint256 dusdAmountInWei = calculateDUSDAmount(casAmount);

        requireCASBalance(casAmount);
        transferCASToCasino(casAmount);

        ensureCasinoHasSufficientDUSDTokens(dusdAmountInWei);
        transferDUSDToUser(dusdAmountInWei);
    }

/*     function tokenPrice(uint256 _numTokens) external pure returns (uint256) {
        return _numTokens * (0.001 ether);
    } */

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
        require(
            _numDUSD <= balanceDUSD(),
            "Insufficient DUSD in the contract."
        );

        // Ensuring successful transfer of DUSD
        require(dusdToken.transfer(owner(), _numDUSD), "DUSD transfer failed");
    }

    function authorizeAddressForTokenTransfer(
        address _address
    ) external onlyOwner {
        casToken.authorizeAddress(_address);
    }

    function transferDUSDToAddress(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(dusdToken.transfer(recipient, amount), "DUSD transfer failed");
    }

    function transferCASToAddress(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(casToken.transfer(recipient, amount), "CAS transfer failed");
    }

    function transferCASTokenOwnership(address newOwner) external onlyOwner {
        casToken.transferOwnership(newOwner);
    }

    // --- Private Helper Functions ---

    function calculateCasAmount(
        uint256 dusdAmountInWei
    ) private view returns (uint256) {
        return (dusdAmountInWei * rate) / 10 ** 18;
    }

    function calculateDUSDAmount(
        uint256 casAmount
    ) private view returns (uint256) {
        return (casAmount * 10 ** 18) / rate;
    }

    function requireDUSDBalance(uint256 dusdAmountInWei) private view {
        require(
            dusdToken.balanceOf(msg.sender) >= dusdAmountInWei,
            "Insufficient DUSD balance"
        );
    }

    function requireCASBalance(uint256 casAmount) private view {
        require(
            casToken.balanceOf(msg.sender) >= casAmount,
            "Insufficient CAS balance"
        );
    }

    function transferDUSDToCasino(uint256 dusdAmountInWei) private {
        require(
            dusdToken.transferFrom(msg.sender, address(this), dusdAmountInWei),
            "DUSD transfer failed"
        );
    }

    function ensureCasinoHasSufficientCASTokens(uint256 casAmount) private {
        if (casToken.balanceOf(address(this)) < casAmount) {
            casToken.mint(address(this), casAmount * 100000);
        }
    }

    function transferCASToUser(uint256 casAmount) private {
        casToken.transfer(msg.sender, casAmount);
    }

    function transferCASToCasino(uint256 casAmount) private {
        casToken.directTransfer(msg.sender, address(this), casAmount);
    }

    function ensureCasinoHasSufficientDUSDTokens(
        uint256 dusdAmountInWei
    ) private view {
        if (dusdToken.balanceOf(address(this)) < dusdAmountInWei) {
            revert("Insufficient DUSD balance in the Casino contract");
        }
    }

    function transferDUSDToUser(uint256 dusdAmountInWei) private {
        dusdToken.transfer(msg.sender, dusdAmountInWei);
    }
}
