import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "../context/WalletContext";

export default function Navbar() {
  const { account, balance, connect, disconnect } = useWallet();
  const router = useRouter();

  const short = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <nav style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E7EC" }} className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo + Links */}
        <div className="flex items-center gap-10">
          <Link href="/" style={{ color: "#101828" }} className="text-lg font-bold tracking-tight">
            NFTrade
          </Link>
          <div className="flex items-center gap-7">
            {[
              { href: "/marketplace", label: "Marketplace" },
              { href: "/mint", label: "Create" },
              { href: "/dashboard", label: "My Items" },
            ].map(({ href, label }) => {
              const active = router.pathname === href || (href === "/marketplace" && router.pathname === "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium transition-colors"
                  style={{ color: active ? "#101828" : "#667085", borderBottom: active ? "2px solid #101828" : "2px solid transparent", paddingBottom: "2px" }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {account ? (
            <>
              {balance !== null && (
                <span className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#15803D" }}>
                  {balance} ETH
                </span>
              )}
              <span className="text-sm font-mono px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F7F8FA", color: "#344054", border: "1px solid #E4E7EC" }}>
                {short(account)}
              </span>
              <button
                onClick={disconnect}
                className="text-sm px-4 py-1.5 rounded-lg font-medium transition"
                style={{ border: "1px solid #E4E7EC", color: "#667085", backgroundColor: "#FFFFFF" }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = "#F7F8FA"; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = "#FFFFFF"; }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="text-sm px-5 py-2 rounded-lg font-semibold transition"
              style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = "#1D2939"; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = "#101828"; }}
            >
              Connect Wallet
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
