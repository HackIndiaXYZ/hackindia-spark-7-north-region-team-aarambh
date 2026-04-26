const hre = require("hardhat");

async function main() {
  console.log("Deploying AegisID contract...");

  const AegisID = await hre.ethers.getContractFactory("AegisID");
  const aegisID = await AegisID.deploy();

  await aegisID.waitForDeployment();

  const address = await aegisID.getAddress();
  console.log(`AegisID deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
