import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const CertificateContract = await ethers.getContractFactory("CertificateContract");
  const certificate = await CertificateContract.deploy();
  await certificate.waitForDeployment();

  const contractAddress = await certificate.getAddress();
  console.log("Certificate Contract deployed to:", contractAddress);

  // Save the contract address to a file for the frontend to use
  const contractsDir = join(__dirname, '..', 'src', 'contracts');
  
  if (!existsSync(contractsDir)) {
    mkdirSync(contractsDir);
  }
  
  writeFileSync(
    join(contractsDir, 'contract-address.json'),
    JSON.stringify({ address: contractAddress }, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });