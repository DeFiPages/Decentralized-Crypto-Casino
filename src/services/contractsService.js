import { ethers } from "ethers";
//import CasinoAbi from "../backend/contractsData/Casino.json";
//import CasinoAddress from "../backend/contractsData/Casino-address.json";
//import RouletteAbi from "../backend/contractsData/Roulette.json"; // Import the ABI for Roulette
//import RouletteAddress from "../backend/contractsData/Roulette-address.json"; // Import the address for Roulette
import DusdAbi from "../backend/contractsData/DST20.json";
/* import { accessListify } from "ethers/lib/utils"; */

let casino = null;
let roulette = null;
let dusdToken = null;

const loadContracts = async signer => {
    console.log("loadContracts entry");
    if (!signer) {
        throw new Error("No signer provided for contract initialization.");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log("Chain ID:", chainId);

    let CasinoAbi, RouletteAbi;
    try {
        CasinoAbi = await import(`../backend/contractsData/Casino-${chainId}.json`);
    } catch (error) {
        console.error(`Casino abi for chain ID ${chainId} not found.`);
    }

    try {
        RouletteAbi = await import(`../backend/contractsData/Roulette-${chainId}.json`);
    } catch (error) {
        console.error(`Roulette abi for chain ID ${chainId} not found.`);
    }

    let CasinoAddress, RouletteAddress;

    try {
        CasinoAddress = await import(`../backend/contractsData/Casino-address-${chainId}.json`);
    } catch (error) {
        console.error(`Casino address for chain ID ${chainId} not found.`);
    }

    try {
        RouletteAddress = await import(`../backend/contractsData/Roulette-address-${chainId}.json`);
    } catch (error) {
        console.error(`Roulette address for chain ID ${chainId} not found.`);
    }

    //
    casino = new ethers.Contract(CasinoAddress.address, CasinoAbi.abi, signer);
    roulette = new ethers.Contract(RouletteAddress.address, RouletteAbi.abi, signer); // Initialize the Roulette contract

    if (!casino || !roulette) {
        throw new Error("Failed to initialize contracts.");
    }
    console.log("casino:", casino);
    const dusdAddress = await casino.dusdToken();
    if (!dusdAddress) {
        throw new Error("Failed to fetch DUSD token address from Casino contract.");
    }
    console.log("Fetched DUSD Address:", dusdAddress);
    dusdToken = new ethers.Contract(dusdAddress, DusdAbi, signer);
    if (!dusdToken) {
        throw new Error("Failed to initialize DUSD token contract.");
    }

    const casAddress = await casino.casToken();
    if (!casAddress) {
        throw new Error("Failed to fetch CAS token address from Casino contract.");
    }
    console.log("Fetched CAS Address:", casAddress);
    const balance = await casino.tokenBalance(CasinoAddress.address);
    console.log(` with CAS tokenBalance ${balance}`);
};

const tokenBalance = async acc => {
    if (!casino) {
        throw new Error("Casino contract is not initialized.");
    }
    const balance = await casino.tokenBalance(acc);
    console.log(`tokenBalance ${balance}`);
    return parseInt(balance._hex);
};

const getDUSDBalance = async account => {
    if (!dusdToken) {
        throw new Error("DUSD token contract is not initialized.");
    }
    console.log(dusdToken);
    console.log("DUSD Token Address in Code:", dusdToken.address);
    console.log("Queried Account Address:", account);
    return await dusdToken.balanceOf(account);
};

const buyTokens = async dusdAmount => {
    const dusdAmountInWei = ethers.utils.parseUnits(dusdAmount.toString(), 18);

    const approveGasLimit = (await dusdToken.estimateGas.approve(casino.address, dusdAmountInWei)).mul(120).div(100);
    await dusdToken.approve(casino.address, dusdAmountInWei, { gasLimit: approveGasLimit });

    const buyGasLimit = (await casino.estimateGas.buyCASTokens(dusdAmountInWei)).mul(120).div(100);
    await casino.buyCASTokens(dusdAmountInWei, { gasLimit: buyGasLimit });
};

const withdrawTokens = async tokenNum => {
    const estimatedGas = await casino.estimateGas.withdrawCasTokens(tokenNum);
    const gasLimit = estimatedGas.mul(120).div(100); // Increase the gas limit by 20%

    await casino.withdrawCasTokens(tokenNum, { gasLimit: gasLimit }).wait();
};

const COLORS = Object.freeze({
    GREEN: 0,
    RED: 1,
    BLACK: 2
});

const playRoulette = async (_selectedColor, tokensBet) => {
    // Convert the string color to its number representation using COLORS
    const colorValue = COLORS[_selectedColor];

    if (colorValue === undefined) {
        throw new Error(`Invalid color: ${_selectedColor}`);
    }

    const estimatedGas = await roulette.estimateGas.playRoulette(colorValue, tokensBet);
    const gasLimit = estimatedGas.mul(200).div(100); // Increase the gas limit by 200%

   // const game = await (await roulette.playRoulette(colorValue, tokensBet, { gasLimit: gasLimit })).wait();
    let result;
    try {
        const game = await (await roulette.playRoulette(colorValue, tokensBet, { gasLimit: gasLimit })).wait();
        for (const event of game.events) {
            if (event.event === "RouletteError") {
                console.error("RouletteError Event:", event.args);
            }
            if (event.event === "RouletteGame") {
                // Assuming "RouletteGame" is the name of your event
                result = {
                    numberWon: parseInt(event.args[0]._hex),
                    result: event.args[1],
                    tokensEarned: parseInt(event.args[2]._hex)
                };
                break;
            }
        }

        if (!result) {
            throw new Error("RouletteGame event not found");
        }
    } catch (error) {
        console.error("Error while playRoulette:", error);
        throw error;
    }

    return result;
};

const tokenPrice = async () => {
    const rate = await getRate();

    if (rate === 0) {
        throw new Error("Rate is zero. Cannot compute token price.");
    }

    const price = ethers.utils.parseEther("1").div(rate);
    return ethers.utils.formatEther(price);
};

const historial = async account => {
    // Fetching game history from the roulette contract
    const historial = await roulette.yourHistory(account);
    let historialParsed = [];
    historial.map(game => historialParsed.push([game[2], parseInt(game[0]), parseInt(game[1])]));
    return historialParsed;
};

const getRate = async () => {
    if (!casino) {
        throw new Error("Casino contract is not initialized.");
    }
    const fetchedRate = await casino.rate();
    return parseInt(fetchedRate._hex);
};

export default {
    loadContracts,
    tokenBalance,
    buyTokens,
    tokenPrice,
    historial,
    playRoulette,
    withdrawTokens,
    getRate,
    getDUSDBalance
};
