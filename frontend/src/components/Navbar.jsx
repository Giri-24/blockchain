import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3, SEPOLIA_CHAIN_ID } from "../context/Web3Context";

export default function Navbar() {
  const { account, isOwner, isVerifiedRecruiter, connectWallet, disconnectWallet,
          isConnecting, chainId, switchToSepolia } = useWeb3();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const shortAddr = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  const isWrongNetwork = account && chainId !== SEPOLIA_CHAIN_ID;

  const navLinks = [
    { to: "/",          label: "Jobs",      always: true },
    { to: "/post-job",  label: "Post Job",  show: isVerifiedRecruiter },
    { to: "/my-jobs",   label: "My Jobs",   show: isVerifiedRecruiter },
    { to: "/admin",     label: "Admin",     show: isOwner },
  ].filter(l => l.always || l.show);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyber-border bg-cyber-dark/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-cyber-green rounded rotate-45 opacity-20" />
              <div className="absolute inset-1 bg-cyber-green rounded rotate-45 opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#00ff88" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-wider text-cyber-text">
              TRUST<span className="text-cyber-green">CHAIN</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-4 py-2 rounded font-mono text-sm tracking-wide transition-all ${
                  location.pathname === l.to
                    ? "text-cyber-green bg-cyber-green/10 border border-cyber-green/30"
                    : "text-gray-600 hover:text-cyber-text hover:bg-gray-100"
                }`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Wallet Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isWrongNetwork && (
              <button onClick={switchToSepolia}
                className="px-3 py-1.5 text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded hover:bg-yellow-500/30 transition-all">
                ⚠ Switch to Sepolia
              </button>
            )}
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-card border border-cyber-border rounded">
                  <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                  <span className="font-mono text-sm text-gray-600">{shortAddr}</span>
                  {isOwner && (
                    <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded">
                      ADMIN
                    </span>
                  )}
                  {isVerifiedRecruiter && !isOwner && (
                    <span className="px-1.5 py-0.5 text-xs bg-cyber-green/20 text-cyber-green border border-cyber-green/40 rounded">
                      RECRUITER
                    </span>
                  )}
                </div>
                <button onClick={disconnectWallet}
                  className="px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-all">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting}
                className="px-4 py-2 font-mono text-sm font-semibold text-cyber-dark bg-cyber-green rounded hover:bg-cyber-green/90 disabled:opacity-50 transition-all">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-cyber-text">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-cyber-border bg-cyber-dark/95 px-4 py-3 space-y-2">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded font-mono text-sm ${
                location.pathname === l.to ? "text-cyber-green bg-cyber-green/10" : "text-gray-400"
              }`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-cyber-border">
            {account ? (
              <div className="space-y-2">
                <div className="px-3 py-2 font-mono text-sm text-gray-300">{shortAddr}</div>
                <button onClick={disconnectWallet}
                  className="w-full px-3 py-2 text-sm text-red-400 border border-red-500/30 rounded">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting}
                className="w-full px-4 py-2 font-mono text-sm bg-cyber-green text-cyber-dark rounded font-semibold">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
