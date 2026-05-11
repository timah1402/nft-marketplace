import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);

  const refreshBalance = useCallback(async (prov, addr) => {
    if (!prov || !addr) return;
    try {
      const raw = await prov.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(raw)).toFixed(4));
    } catch (_) {}
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to use this app.");
      return;
    }
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setChainId(network.chainId.toString());
      refreshBalance(web3Provider, address);
    } catch (err) {
      if (err?.code === -32002 || err?.message?.includes("already pending")) {
        setError("MetaMask has a pending request — open MetaMask and approve it.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
  }, []);

  // Auto-reconnect if already connected
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) connect();
    });

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else connect();
    };
    const handleChainChanged = () => connect();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, disconnect]);

  return (
    <WalletContext.Provider value={{ account, provider, signer, chainId, balance, refreshBalance, connect, disconnect, error }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
