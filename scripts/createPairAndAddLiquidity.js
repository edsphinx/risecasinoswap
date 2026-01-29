/**
 * @title Create Pair and Add Liquidity
 * @notice Creates MON/PHASOR pair directly from Factory, then adds liquidity
 * @dev Run: npx hardhat run scripts/createPairAndAddLiquidity.js --network monad_testnet
 */

const hre = require("hardhat");

// Contract addresses
const FACTORY_ADDRESS = "0xD04c253F3bdf475Ee184a667F66C886940Bea6de";
const ROUTER_ADDRESS = "0x1CE3099D93cafbD02fdF15abb081518F7c1C12cF";
const PHASOR_TOKEN = "0x5c4673457F013c416eDE7d31628195904D3b5FDe";
const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

// ABIs
const FACTORY_ABI = [
    "function createPair(address tokenA, address tokenB) external returns (address pair)",
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function allPairsLength() external view returns (uint256)"
];

const ROUTER_ABI = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function WETH() external pure returns (address)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

const PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("CREATE PAIR AND ADD LIQUIDITY - MON/PHASOR");
    console.log("=".repeat(60));
    console.log("\nDeployer:", deployer.address);

    // Get contracts
    const factory = new hre.ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
    const router = new hre.ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);
    const phasor = new hre.ethers.Contract(PHASOR_TOKEN, ERC20_ABI, deployer);

    // Check balances
    const monBalance = await deployer.getBalance();
    const phasorBalance = await phasor.balanceOf(deployer.address);

    console.log("\n--- Current Balances ---");
    console.log("MON Balance:", hre.ethers.utils.formatEther(monBalance), "MON");
    console.log("PHASOR Balance:", hre.ethers.utils.formatEther(phasorBalance), "PHASOR");

    // Check if pair exists
    console.log("\n--- Checking Pair Status ---");
    let pairAddress = await factory.getPair(WMON_ADDRESS, PHASOR_TOKEN);
    console.log("Existing pair address:", pairAddress);

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
        console.log("\n1. Creating pair WMON/PHASOR...");
        try {
            const createPairTx = await factory.createPair(WMON_ADDRESS, PHASOR_TOKEN);
            await createPairTx.wait();
            pairAddress = await factory.getPair(WMON_ADDRESS, PHASOR_TOKEN);
            console.log("   ✅ Pair created at:", pairAddress);
        } catch (error) {
            console.log("   ❌ Failed to create pair:", error.message);
            return;
        }
    } else {
        console.log("   Pair already exists at:", pairAddress);
    }

    // Liquidity amounts
    const monAmount = hre.ethers.utils.parseEther("2");
    const phasorAmount = hre.ethers.utils.parseEther("10000");

    console.log("\n--- Adding Liquidity ---");
    console.log("MON Amount:", hre.ethers.utils.formatEther(monAmount), "MON");
    console.log("PHASOR Amount:", hre.ethers.utils.formatEther(phasorAmount), "PHASOR");

    // Approve Router
    console.log("\n2. Approving Router to spend PHASOR...");
    const approveTx = await phasor.approve(ROUTER_ADDRESS, phasorAmount);
    await approveTx.wait();
    console.log("   ✅ Approved!");

    // Add liquidity with manual gas limit
    console.log("\n3. Adding liquidity with manual gas limit...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    try {
        const tx = await router.addLiquidityETH(
            PHASOR_TOKEN,
            phasorAmount,
            0,
            0,
            deployer.address,
            deadline,
            {
                value: monAmount,
                gasLimit: 500000
            }
        );

        console.log("   Transaction hash:", tx.hash);
        const receipt = await tx.wait();

        console.log("\n✅ Liquidity added successfully!");
        console.log("   Block:", receipt.blockNumber);
        console.log("   Gas used:", receipt.gasUsed.toString());

        // Check pair reserves
        const pair = new hre.ethers.Contract(pairAddress, PAIR_ABI, deployer);
        const reserves = await pair.getReserves();
        const token0 = await pair.token0();

        console.log("\n--- Pool Status ---");
        console.log("Pair:", pairAddress);
        console.log("Token0:", token0);
        console.log("Reserve0:", hre.ethers.utils.formatEther(reserves[0]));
        console.log("Reserve1:", hre.ethers.utils.formatEther(reserves[1]));

    } catch (error) {
        console.log("\n❌ Failed to add liquidity:", error.message);
        if (error.reason) console.log("   Reason:", error.reason);
        if (error.data) console.log("   Data:", error.data);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
