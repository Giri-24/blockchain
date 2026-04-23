const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustChain", function () {
  let trustChain;
  let owner, recruiter1, recruiter2, jobSeeker1, jobSeeker2;

  const SAMPLE_CID = "QmTestCID123456789abcdef";
  const SAMPLE_HASH = ethers.keccak256(ethers.toUtf8Bytes('{"title":"Software Engineer","company":"TechCorp"}'));

  beforeEach(async function () {
    [owner, recruiter1, recruiter2, jobSeeker1, jobSeeker2] = await ethers.getSigners();

    const TrustChain = await ethers.getContractFactory("TrustChain");
    trustChain = await TrustChain.deploy();
    await trustChain.waitForDeployment();
  });

  // ─── Deployment ──────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await trustChain.owner()).to.equal(owner.address);
    });

    it("Should auto-verify the deploying owner", async function () {
      expect(await trustChain.isVerifiedRecruiter(owner.address)).to.be.true;
    });

    it("Should start with 0 jobs", async function () {
      expect(await trustChain.jobCount()).to.equal(0);
    });
  });

  // ─── Recruiter Verification ───────────────────────────────────────────────
  describe("Recruiter Verification", function () {
    it("Should allow admin to verify a recruiter", async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
      expect(await trustChain.isVerifiedRecruiter(recruiter1.address)).to.be.true;
    });

    it("Should emit RecruiterVerified event", async function () {
      await expect(trustChain.verifyRecruiter(recruiter1.address))
        .to.emit(trustChain, "RecruiterVerified")
        .withArgs(recruiter1.address, await getTimestamp());
    });

    it("Should revert if non-owner tries to verify", async function () {
      await expect(
        trustChain.connect(recruiter1).verifyRecruiter(recruiter2.address)
      ).to.be.revertedWith("TrustChain: caller is not the owner");
    });

    it("Should revert if already verified", async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
      await expect(
        trustChain.verifyRecruiter(recruiter1.address)
      ).to.be.revertedWith("TrustChain: already verified");
    });
  });

  // ─── Job Posting ──────────────────────────────────────────────────────────
  describe("Job Posting", function () {
    beforeEach(async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
    });

    it("Should allow verified recruiter to post a job", async function () {
      await trustChain.connect(recruiter1).postJob(SAMPLE_CID, SAMPLE_HASH);
      expect(await trustChain.jobCount()).to.equal(1);
    });

    it("Should store correct job data", async function () {
      await trustChain.connect(recruiter1).postJob(SAMPLE_CID, SAMPLE_HASH);
      const job = await trustChain.getJob(1);
      expect(job.cid).to.equal(SAMPLE_CID);
      expect(job.dataHash).to.equal(SAMPLE_HASH);
      expect(job.recruiter).to.equal(recruiter1.address);
      expect(job.isActive).to.be.true;
      expect(job.isSuspicious).to.be.false;
    });

    it("Should emit JobPosted event", async function () {
      await expect(trustChain.connect(recruiter1).postJob(SAMPLE_CID, SAMPLE_HASH))
        .to.emit(trustChain, "JobPosted")
        .withArgs(1, recruiter1.address, SAMPLE_CID, SAMPLE_HASH, await getTimestamp());
    });

    it("Should revert if unverified recruiter tries to post", async function () {
      await expect(
        trustChain.connect(recruiter2).postJob(SAMPLE_CID, SAMPLE_HASH)
      ).to.be.revertedWith("TrustChain: not a verified recruiter");
    });

    it("Should revert with empty CID", async function () {
      await expect(
        trustChain.connect(recruiter1).postJob("", SAMPLE_HASH)
      ).to.be.revertedWith("TrustChain: CID cannot be empty");
    });
  });

  // ─── Job Reporting ────────────────────────────────────────────────────────
  describe("Job Reporting", function () {
    beforeEach(async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
      await trustChain.connect(recruiter1).postJob(SAMPLE_CID, SAMPLE_HASH);
    });

    it("Should allow job seeker to report a job", async function () {
      await trustChain.connect(jobSeeker1).reportJob(1);
      const job = await trustChain.getJob(1);
      expect(job.reportCount).to.equal(1);
    });

    it("Should prevent double-reporting", async function () {
      await trustChain.connect(jobSeeker1).reportJob(1);
      await expect(
        trustChain.connect(jobSeeker1).reportJob(1)
      ).to.be.revertedWith("TrustChain: already reported this job");
    });

    it("Should mark job suspicious after threshold", async function () {
      const signers = await ethers.getSigners();
      // Report 5 times from different accounts
      for (let i = 5; i < 10; i++) {
        await trustChain.connect(signers[i]).reportJob(1);
      }
      const job = await trustChain.getJob(1);
      expect(job.isSuspicious).to.be.true;
      expect(job.reportCount).to.equal(5);
    });

    it("Should prevent recruiter from reporting own job", async function () {
      await expect(
        trustChain.connect(recruiter1).reportJob(1)
      ).to.be.revertedWith("TrustChain: cannot report own job");
    });
  });

  // ─── Integrity Verification ───────────────────────────────────────────────
  describe("Integrity Verification", function () {
    beforeEach(async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
      await trustChain.connect(recruiter1).postJob(SAMPLE_CID, SAMPLE_HASH);
    });

    it("Should return true for correct hash", async function () {
      expect(await trustChain.verifyJobIntegrity(1, SAMPLE_HASH)).to.be.true;
    });

    it("Should return false for tampered hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered data"));
      expect(await trustChain.verifyJobIntegrity(1, tamperedHash)).to.be.false;
    });
  });

  // ─── Slash Recruiter ──────────────────────────────────────────────────────
  describe("Slash Recruiter", function () {
    beforeEach(async function () {
      await trustChain.verifyRecruiter(recruiter1.address);
    });

    it("Should revoke recruiter verification", async function () {
      await trustChain.slashRecruiter(recruiter1.address);
      expect(await trustChain.isVerifiedRecruiter(recruiter1.address)).to.be.false;
    });

    it("Should emit RecruiterSlashed event", async function () {
      await expect(trustChain.slashRecruiter(recruiter1.address))
        .to.emit(trustChain, "RecruiterSlashed")
        .withArgs(recruiter1.address, 0);
    });
  });

  // Helper
  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1;
  }
});
