// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./MintableToken.sol";

contract Roulette {
    MintableToken public casToken;
    address public owner;

    event RouletteGame(uint NumberWin, bool result, uint tokensEarned);
    event RouletteError(address indexed player, string reason);

    event BetPlaced(address indexed player, Color selectedColor, uint tokensBet);
    event RandomNumberGenerated(uint randomNumber);
    event WinningsCalculated(uint tokensEarned);
    event InsufficientBalance(address indexed player, uint availableBalance, uint requiredAmount);
    event TransferWinnings(address indexed player, uint tokensEarned);
    event TransferFailed(address indexed player, uint tokensEarned, string reason);
    event InsufficientContractBalance(uint requiredAmount, uint contractBalance);

    //mapping(address => Bet[]) private historyBets; // User betting history

    struct Bet {
        uint tokensBet;
        uint tokensEarned;
        string game;
    }

    bool public enabled = true;

    constructor() {
        owner = msg.sender;
    }

    modifier isEnabled() {
        require(enabled, "Contract is disabled");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function setEnabled(bool _enabled) external onlyOwner {
        enabled = _enabled;
    }

    function setCasTokenAddress(address _casTokenAddress) external onlyOwner {
        require(address(casToken) == address(0), "CAS Token address already set");
        casToken = MintableToken(_casTokenAddress);
    }

    // function yourHistory(address _owner) external view returns (Bet[] memory) {
    //     return historyBets[_owner];
    // }

    enum Color {
        GREEN,
        RED,
        BLACK
    }

    function playRoulette(Color _selectedColor, uint _tokensBet) external isEnabled {
        emit BetPlaced(msg.sender, _selectedColor, _tokensBet);

        if (_selectedColor < Color.GREEN || _selectedColor > Color.BLACK) {
            emit RouletteError(msg.sender, "Invalid color selected");
            emit RouletteGame(0, false, 0);
            revert("Invalid color selected");
        }

        if (_tokensBet <= 0) {
            emit RouletteError(msg.sender, "Bet amount must be greater than 0");
            emit RouletteGame(0, false, 0);
            revert("Bet amount must be greater than 0");
        }

        uint playerBalance = casToken.balanceOf(msg.sender);
        if (_tokensBet > playerBalance) {
            emit InsufficientBalance(msg.sender, playerBalance, _tokensBet);
            emit RouletteError(msg.sender, "Insufficient tokens for bet");
            emit RouletteGame(0, false, 0);
            revert("Insufficient tokens for bet");
        }

        casToken.directTransfer(msg.sender, address(this), _tokensBet);

        uint random = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 15;
        emit RandomNumberGenerated(random);

        uint tokensEarned = 0;
        if (_selectedColor == Color.GREEN && random == 0) {
            tokensEarned = _tokensBet * 14;
        } else if (_selectedColor == Color.RED && random >= 1 && random <= 7) {
            tokensEarned = _tokensBet * 2;
        } else if (_selectedColor == Color.BLACK && random >= 8 && random <= 14) {
            tokensEarned = _tokensBet * 2;
        }

        emit WinningsCalculated(tokensEarned);

        bool win = tokensEarned > 0;
        if (win) {
            uint contractBalance = casToken.balanceOf(address(this));
            if (tokensEarned > contractBalance) {
                emit InsufficientContractBalance(tokensEarned, contractBalance);
                emit RouletteError(msg.sender, "Contract balance insufficient to pay winnings");
                emit RouletteGame(random, false, 0);
                revert("Contract balance insufficient to pay winnings");
            } else {
                casToken.transfer(msg.sender, tokensEarned);
                emit TransferWinnings(msg.sender, tokensEarned);
            }
        }

        emit RouletteGame(random, win, tokensEarned);

 //       Bet memory bet = Bet(_tokensBet, tokensEarned, "Roulette");
        // historyBets[msg.sender].push(bet);
    }
}
