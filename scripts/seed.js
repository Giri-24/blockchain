const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { sha256 } = require("js-sha256");

// Replicate canonical stringify for the script
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  return "{" + sortedKeys.map(key => {
    return JSON.stringify(key) + ":" + canonicalStringify(obj[key]);
  }).join(",") + "}";
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🌱 Seeding TrustChain with sample jobs using account:", deployer.address);

  // Load contract address from frontend utils
  const contractJsonPath = path.join(__dirname, "../frontend/src/utils/contract.json");
  if (!fs.existsSync(contractJsonPath)) {
    console.error("❌ contract.json not found. Deploy the contract first.");
    return;
  }
  const { contractAddress } = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
  const TrustChain = await hre.ethers.getContractAt("TrustChain", contractAddress);

  const sampleJobs = [
    {
      title: "Senior Blockchain Engineer",
      company: "DecentraHire",
      location: "Remote",
      jobType: "Full-time",
      salary: "$120k - $180k",
      experience: "5+ years",
      description: "We are looking for a Senior Blockchain Engineer to build out our decentralized infrastructure.",
      requirements: "Solid understanding of EVM, Solidity, and Ethers.js.",
      skills: ["Solidity", "Ethers.js", "React", "Node.js"],
      officialUrl: "https://example.com/jobs/1",
      postedBy: deployer.address,
      postedAt: new Date().toISOString()
    },
    {
      title: "Frontend Developer (React)",
      company: "Web3Labs",
      location: "Bangalore, India",
      jobType: "Contract",
      salary: "₹20L - ₹35L",
      experience: "2-4 years",
      description: "Join our team to build beautiful Web3 dashboards.",
      requirements: "Proficient in React, Tailwind CSS, and Framer Motion.",
      skills: ["React", "Tailwind", "Framer Motion"],
      officialUrl: "https://example.com/jobs/2",
      postedBy: deployer.address,
      postedAt: new Date().toISOString()
    },
    {
      title: "Blockchain Security Researcher (Tampered)",
      company: "SecureProtocol",
      location: "Remote",
      jobType: "Full-time",
      salary: "$150k - $200k",
      experience: "5+ years",
      description: "We are looking for a security researcher to audit our protocols.",
      requirements: "Expertise in smart contract security.",
      skills: ["Solidity", "Security", "Auditing"],
      officialUrl: "https://example.com/jobs/3",
      postedBy: deployer.address,
      postedAt: new Date().toISOString(),
      _testType: "tampered"
    },
    {
      title: "Earn 10 ETH Daily - Legit Job",
      company: "MoonSavings",
      location: "Remote",
      jobType: "Full-time",
      salary: "10 ETH / Day",
      experience: "No Experience",
      description: "Fast way to earn crypto. Totally legit.",
      requirements: "Must have a private key.",
      skills: ["Crypto"],
      officialUrl: "https://moon-scam.io",
      postedBy: deployer.address,
      postedAt: new Date().toISOString(),
      _testType: "suspicious"
    }
  ];

  const backendJobs = [];

  for (const job of sampleJobs) {
    console.log(`\nPosting: ${job.title} at ${job.company}...`);
    
    // 1. Generate local CID (mock)
    const jsonStr = canonicalStringify(job);
    const hexHash = sha256(jsonStr);
    const bytes32Hash = "0x" + hexHash.padStart(64, "0");
    const mockCid = "QmSeed" + hexHash.substring(0, 40);

    // 2. Post on-chain
    try {
      let finalHash = bytes32Hash;
      if (job._testType === "tampered") {
        console.log("🛠️  Simulating tampering: changing on-chain hash to mismatch data...");
        finalHash = bytes32Hash.replace("a", "b").replace("1", "2"); // Slight modification
      }

      const tx = await TrustChain.postJob(mockCid, finalHash, job.company, job.title);
      await tx.wait();
      console.log(`✅ On-chain success. Hash: ${finalHash}`);
      
      const jobId = await TrustChain.jobCount();

      if (job._testType === "suspicious") {
        console.log("🚩 Simulating community reports for suspicious job...");
        for (let i = 0; i < 6; i++) {
          await (await TrustChain.reportJob(jobId)).wait();
        }
      }
      
      const backendEntry = {
        ...job,
        cid: mockCid,
        ipfsHash: mockCid,
        backendTimestamp: new Date().toISOString()
      };
      delete backendEntry._testType;
      backendJobs.push(backendEntry);
    } catch (err) {
      console.warn(`⚠️  Failed to post ${job.title}: ${err.message}`);
    }
  }

  // 3. Save to backend cache
  const JOBS_FILE = path.join(__dirname, "../api/data/jobs.json");
  if (!fs.existsSync(path.dirname(JOBS_FILE))) {
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
  }
  
  let existingJobs = [];
  if (fs.existsSync(JOBS_FILE)) {
    try {
      existingJobs = JSON.parse(fs.readFileSync(JOBS_FILE, "utf8"));
    } catch {}
  }

  const updatedJobs = [...existingJobs, ...backendJobs];
  fs.writeFileSync(JOBS_FILE, JSON.stringify(updatedJobs, null, 2));
  console.log(`\n📂 Saved ${backendJobs.length} jobs to backend cache: ${JOBS_FILE}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
