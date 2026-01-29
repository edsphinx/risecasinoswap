/**
 * @title Direct Liquidity via Pair Contract
 * @notice Adds liquidity directly to the pair contract (bypassing router issues)
 * @dev Run: npx hardhat run scripts/directLiquidity.js --network monad_testnet
 */

const hre = require("hardhat");

// Contract addresses
const PAIR_ADDRESS = "0x382feb2b52D267A67EFB5E5Fe6Cb4A18d1213195";
const PHASOR_TOKEN = "0x5c4673457F013c416eDE7d31628195904D3b5FDe";
const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

// ABIs
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

const PAIR_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function mint(address to) external returns (uint256 liquidity)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)"
];

const WMON_ABI = [
    "function deposit() external payable",
    "function balanceOf(address) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
];

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("=".repeat(60));
    console.log("DIRECT LIQUIDITY - BYPASSING ROUTER");
    console.log("=".repeat(60));
    console.log("\nDeployer:", deployer.address);

    // Get contracts
    const phasor = new hre.ethers.Contract(PHASOR_TOKEN, ERC20_ABI, deployer);
    const wmon = new hre.ethers.Contract(WMON_ADDRESS, WMON_ABI, deployer);
    const pair = new hre.ethers.Contract(PAIR_ADDRESS, PAIR_ABI, deployer);

    // Check token order
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    console.log("\n--- Pair Info ---");
    console.log("Token0:", token0);
    console.log("Token1:", token1);

    // Amounts: 2 MON, 10,000 PHASOR
    const monAmount = hre.ethers.utils.parseEther("2");
    const phasorAmount = hre.ethers.utils.parseEther("10000");

    console.log("\n--- Step 1: Wrap MON to WMON ---");
    const depositTx = await wmon.deposit({ value: monAmount });
    await depositTx.wait();
    console.log("   ✅ Wrapped", hre.ethers.utils.formatEther(monAmount), "MON to WMON");

    const wmonBalance = await wmon.balanceOf(deployer.address);
    console.log("   WMON Balance:", hre.ethers.utils.formatEther(wmonBalance));

    console.log("\n--- Step 2: Transfer tokens to pair ---");

    // Transfer PHASOR to pair
    const transferPhasorTx = await phasor.transfer(PAIR_ADDRESS, phasorAmount);
    await transferPhasorTx.wait();
    console.log("   ✅ Transferred PHASOR to pair");

    // Transfer WMON to pair
    const transferWmonTx = await wmon.transfer(PAIR_ADDRESS, monAmount);
    await transferWmonTx.wait();
    console.log("   ✅ Transferred WMON to pair");

    console.log("\n--- Step 3: Mint LP tokens ---");
    try {
        const mintTx = await pair.mint(deployer.address, { gasLimit: 300000 });
        const receipt = await mintTx.wait();
        console.log("   ✅ LP tokens minted!");
        console.log("   Tx hash:", mintTx.hash);

        // Check LP balance
        const lpBalance = await pair.balanceOf(deployer.address);
        console.log("\n--- Result ---");
        console.log("LP Token Balance:", hre.ethers.utils.formatEther(lpBalance));

        // Check reserves
        const reserves = await pair.getReserves();
        console.log("Reserve0:", hre.ethers.utils.formatEther(reserves[0]));
        console.log("Reserve1:", hre.ethers.utils.formatEther(reserves[1]));

        console.log("\n✅ LIQUIDITY ADDED SUCCESSFULLY!");
        console.log("View pair: https://testnet.monadscan.com/address/" + PAIR_ADDRESS);

    } catch (error) {
        console.log("   ❌ Failed to mint:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
