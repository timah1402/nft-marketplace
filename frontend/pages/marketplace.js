import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getMarketplaceContract, fetchMetadata } from "../utils/contracts";
import NFTCard from "../components/NFTCard";
import BuyModal from "../components/BuyModal";
import WalletGate from "../components/WalletGate";

const TYPE_OPTIONS = ["All", "ERC-721", "ERC-1155"];
const SORT_OPTIONS = ["Latest", "Price ↑", "Price ↓"];

export default function MarketplacePage() {
  const { account, signer, provider } = useWallet();
  const toast = useToast();

  const [listings, setListings] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notDeployed, setNotDeployed] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setNotDeployed(false);
    try {
      const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const marketplace = getMarketplaceContract(prov);
      let raw;
      try {
        raw = await marketplace.getActiveListings();
      } catch {
        setNotDeployed(true);
        setListings([]);
        return;
      }

      const parsed = raw.map((l) => ({
        listingId: l.listingId.toString(),
        nftContract: l.nftContract,
        tokenId: l.tokenId.toString(),
        seller: l.seller,
        price: l.price.toString(),
        amount: l.amount.toString(),
        remaining: l.remaining.toString(),
        tokenType: Number(l.tokenType),
        active: l.active,
      }));
      setListings(parsed);

      const map = {};
      for (const listing of parsed) {
        const key = `${listing.nftContract}-${listing.tokenId}`;
        if (!map[key]) {
          try {
            const prov2 = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            const isERC1155 = listing.tokenType === 1;
            let tokenURI;
            if (isERC1155) {
              const ERC1155Artifact = require("../src/artifacts/contracts/MyERC1155.sol/MyERC1155.json");
              const contract = new ethers.Contract(listing.nftContract, ERC1155Artifact.abi, prov2);
              tokenURI = await contract.uri(listing.tokenId);
            } else {
              const ERC721Artifact = require("../src/artifacts/contracts/MyERC721.sol/MyERC721.json");
              const contract = new ethers.Contract(listing.nftContract, ERC721Artifact.abi, prov2);
              tokenURI = await contract.tokenURI(listing.tokenId);
            }
            map[key] = await fetchMetadata(tokenURI);
          } catch {
            map[key] = null;
          }
        }
      }
      setMetadataMap(map);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleBuy = async (listing, quantity) => {
    if (!signer) { toast.error("Connect your wallet to buy NFTs."); return; }
    setBuyLoading(true);
    try {
      const marketplace = getMarketplaceContract(signer);
      const total = BigInt(listing.price) * BigInt(quantity);
      const tx = await marketplace.buyNFT(listing.listingId, quantity, { value: total });
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success("Purchase successful!");
      setSelectedListing(null);
      loadListings();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setBuyLoading(false);
    }
  };

  const displayed = useMemo(() => {
    let result = [...listings];
    if (typeFilter === "ERC-721")  result = result.filter((l) => l.tokenType === 0);
    if (typeFilter === "ERC-1155") result = result.filter((l) => l.tokenType === 1);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const meta = metadataMap[`${l.nftContract}-${l.tokenId}`];
        return (meta?.name || "").toLowerCase().includes(q) ||
               (meta?.description || "").toLowerCase().includes(q);
      });
    }
    if (sortBy === "Price ↑") result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "Price ↓") result.sort((a, b) => Number(b.price) - Number(a.price));
    return result;
  }, [listings, metadataMap, search, typeFilter, sortBy]);

  const totalListings = listings.length;
  const uniqueSellers = new Set(listings.map((l) => l.seller)).size;

  return (
    <WalletGate
      title="Browse the Marketplace"
      description="Connect your MetaMask wallet to explore, buy, and sell unique digital assets on-chain."
    >
      {/* ── Hero banner ── */}
      <div
        className="rounded-3xl mb-10 px-10 py-12 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 50%, #FAF5FF 100%)",
          border: "1px solid #E4E7EC",
        }}
      >
        {/* Floating decorations */}
        <div className="absolute pointer-events-none inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"10%", right:"5%", width:64, height:64, borderRadius:"50%", background:"rgba(167,243,208,0.5)", animation:"float 7s ease-in-out infinite" }} />
          <div style={{ position:"absolute", bottom:"15%", right:"12%", width:40, height:40, borderRadius:"10px", background:"rgba(196,181,253,0.4)", animation:"float 9s ease-in-out infinite 1s", transform:"rotate(20deg)" }} />
          <div style={{ position:"absolute", top:"50%", right:"2%", width:24, height:24, borderRadius:"50%", background:"rgba(147,197,253,0.5)", animation:"float 6s ease-in-out infinite 0.5s" }} />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "#101828" }}>
            Discover NFTs
          </h1>
          <p className="text-base max-w-md" style={{ color: "#667085" }}>
            Explore unique digital assets created by collectors on the Hardhat local blockchain.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 relative z-10 shrink-0">
          {[
            { label: "Listed", value: loading ? "—" : totalListings },
            { label: "Creators", value: loading ? "—" : uniqueSellers },
            { label: "Standards", value: "ERC-721 & 1155" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold" style={{ color: "#101828" }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#98A2B3" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      {!notDeployed && !loading && (
        <div
          className="flex flex-wrap gap-3 mb-8 items-center p-4 rounded-2xl sticky top-[65px] z-30"
          style={{ backgroundColor: "rgba(247,248,250,0.92)", backdropFilter: "blur(12px)", border: "1px solid #E4E7EC" }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: "#98A2B3" }}>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #D0D5DD", color: "#101828" }}
            />
          </div>

          {/* Type pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F2F4F7" }}>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                style={typeFilter === t
                  ? { backgroundColor: "#101828", color: "#FFFFFF", boxShadow: "0 1px 4px rgba(16,24,40,0.15)" }
                  : { backgroundColor: "transparent", color: "#667085" }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F2F4F7" }}>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                style={sortBy === s
                  ? { backgroundColor: "#101828", color: "#FFFFFF", boxShadow: "0 1px 4px rgba(16,24,40,0.15)" }
                  : { backgroundColor: "transparent", color: "#667085" }
                }
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={loadListings}
            className="text-sm font-medium px-4 py-2.5 rounded-xl transition"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D0D5DD", color: "#344054" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F7F8FA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
          >
            ↻ Refresh
          </button>

          {displayed.length > 0 && (
            <span className="text-xs ml-auto" style={{ color: "#98A2B3" }}>
              {displayed.length} item{displayed.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: "#D0D5DD", borderTopColor: "#101828" }} />
          <p className="text-sm" style={{ color: "#98A2B3" }}>Loading listings…</p>
        </div>
      ) : notDeployed ? (
        <div className="text-center py-24">
          <p className="text-xl font-bold mb-2" style={{ color: "#344054" }}>Contracts not deployed</p>
          <p className="text-sm mb-6" style={{ color: "#667085" }}>Run these commands to get started:</p>
          <pre className="inline-block text-left text-xs px-6 py-4 rounded-xl" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC", color: "#344054" }}>
            {`npx hardhat node\nnpx hardhat run scripts/deploy.js --network localhost`}
          </pre>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-5">🔍</p>
          <p className="text-xl font-bold mb-2" style={{ color: "#344054" }}>
            {listings.length === 0 ? "No NFTs listed yet" : "No results found"}
          </p>
          <p className="text-sm" style={{ color: "#98A2B3" }}>
            {listings.length === 0 ? "Mint an NFT and list it for sale." : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayed.map((listing) => (
            <NFTCard
              key={listing.listingId}
              listing={listing}
              metadata={metadataMap[`${listing.nftContract}-${listing.tokenId}`]}
              account={account}
              onBuy={(l) => setSelectedListing(l)}
            />
          ))}
        </div>
      )}

      {selectedListing && (
        <BuyModal
          listing={selectedListing}
          metadata={metadataMap[`${selectedListing.nftContract}-${selectedListing.tokenId}`]}
          onConfirm={handleBuy}
          onClose={() => setSelectedListing(null)}
          loading={buyLoading}
        />
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
      `}</style>
    </WalletGate>
  );
}
