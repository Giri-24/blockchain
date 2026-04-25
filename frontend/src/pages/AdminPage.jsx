import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { contract, account, isOwner } = useWeb3();
  const [recruiterAddr, setRecruiterAddr] = useState("");
  const [verifying, setVerifying]         = useState(false);
  const [slashAddr, setSlashAddr]         = useState("");
  const [slashing, setSlashing]           = useState(false);
  const [allJobs, setAllJobs]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [checkAddr, setCheckAddr]         = useState("");
  const [checkResult, setCheckResult]     = useState(null);

  const loadAllJobs = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const total = await contract.jobCount();
      const jobs = [];
      for (let i = 1; i <= Number(total); i++) {
        try {
          const j = await contract.getJob(i);
          let ipfsData = null;
          try { ipfsData = await fetchFromIPFS(j.cid); } catch {}
          jobs.push({
            id: j.id.toString(), cid: j.cid, recruiter: j.recruiter,
            timestamp: j.timestamp.toString(),
            reportCount: j.reportCount.toString(),
            isSuspicious: j.isSuspicious, isActive: j.isActive, ipfsData,
          });
        } catch {}
      }
      setAllJobs(jobs.reverse());
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally { setLoading(false); }
  }, [contract]);

  useEffect(() => { if (isOwner) loadAllJobs(); }, [isOwner, loadAllJobs]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!recruiterAddr) return;
    setVerifying(true);
    try {
      const tx = await contract.verifyRecruiter(recruiterAddr);
      toast.loading("Verifying...", { id: "v" });
      await tx.wait();
      toast.success(`Recruiter ${recruiterAddr.slice(0,10)}... verified!`, { id: "v" });
      setRecruiterAddr("");
    } catch (err) {
      toast.error(err.reason || "Verification failed", { id: "v" });
    } finally { setVerifying(false); }
  };

  const handleSlash = async (e) => {
    e.preventDefault();
    if (!slashAddr || !window.confirm(`Slash recruiter ${slashAddr}?`)) return;
    setSlashing(true);
    try {
      const tx = await contract.slashRecruiter(slashAddr);
      toast.loading("Slashing...", { id: "s" });
      await tx.wait();
      toast.success("Recruiter slashed and de-verified!", { id: "s" });
      setSlashAddr("");
    } catch (err) {
      toast.error(err.reason || "Slash failed", { id: "s" });
    } finally { setSlashing(false); }
  };

  const handleCheckRecruiter = async () => {
    if (!checkAddr || !contract) return;
    try {
      const [isVerified, reputation, jobsPosted, stake, joinedAt] = await contract.getRecruiter(checkAddr);
      setCheckResult({ isVerified, reputation: reputation.toString(), jobsPosted: jobsPosted.toString(), stake: stake.toString(), joinedAt: joinedAt.toString() });
    } catch (err) {
      toast.error("Failed to fetch recruiter info");
    }
  };

  const handleAdminDelete = async (jobId) => {
    if (!window.confirm("Delete job #" + jobId + "?")) return;
    try {
      const tx = await contract.deleteJob(jobId);
      toast.loading("Deleting...", { id: "d" });
      await tx.wait();
      toast.success("Job deleted", { id: "d" });
      loadAllJobs();
    } catch (err) {
      toast.error(err.reason || "Delete failed", { id: "d" });
    }
  };

  if (!account) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <p className="text-gray-600 font-mono">Connect wallet to access admin panel.</p>
    </div>
  );

  if (!isOwner) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="font-display text-xl text-cyber-text mb-2">Access Denied</h2>
        <p className="text-gray-600 font-mono">This panel is restricted to the contract owner.</p>
        <p className="font-mono text-xs text-gray-500 mt-2">Your address: {account}</p>
      </div>
    </div>
  );

  const suspicious = allJobs.filter(j => j.isSuspicious);

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-pattern bg-grid pt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-1 font-mono text-xs bg-purple-500/20 text-purple-600 border border-purple-500/40 rounded">ADMIN</span>
          <h1 className="font-display text-3xl font-bold text-cyber-text">Control Panel</h1>
        </div>
        <p className="text-gray-500 font-mono text-sm mb-8">Manage recruiters and monitor fraud</p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Jobs",  value: allJobs.length,    color: "text-cyber-text" },
            { label: "Flagged",     value: suspicious.length, color: "text-red-500" },
            { label: "Active",      value: allJobs.filter(j => !j.isSuspicious).length, color: "text-cyber-green" },
            { label: "Owner",       value: account?.slice(0,6)+"...", color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="font-mono text-xs text-gray-500 mt-1 uppercase">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Verify Recruiter */}
          <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border">
            <h2 className="font-display text-base font-semibold text-cyber-text uppercase tracking-wide mb-4">
              ✅ Verify Recruiter
            </h2>
            <form onSubmit={handleVerify} className="space-y-3">
              <input value={recruiterAddr} onChange={e => setRecruiterAddr(e.target.value)}
                placeholder="0x... wallet address"
                className="w-full px-3 py-2.5 bg-gray-50 border border-cyber-border text-cyber-text font-mono text-sm rounded-lg placeholder-gray-400 focus:outline-none focus:border-cyber-green/50" />
              <button type="submit" disabled={verifying || !recruiterAddr}
                className="w-full py-2.5 font-mono text-sm font-bold bg-cyber-green text-cyber-dark rounded-lg hover:bg-cyber-green/90 disabled:opacity-50 transition-all">
                {verifying ? "Verifying..." : "Whitelist Recruiter"}
              </button>
            </form>
          </div>

          {/* Slash Recruiter */}
          <div className="p-6 rounded-xl bg-cyber-card border border-red-500/20">
            <h2 className="font-display text-base font-semibold text-cyber-text uppercase tracking-wide mb-4">
              ⚡ Slash Recruiter
            </h2>
            <form onSubmit={handleSlash} className="space-y-3">
              <input value={slashAddr} onChange={e => setSlashAddr(e.target.value)}
                placeholder="0x... wallet address"
                className="w-full px-3 py-2.5 bg-gray-50 border border-red-500/30 text-cyber-text font-mono text-sm rounded-lg placeholder-gray-400 focus:outline-none focus:border-red-500/50" />
              <button type="submit" disabled={slashing || !slashAddr}
                className="w-full py-2.5 font-mono text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/30 disabled:opacity-50 transition-all">
                {slashing ? "Slashing..." : "Revoke & Slash"}
              </button>
            </form>
          </div>

          {/* Check Recruiter */}
          <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-cyber-text uppercase tracking-wide mb-4">
              🔍 Check Recruiter Status
            </h2>
            <div className="flex gap-3">
              <input value={checkAddr} onChange={e => setCheckAddr(e.target.value)}
                placeholder="0x... wallet address to inspect"
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-cyber-border text-cyber-text font-mono text-sm rounded-lg placeholder-gray-400 focus:outline-none focus:border-cyber-blue/50" />
              <button onClick={handleCheckRecruiter}
                className="px-5 py-2.5 font-mono text-sm text-cyber-blue border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/10 transition-all">
                Check
              </button>
            </div>
            {checkResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Verified",   value: checkResult.isVerified ? "✓ Yes" : "✗ No", color: checkResult.isVerified ? "text-cyber-green" : "text-red-400" },
                  { label: "Reputation", value: checkResult.reputation + "/100" },
                  { label: "Jobs",       value: checkResult.jobsPosted },
                  { label: "Stake",      value: checkResult.stake + " wei" },
                  { label: "Joined",     value: new Date(Number(checkResult.joinedAt) * 1000).toLocaleDateString() },
                ].map(r => (
                  <div key={r.label} className="text-center">
                    <div className={`font-mono text-sm font-bold ${r.color || "text-cyber-text"}`}>{r.value}</div>
                    <div className="font-mono text-xs text-gray-500 mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Jobs Monitor */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-cyber-text">All Jobs Monitor</h2>
            <button onClick={loadAllJobs} className="font-mono text-xs text-gray-500 hover:text-white transition-colors">
              ↻ Refresh
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-cyber-card border border-cyber-border animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {allJobs.map(job => (
                <div key={job.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    job.isSuspicious ? "bg-red-500/5 border-red-500/30" : "bg-cyber-card border-cyber-border"
                  }`}>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-gray-500">#{job.id}</span>
                    <div>
                      <p className="font-mono text-sm text-cyber-text">{job.ipfsData?.title || "Untitled"}</p>
                      <p className="font-mono text-xs text-gray-600">{job.recruiter?.slice(0, 14)}...</p>
                    </div>
                    {job.isSuspicious && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                        ⚠ {job.reportCount} reports
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs ${Number(job.reportCount) > 0 ? "text-red-400" : "text-gray-600"}`}>
                      {job.reportCount} reports
                    </span>
                    <button onClick={() => handleAdminDelete(job.id)}
                      className="px-2.5 py-1 text-xs font-mono text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {allJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-mono">No jobs posted yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
