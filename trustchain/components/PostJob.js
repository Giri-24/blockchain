import { useState } from "react";
import { getContract } from "../contract";

export default function PostJob() {
  const [job, setJob] = useState("");

  const submitJob = async () => {
    const contract = await getContract();
    const tx = await contract.addJob(job);
    await tx.wait();
    alert("Job Posted!");
  };

  return (
    <div id="post">
      <h2>Post Job</h2>
      <input onChange={(e) => setJob(e.target.value)} />
      <button onClick={submitJob}>Submit</button>
    </div>
  );
}
