// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MintableToken.sol";

contract Roulette {
    MintableToken public casToken;
    address public owner;

    event RouletteGame(uint NumberWin, bool result, uint tokensEarned);

    mapping(address => Bet[]) private historyBets; // User betting history

    struct Bet {
        uint tokensBet;
        uint tokensEarned;
        string game;
    }

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function setCasTokenAddress(address _casTokenAddress) external onlyOwner {
        require(address(casToken) == address(0), "CAS Token address already set");
        casToken = MintableToken(_casTokenAddress);
    }

    function playRoulette(uint _start, uint _end, uint _tokensBet) external {
        validateRouletteBet(_start, _end, _tokensBet);
        uint tokensEarned = executeRouletteBet(_start, _end, _tokensBet);
        storeBetHistory("Roulete", _tokensBet, tokensEarned);
    }

    function yourHistory(address _owner) external view returns (Bet[] memory) {
        return historyBets[_owner];
    }

    // --- Private Helper Functions ---

    function validateRouletteBet(uint _start, uint _end, uint _tokensBet) private view {
        require(_start >= 0 && _start <= _end && _end <= 14, "Invalid betting range");
        require(_tokensBet > 0, "Bet amount must be greater than 0");
        require(_tokensBet <= casToken.balanceOf(msg.sender), "Insufficient tokens for bet");
    }

    function executeRouletteBet(uint _start, uint _end, uint _tokensBet) private returns (uint) {
        casToken.directTransfer(msg.sender, address(this), _tokensBet);
        uint random = generateRandomNumber();
        uint tokensEarned = determineRouletteWinnings(random, _start, _end, _tokensBet);
        bool win = tokensEarned > 0;

        if (win) {
            casToken.transfer(msg.sender, tokensEarned);
        }

        emit RouletteGame(random, win, tokensEarned);
        return tokensEarned;
    }

    function generateRandomNumber() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 15; //block.prevrandao need Solidity 0.8.18, https://soliditydeveloper.com/prevrandao
    }

    function determineRouletteWinnings(
        uint random,
        uint _start,
        uint _end,
        uint _tokensBet
    ) private pure returns (uint) {
        if (random >= _start && random <= _end) {
            if (random == 0) {
                return _tokensBet * 14;
            } else {
                return _tokensBet * 2;
            }
        }
        return 0;
    }

    function storeBetHistory(string memory _game, uint _tokensBet, uint _tokenEarned) private {
        Bet memory bet = Bet(_tokensBet, _tokenEarned, _game);
        historyBets[msg.sender].push(bet);
    }
}
