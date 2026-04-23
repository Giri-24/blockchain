import { useState } from "react";
import { getContract } from "../contract";

export default function VerifyJob() {
  const [job, setJob] = useState("");
  const [result, setResult] = useState("");

  const verify = async () => {
    const contract = await getContract();
    const res = await contract.verifyJob(job);
    setResult(res ? "Real Job ✅" : "Fake Job ❌");
  };

  return (
    <div id="verify">
      <h2>Verify Job</h2>
      <input onChange={(e) => setJob(e.target.value)} />
      <button onClick={verify}>Check</button>
      <p>{result}</p>
    </div>
  );
}
