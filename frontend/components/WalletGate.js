import { useWallet } from "../context/WalletContext";

export default function WalletGate({ children, title, description }) {
  const { account, connect } = useWallet();

  if (account) return children;

  return (
    <div
      className="fixed inset-0 flex flex-col lg:flex-row items-center justify-center gap-0"
      style={{ backgroundColor: "#F7F8FA", zIndex: 10 }}
    >
      {/* Left — Illustration */}
      <div
        className="flex-1 flex items-center justify-center h-full w-full"
        style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #E4E7EC" }}
      >
        <div
          className="w-full max-w-xl px-12"
          style={{ animation: "float 5s ease-in-out infinite" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/wallet-gate.svg"
            alt="Connect wallet"
            className="w-full h-auto"
          />
          {/* Secure login illustration by Storyset - https://storyset.com/technology */}
        </div>
      </div>

      {/* Right — Content */}
      <div className="flex-1 flex items-center justify-center h-full w-full px-10 lg:px-20">
        <div className="w-full max-w-md">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-8"
            style={{ backgroundColor: "#F2F4F7", color: "#667085" }}
          >
            <span>🔐</span>
            <span>Wallet required</span>
          </div>

          <h1
            className="text-5xl font-extrabold tracking-tight leading-tight mb-5"
            style={{ color: "#101828" }}
          >
            {title || "Connect your wallet"}
          </h1>

          <p className="text-lg leading-relaxed mb-10" style={{ color: "#667085" }}>
            {description || "Link your MetaMask wallet to get started. Your wallet is your identity — no sign-up or password needed."}
          </p>

          {/* Steps */}
          <div
            className="flex flex-col gap-4 mb-10 p-6 rounded-2xl"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E7EC" }}
          >
            {[
              { n: "1", text: "Install MetaMask if you haven't yet" },
              { n: "2", text: "Click the button below to connect" },
              { n: "3", text: "Approve the connection in MetaMask" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-4">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
                >
                  {s.n}
                </span>
                <span className="text-base" style={{ color: "#344054" }}>{s.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={connect}
            className="w-full py-4 rounded-xl text-base font-bold tracking-wide transition"
            style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1D2939"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#101828"; }}
          >
            Connect Wallet
          </button>

          <p className="text-sm mt-4 text-center" style={{ color: "#98A2B3" }}>
            Use the Hardhat Local network (Chain ID 31337)
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
}
