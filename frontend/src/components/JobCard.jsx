import React from "react";
import { Link } from "react-router-dom";

const REPORT_THRESHOLD = 5;

export default function JobCard({ job, onReport, canReport = true }) {
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
    <div className={`relative group rounded-xl border transition-all duration-300 overflow-hidden
      bg-cyber-card hover:shadow-lg hover:shadow-cyber-green/5
      ${isSuspicious
        ? "border-red-500/50 hover:border-red-400/70"
        : "border-cyber-border hover:border-cyber-green/30"
      }`}>

      {/* Suspicious banner */}
      {isSuspicious && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/30">
          <span className="text-red-400 text-sm">⚠</span>
          <span className="font-mono text-xs text-red-400 font-semibold tracking-wide uppercase">
            Flagged as Suspicious ({reportCount}/{REPORT_THRESHOLD} reports)
          </span>
        </div>
      )}

      {/* Integrity badge */}
      {verifyStatus && (
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono
          ${verifyStatus === "valid"
            ? "bg-cyber-green/10 text-cyber-green border border-cyber-green/30"
            : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}>
          <span>{verifyStatus === "valid" ? "✓" : "✗"}</span>
          <span>{verifyStatus === "valid" ? "Verified" : "Tampered"}</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white group-hover:text-cyber-green transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{company}</p>
          </div>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyber-green/10 border border-cyber-green/20 flex items-center justify-center">
            <span className="text-cyber-green font-display text-sm font-bold">
              {company.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Tag icon="📍" text={location} />
          <Tag icon="⏰" text={type} />
          <Tag icon="💰" text={salary} />
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 4).map((s, i) => (
              <span key={i} className="px-2 py-0.5 text-xs font-mono bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20 rounded">
                {s}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="px-2 py-0.5 text-xs font-mono text-gray-500">+{skills.length - 4} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-cyber-border">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-500">{shortAddr}</span>
            <span className="text-gray-600">·</span>
            <span className="font-mono text-xs text-gray-500">{date}</span>
          </div>

          <div className="flex items-center gap-2">
            {canReport && (
              <button onClick={() => onReport?.(id)}
                className="px-2.5 py-1 text-xs font-mono text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-all">
                Report
              </button>
            )}
            <Link to={`/job/${id}`}
              className="px-2.5 py-1 text-xs font-mono text-cyber-green border border-cyber-green/30 rounded hover:bg-cyber-green/10 transition-all">
              View →
            </Link>
          </div>
        </div>

        {/* Report progress */}
        {Number(reportCount) > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-xs text-gray-500">Reports</span>
              <span className="font-mono text-xs text-red-400">{reportCount}/{REPORT_THRESHOLD}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100 ? "#ef4444" : progress >= 60 ? "#f97316" : "#eab308",
                }}
              />
            </div>
          </div>
        )}

        {/* IPFS CID */}
        <div className="mt-2">
          <a
            href={`https://gateway.pinata.cloud/ipfs/${cid}`}
            target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs text-gray-600 hover:text-cyber-blue transition-colors truncate block">
            ipfs://{cid?.slice(0, 20)}...
          </a>
        </div>
      </div>
    </div>
  );
}

function Tag({ icon, text }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-gray-400 bg-white/5 rounded">
      <span>{icon}</span><span>{text}</span>
    </span>
  );
}
