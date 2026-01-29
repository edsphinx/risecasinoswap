/**
 * @title Add Liquidity with New Router
 * @notice Uses the new Router with official WMON
 * @dev Run: npx hardhat run scripts/addLiquidityNew.js --network monad_testnet
 */

const hre = require("hardhat");

// NEW Contract addresses
const ROUTER_ADDRESS = "0x8CA682eC73A7D92b27c79120C260862B3cc9Bd3B";
const FACTORY_ADDRESS = "0xD04c253F3bdf475Ee184a667F66C886940Bea6de";
const PHASOR_TOKEN = "0x5c4673457F013c416eDE7d31628195904D3b5FDe";
const WMON_ADDRESS = "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541";  // Official WMON

// ABIs
const ROUTER_ABI = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function WETH() external pure returns (address)",
    "function factory() external pure returns (address)"
];

const FACTORY_ABI = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)"
];

const PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function balanceOf(address owner) external view returns (uint256)"
];

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("ADD LIQUIDITY - MON/PHASOR (New Router)");
    console.log("=".repeat(60));
    console.log("\nDeployer:", deployer.address);

    // Get contracts
    const router = new hre.ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);
    const factory = new hre.ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
    const phasor = new hre.ethers.Contract(PHASOR_TOKEN, ERC20_ABI, deployer);

    // Verify router config
    const routerWETH = await router.WETH();
    const routerFactory = await router.factory();
    console.log("\n--- Router Config ---");
    console.log("Router WETH:", routerWETH);
    console.log("Router Factory:", routerFactory);

    // Check balances
    const monBalance = await deployer.getBalance();
    const phasorBalance = await phasor.balanceOf(deployer.address);

    console.log("\n--- Balances ---");
    console.log("MON Balance:", hre.ethers.utils.formatEther(monBalance), "MON");
    console.log("PHASOR Balance:", hre.ethers.utils.formatEther(phasorBalance), "PHASOR");

    // Check if pair exists
    let pairAddress = await factory.getPair(WMON_ADDRESS, PHASOR_TOKEN);
    console.log("\n--- Pair Status ---");
    console.log("Pair address:", pairAddress);

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
        console.log("Creating new pair...");
        const createTx = await factory.createPair(WMON_ADDRESS, PHASOR_TOKEN);
        await createTx.wait();
        pairAddress = await factory.getPair(WMON_ADDRESS, PHASOR_TOKEN);
        console.log("✅ Pair created:", pairAddress);
    }

    // Amounts: 2 MON + 10,000 PHASOR
    const monAmount = hre.ethers.utils.parseEther("2");
    const phasorAmount = hre.ethers.utils.parseEther("10000");

    console.log("\n--- Adding Liquidity ---");
    console.log("MON:", hre.ethers.utils.formatEther(monAmount));
    console.log("PHASOR:", hre.ethers.utils.formatEther(phasorAmount));

    // Approve
    console.log("\n1. Approving Router...");
    const approveTx = await phasor.approve(ROUTER_ADDRESS, phasorAmount);
    await approveTx.wait();
    console.log("   ✅ Approved!");

    // Add liquidity
    console.log("\n2. Adding liquidity...");
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

        console.log("   Tx:", tx.hash);
        const receipt = await tx.wait();
        console.log("   ✅ Success! Gas used:", receipt.gasUsed.toString());

        // Check pair
        const pair = new hre.ethers.Contract(pairAddress, PAIR_ABI, deployer);
        const reserves = await pair.getReserves();
        const lpBalance = await pair.balanceOf(deployer.address);

        console.log("\n--- Pool Created ---");
        console.log("Pair:", pairAddress);
        console.log("Reserve0:", hre.ethers.utils.formatEther(reserves[0]));
        console.log("Reserve1:", hre.ethers.utils.formatEther(reserves[1]));
        console.log("LP Tokens:", hre.ethers.utils.formatEther(lpBalance));
        console.log("\n✅ LIQUIDITY ADDED SUCCESSFULLY!");
        console.log("View: https://testnet.monadscan.com/address/" + pairAddress);

    } catch (error) {
        console.log("\n❌ Failed:", error.message);
        if (error.reason) console.log("   Reason:", error.reason);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
