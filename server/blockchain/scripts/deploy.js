const hre = require("hardhat");

async function main() {
    console.log("Deploying CredentialRegistry contract...");

    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
    const credentialRegistry = await CredentialRegistry.deploy();

    await credentialRegistry.waitForDeployment();

    const address = await credentialRegistry.getAddress();

    console.log("✅ CredentialRegistry deployed to:", address);
    console.log("");
    console.log("📝 Update your .env file with:");
    console.log(`CONTRACT_ADDRESS=${address}`);
    console.log("");
    console.log("🔍 Verify on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
