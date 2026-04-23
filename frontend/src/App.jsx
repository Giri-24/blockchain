import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import PostJobPage from "./pages/PostJobPage";
import MyJobsPage from "./pages/MyJobsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-cyber-dark font-body">
          <Navbar />
          <Routes>
            <Route path="/"          element={<JobsPage />} />
            <Route path="/job/:id"   element={<JobDetailPage />} />
            <Route path="/post-job"  element={<PostJobPage />} />
            <Route path="/my-jobs"   element={<MyJobsPage />} />
            <Route path="/admin"     element={<AdminPage />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0a1628",
                color: "#fff",
                border: "1px solid #1a3050",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
              },
              success: { iconTheme: { primary: "#00ff88", secondary: "#050d1a" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#050d1a" } },
            }}
          />
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}
