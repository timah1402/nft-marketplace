import { useState } from "react";
import Link from "next/link";
import { ipfsToHttp } from "../utils/contracts";

const BADGE = {
  erc721:  { bg: "#F4F3FF", color: "#5925DC", label: "ERC-721" },
  erc1155: { bg: "#EFF8FF", color: "#175CD3", label: "ERC-1155" },
};

export default function NFTCard({ listing, metadata, onBuy, account }) {
  const [hovered, setHovered] = useState(false);
  const isSeller = account && listing.seller.toLowerCase() === account.toLowerCase();
  const isERC1155 = listing.tokenType === 1 || listing.tokenType === "1";
  const price = listing.price ? (Number(listing.price) / 1e18).toFixed(4) : "0";
  const image = metadata?.image ? ipfsToHttp(metadata.image) : null;
  const badge = isERC1155 ? BADGE.erc1155 : BADGE.erc721;
  const sellerShort = `${listing.seller.slice(0, 6)}…${listing.seller.slice(-4)}`;
  const sellerInitial = listing.seller.slice(2, 4).toUpperCase();

  return (
    <Link
      href={`/nft/${listing.nftContract}/${listing.tokenId}`}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E4E7EC",
        boxShadow: hovered ? "0 16px 40px rgba(16,24,40,0.12)" : "0 1px 4px rgba(16,24,40,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative overflow-hidden" style={{ height: 240, backgroundColor: "#F2F4F7", flexShrink: 0 }}>
        {image ? (
          <img
            src={image}
            alt={metadata?.name || "NFT"}
            className="w-full h-full object-cover"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s ease" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 40 }}>🖼️</span>
            <span className="text-xs" style={{ color: "#98A2B3" }}>No Image</span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: badge.bg, color: badge.color, opacity: 0.95 }}
          >
            {badge.label}
          </span>
          {isERC1155 && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#FFFFFF" }}
            >
              {listing.remaining} left
            </span>
          )}
        </div>

        {/* Buy overlay on hover */}
        {!isSeller && (
          <div
            className="absolute inset-0 flex items-end p-4 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(16,24,40,0.7) 0%, transparent 55%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          >
            <button
              onClick={(e) => { e.preventDefault(); onBuy(listing); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide pointer-events-auto transition"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#101828",
                transform: hovered ? "translateY(0)" : "translateY(8px)",
                transition: "transform 0.25s ease, background-color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F2F4F7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
            >
              Buy Now
            </button>
          </div>
        )}

        {isSeller && (
          <div
            className="absolute inset-0 flex items-end p-4 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(16,24,40,0.5) 0%, transparent 55%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          >
            <span
              className="w-full py-2 rounded-xl text-xs font-semibold text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF", backdropFilter: "blur(4px)" }}
            >
              Your listing
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name */}
        <div>
          <h3 className="font-bold text-base truncate" style={{ color: "#101828" }}>
            {metadata?.name || `Token #${listing.tokenId}`}
          </h3>
          {metadata?.description && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#98A2B3" }}>
              {metadata.description}
            </p>
          )}
        </div>

        {/* Seller */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: "#F2F4F7", color: "#667085" }}
          >
            {sellerInitial}
          </div>
          <span className="text-xs font-mono" style={{ color: "#667085" }}>{sellerShort}</span>
        </div>

        {/* Price row */}
        <div
          className="flex items-center justify-between pt-3 mt-auto"
          style={{ borderTop: "1px solid #F2F4F7" }}
        >
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "#98A2B3" }}>Price</p>
            <p className="text-lg font-extrabold" style={{ color: "#101828" }}>{price} <span className="text-sm font-semibold" style={{ color: "#667085" }}>ETH</span></p>
          </div>
          {isSeller && (
            <span className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F7F8FA", color: "#98A2B3" }}>
              Your listing
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
