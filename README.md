# TrustChain – Fake Job Detection System 🔗

A decentralized application (DApp) that uses Ethereum blockchain + IPFS to create a tamper-proof, fraud-resistant job portal.

```
┌─────────────────────────────────────────────────────────────┐
│           TrustChain Architecture                           │
│                                                             │
│  [Job Seeker / Recruiter / Admin]                           │
│            │                                                │
│     [React + Ethers.js Frontend]                            │
│       │              │                                      │
│  [MetaMask]    [IPFS / Pinata]                              │
│       │              │                                      │
│  [Solidity Smart Contract on Ethereum Sepolia]              │
│   - Recruiter whitelist                                     │
│   - Job CID + SHA-256 hash storage                         │
│   - Fraud reporting + auto-flagging                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
trustchain/
├── contracts/
│   └── TrustChain.sol          # Main smart contract
├── scripts/
│   └── deploy.js               # Hardhat deployment script
├── test/
│   └── TrustChain.test.js      # Contract unit tests
├── hardhat.config.js           # Hardhat configuration
├── .env.example                # Environment variable template
├── package.json                # Hardhat project deps
└── frontend/
    ├── public/index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx
        ├── index.js
        ├── index.css
        ├── context/
        │   └── Web3Context.jsx     # Ethers.js + MetaMask integration
        ├── pages/
        │   ├── JobsPage.jsx        # Browse all jobs
        │   ├── JobDetailPage.jsx   # Job detail + integrity verify
        │   ├── PostJobPage.jsx     # Recruiter: post a job
        │   ├── MyJobsPage.jsx      # Recruiter: manage jobs
        │   └── AdminPage.jsx       # Admin: manage recruiters
        ├── components/
        │   ├── Navbar.jsx
        │   └── JobCard.jsx
        └── utils/
            ├── ipfs.js             # Pinata upload + hash utils
            └── contract.json       # Auto-generated after deploy
```

---

## ⚙️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | Comes with Node |
| MetaMask | Latest | https://metamask.io |
| Git | Any | https://git-scm.com |

---

## 🚀 Step-by-Step Setup

### Step 1 – Clone & Install Root Dependencies

```bash
# Navigate into the project
cd trustchain

# Install Hardhat + blockchain dependencies
npm install
```

### Step 2 – Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Your MetaMask wallet private key (export from MetaMask → Account Details)
PRIVATE_KEY=0xabc123...

# Get a free RPC URL from https://alchemy.com → Create App → Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Optional: for Etherscan verification
# Get from https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_key
```

> ⚠️ **NEVER commit your private key to Git!** `.env` is in `.gitignore`.

### Step 3 – Get Free Sepolia ETH

You need SepoliaETH to pay gas fees:

1. Go to https://sepoliafaucet.com (requires Alchemy account) **OR**
2. https://faucet.sepolia.dev **OR**
3. https://www.infura.io/faucet/sepolia

Paste your MetaMask wallet address and request ETH. You need ~0.05 ETH.

### Step 4 – Compile the Smart Contract

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully (evm target: paris)
```

### Step 5 – Run Tests

```bash
npx hardhat test
```

Expected output:
```
TrustChain
  Deployment
    ✔ Should set the correct owner
    ✔ Should auto-verify the deploying owner
    ✔ Should start with 0 jobs
  Recruiter Verification
    ✔ Should allow admin to verify a recruiter
    ✔ Should emit RecruiterVerified event
    ✔ Should revert if non-owner tries to verify
    ✔ Should revert if already verified
  ...
  16 passing
```

### Step 6 – Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
🚀 Deploying TrustChain to sepolia...
📝 Deploying with account: 0xYourAddress...
💰 Account balance: 0.5 ETH
✅ TrustChain deployed to: 0xContractAddress...
📄 Contract info saved to frontend/src/utils/contract.json
```

> ✅ The deployment script automatically saves the contract address + ABI to `frontend/src/utils/contract.json`. The frontend will use this file.

You can verify on Etherscan: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

### Step 7 – Setup Frontend

```bash
cd frontend
npm install
```

### Step 8 – Configure Pinata (IPFS)

1. Create a free account at https://pinata.cloud
2. Go to **API Keys** → **New Key**
3. Enable `pinFileToIPFS` and `pinJSONToIPFS` permissions
4. Create file `frontend/.env`:

```env
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET=your_pinata_secret_key
REACT_APP_PINATA_JWT=your_pinata_jwt_token
```

> 💡 Without Pinata keys, the app runs in **demo mode** – it generates a mock CID. Everything works except actual IPFS retrieval.

### Step 9 – Start the Frontend

```bash
# Inside the frontend/ directory
npm start
```

Opens at http://localhost:3000

---

## 🦊 MetaMask Setup

1. Install MetaMask browser extension
2. Add Sepolia Network (if not already there):
   - Network Name: `Sepolia Testnet`
   - RPC URL: `https://rpc.sepolia.org`
   - Chain ID: `11155111`
   - Currency: `ETH`
   - Explorer: `https://sepolia.etherscan.io`
3. Or click **"Switch to Sepolia"** button in the app – it adds automatically
4. Import your deployer wallet (the one that has SepoliaETH)

---

## 🧪 Testing the Full Flow

### Flow 1: Admin verifies a recruiter
1. Connect with **deployer wallet** (admin)
2. Go to **Admin panel**
3. Enter a recruiter wallet address → click **Whitelist Recruiter**
4. Confirm MetaMask transaction

### Flow 2: Recruiter posts a job
1. Connect with a **verified recruiter wallet**
2. Go to **Post Job**
3. Fill the form → click **Upload to IPFS**
   - Job JSON is uploaded to IPFS → CID returned
   - SHA-256 hash is computed
4. Click **Post to Ethereum Blockchain**
   - Confirm MetaMask transaction
   - `postJob(cid, bytes32Hash)` is called on-chain

### Flow 3: Job seeker verifies authenticity
1. Go to any job listing → click **View**
2. Click **Verify on Blockchain**
   - App fetches JSON from IPFS
   - Recomputes SHA-256 hash
   - Compares with on-chain hash
   - ✅ **"Data is authentic"** or ❌ **"Data has been tampered"**

### Flow 4: Report a fraudulent job
1. Any connected wallet can click **Report Fraud**
2. Transaction is sent on-chain
3. If 5+ reports → job auto-flagged as suspicious
4. Recruiter reputation decreases by 5 per report

### Flow 5: Test tamper detection
1. Note a job's CID
2. Go to Pinata dashboard → modify the pinned JSON
3. Click **Verify on Blockchain** on that job
4. Will show ❌ **"Data has been tampered"**

### Flow 6: Admin slashes a bad recruiter
1. Connect as admin
2. Go to Admin panel → **Slash Recruiter**
3. Enter the bad recruiter's address
4. Their verification is revoked, stake is confiscated

---

## 📜 Smart Contract Reference

**Contract Address (after deploy):** Saved in `frontend/src/utils/contract.json`

### Key Functions

| Function | Access | Description |
|----------|--------|-------------|
| `verifyRecruiter(address)` | Owner only | Whitelist a recruiter wallet |
| `slashRecruiter(address)` | Owner only | Revoke verification, slash stake |
| `postJob(cid, hash)` | Verified recruiter | Post job to blockchain |
| `getJob(jobId)` | Public | Get job details |
| `getAllJobIds()` | Public | Get all active job IDs |
| `reportJob(jobId)` | Any wallet | Report fraudulent job |
| `deleteJob(jobId)` | Recruiter / Owner | Deactivate a job |
| `verifyJobIntegrity(jobId, hash)` | Public | On-chain hash comparison |
| `depositStake()` | Verified recruiter | Stake ETH for trust |
| `getRecruiter(address)` | Public | Get recruiter info |

### Key State

```solidity
mapping(address => bool) public isVerifiedRecruiter;

struct Job {
    uint256 id;
    string  cid;          // IPFS CID
    bytes32 dataHash;     // SHA-256 of job JSON
    address recruiter;
    uint256 timestamp;
    uint256 reportCount;
    bool    isSuspicious; // auto-flagged at 5 reports
    bool    isActive;
}
```

---

## 🔒 Security Model

| Threat | Mitigation |
|--------|-----------|
| Fake job posting | Only whitelisted recruiters can post |
| Data tampering | SHA-256 hash stored on-chain; mismatch detected |
| Spam reporting | One report per wallet per job (tracked in mapping) |
| Self-reporting | Contract rejects recruiter reporting own job |
| Bad recruiters | Admin can slash and revoke; reputation system |
| Replay attacks | Ethereum nonces prevent transaction replay |

---

## 🌐 Local Development (Without Sepolia)

You can develop locally using Hardhat's built-in network:

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
cd frontend && npm start
```

In MetaMask, add network:
- RPC: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Use the private keys printed by `npx hardhat node`

---

## 💡 Bonus Features (Implemented)

- ✅ **Reputation system** – score decreases per report, shown in Admin
- ✅ **Token staking** – recruiters can `depositStake()` with SepoliaETH
- ✅ **Auto-flagging** – jobs auto-marked suspicious at 5 reports
- ✅ **Admin slash** – stake confiscation on misconduct
- ✅ **Integrity verification** – SHA-256 recompute vs on-chain hash

---

## 🏗️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20 |
| Development | Hardhat |
| Testnet | Ethereum Sepolia (chainId: 11155111) |
| Frontend | React 18 + Tailwind CSS |
| Blockchain SDK | Ethers.js v6 |
| Wallet | MetaMask |
| Storage | IPFS via Pinata |
| Hashing | SHA-256 (js-sha256) |

---

## 📞 Support

- Alchemy Sepolia RPC: https://alchemy.com
- Sepolia Faucet: https://sepoliafaucet.com
- Pinata IPFS: https://pinata.cloud
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js v6: https://docs.ethers.org/v6

---

*Built with ❤️ for the decentralized future of trustworthy hiring.*
