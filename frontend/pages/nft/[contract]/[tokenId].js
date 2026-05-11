import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "../../../context/WalletContext";
import { useToast } from "../../../context/ToastContext";
import { getMarketplaceContract, ipfsToHttp, fetchMetadata } from "../../../utils/contracts";
import BuyModal from "../../../components/BuyModal";
import MarketplaceArtifact from "../../../src/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";
import ERC721Artifact from "../../../src/artifacts/contracts/MyERC721.sol/MyERC721.json";
import ERC1155Artifact from "../../../src/artifacts/contracts/MyERC1155.sol/MyERC1155.json";

export default function NFTDetailPage() {
  const router = useRouter();
  const { contract: contractAddress, tokenId } = router.query;
  const { account, signer, provider } = useWallet();
  const toast = useToast();

  const [listing, setListing]           = useState(null);
  const [metadata, setMetadata]         = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [buying, setBuying]             = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isERC1155, setIsERC1155]       = useState(false);
  const [imageLoaded, setImageLoaded]   = useState(false);

  const load = useCallback(async () => {
    if (!contractAddress || !tokenId) return;
    setLoading(true);
    try {
      const prov = provider || new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const marketplace = getMarketplaceContract(prov);

      // Find active listing for this NFT
      const raw = await marketplace.getActiveListings();
      const found = raw.find(
        (l) =>
          l.nftContract.toLowerCase() === contractAddress.toLowerCase() &&
          l.tokenId.toString() === tokenId.toString()
      );

      let tokenType = 0;
      if (found) {
        tokenType = Number(found.tokenType);
        setListing({
          listingId: found.listingId.toString(),
          nftContract: found.nftContract,
          tokenId:     found.tokenId.toString(),
          seller:      found.seller,
          price:       found.price.toString(),
          amount:      found.amount.toString(),
          remaining:   found.remaining.toString(),
          tokenType,
          active: found.active,
        });
      } else {
        setListing(null);
      }
      setIsERC1155(tokenType === 1);

      // Fetch metadata
      try {
        if (tokenType === 1) {
          const c = new ethers.Contract(contractAddress, ERC1155Artifact.abi, prov);
          const uri = await c.uri(tokenId);
          setMetadata(await fetchMetadata(uri));
        } else {
          const c = new ethers.Contract(contractAddress, ERC721Artifact.abi, prov);
          const uri = await c.tokenURI(tokenId);
          setMetadata(await fetchMetadata(uri));
        }
      } catch { setMetadata(null); }

      // Price history: NFTListed events for this contract+tokenId → NFTSold for each listingId
      try {
        const mkt = new ethers.Contract(marketplace.target, MarketplaceArtifact.abi, prov);
        const listedFilter = mkt.filters.NFTListed(null, contractAddress, tokenId);
        const listedEvents = await mkt.queryFilter(listedFilter);

        const sales = [];
        for (const le of listedEvents) {
          const lid = le.args.listingId;
          const soldFilter = mkt.filters.NFTSold(lid, null);
          const soldEvents = await mkt.queryFilter(soldFilter);
          for (const se of soldEvents) {
            const block = await prov.getBlock(se.blockNumber);
            sales.push({
              buyer:        se.args.buyer,
              quantity:     Number(se.args.quantity),
              totalPaid:    se.args.totalPaid.toString(),
              pricePerUnit: (Number(se.args.totalPaid) / Number(se.args.quantity) / 1e18).toFixed(4),
              date:         block ? new Date(block.timestamp * 1000) : null,
            });
          }
        }
        sales.sort((a, b) => (b.date || 0) - (a.date || 0));
        setSalesHistory(sales);
      } catch { setSalesHistory([]); }
    } catch (err) {
      console.error("NFT detail load error:", err);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenId, provider]);

  useEffect(() => { load(); }, [load]);

  const handleBuy = async (lst, quantity) => {
    if (!signer) { toast.error("Connect your wallet to buy."); return; }
    setBuying(true);
    try {
      const marketplace = getMarketplaceContract(signer);
      const total = BigInt(lst.price) * BigInt(quantity);
      const tx = await marketplace.buyNFT(lst.listingId, quantity, { value: total });
      toast.info("Transaction submitted…");
      await tx.wait();
      toast.success("Purchase successful!");
      setShowBuyModal(false);
      load();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setBuying(false);
    }
  };

  const image    = metadata?.image ? ipfsToHttp(metadata.image) : null;
  const isSeller = account && listing?.seller?.toLowerCase() === account?.toLowerCase();
  const priceEth = listing ? (Number(listing.price) / 1e18).toFixed(4) : null;
  const badge    = isERC1155
    ? { bg: "#EFF8FF", color: "#175CD3", label: "ERC-1155" }
    : { bg: "#F4F3FF", color: "#5925DC", label: "ERC-721" };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2"
          style={{ borderColor: "#D0D5DD", borderTopColor: "#101828" }}
        />
        <p className="text-sm" style={{ color: "#98A2B3" }}>Loading NFT…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: "#98A2B3" }}>
        <Link href="/marketplace" className="hover:underline transition" style={{ color: "#667085" }}>
          Marketplace
        </Link>
        <span>/</span>
        <span style={{ color: "#101828" }}>{metadata?.name || `Token #${tokenId}`}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── Left: Image ── */}
        <div className="lg:sticky lg:top-24">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              border: "1px solid #E4E7EC",
              boxShadow: "0 4px 24px rgba(16,24,40,0.06)",
              backgroundColor: "#F2F4F7",
              aspectRatio: "1 / 1",
            }}
          >
            {image ? (
              <img
                src={image}
                alt={metadata?.name || "NFT"}
                className="w-full h-full object-cover"
                style={{ opacity: imageLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <span style={{ fontSize: 56 }}>🖼️</span>
                <span className="text-sm" style={{ color: "#98A2B3" }}>No Image</span>
              </div>
            )}
          </div>

          {/* Token details */}
          <div
            className="mt-4 rounded-2xl p-4 grid grid-cols-2 gap-4"
            style={{ border: "1px solid #E4E7EC", backgroundColor: "#FFFFFF" }}
          >
            {[
              { label: "Contract",   value: contractAddress ? `${contractAddress.slice(0, 8)}…${contractAddress.slice(-6)}` : "—" },
              { label: "Token ID",   value: `#${tokenId}` },
              { label: "Standard",   value: badge.label },
              { label: "Blockchain", value: "Hardhat Local" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#98A2B3" }}>{item.label}</p>
                <p className="text-sm font-semibold font-mono" style={{ color: "#344054" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Info ── */}
        <div className="flex flex-col gap-6">

          {/* Badge + name */}
          <div>
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "#101828" }}>
              {metadata?.name || `Token #${tokenId}`}
            </h1>
            {metadata?.description && (
              <p className="text-base leading-relaxed" style={{ color: "#667085" }}>
                {metadata.description}
              </p>
            )}
          </div>

          {/* Seller */}
          {listing && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: "#F2F4F7", color: "#667085" }}
              >
                {listing.seller.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#98A2B3" }}>Listed by</p>
                <p className="text-sm font-mono font-semibold" style={{ color: "#344054" }}>
                  {listing.seller.slice(0, 10)}…{listing.seller.slice(-6)}
                  {isSeller && (
                    <span className="ml-2 text-xs font-sans" style={{ color: "#98A2B3" }}>(you)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Attributes */}
          {metadata?.attributes?.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: "#344054" }}>Attributes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {metadata.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC" }}
                  >
                    <p
                      className="text-xs font-medium uppercase tracking-wide mb-0.5"
                      style={{ color: "#98A2B3" }}
                    >
                      {attr.trait_type}
                    </p>
                    <p className="text-sm font-bold" style={{ color: "#101828" }}>
                      {attr.value?.toString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price / Buy */}
          <div
            className="rounded-2xl p-5"
            style={{ border: "1px solid #E4E7EC", backgroundColor: "#FFFFFF" }}
          >
            {listing ? (
              <>
                <p className="text-xs font-medium mb-1" style={{ color: "#98A2B3" }}>
                  {isERC1155
                    ? `Price per unit · ${listing.remaining} of ${listing.amount} remaining`
                    : "Current price"}
                </p>
                <p className="text-4xl font-extrabold mb-5" style={{ color: "#101828" }}>
                  {priceEth}{" "}
                  <span className="text-xl font-semibold" style={{ color: "#667085" }}>ETH</span>
                </p>
                {isSeller ? (
                  <div
                    className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                    style={{ backgroundColor: "#F7F8FA", color: "#98A2B3" }}
                  >
                    This is your listing
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!account) { toast.error("Connect your wallet to buy."); return; }
                      setShowBuyModal(true);
                    }}
                    className="w-full py-3.5 rounded-xl text-base font-bold transition"
                    style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1D2939"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#101828"; }}
                  >
                    Buy Now
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-center py-2" style={{ color: "#98A2B3" }}>
                Not currently listed for sale
              </p>
            )}
          </div>

          {/* Sale history */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "#344054" }}>Sale History</p>
            {salesHistory.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ border: "1px solid #E4E7EC", backgroundColor: "#FAFAFA" }}
              >
                <p className="text-sm" style={{ color: "#98A2B3" }}>No sales yet</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E4E7EC" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#F7F8FA", borderBottom: "1px solid #E4E7EC" }}>
                      {["Price", isERC1155 ? "Qty" : null, "Buyer", "Date"]
                        .filter(Boolean)
                        .map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold"
                            style={{ color: "#667085" }}
                          >
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((s, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < salesHistory.length - 1 ? "1px solid #F2F4F7" : "none",
                        }}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: "#101828" }}>
                          {s.pricePerUnit} ETH
                        </td>
                        {isERC1155 && (
                          <td className="px-4 py-3" style={{ color: "#344054" }}>{s.quantity}</td>
                        )}
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "#667085" }}>
                          {s.buyer.slice(0, 8)}…{s.buyer.slice(-6)}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#98A2B3" }}>
                          {s.date ? s.date.toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {showBuyModal && listing && (
        <BuyModal
          listing={listing}
          metadata={metadata}
          onConfirm={handleBuy}
          onClose={() => setShowBuyModal(false)}
          loading={buying}
        />
      )}
    </div>
  );
}
