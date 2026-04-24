// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustChain - Fake Job Detection System
 * @dev Decentralized job portal with recruiter verification and fraud detection
 */
contract TrustChain {
    // ─── State Variables ───────────────────────────────────────────────────────

    address public owner;
    uint256 public jobCount;
    uint256 public constant REPORT_THRESHOLD = 5;
    uint256 public constant STAKE_AMOUNT = 0.01 ether;

    // ─── Structs ───────────────────────────────────────────────────────────────

    struct Job {
        uint256 id;
        string  cid;          // IPFS Content Identifier
        bytes32 dataHash;     // SHA-256 hash of job JSON for integrity check
        address recruiter;
        uint256 timestamp;
        uint256 reportCount;
        bool    isSuspicious;
        bool    isActive;
    }

    struct Recruiter {
        bool    isVerified;
        uint256 reputation;   // 0-100 score
        uint256 jobsPosted;
        uint256 stake;        // ETH staked
        uint256 joinedAt;
    }

    // ─── Mappings ──────────────────────────────────────────────────────────────

    mapping(address => bool)        public isVerifiedRecruiter;
    mapping(address => Recruiter)   public recruiters;
    mapping(uint256 => Job)         public jobs;
    mapping(uint256 => mapping(address => bool)) public hasReported;
    mapping(bytes32 => bool) public jobExistsHash; // Prevent duplicates using signature

    // ─── Events ────────────────────────────────────────────────────────────────

    event RecruiterVerified(address indexed recruiter, uint256 timestamp);
    event RecruiterSlashed(address indexed recruiter, uint256 slashedAmount);
    event JobVerified(uint256 indexed jobId, string company, string title, uint256 timestamp); // Transparency Log
    event JobPosted(uint256 indexed jobId, address indexed recruiter, string cid, bytes32 dataHash, uint256 timestamp);
    event JobReported(uint256 indexed jobId, address indexed reporter, uint256 reportCount);
    event JobMarkedSuspicious(uint256 indexed jobId, uint256 reportCount);
    event JobDeleted(uint256 indexed jobId, address indexed recruiter);
    event StakeDeposited(address indexed recruiter, uint256 amount);

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "TrustChain: caller is not the owner");
        _;
    }

    modifier onlyVerifiedRecruiter() {
        require(isVerifiedRecruiter[msg.sender], "TrustChain: not a verified recruiter");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobId > 0 && jobId <= jobCount, "TrustChain: job does not exist");
        require(jobs[jobId].isActive, "TrustChain: job is not active");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // Auto-verify the deploying address as a recruiter for testing
        _verifyRecruiter(msg.sender);
    }

    // ─── Admin Functions ───────────────────────────────────────────────────────

    /**
     * @dev Whitelist a recruiter wallet address (admin only)
     * @param recruiter The wallet address to verify
     */
    function verifyRecruiter(address recruiter) external onlyOwner {
        _verifyRecruiter(recruiter);
    }

    function _verifyRecruiter(address recruiter) internal {
        require(recruiter != address(0), "TrustChain: invalid address");
        require(!isVerifiedRecruiter[recruiter], "TrustChain: already verified");

        isVerifiedRecruiter[recruiter] = true;
        recruiters[recruiter] = Recruiter({
            isVerified:  true,
            reputation:  100,
            jobsPosted:  0,
            stake:       0,
            joinedAt:    block.timestamp
        });

        emit RecruiterVerified(recruiter, block.timestamp);
    }

    /**
     * @dev Revoke recruiter verification and slash their stake
     * @param recruiter The recruiter address to slash
     */
    function slashRecruiter(address recruiter) external onlyOwner {
        require(isVerifiedRecruiter[recruiter], "TrustChain: not a verified recruiter");

        uint256 slashedAmount = recruiters[recruiter].stake;
        recruiters[recruiter].stake = 0;
        isVerifiedRecruiter[recruiter] = false;
        recruiters[recruiter].isVerified = false;

        if (slashedAmount > 0) {
            (bool sent,) = owner.call{value: slashedAmount}("");
            require(sent, "TrustChain: ETH transfer failed");
        }

        emit RecruiterSlashed(recruiter, slashedAmount);
    }

    // ─── Recruiter Functions ───────────────────────────────────────────────────

    /**
     * @dev Deposit stake as a recruiter (optional but boosts reputation)
     */
    function depositStake() external payable onlyVerifiedRecruiter {
        require(msg.value >= STAKE_AMOUNT, "TrustChain: insufficient stake amount");
        recruiters[msg.sender].stake += msg.value;
        emit StakeDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Post a job to the blockchain (requires verified signature)
     * @param cid IPFS Content Identifier of the job JSON
     * @param dataHash SHA-256 hash of the job JSON for integrity verification
     * @param company Company name string (used for duplicate verification)
     * @param title Job title string (used for duplicate verification)
     */
    function postJob(string memory cid, bytes32 dataHash, string memory company, string memory title) external onlyVerifiedRecruiter {
        require(bytes(cid).length > 0, "TrustChain: CID cannot be empty");
        require(dataHash != bytes32(0), "TrustChain: dataHash cannot be empty");

        // Duplicate Preventer: Only unique jobs are added
        bytes32 uniqueSig = keccak256(abi.encodePacked(company, title));
        require(!jobExistsHash[uniqueSig], "TrustChain: Duplicate Job Detected on Blockchain");
        jobExistsHash[uniqueSig] = true;

        jobCount++;
        jobs[jobCount] = Job({
            id:           jobCount,
            cid:          cid,
            dataHash:     dataHash,
            recruiter:    msg.sender,
            timestamp:    block.timestamp,
            reportCount:  0,
            isSuspicious: false,
            isActive:     true
        });

        recruiters[msg.sender].jobsPosted++;

        emit JobVerified(jobCount, company, title, block.timestamp);
        emit JobPosted(jobCount, msg.sender, cid, dataHash, block.timestamp);
    }

    /**
     * @dev Get job details by ID
     * @param jobId The job ID to retrieve
     */
    function getJob(uint256 jobId) external view jobExists(jobId) returns (
        uint256 id,
        string  memory cid,
        bytes32 dataHash,
        address recruiter,
        uint256 timestamp,
        uint256 reportCount,
        bool    isSuspicious,
        bool    isActive
    ) {
        Job storage job = jobs[jobId];
        return (
            job.id,
            job.cid,
            job.dataHash,
            job.recruiter,
            job.timestamp,
            job.reportCount,
            job.isSuspicious,
            job.isActive
        );
    }

    /**
     * @dev Get all active job IDs
     */
    function getAllJobIds() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].isActive) activeCount++;
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= jobCount; i++) {
            if (jobs[i].isActive) {
                activeIds[idx++] = i;
            }
        }
        return activeIds;
    }

    /**
     * @dev Report a fraudulent job
     * @param jobId The job ID to report
     */
    function reportJob(uint256 jobId) external jobExists(jobId) {
        require(!hasReported[jobId][msg.sender], "TrustChain: already reported this job");
        require(jobs[jobId].recruiter != msg.sender, "TrustChain: cannot report own job");

        hasReported[jobId][msg.sender] = true;
        jobs[jobId].reportCount++;

        // Decrease recruiter reputation
        address recruiter = jobs[jobId].recruiter;
        if (recruiters[recruiter].reputation >= 5) {
            recruiters[recruiter].reputation -= 5;
        } else {
            recruiters[recruiter].reputation = 0;
        }

        emit JobReported(jobId, msg.sender, jobs[jobId].reportCount);

        // Auto-flag if threshold exceeded
        if (jobs[jobId].reportCount >= REPORT_THRESHOLD && !jobs[jobId].isSuspicious) {
            jobs[jobId].isSuspicious = true;
            emit JobMarkedSuspicious(jobId, jobs[jobId].reportCount);
        }
    }

    /**
     * @dev Recruiter can delete their own job
     * @param jobId The job ID to delete
     */
    function deleteJob(uint256 jobId) external jobExists(jobId) {
        require(jobs[jobId].recruiter == msg.sender || msg.sender == owner,
            "TrustChain: not authorized to delete");
        jobs[jobId].isActive = false;
        emit JobDeleted(jobId, msg.sender);
    }

    /**
     * @dev Verify job data integrity on-chain
     * @param jobId The job ID to verify
     * @param providedHash The hash to compare against stored hash
     */
    function verifyJobIntegrity(uint256 jobId, bytes32 providedHash) external view jobExists(jobId) returns (bool) {
        return jobs[jobId].dataHash == providedHash;
    }

    /**
     * @dev Get recruiter details
     */
    function getRecruiter(address recruiter) external view returns (
        bool    isVerified,
        uint256 reputation,
        uint256 jobsPosted,
        uint256 stake,
        uint256 joinedAt
    ) {
        Recruiter storage r = recruiters[recruiter];
        return (r.isVerified, r.reputation, r.jobsPosted, r.stake, r.joinedAt);
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
