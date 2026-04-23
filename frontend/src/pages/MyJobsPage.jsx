import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function MyJobsPage() {
  const { contract, account, isVerifiedRecruiter } = useWeb3();
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
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <p className="text-gray-400 font-mono">Connect wallet to view your jobs.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-pattern bg-grid pt-20">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">My Jobs</h1>
            <p className="text-gray-500 font-mono text-sm mt-1">Your posted positions on-chain</p>
          </div>
          {isVerifiedRecruiter && (
            <Link to="/post-job"
              className="px-5 py-2.5 font-mono text-sm font-bold bg-cyber-green text-cyber-dark rounded-lg hover:bg-cyber-green/90 transition-all">
              + Post New Job
            </Link>
          )}
        </div>

        {/* Recruiter Stats */}
        {recruiterInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Reputation", value: recruiterInfo.reputation + "/100", color: Number(recruiterInfo.reputation) >= 70 ? "text-cyber-green" : "text-yellow-400" },
              { label: "Jobs Posted", value: recruiterInfo.jobsPosted, color: "text-cyber-blue" },
              { label: "Joined",      value: recruiterInfo.joinedAt,  color: "text-gray-300" },
              { label: "Stake (wei)", value: recruiterInfo.stake === "0" ? "None" : recruiterInfo.stake, color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
                <div className={`font-display text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="font-mono text-xs text-gray-500 mt-1 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-cyber-card border border-cyber-border animate-pulse" />)}
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
                      <h3 className="font-display text-base font-semibold text-white truncate">
                        {job.ipfsData?.title || "Untitled Job"}
                      </h3>
                      {job.isSuspicious && (
                        <span className="px-2 py-0.5 text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                          ⚠ Suspicious
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 font-mono">
                      {job.ipfsData?.company} · {job.ipfsData?.location} · {new Date(Number(job.timestamp) * 1000).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-mono text-xs text-gray-500">
                        Reports: <span className={Number(job.reportCount) > 0 ? "text-red-400" : "text-cyber-green"}>{job.reportCount}</span>
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
