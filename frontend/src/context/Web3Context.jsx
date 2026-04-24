import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import contractData from "../utils/contract.json";

const Web3Context = createContext(null);

export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

export function Web3Provider({ children }) {
  const [provider, setProvider]           = useState(null);
  const [signer, setSigner]               = useState(null);
  const [contract, setContract]           = useState(null);
  const [account, setAccount]             = useState(null);
  const [isOwner, setIsOwner]             = useState(false);
  const [isVerifiedRecruiter, setIsVerifiedRecruiter] = useState(false);
  const [networkName, setNetworkName]     = useState("");
  const [isConnecting, setIsConnecting]   = useState(false);
  const [chainId, setChainId]             = useState(null);

  const initContract = useCallback((signerOrProvider) => {
    try {
      const c = new ethers.Contract(
        contractData.contractAddress,
        contractData.abi,
        signerOrProvider
      );
      setContract(c);
      return c;
    } catch (err) {
      console.error("Contract init error:", err);
      return null;
    }
  }, []);

  const checkRoles = useCallback(async (c, addr) => {
    try {
      const ownerAddr = await c.owner();
      setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
      const verified  = await c.isVerifiedRecruiter(addr);
      setIsVerifiedRecruiter(verified);
    } catch (err) {
      console.error("Role check error:", err);
    }
  }, []);

  const connectWallet = useCallback(async (isManual = true) => {
    if (!window.ethereum) {
      if (isManual) toast.error("MetaMask not detected! Please install MetaMask.");
      return;
    }
    
    setIsConnecting(true);
    try {
      // Request accounts - only eth_requestAccounts triggers popup
      // eth_accounts is silent
      const method = isManual ? "eth_requestAccounts" : "eth_accounts";
      const accounts = await window.ethereum.request({ method });
      
      if (accounts.length === 0) {
        if (isManual) toast.error("No accounts found. Please unlock MetaMask.");
        setIsConnecting(false);
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer   = await web3Provider.getSigner();
      const network      = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId("0x" + network.chainId.toString(16));
      setNetworkName(network.name);

      const c = initContract(web3Signer);
      if (c) await checkRoles(c, accounts[0]);

      if (isManual) toast.success("Wallet connected!");
    } catch (err) {
      console.error("Connect error:", err);
      if (isManual) toast.error(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [initContract, checkRoles]);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setIsOwner(false);
    setIsVerifiedRecruiter(false);
    setNetworkName("");
    setChainId(null);
    // Clear auto-connect preference if you implemented one
    toast.success("Wallet disconnected");
  }, []);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        // Update roles for the new account
        if (contract) await checkRoles(contract, accounts[0]);
      }
    };

    const handleChainChanged = (id) => {
      setChainId(id);
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [contract, checkRoles, disconnectWallet]);

  // Persistent Auto-connect check
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        // Just check if we already have authorized accounts
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          connectWallet(false); // Silent connect
        }
      }
    };
    checkConnection();
  }, [connectWallet]);

  const value = {
    provider, signer, contract, account,
    isOwner, isVerifiedRecruiter,
    networkName, chainId, isConnecting,
    connectWallet: () => connectWallet(true), // Manual connect
    disconnectWallet, switchToSepolia,
    contractAddress: contractData.contractAddress,
    isOnSepolia: chainId === SEPOLIA_CHAIN_ID,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
};
