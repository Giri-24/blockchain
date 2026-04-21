import { useState } from "react";
import { getContract } from "../contract";

export default function ViewJobs() {
  const [jobs, setJobs] = useState([]);

  const loadJobs = async () => {
    const contract = await getContract();
    const data = await contract.getJobs();
    setJobs(data);
  };

  return (
    <div id="view">
      <h2>All Jobs</h2>
      <button onClick={loadJobs}>Load Jobs</button>

      {jobs.map((job, i) => (
        <p key={i}>{job}</p>
      ))}
    </div>
  );
}
