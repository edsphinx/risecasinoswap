/**
 * @title Deploy Phasor Governance Token
 * @notice Deploys PhasorToken to Monad Testnet
 * @dev Run: npx hardhat run scripts/deployToken.js --network monad_testnet
 */

const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying PhasorToken with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    console.log("\n--- Deploying PhasorToken ---");

    const PhasorToken = await hre.ethers.getContractFactory("PhasorToken");
    const token = await PhasorToken.deploy(deployer.address);
    await token.deployed();

    console.log("PhasorToken deployed to:", token.address);

    const totalSupply = await token.totalSupply();
    const symbol = await token.symbol();
    const name = await token.name();

    console.log("\n--- Token Info ---");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", hre.ethers.utils.formatEther(totalSupply), symbol);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        token: token.address,
        name: name,
        symbol: symbol,
        totalSupply: totalSupply.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    console.log("\n--- Deployment Info ---");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Write to file for reference
    const fs = require("fs");
    fs.writeFileSync(
        `deployment-token-${hre.network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\nDeployment info saved to deployment-token-${hre.network.name}.json`);

    // Verify contract
    if (hre.network.name === "monad_testnet") {
        console.log("\n--- Verifying Contract ---");
        console.log("Waiting 30 seconds for block explorer to index...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await hre.run("verify:verify", {
                address: token.address,
                constructorArguments: [deployer.address],
            });
            console.log("Contract verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("Contract is already verified!");
            } else {
                console.log("Verification failed:", error.message);
                console.log("You can verify manually later with:");
                console.log(`npx hardhat verify --network ${hre.network.name} ${token.address} "${deployer.address}"`);
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
