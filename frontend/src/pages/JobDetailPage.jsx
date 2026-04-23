import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS, computeHash, hashToBytes32 } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function JobDetailPage() {
  const { id }          = useParams();
  const { contract, account } = useWeb3();
  const [job, setJob]   = useState(null);
  const [ipfsData, setIpfsData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState(null); // null | 'valid' | 'tampered'
  const [reporting, setReporting] = useState(false);

  const loadJob = useCallback(async () => {
    if (!contract || !id) return;
    setLoading(true);
    try {
      const j = await contract.getJob(id);
      setJob({
        id: j.id.toString(), cid: j.cid, dataHash: j.dataHash,
        recruiter: j.recruiter, timestamp: j.timestamp.toString(),
        reportCount: j.reportCount.toString(),
        isSuspicious: j.isSuspicious, isActive: j.isActive,
      });
      try {
        const data = await fetchFromIPFS(j.cid);
        setIpfsData(data);
      } catch { setIpfsData(null); }
    } catch (err) {
      toast.error("Job not found");
    } finally { setLoading(false); }
  }, [contract, id]);

  useEffect(() => { loadJob(); }, [loadJob]);

  const verifyIntegrity = async () => {
    if (!job || !ipfsData) return;
    setVerifying(true);
    try {
      const { integrity: _i, ...coreData } = ipfsData;
      const jsonStr = JSON.stringify(coreData, null, 2);
      const computedHex = computeHash(jsonStr);
      const computedBytes32 = hashToBytes32(computedHex);

      const onChainValid = await contract.verifyJobIntegrity(id, computedBytes32);
      setIntegrity(onChainValid ? "valid" : "tampered");
      toast[onChainValid ? "success" : "error"](
        onChainValid ? "✓ Data integrity verified!" : "✗ Data has been tampered!"
      );
    } catch (err) {
      toast.error("Verification failed: " + err.message);
    } finally { setVerifying(false); }
  };

  const reportJob = async () => {
    if (!account) { toast.error("Connect wallet to report"); return; }
    setReporting(true);
    try {
      const tx = await contract.reportJob(id);
      toast.loading("Submitting...", { id: "rpt" });
      await tx.wait();
      toast.success("Reported successfully", { id: "rpt" });
      loadJob();
    } catch (err) {
      toast.error(err.reason || "Report failed", { id: "rpt" });
    } finally { setReporting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <div className="font-mono text-cyber-green animate-pulse">Loading job data...</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 font-mono mb-4">Job not found</p>
        <Link to="/" className="text-cyber-green font-mono">← Back to Jobs</Link>
      </div>
    </div>
  );

  const date = new Date(Number(job.timestamp) * 1000).toLocaleString();

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-pattern bg-grid pt-20">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-mono text-sm mb-6 transition-colors">
          ← Back to Jobs
        </Link>

        {/* Suspicious Warning */}
        {job.isSuspicious && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <p className="font-display text-red-400 font-semibold">This job has been flagged as suspicious</p>
              <p className="font-mono text-sm text-red-400/70 mt-1">
                {job.reportCount} users have reported this posting. Exercise caution before applying.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border">
              <h1 className="font-display text-2xl font-bold text-white mb-1">
                {ipfsData?.title || "Job #" + id}
              </h1>
              <p className="text-gray-400 font-body text-lg mb-4">{ipfsData?.company}</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { icon: "📍", val: ipfsData?.location },
                  { icon: "⏰", val: ipfsData?.jobType },
                  { icon: "💰", val: ipfsData?.salary },
                  { icon: "🏢", val: ipfsData?.experience },
                ].filter(x => x.val).map(({ icon, val }) => (
                  <span key={val} className="px-3 py-1 bg-white/5 text-gray-300 rounded-full font-mono text-sm">
                    {icon} {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            {ipfsData?.description && (
              <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border">
                <h2 className="font-display text-base font-semibold text-white mb-3 uppercase tracking-wide">
                  Job Description
                </h2>
                <p className="text-gray-400 font-body leading-relaxed whitespace-pre-wrap">
                  {ipfsData.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {ipfsData?.requirements && (
              <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border">
                <h2 className="font-display text-base font-semibold text-white mb-3 uppercase tracking-wide">
                  Requirements
                </h2>
                <p className="text-gray-400 font-body leading-relaxed whitespace-pre-wrap">
                  {ipfsData.requirements}
                </p>
              </div>
            )}

            {/* Skills */}
            {ipfsData?.skills?.length > 0 && (
              <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border">
                <h2 className="font-display text-base font-semibold text-white mb-3 uppercase tracking-wide">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {ipfsData.skills.map(s => (
                    <span key={s} className="px-3 py-1 font-mono text-sm bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Integrity Check */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-4">
                Integrity Verification
              </h3>
              {integrity && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 font-mono text-sm
                  ${integrity === "valid"
                    ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                  }`}>
                  <span className="text-lg">{integrity === "valid" ? "✓" : "✗"}</span>
                  <span>{integrity === "valid" ? "Data is authentic" : "Data has been tampered"}</span>
                </div>
              )}
              <button onClick={verifyIntegrity} disabled={verifying || !ipfsData}
                className="w-full py-2.5 font-mono text-sm font-semibold text-cyber-dark bg-cyber-green rounded-lg hover:bg-cyber-green/90 disabled:opacity-50 transition-all">
                {verifying ? "Verifying..." : "Verify on Blockchain"}
              </button>
              <p className="mt-2 text-xs text-gray-600 font-mono text-center">
                Compares IPFS data SHA-256 with on-chain hash
              </p>
            </div>

            {/* Blockchain Info */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide">Blockchain Record</h3>
              <InfoRow label="Job ID" value={"#" + job.id} />
              <InfoRow label="Posted" value={date} small />
              <InfoRow label="Recruiter" value={`${job.recruiter?.slice(0,10)}...`} mono />
              <InfoRow label="Reports" value={`${job.reportCount} / 5`} color={Number(job.reportCount) > 0 ? "text-red-400" : "text-cyber-green"} />
              <InfoRow label="Status" value={job.isSuspicious ? "⚠ Suspicious" : "✓ Active"} color={job.isSuspicious ? "text-red-400" : "text-cyber-green"} />
            </div>

            {/* IPFS */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wide mb-3">IPFS Storage</h3>
              <a href={`https://gateway.pinata.cloud/ipfs/${job.cid}`} target="_blank" rel="noopener noreferrer"
                className="block p-2 bg-white/5 rounded font-mono text-xs text-cyber-blue hover:text-white break-all transition-colors">
                {job.cid}
              </a>
            </div>

            {/* Report */}
            <button onClick={reportJob} disabled={reporting || !account}
              className="w-full py-2.5 font-mono text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-all">
              {reporting ? "Reporting..." : "🚨 Report Fraud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, small, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-mono text-xs text-gray-500 uppercase">{label}</span>
      <span className={`font-mono text-xs ${color || "text-gray-300"} ${small ? "text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
