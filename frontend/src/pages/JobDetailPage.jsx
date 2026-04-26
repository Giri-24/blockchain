import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { fetchFromIPFS, computeHash, hashToBytes32 } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function JobDetailPage() {
  const { id }          = useParams();
  const { contract, account, connectWallet } = useWeb3();
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
      toast.loading("Awaiting Signature from MetaMask...", { id: "rpt" });
      const tx = await contract.reportJob(id);
      
      toast.loading("Transaction processing on Sepolia...", { id: "rpt" });
      await tx.wait();
      
      toast.success("Report permanently stored on-chain", { id: "rpt" });
      loadJob();
    } catch (err) {
      console.error("Report Error:", err);
      toast.error(err.reason || err.message || "Report cancelled or failed", { id: "rpt" });
    } finally { setReporting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-trust-bg pt-24 flex items-center justify-center">
      <div className="font-mono text-trust-accent animate-pulse font-black uppercase tracking-[0.3em] text-xs">Synchronizing Ledger...</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-trust-bg pt-24 flex items-center justify-center text-center px-4">
      <div className="max-w-md w-full py-16 bg-white border border-trust-border rounded-3xl shadow-sm">
        <p className="text-red-500 font-mono font-black uppercase tracking-widest text-xs mb-4">Null Pointer: Job Not Found</p>
        <Link to="/" className="inline-flex items-center gap-2 text-trust-accent hover:underline font-mono text-[10px] font-black uppercase tracking-widest">
          ← Return to Terminal
        </Link>
      </div>
    </div>
  );

  const date = new Date(Number(job.timestamp) * 1000).toLocaleString();

  return (
    <div className="min-h-screen bg-trust-bg pt-24">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-3 text-trust-subtle hover:text-trust-text transition-colors mb-10 group">
          <span className="p-2 bg-white rounded-xl border border-trust-border group-hover:bg-trust-border transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </span>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">Return to Open Market</span>
        </Link>

        {/* Suspicious Warning */}
        {job.isSuspicious && (
          <div className="mb-10 p-6 rounded-[32px] bg-red-50 border border-red-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 text-xl shadow-inner">⚠️</div>
            <div>
              <p className="font-display text-red-600 font-black text-lg">Trust Violation Detected</p>
              <p className="font-mono text-[11px] font-bold text-red-500/70 mt-1 uppercase tracking-tight leading-relaxed">
                {job.reportCount} community reports filed. Potential fraudulent activity on the employment layer.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-10">
            <div className="p-10 rounded-[32px] bg-white border border-trust-border shadow-2xl shadow-slate-200/20">
              <h1 className="font-display text-4xl font-black text-trust-text mb-4 leading-tight">
                {ipfsData?.title || "Job #" + id}
              </h1>
              <p className="text-trust-subtle font-body text-xl mb-10">{ipfsData?.company}</p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                {[
                  { icon: "📍", val: ipfsData?.location },
                  { icon: "⏰", val: ipfsData?.jobType },
                  { icon: "💰", val: ipfsData?.salary },
                  { icon: "🏢", val: ipfsData?.experience },
                ].filter(x => x.val).map(({ icon, val }) => (
                  <span key={val} className="px-5 py-3 bg-trust-border/20 border border-trust-border rounded-2xl font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <span className="opacity-60 grayscale">{icon}</span> {val}
                  </span>
                ))}
              </div>

              {ipfsData?.officialUrl && (
                <div className="mb-2">
                  {account ? (
                    <a href={ipfsData.officialUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-4 px-10 py-5 font-mono text-xs font-black uppercase tracking-[0.2em] bg-trust-primary text-white rounded-[24px] hover:shadow-2xl hover:shadow-trust-primary/40 transition-all group">
                      Initialize Application 
                      <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                    </a>
                  ) : (
                    <button onClick={connectWallet}
                      className="inline-flex items-center gap-4 px-10 py-5 font-mono text-xs font-black uppercase tracking-[0.2em] bg-white border-2 border-trust-accent text-trust-accent rounded-[24px] hover:bg-trust-accent hover:text-white transition-all">
                      Unlock Secure Gate
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {ipfsData?.description && (
              <div className="p-10 rounded-[32px] bg-white border border-trust-border">
                <h2 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="w-4 h-0.5 bg-trust-accent" /> Opportunity Brief
                </h2>
                <p className="text-trust-subtle font-body leading-loose text-lg whitespace-pre-wrap">
                  {ipfsData.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {ipfsData?.requirements && (
              <div className="p-10 rounded-[32px] bg-white border border-trust-border">
                <h2 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="w-4 h-0.5 bg-trust-accent" /> Mandatory Prerequisites
                </h2>
                <p className="text-trust-subtle font-body leading-loose text-lg whitespace-pre-wrap">
                  {ipfsData.requirements}
                </p>
              </div>
            )}

            {/* Skills */}
            {ipfsData?.skills?.length > 0 && (
              <div className="p-10 rounded-[32px] bg-white border border-trust-border">
                <h2 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <span className="w-4 h-0.5 bg-trust-accent" /> Skillset Matrix
                </h2>
                <div className="flex flex-wrap gap-3">
                  {ipfsData.skills.map(s => (
                    <span key={s} className="px-4 py-2 font-mono text-[10px] font-black uppercase bg-trust-primary/5 text-trust-primary border border-trust-primary/10 rounded-xl">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Integrity Check */}
            <div className="p-8 rounded-[32px] bg-white border border-trust-border shadow-sm">
              <h3 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trust-accent animate-pulse" /> Security Protocol
              </h3>
              {integrity && (
                <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-widest
                  ${integrity === "valid"
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                    : "bg-red-50 border border-red-100 text-red-600"
                  }`}>
                  <span className="text-xl">{integrity === "valid" ? "✓" : "✗"}</span>
                  <span>{integrity === "valid" ? "Identity Match" : "Hash Collision"}</span>
                </div>
              )}
              <button onClick={verifyIntegrity} disabled={verifying || !ipfsData}
                className="w-full py-5 font-mono text-[11px] font-black uppercase tracking-widest bg-trust-accent text-white rounded-2xl hover:shadow-xl hover:shadow-trust-accent/20 disabled:opacity-50 transition-all">
                {verifying ? "Auditing Source..." : "Validate Authenticity"}
              </button>
            </div>

            {/* Blockchain Info */}
            <div className="p-8 rounded-[32px] bg-white border border-trust-border space-y-5">
              <h3 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-2">Network Segment</h3>
              <InfoRow label="Ledger Index" value={"#" + job.id} />
              <InfoRow label="Timestamp" value={date.split(',')[0]} small />
              <InfoRow label="Archon" value={`${job.recruiter?.slice(0,8)}...`} mono />
              <InfoRow label="State" value={job.isSuspicious ? "⚠ Suspicious" : "✓ Active"} color={job.isSuspicious ? "text-red-500" : "text-trust-accent"} />
            </div>

            {/* IPFS */}
            <div className="p-8 rounded-[32px] bg-white border border-trust-border">
              <h3 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-4">Storage Node</h3>
              <a href={`https://gateway.pinata.cloud/ipfs/${job.cid}`} target="_blank" rel="noopener noreferrer"
                className="block p-4 bg-trust-border/20 rounded-2xl font-mono text-[9px] font-bold text-trust-subtle hover:text-trust-accent break-all transition-colors line-clamp-3">
                {job.cid}
              </a>
            </div>

            {/* Report */}
            <button onClick={reportJob} disabled={reporting || !account}
              className="w-full py-4 font-mono text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-200 rounded-2xl hover:bg-red-50 disabled:opacity-50 transition-all">
              {reporting ? "Filing..." : "🚨 Report Fraud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, small, color }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="font-mono text-[9px] font-black text-trust-muted uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-[10px] font-bold ${color || "text-trust-text"} ${small ? "text-[9px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
