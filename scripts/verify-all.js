/**
 * @title Verify All Contracts on Etherscan/Monadscan
 * @notice Verifies Factory, Token, and Router on Monad Testnet
 * @dev Run: npx hardhat run scripts/verify-all.js --network monad_testnet
 */

const hre = require("hardhat");

async function main() {
    console.log("=".repeat(60));
    console.log("VERIFYING ALL CONTRACTS ON MONAD TESTNET");
    console.log("=".repeat(60));

    const contracts = [
        {
            name: "UniswapV2Factory",
            address: "0xD04c253F3bdf475Ee184a667F66C886940Bea6de",
            args: ["0xde638AEc64261bf96520f97d5752E464dA83a2d7"]
        },
        {
            name: "PhasorToken",
            address: "0x5c4673457F013c416eDE7d31628195904D3b5FDe",
            args: ["0xde638AEc64261bf96520f97d5752E464dA83a2d7"]
        }
    ];

    for (const contract of contracts) {
        console.log(`\n--- Verifying ${contract.name} ---`);
        console.log(`Address: ${contract.address}`);

        try {
            await hre.run("verify:verify", {
                address: contract.address,
                constructorArguments: contract.args,
            });
            console.log(`✅ ${contract.name} verified successfully!`);
        } catch (error) {
            if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
                console.log(`✅ ${contract.name} is already verified!`);
            } else if (error.message.includes("Successfully verified")) {
                console.log(`✅ ${contract.name} verified successfully!`);
            } else {
                console.log(`⚠️ ${contract.name} verification result: ${error.message}`);
            }
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("VERIFICATION COMPLETE");
    console.log("=".repeat(60));
    console.log("\nView verified contracts at:");
    console.log("- https://testnet.monadscan.com/address/0xD04c253F3bdf475Ee184a667F66C886940Bea6de");
    console.log("- https://testnet.monadscan.com/address/0x5c4673457F013c416eDE7d31628195904D3b5FDe");
    console.log("- https://testnet.monadscan.com/address/0x1CE3099D93cafbD02fdF15abb081518F7c1C12cF");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
