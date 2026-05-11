import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import WalletGate from "../components/WalletGate";
import {
  getERC721Contract,
  getERC1155Contract,
  getMarketplaceContract,
  fetchMetadata,
  ipfsToHttp,
  addresses,
} from "../utils/contracts";
import Link from "next/link";

const TABS = ["Owned", "Created", "Listed", "Activity"];

const ACTIVITY_CONFIG = {
  "Minted ERC-721":  { icon: "🎨", bg: "#F9F5FF", text: "#6941C6", border: "#D9D6FE", label: "Minted ERC-721" },
  "Minted ERC-1155": { icon: "🖼️", bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF", label: "Minted ERC-1155" },
  Listed:            { icon: "🏷️", bg: "#F8F9FC", text: "#344054", border: "#D0D5DD", label: "Listed" },
  Bought:            { icon: "🛍️", bg: "#ECFDF3", text: "#027A48", border: "#6CE9A6", label: "Bought" },
  Sold:              { icon: "💰", bg: "#FFFAEB", text: "#B54708", border: "#FEC84B", label: "Sold" },
  Cancelled:         { icon: "✕",  bg: "#FEF3F2", text: "#B42318", border: "#FDA29B", label: "Cancelled" },
};

const BADGE = {
  "ERC-721":  { bg: "#F4F3FF", color: "#5925DC" },
  "ERC-1155": { bg: "#EFF8FF", color: "#175CD3" },
};

export default function DashboardPage() {
  const { account, signer, provider } = useWallet();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("Owned");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);

  const loadOwned = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const erc721 = getERC721Contract(prov);
    const erc1155 = getERC1155Contract(prov);

    const total721 = await erc721.totalSupply();
    const owned721 = [];
    for (let i = 0; i < Number(total721); i++) {
      try {
        const owner = await erc721.ownerOf(i);
        if (owner.toLowerCase() === account.toLowerCase()) {
          const tokenURI = await erc721.tokenURI(i);
          const metadata = await fetchMetadata(tokenURI);
          owned721.push({ tokenId: i.toString(), standard: "ERC-721", metadata, nftContract: addresses.MyERC721 });
        }
      } catch {}
    }

    const total1155 = await erc1155.totalTokenTypes();
    const owned1155 = [];
    for (let i = 0; i < Number(total1155); i++) {
      try {
        const balance = await erc1155.balanceOf(account, i);
        if (Number(balance) > 0) {
          const tokenURI = await erc1155.uri(i);
          const metadata = await fetchMetadata(tokenURI);
          owned1155.push({ tokenId: i.toString(), standard: "ERC-1155", balance: balance.toString(), metadata, nftContract: addresses.MyERC1155 });
        }
      } catch {}
    }
    return [...owned721, ...owned1155];
  }, [account, provider]);

  const loadCreated = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const erc721 = getERC721Contract(prov);
    const erc1155 = getERC1155Contract(prov);

    const total721 = await erc721.totalSupply();
    const created721 = [];
    for (let i = 0; i < Number(total721); i++) {
      try {
        const creator = await erc721.creators(i);
        if (creator.toLowerCase() === account.toLowerCase()) {
          const tokenURI = await erc721.tokenURI(i);
          const metadata = await fetchMetadata(tokenURI);
          created721.push({ tokenId: i.toString(), standard: "ERC-721", metadata, nftContract: addresses.MyERC721 });
        }
      } catch {}
    }

    const total1155 = await erc1155.totalTokenTypes();
    const created1155 = [];
    for (let i = 0; i < Number(total1155); i++) {
      try {
        const creator = await erc1155.creators(i);
        if (creator.toLowerCase() === account.toLowerCase()) {
          const tokenURI = await erc1155.uri(i);
          const metadata = await fetchMetadata(tokenURI);
          const supply = await erc1155.tokenSupply(i);
          created1155.push({ tokenId: i.toString(), standard: "ERC-1155", supply: supply.toString(), metadata, nftContract: addresses.MyERC1155 });
        }
      } catch {}
    }
    return [...created721, ...created1155];
  }, [account, provider]);

  const loadListed = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const marketplace = getMarketplaceContract(prov);
    const total = await marketplace.totalListings();
    const myListings = [];

    for (let i = 0; i < Number(total); i++) {
      try {
        const l = await marketplace.getListing(i);
        if (l.seller.toLowerCase() === account.toLowerCase() && l.active) {
          const isERC1155 = Number(l.tokenType) === 1;
          let metadata = null;
          try {
            if (isERC1155) {
              const erc1155 = getERC1155Contract(prov);
              metadata = await fetchMetadata(await erc1155.uri(l.tokenId));
            } else {
              const erc721 = getERC721Contract(prov);
              metadata = await fetchMetadata(await erc721.tokenURI(l.tokenId));
            }
          } catch {}
          myListings.push({
            listingId: i.toString(),
            tokenId: l.tokenId.toString(),
            nftContract: l.nftContract,
            price: l.price.toString(),
            remaining: l.remaining.toString(),
            standard: isERC1155 ? "ERC-1155" : "ERC-721",
            metadata,
          });
        }
      } catch {}
    }
    return myListings;
  }, [account, provider]);

  const loadActivity = useCallback(async () => {
    const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const erc721 = getERC721Contract(prov);
    const erc1155 = getERC1155Contract(prov);
    const marketplace = getMarketplaceContract(prov);
    const events = [];

    try {
      const m721 = await erc721.queryFilter("NFTMinted");
      for (const e of m721) {
        if (e.args.creator.toLowerCase() === account.toLowerCase()) {
          events.push({ label: "Minted ERC-721", detail: `Token #${e.args.tokenId}`, blockNumber: e.blockNumber, hash: e.transactionHash });
        }
      }

      const m1155 = await erc1155.queryFilter("NFTMinted");
      for (const e of m1155) {
        if (e.args.creator.toLowerCase() === account.toLowerCase()) {
          events.push({ label: "Minted ERC-1155", detail: `Token #${e.args.tokenId} × ${e.args.amount}`, blockNumber: e.blockNumber, hash: e.transactionHash });
        }
      }

      const listed = await marketplace.queryFilter("NFTListed");
      for (const e of listed) {
        if (e.args.seller.toLowerCase() === account.toLowerCase()) {
          events.push({ label: "Listed", detail: `Token #${e.args.tokenId} @ ${(Number(e.args.price) / 1e18).toFixed(4)} ETH`, blockNumber: e.blockNumber, hash: e.transactionHash });
        }
      }

      const sold = await marketplace.queryFilter("NFTSold");
      for (const e of sold) {
        const eth = (Number(e.args.totalPaid) / 1e18).toFixed(4);
        if (e.args.buyer.toLowerCase() === account.toLowerCase()) {
          events.push({ label: "Bought", detail: `Listing #${e.args.listingId} · paid ${eth} ETH`, blockNumber: e.blockNumber, hash: e.transactionHash });
        }
        try {
          const listing = await marketplace.getListing(e.args.listingId);
          if (listing.seller.toLowerCase() === account.toLowerCase()) {
            events.push({ label: "Sold", detail: `Listing #${e.args.listingId} · received ${eth} ETH`, blockNumber: e.blockNumber, hash: e.transactionHash });
          }
        } catch {}
      }

      const cancelled = await marketplace.queryFilter("ListingCancelled");
      for (const e of cancelled) {
        try {
          const listing = await marketplace.getListing(e.args.listingId);
          if (listing.seller.toLowerCase() === account.toLowerCase()) {
            events.push({ label: "Cancelled", detail: `Listing #${e.args.listingId}`, blockNumber: e.blockNumber, hash: e.transactionHash });
          }
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load activity:", err);
    }

    events.sort((a, b) => b.blockNumber - a.blockNumber);
    return events;
  }, [account, provider]);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    setItems([]);
    const loaders = { Owned: loadOwned, Created: loadCreated, Listed: loadListed, Activity: loadActivity };
    loaders[activeTab]().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [account, activeTab, loadOwned, loadCreated, loadListed, loadActivity]);

  const handleCancel = async (listingId) => {
    if (!signer) return;
    setCancelLoading(listingId);
    try {
      const marketplace = getMarketplaceContract(signer);
      const tx = await marketplace.cancelListing(listingId);
      await tx.wait();
      toast.success("Listing cancelled.");
      setItems((prev) => prev.filter((i) => i.listingId !== listingId));
    } catch (err) {
      toast.error(err.reason || "Failed to cancel listing.");
    } finally {
      setCancelLoading(null);
    }
  };

  return (
    <WalletGate
      title="My Items"
      description="Connect your MetaMask wallet to view your owned, created, and listed NFTs — plus your full on-chain activity."
    >
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#101828" }}>My Items</h1>
        <p className="text-xs font-mono mt-1 truncate max-w-sm" style={{ color: "#98A2B3" }}>{account}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: "1px solid #E4E7EC" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium transition"
              style={{
                color: active ? "#101828" : "#667085",
                borderBottom: active ? "2px solid #101828" : "2px solid transparent",
                marginBottom: "-1px",
                backgroundColor: "transparent",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-t-transparent" style={{ borderColor: "#D0D5DD", borderTopColor: "#101828" }} />
        </div>
      ) : activeTab === "Activity" ? (
        items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-lg font-semibold mb-1" style={{ color: "#344054" }}>No activity yet</p>
            <p className="text-sm" style={{ color: "#98A2B3" }}>Your on-chain actions will appear here.</p>
          </div>
        ) : (
          <div className="max-w-3xl">
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total events", value: items.length },
                { label: "Minted", value: items.filter(e => e.label?.startsWith("Minted")).length },
                { label: "Trades", value: items.filter(e => e.label === "Bought" || e.label === "Sold").length },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl px-5 py-4 text-center"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E7EC" }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: "#101828" }}>{s.value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#98A2B3" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-6 top-0 bottom-0 w-px"
                style={{ backgroundColor: "#E4E7EC" }}
              />

              <div className="flex flex-col gap-3">
                {items.map((ev, idx) => {
                  const c = ACTIVITY_CONFIG[ev.label] || ACTIVITY_CONFIG["Listed"];
                  // Extract ETH amount if present in detail
                  const ethMatch = ev.detail?.match(/([\d.]+)\s*ETH/);
                  const ethAmount = ethMatch ? ethMatch[1] : null;
                  const detailClean = ev.detail?.replace(/[\d.]+\s*ETH/, "").replace(/·\s*$/, "").trim() ?? "";

                  return (
                    <div key={idx} className="flex gap-5 relative">
                      {/* Icon bubble */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 z-10"
                        style={{
                          backgroundColor: c.bg,
                          border: `1.5px solid ${c.border}`,
                          boxShadow: "0 1px 4px rgba(16,24,40,0.06)",
                        }}
                      >
                        {c.icon}
                      </div>

                      {/* Card */}
                      <div
                        className="flex-1 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 mb-1"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E7EC",
                          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                        }}
                      >
                        <div className="min-w-0">
                          {/* Badge + detail */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                              style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                            >
                              {c.label}
                            </span>
                            <span className="text-sm font-medium truncate" style={{ color: "#344054" }}>
                              {detailClean}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: "#98A2B3" }}>
                            Block <span className="font-mono">#{ev.blockNumber}</span>
                          </p>
                        </div>

                        {/* ETH amount badge */}
                        {ethAmount && (
                          <div
                            className="shrink-0 text-right px-3 py-2 rounded-xl"
                            style={{
                              backgroundColor: ev.label === "Sold" ? "#FFFAEB" : ev.label === "Bought" ? "#FEF3F2" : "#F7F8FA",
                              border: `1px solid ${ev.label === "Sold" ? "#FEC84B" : ev.label === "Bought" ? "#FDA29B" : "#E4E7EC"}`,
                            }}
                          >
                            <p className="text-xs font-medium" style={{ color: "#98A2B3" }}>
                              {ev.label === "Sold" ? "received" : ev.label === "Bought" ? "paid" : "price"}
                            </p>
                            <p className="text-base font-extrabold" style={{ color: ev.label === "Sold" ? "#B54708" : ev.label === "Bought" ? "#B42318" : "#101828" }}>
                              {ethAmount} <span className="text-xs font-semibold">ETH</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      ) : items.length === 0 ? (
        <div className="text-center py-20" style={{ color: "#98A2B3" }}>
          No items here yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item, idx) => {
            const image = item.metadata?.image ? ipfsToHttp(item.metadata.image) : null;
            const badge = BADGE[item.standard] || BADGE["ERC-721"];
            return (
              <Link
                key={idx}
                href={`/nft/${item.nftContract}/${item.tokenId}`}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E7EC", boxShadow: "0 1px 3px rgba(16,24,40,0.06)", textDecoration: "none", color: "inherit" }}
              >
                <div className="w-full h-44 overflow-hidden relative" style={{ backgroundColor: "#F2F4F7" }}>
                  {image ? (
                    <img src={image} alt="nft" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm" style={{ color: "#98A2B3" }}>No Image</span>
                    </div>
                  )}
                  <span
                    className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {item.standard}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-1 flex-1">
                  <p className="font-semibold truncate" style={{ color: "#101828" }}>
                    {item.metadata?.name || `Token #${item.tokenId}`}
                  </p>
                  <p className="text-xs" style={{ color: "#98A2B3" }}>Token ID: {item.tokenId}</p>
                  {item.balance && <p className="text-xs" style={{ color: "#667085" }}>Balance: {item.balance}</p>}
                  {item.supply && <p className="text-xs" style={{ color: "#667085" }}>Supply: {item.supply}</p>}

                  {activeTab === "Listed" && (
                    <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F2F4F7" }}>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#101828" }}>
                          {(Number(item.price) / 1e18).toFixed(4)} ETH
                        </p>
                        <p className="text-xs" style={{ color: "#98A2B3" }}>Qty: {item.remaining}</p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); handleCancel(item.listingId); }}
                        disabled={cancelLoading === item.listingId}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        style={{ border: "1px solid #FDA29B", color: "#B42318", backgroundColor: "#FFFFFF" }}
                        onMouseEnter={(e) => { if (cancelLoading !== item.listingId) e.currentTarget.style.backgroundColor = "#FEF3F2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
                      >
                        {cancelLoading === item.listingId ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </WalletGate>
  );
}
