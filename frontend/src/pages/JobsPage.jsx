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
    try {
      setLoading(true);
      // 1. Fetch from Backend (Fast Cache) - Always do this first
      let backendJobs = [];
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/jobs`);
        if (res.ok) backendJobs = await res.json();
      } catch (err) {
        console.warn("Backend cache fetch failed:", err);
      }

      let blockchainResults = [];
      
      // 2. Try to Fetch from Blockchain if contract exists
      if (contract) {
        try {
          const ids = await contract.getAllJobIds();
          const jobPromises = ids.map(async (id) => {
            try {
              const j = await contract.getJob(id);
              const jobId = j.id.toString();
              
              let ipfsData = backendJobs.find(bj => bj.cid === j.cid);
              if (!ipfsData) {
                try { ipfsData = await fetchFromIPFS(j.cid); } catch { ipfsData = null; }
              }
              
              const verification = ipfsData ? verifyIntegrity(ipfsData, j.dataHash) : { valid: false };
              
              return {
                id: jobId,
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
            } catch (e) {
              console.error(`Error loading job ${id}:`, e);
              return null;
            }
          });
          blockchainResults = (await Promise.all(jobPromises)).filter(Boolean);
        } catch (bcErr) {
          console.warn("Blockchain fetch failed:", bcErr);
        }
      }
      
      // 3. Merge & Deduplicate
      // Find jobs that are in the backend but NOT on-chain yet
      const backendOnlyJobs = backendJobs.filter(bj => 
        !blockchainResults.some(br => br.cid === bj.cid)
      ).map(bj => ({
        id: `pending-${bj.cid.slice(0, 8)}`,
        cid: bj.cid,
        dataHash: bj.ipfsHash || bj.cid, 
        recruiter: bj.postedBy,
        timestamp: bj.postedAt || bj.backendTimestamp,
        reportCount: "0",
        isSuspicious: false,
        isActive: true,
        ipfsData: bj,
        verifyStatus: "portal-only",
      }));

      const allJobs = [...blockchainResults, ...backendOnlyJobs];
      setJobs(allJobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
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
    <div className="min-h-screen bg-trust-bg bg-grid-pattern bg-grid pt-24">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 bg-trust-accent/10 border border-trust-accent/20 rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-trust-accent animate-pulse" />
            <span className="font-mono text-[10px] font-black text-trust-accent tracking-[0.2em] uppercase">Immutable Hiring Infrastructure</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black text-trust-text mb-6">
            Future of <span className="text-trust-accent">Trust</span>
          </h1>
          <p className="text-trust-subtle font-body max-w-2xl mx-auto text-xl leading-relaxed">
            Every job posting is verified on the Ethereum blockchain and stored on IPFS. 
            No fakes, just talent.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto">
          {[
            { label: "On-Chain Jobs", value: jobs.length, color: "text-trust-text" },
            { label: "Verified",      value: jobs.filter(j => j.verifyStatus === "valid" && !j.isSuspicious).length, color: "text-trust-accent" },
            { label: "Fraud Flagged", value: jobs.filter(j => j.isSuspicious).length,  color: "text-red-500" },
          ].map(s => (
            <div key={s.label} className="text-center p-6 rounded-3xl bg-white border border-trust-border shadow-sm hover:shadow-md transition-shadow">
              <div className={`font-display text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="font-mono text-[10px] font-bold text-trust-muted mt-2 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 px-2">
          <div className="flex p-1 bg-trust-border/50 rounded-2xl border border-trust-border">
            {["all", "verified", "suspicious"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl font-mono text-[11px] font-black capitalize tracking-widest transition-all ${
                  filter === f
                    ? "bg-white text-trust-accent shadow-sm"
                    : "text-trust-subtle hover:text-trust-text"
                }`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={loadJobs} disabled={loading}
            className="group flex items-center gap-2 px-6 py-2.5 font-mono text-[11px] font-black text-trust-accent bg-white border border-trust-accent/20 rounded-2xl hover:bg-trust-accent hover:text-white transition-all shadow-sm">
            <span>{loading ? "Syncing..." : "Sync Node"}</span>
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
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
