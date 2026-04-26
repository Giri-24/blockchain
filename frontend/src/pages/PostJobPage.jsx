import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { uploadToIPFS, hashToBytes32 } from "../utils/ipfs";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  title: "", company: "", location: "", jobType: "Full-time",
  salary: "", experience: "", description: "", requirements: "",
  skills: "", contactEmail: "", officialUrl: "",
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function PostJobPage() {
  const { contract, account, isVerifiedRecruiter } = useWeb3();
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [step, setStep]       = useState(1); // 1: fill, 2: upload, 3: confirm
  const [uploading, setUploading] = useState(false);
  const [txData, setTxData]   = useState(null); // { cid, hash }
  const [posting, setPosting] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleUpload = async (e) => {
    e.preventDefault();

    const skillsArr = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const jobData = {
      ...form,
      skills: skillsArr,
      postedBy: account,
      postedAt: new Date().toISOString(),
      version: "1.0",
    };

    setUploading(true);
    
    // 1. Official Company Portal Verification Step via Backend
    toast.loading("Verifying via Official Job Portal...", { id: "ipfs" });
    try {
      const verifyRes = await fetch(`${BACKEND_URL}/api/verify-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, company: form.company })
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok) throw new Error(verifyData.error);
      toast.success(verifyData.message, { id: "ipfs" });
    } catch (err) {
      toast.error(err.message || "Portal Verification Failed", { id: "ipfs" });
      setUploading(false);
      return; // Stop the process, job cannot be posted
    }

    // 2. IPFS Upload Step
    toast.loading("Uploading securely to IPFS...", { id: "ipfs" });
    try {
      const { cid, hash } = await uploadToIPFS(jobData);
      setTxData({ cid, hash });
      setStep(2);
      toast.success(`Uploaded! CID: ${cid.slice(0, 12)}...`, { id: "ipfs" });
    } catch (err) {
      toast.error(err.message || "Upload failed", { id: "ipfs" });
    } finally { setUploading(false); }
  };

  const handlePostOnChain = async () => {
    if (!txData || !contract) return;
    setPosting(true);
    try {
      const bytes32Hash = hashToBytes32(txData.hash);
      toast.loading("Posting to blockchain (Awaiting Signature)...", { id: "tx" });
      const tx = await contract.postJob(txData.cid, bytes32Hash, form.company, form.title);
      await tx.wait();
      toast.success("Job posted on-chain!", { id: "tx" });
      setStep(3);
      setTimeout(() => navigate("/my-jobs"), 2000);
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed", { id: "tx" });
    } finally { setPosting(false); }
  };

  if (!account) return (
    <div className="min-h-screen bg-trust-bg pt-24 text-center px-4 flex items-center justify-center">
      <div className="max-w-md w-full py-20 bg-white border border-trust-border rounded-[40px] shadow-2xl shadow-indigo-500/5">
        <div className="text-6xl mb-8">🧱</div>
        <h2 className="font-display text-3xl font-black text-trust-text mb-3">Connect Identity</h2>
        <p className="text-trust-subtle font-body mb-8 text-sm max-w-xs mx-auto">Authorize your Ethereum wallet to interact with the job protocol.</p>
        <div className="mx-8 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
          Wallet Signature Required
        </div>
      </div>
    </div>
  );

  // Unified universal access

  return (
    <div className="min-h-screen bg-trust-bg pt-24">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <h1 className="font-display text-4xl font-black text-trust-text mb-2">Publish Job</h1>
        <p className="text-trust-subtle font-mono text-[11px] font-bold uppercase tracking-widest mb-10">
          Sync to IPFS & Decentralized Ledger (Universal Access Enabled)
        </p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-12">
          {["Details", "IPFS Sync", "On-Chain"].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-sm font-black transition-all duration-500
                  ${step > i + 1 ? "bg-trust-accent text-white shadow-lg shadow-trust-accent/20" :
                    step === i + 1 ? "bg-trust-accent/10 border-2 border-trust-accent text-trust-accent scale-110" :
                    "bg-white border border-trust-border text-trust-muted"}`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`font-mono text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline ${step >= i + 1 ? "text-trust-text" : "text-trust-muted"}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full mx-2 ${step > i + 1 ? "bg-trust-accent" : "bg-trust-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="p-8 rounded-[32px] bg-white border border-trust-border shadow-sm space-y-6">
              <h2 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trust-accent" /> Professional Profile
              </h2>
              <Field label="Job Designation" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Principal Systems Architect" />
              <Field label="Enterprise Entity" name="company" value={form.company} onChange={handleChange} required placeholder="e.g. Global Tech Solutions" />
              <div className="grid grid-cols-2 gap-6">
                <Field label="Zone / HQ" name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Remote / Bangalore" />
                <div>
                  <label className="block font-mono text-[9px] font-black text-trust-muted mb-2 uppercase tracking-widest">Engagement Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-trust-border/10 border border-trust-border text-trust-text font-mono text-xs font-bold rounded-2xl focus:outline-none focus:border-trust-accent/50 focus:ring-4 focus:ring-trust-accent/5 transition-all">
                    {JOB_TYPES.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Comp Package" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹25-40 LPA" />
                <Field label="Tenure Required" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 5+ years" />
              </div>
              <Field label="Authorized Contact" name="contactEmail" value={form.contactEmail} onChange={handleChange} required type="email" placeholder="recruitment@entity.com" />
              <Field label="Official Posting URL" name="officialUrl" value={form.officialUrl} onChange={handleChange} required type="url" placeholder="https://portal.company.com/career/123" />
            </div>

            <div className="p-8 rounded-[32px] bg-white border border-trust-border shadow-sm space-y-6">
              <h2 className="font-display text-[10px] font-black text-trust-text uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trust-accent" /> Opportunity Scope
              </h2>
              <Textarea label="Role Intelligence" name="description" value={form.description} onChange={handleChange} required rows={5} placeholder="Define the core mission and impact of this role..." />
              <Textarea label="Capability Requirements" name="requirements" value={form.requirements} onChange={handleChange} rows={4} placeholder="List explicit technical and professional requirements..." />
              <Field label="Core Competencies (CSV)" name="skills" value={form.skills} onChange={handleChange} placeholder="EVM, Solidity, Rust, Cryptography" />
            </div>

            <button type="submit" disabled={uploading}
              className="w-full py-5 font-mono text-[11px] font-black uppercase tracking-widest bg-trust-primary text-white rounded-[24px] hover:shadow-2xl hover:shadow-trust-primary/30 disabled:opacity-50 transition-all">
              {uploading ? "Encrypting Segment..." : "Authorize IPFS Deployment →"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && txData && (
          <div className="space-y-6">
            <div className="p-8 rounded-[32px] bg-white border border-trust-primary/20 shadow-xl shadow-trust-primary/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-trust-primary/10 flex items-center justify-center text-trust-primary shadow-inner">✓</div>
                <h2 className="font-display text-xl font-black text-trust-text">IPFS Sync Complete</h2>
              </div>
              <div className="space-y-4">
                <InfoBlock label="Decentralized CID" value={txData.cid} />
                <InfoBlock label="Cryptographic Signature" value={txData.hash} />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
              <p className="font-mono text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-relaxed">
                ⛽ Ethereum Transaction Pending: Gas fee required (SepoliaETH) via MetaMask.
              </p>
            </div>

            <button onClick={handlePostOnChain} disabled={posting}
              className="w-full py-5 font-mono text-[11px] font-black uppercase tracking-widest bg-trust-accent text-white rounded-[24px] hover:shadow-2xl hover:shadow-trust-accent/30 disabled:opacity-50 transition-all">
              {posting ? "Synchronizing Chain..." : "Finalize On-Chain Ledger →"}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 rounded-[32px] bg-white border border-trust-primary/20 flex items-center justify-center text-4xl shadow-2xl shadow-trust-primary/10">
              💎
            </div>
            <h2 className="font-display text-4xl font-black text-trust-text mb-3">Ledger Updated</h2>
            <p className="text-trust-subtle font-mono text-[11px] font-black uppercase tracking-widest">Job hash immortalized on-chain</p>
            <p className="text-trust-muted font-body text-sm mt-8 animate-pulse">Redirecting to Private Registry...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = "text", placeholder }) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-[9px] font-black text-trust-muted uppercase tracking-widest">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-trust-border/10 border border-trust-border text-trust-text font-mono text-xs font-bold rounded-2xl placeholder-trust-muted/40 focus:outline-none focus:border-trust-accent/50 focus:ring-4 focus:ring-trust-accent/5 transition-all" />
    </div>
  );
}

function Textarea({ label, name, value, onChange, required, rows, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-[9px] font-black text-trust-muted uppercase tracking-widest">{label}</label>
      <textarea name={name} value={value} onChange={onChange} required={required} rows={rows} placeholder={placeholder}
        className="w-full px-5 py-3.5 bg-trust-border/10 border border-trust-border text-trust-text font-mono text-xs font-bold rounded-2xl placeholder-trust-muted/40 focus:outline-none focus:border-trust-accent/50 focus:ring-4 focus:ring-trust-accent/5 transition-all resize-none" />
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="p-5 bg-trust-border/20 rounded-2xl border border-trust-border/40">
      <p className="font-mono text-[9px] font-black text-trust-muted uppercase tracking-widest mb-2">{label}</p>
      <div className="font-mono text-[10px] font-bold text-trust-primary break-all leading-relaxed">{value}</div>
    </div>
  );
}
