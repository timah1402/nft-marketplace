import { useState } from "react";
import { ipfsToHttp } from "../utils/contracts";

export default function BuyModal({ listing, metadata, onConfirm, onClose, loading }) {
  const [quantity, setQuantity] = useState(1);
  const isERC1155 = listing.tokenType === 1 || listing.tokenType === "1";
  const priceEth = Number(listing.price) / 1e18;
  const maxQty = Number(listing.remaining);
  const total = (priceEth * (isERC1155 ? quantity : 1)).toFixed(4);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(16,24,40,0.4)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 20px 60px rgba(16,24,40,0.18)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "#101828" }}>Complete Purchase</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition"
            style={{ color: "#667085", backgroundColor: "#F7F8FA" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#E4E7EC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F7F8FA"; }}
          >
            ×
          </button>
        </div>

        {/* NFT preview */}
        <div className="flex gap-4 mb-5 p-4 rounded-xl" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC" }}>
          {metadata?.image && (
            <img
              src={ipfsToHttp(metadata.image)}
              alt="nft"
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate" style={{ color: "#101828" }}>
              {metadata?.name || `Token #${listing.tokenId}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#667085" }}>
              {isERC1155 ? "ERC-1155 · Multi-copy" : "ERC-721 · Unique"}
            </p>
            <p className="text-sm font-bold mt-1" style={{ color: "#101828" }}>
              {priceEth.toFixed(4)} ETH {isERC1155 && "/ unit"}
            </p>
          </div>
        </div>

        {/* Quantity */}
        {isERC1155 && (
          <div className="mb-5">
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>
              Quantity <span style={{ color: "#98A2B3" }}>(max {maxQty})</span>
            </label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
            />
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC" }}>
          <span className="text-sm" style={{ color: "#667085" }}>Total to pay</span>
          <span className="text-lg font-bold" style={{ color: "#101828" }}>{total} ETH</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
            style={{ border: "1px solid #D0D5DD", color: "#344054", backgroundColor: "#FFFFFF" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#F7F8FA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(listing, isERC1155 ? quantity : 1)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#1D2939"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#101828"; }}
          >
            {loading ? "Confirming…" : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
