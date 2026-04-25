import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

const REPORT_THRESHOLD = 5;

export default function JobCard({ job, onReport, canReport = true }) {
  const { account, connectWallet } = useWeb3();
  const {
    id, cid, recruiter, timestamp, reportCount,
    isSuspicious, ipfsData, verifyStatus,
  } = job;

  const date   = new Date(Number(timestamp) * 1000).toLocaleDateString();
  const title   = ipfsData?.title       || "Loading...";
  const company = ipfsData?.company     || "Unknown";
  const salary  = ipfsData?.salary      || "Not specified";
  const type    = ipfsData?.jobType     || "Full-time";
  const location= ipfsData?.location    || "Remote";
  const skills  = ipfsData?.skills      || [];
  const shortAddr = recruiter ? `${recruiter.slice(0, 6)}...${recruiter.slice(-4)}` : "";
  const progress = Math.min((Number(reportCount) / REPORT_THRESHOLD) * 100, 100);

  return (
    <div className={`relative group rounded-2xl border transition-all duration-500 overflow-hidden
      bg-trust-card hover:shadow-2xl hover:shadow-trust-accent/10
      ${isSuspicious
        ? "border-red-200 hover:border-red-300"
        : "border-trust-border hover:border-trust-accent/30"
      }`}>

      {/* Suspicious banner */}
      {isSuspicious && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
          <span className="text-red-500 text-sm">⚠</span>
          <span className="font-mono text-xs text-red-600 font-semibold tracking-wide uppercase">
            Flagged as Suspicious ({reportCount}/{REPORT_THRESHOLD} reports)
          </span>
        </div>
      )}

      {/* Integrity badge */}
      {verifyStatus && (
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
          ${verifyStatus === "valid"
            ? "bg-trust-accent/10 text-trust-accent border border-trust-accent/20"
            : "bg-red-50 text-red-500 border border-red-100"
          }`}>
          <span className={verifyStatus === "valid" ? "animate-pulse" : ""}>{verifyStatus === "valid" ? "●" : "✗"}</span>
          <span>{verifyStatus === "valid" ? "Authentic" : "Tampered"}</span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-trust-text group-hover:text-trust-accent transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-sm font-medium text-trust-subtle mt-0.5">{company}</p>
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-trust-border/50 border border-trust-border flex items-center justify-center shadow-inner">
            <span className="text-trust-accent font-display text-lg font-black">
              {company.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Tag icon="📍" text={location} />
          <Tag icon="⏰" text={type} />
          <Tag icon="💰" text={salary} />
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {skills.slice(0, 3).map((s, i) => (
              <span key={i} className="px-2.5 py-1 text-[10px] font-bold font-mono bg-trust-primary/5 text-trust-primary border border-trust-primary/10 rounded-md">
                {s}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="px-2 py-1 text-[10px] font-bold font-mono text-trust-muted">+{skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-trust-border/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-trust-accent/40" />
            <span className="font-mono text-[10px] text-trust-muted font-bold uppercase tracking-tighter">{shortAddr}</span>
          </div>

          <div className="flex items-center gap-2">
            {canReport && (
              <button onClick={() => onReport?.(id)}
                className="p-1.5 text-trust-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Report Fraud">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </button>
            )}
            <Link to={`/job/${id}`}
              className="px-4 py-1.5 text-xs font-bold font-mono text-trust-text bg-trust-border border border-trust-border rounded-lg hover:bg-trust-accent hover:text-white hover:border-trust-accent transition-all">
              Details
            </Link>
            {ipfsData?.officialUrl && (
              account ? (
                <a href={ipfsData.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-bold font-mono bg-trust-primary text-white rounded-lg hover:shadow-lg hover:shadow-trust-primary/20 transition-all">
                  Apply ↗
                </a>
              ) : (
                <button onClick={(e) => { e.preventDefault(); connectWallet(); }}
                  className="px-4 py-1.5 text-xs font-bold font-mono text-trust-accent border-2 border-trust-accent rounded-lg hover:bg-trust-accent hover:text-white transition-all">
                  Connect
                </button>
              )
            )}
          </div>
        </div>

        {/* Report progress */}
        {Number(reportCount) > 0 && (
          <div className="mt-4 p-2 bg-red-50/50 rounded-lg border border-red-100/50">
            <div className="flex justify-between mb-1.5">
              <span className="font-mono text-[9px] text-red-400 font-bold uppercase">Community Reports</span>
              <span className="font-mono text-[9px] text-red-500 font-bold">{reportCount}/{REPORT_THRESHOLD}</span>
            </div>
            <div className="h-1 bg-red-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100 ? "#ef4444" : progress >= 60 ? "#f97316" : "#f87171",
                }}
              />
            </div>
          </div>
        )}

        {/* Traceability Link */}
        <div className="mt-4 pt-4 border-t border-dashed border-trust-border">
          <div className="flex items-center justify-between text-[9px] font-bold font-mono text-trust-muted">
            <span>CID: {cid?.slice(0, 12)}...</span>
            <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noopener noreferrer" className="text-trust-accent hover:underline">View on IPFS</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ icon, text }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold font-mono text-trust-subtle bg-trust-border border border-trust-border/50 rounded-lg">
      <span className="opacity-70">{icon}</span><span>{text}</span>
    </span>
  );
}
