import axios from "axios";
import { sha256 } from "js-sha256";

// Use the deployed backend URL, or localhost for local testing
const BACKEND_URL       = process.env.REACT_APP_API_URL       || "http://localhost:3001";
const PINATA_BASE_URL   = "https://api.pinata.cloud";
const IPFS_GATEWAY      = "https://gateway.pinata.cloud/ipfs";

/**
 * Upload JSON data to IPFS via Pinata
 * @param {Object} jobData - Job data to upload
 * @returns {{ cid: string, hash: string }} IPFS CID and SHA-256 hash
 */
export async function uploadToIPFS(jobData) {
  const jsonString = JSON.stringify(jobData, null, 2);
  const hash = computeHash(jsonString);

  // Add hash to the data for self-verification
  const dataWithHash = { ...jobData, integrity: { sha256: hash, timestamp: Date.now() } };

  try {
    let cid;

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/upload-ipfs`,
        {
          pinataContent: dataWithHash,
          pinataMetadata: { name: `TrustChain_Job_${Date.now()}` },
          pinataOptions: { cidVersion: 1 },
        }
      );
      cid = response.data.cid;
    } catch (apiError) {
      console.warn("⚠️  Backend API failed, trying demo mode CID:", apiError.message);
      // Demo mode fallback if backend is not reachable
      cid = "Qm" + hash.substring(0, 44);
    }

    return { cid, hash };
  } catch (err) {
    console.error("IPFS upload error:", err);
    throw new Error("Failed to upload to IPFS: " + (err.response?.data?.error || err.message));
  }
}

/**
 * Fetch job data from IPFS
 * @param {string} cid - IPFS Content Identifier
 * @returns {Object} Job data
 */
export async function fetchFromIPFS(cid) {
  const gateways = [
    `${IPFS_GATEWAY}/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ];

  for (const gateway of gateways) {
    try {
      const response = await axios.get(gateway, { timeout: 10000 });
      return response.data;
    } catch {
      continue;
    }
  }
  throw new Error("Failed to fetch from IPFS – all gateways failed");
}

/**
 * Compute SHA-256 hash of a JSON string
 * @param {string|Object} data
 * @returns {string} hex hash
 */
export function computeHash(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return sha256(str);
}

/**
 * Convert hex hash to bytes32 for Solidity
 * @param {string} hexHash - 64-char hex string
 * @returns {string} bytes32 hex prefixed with 0x
 */
export function hashToBytes32(hexHash) {
  return "0x" + hexHash.padStart(64, "0");
}

/**
 * Verify job data integrity against blockchain hash
 * @param {Object} jobData - Raw IPFS data
 * @param {string} storedHash - bytes32 hash from blockchain
 * @returns {{ valid: boolean, computedHash: string }}
 */
export function verifyIntegrity(jobData, storedHash) {
  // Remove the integrity field before re-hashing (it's metadata)
  const { integrity, ...coreData } = jobData;
  const jsonString = JSON.stringify(coreData, null, 2);
  const computedHex = computeHash(jsonString);
  const computedBytes32 = hashToBytes32(computedHex);

  return {
    valid: computedBytes32.toLowerCase() === storedHash.toLowerCase(),
    computedHash: computedBytes32,
    storedHash,
  };
}

export const IPFS_GATEWAY_URL = IPFS_GATEWAY;
