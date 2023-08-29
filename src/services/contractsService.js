import { ethers } from "ethers";
import CasinoAbi from "../backend/contractsData/Casino.json";
import CasinoAddress from "../backend/contractsData/Casino-address.json";
import RouletteAbi from "../backend/contractsData/Roulette.json";  // Import the ABI for Roulette
import RouletteAddress from "../backend/contractsData/Roulette-address.json";  // Import the address for Roulette
import DusdAbi from "./DUSDMinimalInterface.json";

let casino = null;
let roulette = null;  // Declare a variable for the Roulette contract
let dusdToken = null;

const loadContracts = async (signer) => {
    if (!signer) {
        throw new Error("No signer provided for contract initialization.");
    }

    casino = new ethers.Contract(CasinoAddress.address, CasinoAbi.abi, signer);
    roulette = new ethers.Contract(RouletteAddress.address, RouletteAbi.abi, signer);  // Initialize the Roulette contract

    if (!casino || !roulette) {
        throw new Error("Failed to initialize contracts.");
    }

    const dusdAddress = await casino.dusdToken();

    if (!dusdAddress) {
        throw new Error("Failed to fetch DUSD token address from Casino contract.");
    }

    console.log("Fetched DUSD Address:", dusdAddress);
    dusdToken = new ethers.Contract(dusdAddress, DusdAbi, signer);

    if (!dusdToken) {
        throw new Error("Failed to initialize DUSD token contract.");
    }
}

const tokenBalance = async (acc) => {
    const balance = await casino.tokenBalance(acc);
    return parseInt(balance._hex);
}

const getDUSDBalance = async (account) => {
    if (!dusdToken) {
        throw new Error("DUSD token contract is not initialized.");
    }
    console.log(dusdToken);

    console.log("DUSD Token Address in Code:", dusdToken.address);
    console.log("Queried Account Address:", account);
    let provider = new ethers.providers.JsonRpcProvider();
    const network = await provider.getNetwork();
    console.log("Connected Network:", network.name);

    return await dusdToken.balanceOf(account);
}

const buyTokens = async (dusdAmount) => {
    const dusdAmountInWei = ethers.utils.parseUnits(dusdAmount.toString(), 18); // Using ethers.js utility
    console.log(`ContractService.js:buyTokens: approve dusdAmountInWei ${dusdAmountInWei}`);
    await dusdToken.approve(CasinoAddress.address, dusdAmountInWei);
    console.log(`buy dusdAmountInWei ${dusdAmountInWei}`);
    await (await casino.buyTokens(dusdAmountInWei)).wait();
}

const withdrawTokens = async (tokenNum) => {
        await (await casino.returnCasTokens(tokenNum)).wait();
}

const playRoulette = async (start, end, tokensBet) => {
    // Using the roulette contract for playing the roulette game
    const game = await (await roulette.playRoulette(start.toString(), end.toString(), tokensBet.toString())).wait();
    let result;
    try {
        result = {
            numberWon: parseInt(game.events[1].args[0]._hex),
            result: game.events[1].args[1],
            tokensEarned: parseInt(game.events[1].args[2]._hex)
        }
    } catch (error) {
        result = {
            numberWon: parseInt(game.events[2].args[0]._hex),
            result: game.events[2].args[1],
            tokensEarned: parseInt(game.events[2].args[2]._hex)
        }
    }
    return result;
}


const tokenPrice = async () => {
    const price = await casino.tokenPrice(1)
    return ethers.utils.formatEther(price._hex)
}

const historial = async (account) => {
    // Fetching game history from the roulette contract
    const historial = await roulette.yourHistory(account);
    let historialParsed = [];
    historial.map((game) => (
        historialParsed.push([game[2], parseInt(game[0]), parseInt(game[1])])
    ));
    return historialParsed;
}

const getRate = async () => {
    if (!casino) {
        throw new Error("Casino contract is not initialized.");
    }
    const fetchedRate = await casino.rate();
    return parseInt(fetchedRate._hex);
}

export default { loadContracts, tokenBalance, buyTokens, tokenPrice, historial, playRoulette, withdrawTokens, getRate, getDUSDBalance };





