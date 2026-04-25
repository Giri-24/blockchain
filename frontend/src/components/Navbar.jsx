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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-trust-border bg-trust-bg/70 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-trust-accent rounded-xl rotate-12 opacity-10 group-hover:rotate-45 transition-transform duration-500" />
              <div className="absolute inset-0 bg-trust-accent rounded-xl -rotate-12 opacity-20 group-hover:rotate-90 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5l10-5l-10-5zM2 17l10 5l10-5M2 12l10 5l10-5" stroke="currentColor" className="text-trust-accent" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="font-display text-xl font-black tracking-tight text-trust-text">
              TRUST<span className="text-trust-accent">CHAIN</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-5 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all ${
                  location.pathname === l.to
                    ? "text-trust-accent bg-trust-accent/5 shadow-sm shadow-trust-accent/5 border border-trust-accent/10"
                    : "text-trust-subtle hover:text-trust-text hover:bg-trust-border"
                }`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Wallet Controls */}
          <div className="hidden md:flex items-center gap-4">
            {isWrongNetwork && (
              <button onClick={switchToSepolia}
                className="px-4 py-2 text-[10px] font-bold font-mono bg-amber-50 text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all">
                ⚠ Switch to Sepolia
              </button>
            )}
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 px-4 py-2 bg-trust-card border border-trust-border rounded-2xl shadow-sm">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-trust-accent animate-pulse" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-trust-accent animate-ping opacity-40" />
                  </div>
                  <span className="font-mono text-xs font-bold text-trust-subtle">{shortAddr}</span>
                  {isOwner && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md">
                      ADMIN
                    </span>
                  )}
                  {isVerifiedRecruiter && !isOwner && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-trust-accent/10 text-trust-accent border border-trust-accent/20 rounded-md">
                      RECRUITER
                    </span>
                  )}
                </div>
                <button onClick={disconnectWallet}
                  className="p-2 text-trust-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Disconnect Wallet">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting}
                className="px-6 py-2.5 font-mono text-xs font-black uppercase tracking-widest text-white bg-trust-primary rounded-2xl hover:shadow-xl hover:shadow-trust-primary/20 disabled:opacity-50 transition-all">
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
