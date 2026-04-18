import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { uploadToIPFS, hashToBytes32 } from "../utils/ipfs";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  title: "", company: "", location: "", jobType: "Full-time",
  salary: "", experience: "", description: "", requirements: "",
  skills: "", contactEmail: "",
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];

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
    if (!isVerifiedRecruiter) { toast.error("You are not a verified recruiter"); return; }

    const skillsArr = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const jobData = {
      ...form,
      skills: skillsArr,
      postedBy: account,
      postedAt: new Date().toISOString(),
      version: "1.0",
    };

    setUploading(true);
    try {
      toast.loading("Uploading to IPFS...", { id: "ipfs" });
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
      toast.loading("Posting to blockchain...", { id: "tx" });
      const tx = await contract.postJob(txData.cid, bytes32Hash);
      await tx.wait();
      toast.success("Job posted on-chain!", { id: "tx" });
      setStep(3);
      setTimeout(() => navigate("/my-jobs"), 2000);
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed", { id: "tx" });
    } finally { setPosting(false); }
  };

  if (!account) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <p className="text-gray-400 font-mono">Connect your wallet to post jobs.</p>
    </div>
  );

  if (!isVerifiedRecruiter) return (
    <div className="min-h-screen bg-cyber-dark pt-20 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-2xl">🔒</div>
        <h2 className="font-display text-xl text-white mb-2">Not Verified</h2>
        <p className="text-gray-400 font-body">Your wallet is not whitelisted as a verified recruiter. Contact the admin to get verified.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-pattern bg-grid pt-20">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <h1 className="font-display text-3xl font-bold text-white mb-2">Post a Job</h1>
        <p className="text-gray-500 font-mono text-sm mb-8">
          Job data → IPFS → Blockchain. Tamper-proof & immutable.
        </p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {["Fill Details", "Upload to IPFS", "Post On-Chain"].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold
                  ${step > i + 1 ? "bg-cyber-green text-cyber-dark" :
                    step === i + 1 ? "bg-cyber-green/20 border-2 border-cyber-green text-cyber-green" :
                    "bg-cyber-card border border-cyber-border text-gray-600"}`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`font-mono text-xs hidden sm:inline ${step >= i + 1 ? "text-white" : "text-gray-600"}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-cyber-green" : "bg-cyber-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleUpload} className="space-y-5">
            <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-gray-400">Job Details</h2>
              <Field label="Job Title*" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Senior React Developer" />
              <Field label="Company Name*" name="company" value={form.company} onChange={handleChange} required placeholder="e.g. TechCorp India" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Location*" name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Remote / Bangalore" />
                <div>
                  <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase">Job Type</label>
                  <select name="jobType" value={form.jobType} onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-white/5 border border-cyber-border text-white font-mono text-sm rounded-lg focus:outline-none focus:border-cyber-green/50">
                    {JOB_TYPES.map(t => <option key={t} value={t} className="bg-cyber-dark">{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Salary Range" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹8-12 LPA" />
                <Field label="Experience" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2-4 years" />
              </div>
              <Field label="Contact Email*" name="contactEmail" value={form.contactEmail} onChange={handleChange} required type="email" placeholder="hr@company.com" />
            </div>

            <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
              <h2 className="font-display text-sm uppercase tracking-wide text-gray-400">Description</h2>
              <Textarea label="Job Description*" name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Describe the role and responsibilities..." />
              <Textarea label="Requirements" name="requirements" value={form.requirements} onChange={handleChange} rows={3} placeholder="List qualifications and requirements..." />
              <Field label="Skills (comma-separated)" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB, AWS" />
            </div>

            <button type="submit" disabled={uploading}
              className="w-full py-3 font-mono font-bold bg-cyber-green text-cyber-dark rounded-xl hover:bg-cyber-green/90 disabled:opacity-50 transition-all">
              {uploading ? "Uploading to IPFS..." : "Upload to IPFS →"}
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && txData && (
          <div className="space-y-5">
            <div className="p-6 rounded-xl bg-cyber-card border border-cyber-green/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-cyber-green/20 flex items-center justify-center text-cyber-green">✓</div>
                <h2 className="font-display text-white font-semibold">IPFS Upload Successful</h2>
              </div>
              <div className="space-y-3">
                <InfoBlock label="IPFS CID" value={txData.cid} />
                <InfoBlock label="SHA-256 Hash" value={txData.hash} />
                <InfoBlock label="IPFS Gateway" value={`gateway.pinata.cloud/ipfs/${txData.cid.slice(0,20)}...`} />
              </div>
            </div>

            <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="font-mono text-sm text-yellow-400">
                ⛽ This transaction requires gas (SepoliaETH). Your MetaMask will prompt for confirmation.
              </p>
            </div>

            <button onClick={handlePostOnChain} disabled={posting}
              className="w-full py-3 font-mono font-bold bg-cyber-green text-cyber-dark rounded-xl hover:bg-cyber-green/90 disabled:opacity-50 transition-all">
              {posting ? "Waiting for blockchain..." : "Post to Ethereum Blockchain →"}
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-green/20 border-2 border-cyber-green flex items-center justify-center text-3xl">
              🎉
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Job Posted!</h2>
            <p className="text-gray-400 font-mono">Your job is now live on the Ethereum blockchain</p>
            <p className="text-gray-600 font-mono text-sm mt-2">Redirecting to My Jobs...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = "text", placeholder }) {
  return (
    <div>
      <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/5 border border-cyber-border text-white font-mono text-sm rounded-lg placeholder-gray-600
          focus:outline-none focus:border-cyber-green/50 transition-colors" />
    </div>
  );
}

function Textarea({ label, name, value, onChange, required, rows, placeholder }) {
  return (
    <div>
      <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase">{label}</label>
      <textarea name={name} value={value} onChange={onChange} required={required} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/5 border border-cyber-border text-white font-mono text-sm rounded-lg placeholder-gray-600
          focus:outline-none focus:border-cyber-green/50 transition-colors resize-none" />
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="font-mono text-xs text-gray-500 uppercase mb-1">{label}</p>
      <div className="p-2 bg-white/5 rounded font-mono text-xs text-cyber-green break-all">{value}</div>
    </div>
  );
}
