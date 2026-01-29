/**
 * @title Add Initial Liquidity
 * @notice Adds initial liquidity for MON/PHASOR pool on Monad Testnet
 * @dev Run: npx hardhat run scripts/addLiquidity.js --network monad_testnet
 */

const hre = require("hardhat");

// Contract addresses
const ROUTER_ADDRESS = "0x1CE3099D93cafbD02fdF15abb081518F7c1C12cF";
const PHASOR_TOKEN = "0x5c4673457F013c416eDE7d31628195904D3b5FDe";
const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

// Router ABI (only needed functions)
const ROUTER_ABI = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function WETH() external pure returns (address)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("ADDING INITIAL LIQUIDITY - MON/PHASOR");
    console.log("=".repeat(60));
    console.log("\nDeployer:", deployer.address);

    // Get contracts
    const router = new hre.ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, deployer);
    const phasor = new hre.ethers.Contract(PHASOR_TOKEN, ERC20_ABI, deployer);

    // Check balances
    const monBalance = await deployer.getBalance();
    const phasorBalance = await phasor.balanceOf(deployer.address);

    console.log("\n--- Current Balances ---");
    console.log("MON Balance:", hre.ethers.utils.formatEther(monBalance), "MON");
    console.log("PHASOR Balance:", hre.ethers.utils.formatEther(phasorBalance), "PHASOR");

    // Liquidity amounts: 2 MON + 10,000 PHASOR
    const monAmount = hre.ethers.utils.parseEther("2"); // 2 MON
    const phasorAmount = hre.ethers.utils.parseEther("10000"); // 10,000 PHASOR

    console.log("\n--- Adding Liquidity ---");
    console.log("MON Amount:", hre.ethers.utils.formatEther(monAmount), "MON");
    console.log("PHASOR Amount:", hre.ethers.utils.formatEther(phasorAmount), "PHASOR");

    // Check if we have enough balance
    if (monBalance.lt(monAmount.add(hre.ethers.utils.parseEther("0.5")))) {
        console.log("\n❌ Insufficient MON balance! Need at least 2.5 MON (2 for liquidity + gas)");
        return;
    }

    if (phasorBalance.lt(phasorAmount)) {
        console.log("\n❌ Insufficient PHASOR balance!");
        return;
    }

    // Approve Router to spend PHASOR
    console.log("\n1. Approving Router to spend PHASOR...");
    const approveTx = await phasor.approve(ROUTER_ADDRESS, phasorAmount);
    await approveTx.wait();
    console.log("   ✅ Approved!");

    // Add liquidity
    console.log("\n2. Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    try {
        const tx = await router.addLiquidityETH(
            PHASOR_TOKEN,
            phasorAmount,
            0, // amountTokenMin (0 = accept any) 
            0, // amountETHMin (0 = accept any)
            deployer.address,
            deadline,
            { value: monAmount }
        );

        console.log("   Transaction hash:", tx.hash);
        const receipt = await tx.wait();

        console.log("\n✅ Liquidity added successfully!");
        console.log("   Block:", receipt.blockNumber);
        console.log("   Gas used:", receipt.gasUsed.toString());

        // Parse events to get liquidity token amount
        console.log("\n--- Pool Created ---");
        console.log("Pool: MON/PHASOR");
        console.log("Initial price: 1 MON = 5000 PHASOR");
        console.log("View pool on explorer: https://testnet.monadscan.com/tx/" + tx.hash);

    } catch (error) {
        console.log("\n❌ Failed to add liquidity:", error.message);
        if (error.reason) {
            console.log("   Reason:", error.reason);
        }
    }

    // Final balances
    const finalMonBalance = await deployer.getBalance();
    const finalPhasorBalance = await phasor.balanceOf(deployer.address);

    console.log("\n--- Final Balances ---");
    console.log("MON Balance:", hre.ethers.utils.formatEther(finalMonBalance), "MON");
    console.log("PHASOR Balance:", hre.ethers.utils.formatEther(finalPhasorBalance), "PHASOR");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
