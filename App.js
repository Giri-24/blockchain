import Navbar from "./components/Navbar";
import PostJob from "./components/PostJob";
import VerifyJob from "./components/VerifyJob";
import ViewJobs from "./components/ViewJobs";

function App() {
  return (
    <div>
      <Navbar />

      <section id="home">
        <h1>TrustChain</h1>
        <p>Fake Job Detection using Blockchain</p>
      </section>

      <PostJob />
      <VerifyJob />
      <ViewJobs />
    </div>
  );
}

export default App;
