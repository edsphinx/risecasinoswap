/**
 * @title Deploy Uniswap V2 Factory
 * @notice Deploys UniswapV2Factory to Rise Testnet or Monad Testnet
 * @dev Run: npx hardhat run scripts/deploy.js --network rise_testnet
 *      Or:  npx hardhat run scripts/deploy.js --network monad_testnet
 */

const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // FeeToSetter - can be set to deployer for testnet
    const feeToSetter = process.env.FEE_TO_SETTER || deployer.address;

    console.log("\n--- Deploying UniswapV2Factory ---");
    console.log("FeeToSetter:", feeToSetter);

    const UniswapV2Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
    const factory = await UniswapV2Factory.deploy(feeToSetter);
    await factory.deployed();

    console.log("UniswapV2Factory deployed to:", factory.address);

    // Get the INIT_CODE_HASH for Router configuration
    const pairCodeHash = await factory.pairCodeHash();
    console.log("\n--- IMPORTANT ---");
    console.log("INIT_CODE_PAIR_HASH:", pairCodeHash);
    console.log("You will need this hash to configure the Router!");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        factory: factory.address,
        feeToSetter: feeToSetter,
        pairCodeHash: pairCodeHash,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    console.log("\n--- Deployment Info ---");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Write to file for reference
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\nDeployment info saved to deployment-${hre.network.name}.json`);

    // Verify contract on block explorer
    if (hre.network.name === "monad_testnet" || hre.network.name === "rise_testnet") {
        console.log("\n--- Verifying Contract ---");
        console.log("Waiting 30 seconds for block explorer to index...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await hre.run("verify:verify", {
                address: factory.address,
                constructorArguments: [feeToSetter],
            });
            console.log("Contract verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("Contract is already verified!");
            } else {
                console.log("Verification failed:", error.message);
                console.log("You can verify manually later with:");
                console.log(`npx hardhat verify --network ${hre.network.name} ${factory.address} "${feeToSetter}"`);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
