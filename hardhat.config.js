require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999
                    },
                    evmVersion: "istanbul"
                }
            },
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    },
    networks: {
        hardhat: {},
        localhost: {
            url: "http://localhost:8545",
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
        },
        rise_testnet: {
            url: process.env.RPC_URL || "https://testnet.riselabs.xyz",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155931
        },
        monad_testnet: {
            url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 10143
        }
    },
    sourcify: {
        enabled: true,
        apiUrl: "https://sourcify-api-monad.blockvision.org",
        browserUrl: "https://monadvision.com"
    },
    etherscan: {
        apiKey: {
            monad_testnet: process.env.ETHERSCAN_API_V2 || ""
        },
        customChains: [
            {
                network: "monad_testnet",
                chainId: 10143,
                urls: {
                    apiURL: "https://api.etherscan.io/v2/api?chainid=10143",
                    browserURL: "https://testnet.monadscan.com"
                }
            }
        ]
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
