/**
 * @title Verify Contracts on Sourcify
 * @notice Verifies deployed contracts on Sourcify for Monad Testnet
 * @dev Run: npx hardhat run scripts/verify-sourcify.js --network monad_testnet
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCIFY_API = "https://sourcify.dev/server";
const CHAIN_ID = 10143; // Monad Testnet

async function verifyContract(contractAddress, contractName, constructorArgs = []) {
    console.log(`\n--- Verifying ${contractName} at ${contractAddress} ---`);

    try {
        // Get the artifact
        const artifact = await hre.artifacts.readArtifact(contractName);

        // Get build info
        const buildInfoPath = path.join(hre.config.paths.artifacts, "build-info");
        const buildInfoFiles = fs.readdirSync(buildInfoPath);

        if (buildInfoFiles.length === 0) {
            console.log("No build info found. Please compile contracts first.");
            return false;
        }

        // Read the first build info (assuming single compilation)
        const buildInfo = JSON.parse(
            fs.readFileSync(path.join(buildInfoPath, buildInfoFiles[0]), "utf8")
        );

        // Find the source file
        let sourceFile = null;
        for (const [file, content] of Object.entries(buildInfo.input.sources)) {
            if (file.includes(contractName)) {
                sourceFile = { path: file, content: content.content };
                break;
            }
        }

        if (!sourceFile) {
            console.log(`Source file for ${contractName} not found`);
            return false;
        }

        console.log(`Found source: ${sourceFile.path}`);
        console.log(`Compiler version: ${buildInfo.solcVersion}`);

        // Check if already verified on Sourcify
        const checkUrl = `${SOURCIFY_API}/check-all-by-addresses?addresses=${contractAddress}&chainIds=${CHAIN_ID}`;

        const checkResponse = await fetch(checkUrl);
        const checkData = await checkResponse.json();

        if (checkData[0] && checkData[0].status === "perfect") {
            console.log(`✅ ${contractName} is already verified on Sourcify!`);
            return true;
        }

        console.log(`Contract not verified yet. Please verify manually at:`);
        console.log(`https://sourcify.dev/#/verifier`);
        console.log(`  - Chain ID: ${CHAIN_ID} (Monad Testnet)`);
        console.log(`  - Contract Address: ${contractAddress}`);
        console.log(`  - Upload the source files from contracts/ folder`);

        return true;
    } catch (error) {
        console.log(`Verification check failed: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("SOURCIFY VERIFICATION FOR MONAD TESTNET");
    console.log("=".repeat(60));

    // Contracts to verify
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
        await verifyContract(contract.address, contract.name, contract.args);
    }

    console.log("\n" + "=".repeat(60));
    console.log("VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log("\nTo verify contracts manually on Sourcify:");
    console.log("1. Go to https://sourcify.dev/#/verifier");
    console.log("2. Select 'Import from Solidity JSON Input'");
    console.log("3. Use artifacts/build-info/*.json files");
    console.log("4. Enter chain ID: 10143 (Monad Testnet)");
    console.log("5. Enter contract addresses");
    console.log("\nOr use Monad Explorer directly:");
    console.log("- Factory: https://testnet.monadexplorer.com/address/0xD04c253F3bdf475Ee184a667F66C886940Bea6de");
    console.log("- Token: https://testnet.monadexplorer.com/address/0x5c4673457F013c416eDE7d31628195904D3b5FDe");
    console.log("- Router: https://testnet.monadexplorer.com/address/0x1CE3099D93cafbD02fdF15abb081518F7c1C12cF");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
