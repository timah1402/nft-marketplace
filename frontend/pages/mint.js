import { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { getERC721Contract, getERC1155Contract, getMarketplaceContract } from "../utils/contracts";
import { uploadFileToIPFS, uploadMetadataToIPFS } from "../utils/ipfs";
import WalletGate from "../components/WalletGate";

const STEPS = { IDLE: "idle", UPLOADING: "uploading", MINTING: "minting", APPROVING: "approving", LISTING: "listing", DONE: "done" };

const STEP_LABEL = {
  uploading: "Uploading to IPFS…",
  minting:   "Minting on blockchain…",
  approving: "Approving marketplace…",
  listing:   "Listing for sale…",
};

export default function MintPage() {
  const { account, signer, connect } = useWallet();
  const toast = useToast();

  const [tokenType, setTokenType] = useState("ERC721");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [supply, setSupply] = useState(1);

  const [listForSale, setListForSale] = useState(false);
  const [price, setPrice] = useState("");
  const [listAmount, setListAmount] = useState(1);

  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [mintedTokenId, setMintedTokenId] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMint = async () => {
    if (!account) { connect(); return; }
    if (!name || !image) { setError("Name and image are required."); return; }
    if (listForSale && !price) { setError("Please enter a listing price."); return; }

    setError(null);
    setTxHash(null);
    setMintedTokenId(null);

    try {
      setStep(STEPS.UPLOADING);
      const imageURI = await uploadFileToIPFS(image);
      const metadataURI = await uploadMetadataToIPFS({ name, description, image: imageURI, attributes: [] });

      setStep(STEPS.MINTING);
      let tokenId;
      if (tokenType === "ERC721") {
        const contract = getERC721Contract(signer);
        const tx = await contract.mintNFT(metadataURI);
        const receipt = await tx.wait();
        const event = receipt.logs
          .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
          .find((e) => e && e.name === "NFTMinted");
        tokenId = event ? event.args.tokenId.toString() : "0";
        setTxHash(receipt.hash);
      } else {
        const contract = getERC1155Contract(signer);
        const tx = await contract.mintNFT(supply, metadataURI, name);
        const receipt = await tx.wait();
        const event = receipt.logs
          .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
          .find((e) => e && e.name === "NFTMinted");
        tokenId = event ? event.args.tokenId.toString() : "0";
        setTxHash(receipt.hash);
      }
      setMintedTokenId(tokenId);

      if (listForSale) {
        const marketplace = getMarketplaceContract(signer);
        const priceWei = ethers.parseEther(price);

        if (tokenType === "ERC721") {
          setStep(STEPS.APPROVING);
          const nft = getERC721Contract(signer);
          const addresses = require("../contracts/addresses.json");
          await (await nft.approve(addresses.NFTMarketplace, tokenId)).wait();
          setStep(STEPS.LISTING);
          await (await marketplace.listERC721(addresses.MyERC721, tokenId, priceWei)).wait();
        } else {
          setStep(STEPS.APPROVING);
          const nft = getERC1155Contract(signer);
          const addresses = require("../contracts/addresses.json");
          await (await nft.setApprovalForAll(addresses.NFTMarketplace, true)).wait();
          setStep(STEPS.LISTING);
          await (await marketplace.listERC1155(addresses.MyERC1155, tokenId, listAmount, priceWei)).wait();
        }
      }

      setStep(STEPS.DONE);
      toast.success(listForSale ? "NFT minted and listed!" : "NFT minted successfully!");
    } catch (err) {
      console.error(err);
      const msg = err.reason || err.message || "Something went wrong.";
      setError(msg);
      toast.error(msg);
      setStep(STEPS.IDLE);
    }
  };

  const reset = () => {
    setName(""); setDescription(""); setImage(null); setImagePreview(null);
    setSupply(1); setPrice(""); setListAmount(1); setListForSale(false);
    setStep(STEPS.IDLE); setError(null); setTxHash(null); setMintedTokenId(null);
  };

  /* ── Done screen ── */
  if (step === STEPS.DONE) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5"
          style={{ backgroundColor: "#ECFDF3" }}
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#101828" }}>NFT Minted</h2>
        <p className="text-sm mb-1" style={{ color: "#667085" }}>
          Token ID: <span className="font-mono font-semibold" style={{ color: "#101828" }}>{mintedTokenId}</span>
        </p>
        {txHash && (
          <p className="text-xs font-mono mb-1 break-all" style={{ color: "#98A2B3" }}>Tx: {txHash}</p>
        )}
        {listForSale && (
          <p className="text-sm mt-2 mb-6" style={{ color: "#027A48" }}>Listed on the marketplace.</p>
        )}
        <button
          onClick={reset}
          className="text-sm font-semibold px-6 py-2.5 rounded-xl mt-4 transition"
          style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
        >
          Mint Another
        </button>
      </div>
    );
  }

  const busy = step !== STEPS.IDLE;

  /* ── Progress steps indicator ── */
  const PROGRESS_STEPS = listForSale
    ? ["Upload", "Mint", "Approve", "List"]
    : ["Upload", "Mint"];
  const stepIndex = { uploading: 0, minting: 1, approving: 2, listing: 3 };
  const currentIdx = stepIndex[step] ?? -1;

  return (
    <WalletGate
      title="Create your NFT"
      description="Connect your MetaMask wallet to mint unique ERC-721 or multi-edition ERC-1155 tokens directly on-chain."
    >
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#101828" }}>Create NFT</h1>
        <p className="mt-1 text-sm" style={{ color: "#667085" }}>Mint ERC-721 or ERC-1155 tokens on-chain</p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl mb-6 text-sm" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FDA29B", color: "#B42318" }}>
          {error}
        </div>
      )}

      {/* Progress bar */}
      {busy && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            {PROGRESS_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition"
                  style={{
                    backgroundColor: i <= currentIdx ? "#101828" : "#F2F4F7",
                    color: i <= currentIdx ? "#FFFFFF" : "#98A2B3",
                  }}
                >
                  {i < currentIdx ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: i <= currentIdx ? "#101828" : "#98A2B3" }}>
                  {label}
                </span>
                {i < PROGRESS_STEPS.length - 1 && (
                  <div className="w-8 h-px mx-1" style={{ backgroundColor: i < currentIdx ? "#101828" : "#E4E7EC" }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm flex items-center gap-2" style={{ color: "#667085" }}>
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#D0D5DD", borderTopColor: "#101828" }} />
            {STEP_LABEL[step]}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E7EC" }}>

        {/* Token type */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: "#344054" }}>Token Standard</label>
          <div className="flex gap-2">
            {["ERC721", "ERC1155"].map((t) => (
              <button
                key={t}
                onClick={() => setTokenType(t)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                style={tokenType === t
                  ? { backgroundColor: "#101828", color: "#FFFFFF" }
                  : { backgroundColor: "#F7F8FA", color: "#667085", border: "1px solid #E4E7EC" }
                }
              >
                {t === "ERC721" ? "ERC-721 · Unique" : "ERC-1155 · Multi-copy"}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "#98A2B3" }}>
            {tokenType === "ERC721"
              ? "One-of-one NFT — only a single token will ever exist."
              : "Create multiple copies of the same NFT."}
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            placeholder="My Awesome NFT"
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition disabled:opacity-50"
            style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            rows={3}
            placeholder="Tell the story behind your NFT…"
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none resize-none transition disabled:opacity-50"
            style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
          />
        </div>

        {/* Image */}
        <div>
          <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>Image *</label>
          <div
            className="relative rounded-xl p-4 text-center transition cursor-pointer"
            style={{ border: "2px dashed #D0D5DD" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#101828"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D0D5DD"; }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={busy}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            ) : (
              <div>
                <p className="text-sm font-medium" style={{ color: "#344054" }}>Click or drag to upload</p>
                <p className="text-xs mt-0.5" style={{ color: "#98A2B3" }}>PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Supply (ERC-1155) */}
        {tokenType === "ERC1155" && (
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>Supply (copies)</label>
            <input
              type="number"
              min={1}
              value={supply}
              onChange={(e) => setSupply(Math.max(1, Number(e.target.value)))}
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition disabled:opacity-50"
              style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
            />
          </div>
        )}

        {/* List for sale toggle */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
          style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC" }}
          onClick={() => !busy && setListForSale(!listForSale)}
        >
          <div
            className="w-9 h-5 rounded-full relative transition flex items-center px-0.5"
            style={{ backgroundColor: listForSale ? "#101828" : "#D0D5DD" }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: listForSale ? "translateX(16px)" : "translateX(0)" }}
            />
          </div>
          <label className="text-sm font-medium cursor-pointer" style={{ color: "#344054" }}>
            List immediately for sale
          </label>
        </div>

        {/* Listing options */}
        {listForSale && (
          <div className="rounded-xl p-4 flex flex-col gap-4" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E4E7EC" }}>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>
                Price (ETH) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
                placeholder="0.05"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition disabled:opacity-50"
                style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
              />
            </div>
            {tokenType === "ERC1155" && (
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#344054" }}>Amount to list</label>
                <input
                  type="number"
                  min={1}
                  max={supply}
                  value={listAmount}
                  onChange={(e) => setListAmount(Math.min(supply, Math.max(1, Number(e.target.value))))}
                  disabled={busy}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition disabled:opacity-50"
                  style={{ border: "1px solid #D0D5DD", color: "#101828", backgroundColor: "#FFFFFF" }}
                />
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleMint}
          disabled={busy || !account}
          className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
          onMouseEnter={(e) => { if (!busy && account) e.target.style.backgroundColor = "#1D2939"; }}
          onMouseLeave={(e) => { e.target.style.backgroundColor = "#101828"; }}
        >
          {busy ? STEP_LABEL[step] : `Create ${tokenType === "ERC721" ? "ERC-721" : "ERC-1155"} NFT`}
        </button>
      </div>
    </div>
    </WalletGate>
  );
}
