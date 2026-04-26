import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function MyJobsPage() {
  const { contract, account, isOwner, isVerifiedRecruiter } = useWeb3();
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [recruiterInfo, setRecruiterInfo] = useState(null);

  const loadMyJobs = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const totalJobs = await contract.jobCount();
      const myJobs = [];
      for (let i = 1; i <= Number(totalJobs); i++) {
        try {
          const j = await contract.getJob(i);
          if (j.recruiter.toLowerCase() === account.toLowerCase()) {
            let ipfsData = null;
            try { ipfsData = await fetchFromIPFS(j.cid); } catch {}
            myJobs.push({
              id: j.id.toString(), cid: j.cid, dataHash: j.dataHash,
              recruiter: j.recruiter, timestamp: j.timestamp.toString(),
              reportCount: j.reportCount.toString(),
              isSuspicious: j.isSuspicious, isActive: j.isActive, ipfsData,
            });
          }
        } catch {}
      }
      setJobs(myJobs.reverse());

      const info = await contract.getRecruiter(account);
      setRecruiterInfo({
        reputation: info.reputation.toString(),
        jobsPosted: info.jobsPosted.toString(),
        stake: info.stake.toString(),
        joinedAt: new Date(Number(info.joinedAt) * 1000).toLocaleDateString(),
      });
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally { setLoading(false); }
  }, [contract, account]);

  useEffect(() => { loadMyJobs(); }, [loadMyJobs]);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const tx = await contract.deleteJob(jobId);
      toast.loading("Deleting...", { id: "del" });
      await tx.wait();
      toast.success("Job deleted", { id: "del" });
      loadMyJobs();
    } catch (err) {
      toast.error(err.reason || "Delete failed", { id: "del" });
    }
  };

  if (!account) return (
    <div className="min-h-screen bg-trust-bg pt-24 flex items-center justify-center">
      <p className="text-trust-muted font-mono font-bold uppercase tracking-widest text-[10px]">Access Restricted: Connect Wallet</p>
    </div>
  );

  if (!isOwner) return (
    <div className="min-h-screen bg-trust-bg pt-24 text-center px-4 flex items-center justify-center">
      <div className="max-w-md w-full py-20 bg-white border border-trust-border rounded-[40px] shadow-2xl shadow-indigo-500/5">
        <div className="text-6xl mb-8">🛡️</div>
        <h2 className="font-display text-3xl font-black text-trust-text mb-3">Authority Required</h2>
        <p className="text-trust-subtle font-body mb-8 text-sm max-w-xs mx-auto">This secure governance terminal is reserved exclusively for the contract archon.</p>
        <div className="mx-8 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
          Auth Key Missing or Invalid
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-trust-bg pt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl font-black text-trust-text">My Postings</h1>
            <p className="text-trust-subtle font-mono text-[11px] font-bold uppercase tracking-widest mt-1">Immutable employment ledger</p>
          </div>
          {isVerifiedRecruiter && (
            <Link to="/post-job"
              className="px-5 py-2.5 font-mono text-sm font-bold bg-trust-accent text-white rounded-xl hover:bg-opacity-90 transition-all">
              + Post New Job
            </Link>
          )}
        </div>

        {/* Recruiter Stats */}
        {recruiterInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Reputation", value: recruiterInfo.reputation + "/100", color: Number(recruiterInfo.reputation) >= 70 ? "text-trust-accent" : "text-amber-500" },
              { label: "Jobs Posted", value: recruiterInfo.jobsPosted, color: "text-trust-text" },
              { label: "Joined",      value: recruiterInfo.joinedAt,  color: "text-trust-subtle" },
              { label: "Stake (wei)", value: recruiterInfo.stake === "0" ? "None" : recruiterInfo.stake, color: "text-indigo-600" },
            ].map(s => (
              <div key={s.label} className="p-6 rounded-3xl bg-white border border-trust-border shadow-sm">
                <div className={`font-display text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="font-mono text-[10px] font-bold text-trust-muted mt-2 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white border border-trust-border animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📭</div>
            <p className="font-mono text-gray-500">You haven't posted any jobs yet.</p>
            {isVerifiedRecruiter && (
              <Link to="/post-job" className="inline-block mt-4 text-cyber-green font-mono hover:underline">
                Post your first job →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id}
                className={`p-5 rounded-xl border transition-all ${
                  job.isSuspicious ? "bg-red-500/5 border-red-500/30" : "bg-cyber-card border-cyber-border"
                }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-500">#{job.id}</span>
                      <h3 className="font-display text-base font-semibold text-cyber-text truncate">
                        {job.ipfsData?.title || "Untitled Job"}
                      </h3>
                      {job.isSuspicious && (
                        <span className="px-2 py-0.5 text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                          ⚠ Suspicious
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 font-mono">
                      {job.ipfsData?.company} · {job.ipfsData?.location} · {new Date(Number(job.timestamp) * 1000).toLocaleDateString()}
                    </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="font-mono text-[10px] text-trust-subtle font-bold uppercase tracking-tight">
              Reports: <span className={Number(job.reportCount) > 0 ? "text-red-500" : "text-trust-accent"}>{job.reportCount}</span>
            </span>
                      <a href={`https://gateway.pinata.cloud/ipfs/${job.cid}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-cyber-blue hover:underline">
                        IPFS ↗
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/job/${job.id}`}
                      className="px-3 py-1.5 text-xs font-mono text-cyber-green border border-cyber-green/30 rounded hover:bg-cyber-green/10 transition-all">
                      View
                    </Link>
                    <button onClick={() => handleDelete(job.id)}
                      className="px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
