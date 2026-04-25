import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS, verifyIntegrity } from "../utils/ipfs";
import JobCard from "../components/JobCard";
import toast from "react-hot-toast";

export default function JobsPage() {
  const { contract, account, connectWallet, isConnecting } = useWeb3();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState("all"); // all | verified | suspicious

  const loadJobs = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const ids = await contract.getAllJobIds();
      const jobPromises = ids.map(async (id) => {
        try {
          const j = await contract.getJob(id);
          let ipfsData = null;
          try { ipfsData = await fetchFromIPFS(j.cid); } catch {}
          
          const verification = ipfsData ? verifyIntegrity(ipfsData, j.dataHash) : { valid: false };
          
          return {
            id: j.id.toString(),
            cid: j.cid,
            dataHash: j.dataHash,
            recruiter: j.recruiter,
            timestamp: j.timestamp.toString(),
            reportCount: j.reportCount.toString(),
            isSuspicious: j.isSuspicious,
            isActive: j.isActive,
            ipfsData,
            verifyStatus: verification.valid ? "valid" : "invalid",
          };
          } catch { return null; }
      });
      const results = (await Promise.all(jobPromises)).filter(Boolean);
      setJobs(results.reverse()); // newest first
    } catch (err) {
      console.error(err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleReport = async (jobId) => {
    if (!account) { toast.error("Connect wallet to report"); return; }
    try {
      const tx = await contract.reportJob(jobId);
      toast.loading("Submitting report...", { id: "report" });
      await tx.wait();
      toast.success("Job reported!", { id: "report" });
      loadJobs();
    } catch (err) {
      toast.error(err.reason || err.message || "Report failed", { id: "report" });
    }
  };

  const filtered = jobs.filter(j => {
    if (filter === "verified")   return j.verifyStatus === "valid" && !j.isSuspicious;
    if (filter === "suspicious") return j.isSuspicious;
    return true;
  });

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-pattern bg-grid pt-20">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-cyber-green/10 border border-cyber-green/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <span className="font-mono text-xs text-cyber-green tracking-widest uppercase">Blockchain-Verified Jobs</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyber-text mb-4">
            Find <span className="text-cyber-green">Authentic</span> Jobs
          </h1>
          <p className="text-gray-600 font-body max-w-2xl mx-auto text-lg">
            Every job posting is verified on Ethereum and stored on IPFS.
            Tamper-proof. Trustless. Transparent.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          {[
            { label: "Total Jobs",  value: jobs.length, color: "text-cyber-blue" },
            { label: "Verified",    value: jobs.filter(j => j.verifyStatus === "valid" && !j.isSuspicious).length, color: "text-cyber-green" },
            { label: "Flagged",     value: jobs.filter(j => j.isSuspicious).length,  color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-cyber-card border border-cyber-border">
              <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2">
            {["all", "verified", "suspicious"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded font-mono text-sm capitalize transition-all ${
                  filter === f
                    ? "bg-cyber-green text-white font-bold shadow-lg shadow-cyber-green/20"
                    : "bg-white text-gray-600 border border-cyber-border hover:border-cyber-green/30"
                }`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={loadJobs} disabled={loading}
            className="px-4 py-1.5 font-mono text-sm text-cyber-blue border border-cyber-blue/30 rounded hover:bg-cyber-blue/10 transition-all disabled:opacity-50">
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {/* Content */}
        {!account ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyber-card border border-cyber-border flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-display text-xl text-cyber-text mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-6 font-body">View blockchain-verified jobs by connecting MetaMask</p>
            <button onClick={connectWallet} disabled={isConnecting}
              className="px-6 py-3 font-mono font-bold bg-cyber-green text-cyber-dark rounded-lg hover:bg-cyber-green/90 transition-all">
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-cyber-card border border-cyber-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-mono">No jobs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(job => (
              <div key={job.id} className="animate-fade-up">
                <JobCard job={job} onReport={handleReport} canReport={!!account} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
