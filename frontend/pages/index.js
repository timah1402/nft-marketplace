import { useEffect, useRef } from "react";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";

/* ── scroll fade-up ── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(32px)";
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── sections data ── */
const SECTIONS = [
  {
    tag: "Create",
    title: "Mint your own NFT",
    desc: "Upload any image and turn it into a unique ERC-721 or multi-edition ERC-1155 token. Stored forever on-chain with IPFS metadata.",
    points: ["One-of-one or multi-copy editions", "IPFS-backed metadata & images", "Instant listing after minting"],
    cta: { label: "Start creating", href: "/mint" },
    svg: "/svg/feature-create.svg",
    flip: false,
    bg: "rgba(240,253,250,0.8)",
    tagColor: "#0D9488",
    tagBg: "#F0FDFA",
  },
  {
    tag: "Trade",
    title: "Buy & sell on the open market",
    desc: "Browse NFTs listed by other creators and buy instantly. Set your price and list your NFTs — payments go straight to your wallet.",
    points: ["Fixed-price listings", "ETH paid directly wallet-to-wallet", "ERC-721 & ERC-1155 supported"],
    cta: { label: "Browse marketplace", href: "/marketplace" },
    svg: "/svg/feature-buy.svg",
    flip: true,
    bg: "rgba(245,243,255,0.8)",
    tagColor: "#7C3AED",
    tagBg: "#F5F3FF",
  },
  {
    tag: "Track",
    title: "Your collection, at a glance",
    desc: "See every NFT you own, created, or listed. Check your full on-chain activity history — mints, buys, sales, and cancellations.",
    points: ["Owned, created & listed tabs", "Full activity feed from the chain", "Cancel listings anytime"],
    cta: { label: "Open dashboard", href: "/dashboard" },
    svg: "/svg/feature-track.svg",
    flip: false,
    bg: "rgba(255,247,237,0.8)",
    tagColor: "#D97706",
    tagBg: "#FFFBEB",
  },
];

const STEPS = [
  { n: "01", svg: "/svg/step-wallet.svg", title: "Connect wallet", desc: "Link MetaMask in one click. No sign-up, no password." },
  { n: "02", svg: "/svg/step-mint.svg",   title: "Mint or browse",  desc: "Create an NFT from an image or explore what's listed." },
  { n: "03", svg: "/svg/step-trade.svg",  title: "Trade & earn",    desc: "Buy NFTs you love or sell yours. ETH goes straight to you." },
];

export default function HomePage() {
  const { account, connect } = useWallet();
  const heroRef = useFadeIn();

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ─── HERO ─── */}
      <section
        className="relative flex flex-col lg:flex-row items-center gap-10 pt-4 pb-24 min-h-[88vh]"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(209,250,229,0.55) 0%, rgba(224,231,255,0.35) 50%, transparent 75%)",
        }}
      >
        {/* Floating blobs */}
        <div className="absolute pointer-events-none inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"8%", right:"12%", width:80, height:80, borderRadius:"50%", background:"rgba(167,243,208,0.5)", animation:"float 7s ease-in-out infinite" }} />
          <div style={{ position:"absolute", top:"22%", right:"6%", width:48, height:48, borderRadius:"12px", background:"rgba(196,181,253,0.4)", animation:"float 9s ease-in-out infinite 1s", transform:"rotate(20deg)" }} />
          <div style={{ position:"absolute", bottom:"20%", right:"18%", width:32, height:32, borderRadius:"50%", background:"rgba(167,243,208,0.6)", animation:"float 6s ease-in-out infinite 0.5s" }} />
          <div style={{ position:"absolute", top:"15%", left:"3%", width:56, height:56, borderRadius:"14px", background:"rgba(253,230,138,0.35)", animation:"float 8s ease-in-out infinite 2s", transform:"rotate(-15deg)" }} />
        </div>

        {/* Text */}
        <div ref={heroRef} className="flex-1 max-w-xl relative z-10" style={{ transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
          >
            Decentralized NFT Marketplace
          </span>
          <h1 className="text-6xl font-extrabold leading-tight tracking-tight mb-6" style={{ color: "#101828" }}>
            NFTs<br />simplified.
          </h1>
          <p className="text-xl leading-relaxed mb-10" style={{ color: "#667085", maxWidth: 440 }}>
            Create, collect, and trade unique digital assets directly from your wallet — no middlemen, no fees.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/marketplace"
              className="inline-block px-8 py-4 rounded-xl text-base font-bold transition"
              style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1D2939"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#101828"; }}
            >
              Explore NFTs
            </Link>
            <Link
              href="/mint"
              className="inline-block px-8 py-4 rounded-xl text-base font-bold transition"
              style={{ border: "1.5px solid #D0D5DD", color: "#344054", backgroundColor: "#FFFFFF" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F7F8FA"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
            >
              Create NFT
            </Link>
          </div>
          {!account && (
            <p className="mt-5 text-sm" style={{ color: "#98A2B3" }}>
              <button onClick={connect} className="underline font-semibold" style={{ color: "#667085" }}>
                Connect wallet
              </button>{" "}to get started
            </p>
          )}
        </div>

        {/* Hero illustration */}
        <div className="flex-1 flex justify-center items-center relative z-10 max-w-2xl w-full">
          <div style={{ animation: "float 5.5s ease-in-out infinite", width: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/svg/hero.svg" alt="NFT Marketplace" className="w-full h-auto" style={{ filter: "drop-shadow(0 24px 48px rgba(16,24,40,0.08))" }} />
            {/* Online illustrations by Storyset - https://storyset.com/online */}
          </div>
        </div>
      </section>

      {/* ─── FEATURE SECTIONS (alternating) ─── */}
      {SECTIONS.map((s) => (
        <FeatureSection key={s.title} section={s} />
      ))}

      {/* ─── HOW IT WORKS ─── */}
      <HowItWorks />

      {/* ─── CTA ─── */}
      <CtaBanner account={account} connect={connect} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
      `}</style>
    </div>
  );
}

/* ── Alternating feature section ── */
function FeatureSection({ section: s }) {
  const ref = useFadeIn();

  return (
    <section
      className="py-24 px-2"
      style={{ background: s.bg, borderTop: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div
        ref={ref}
        className={`max-w-6xl mx-auto flex flex-col ${s.flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16`}
        style={{ transition: "opacity 0.7s ease, transform 0.7s ease" }}
      >
        {/* Illustration */}
        <div className="flex-1 flex justify-center">
          <div style={{ animation: "float 6s ease-in-out infinite", width: "100%", maxWidth: 480 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.svg}
              alt={s.title}
              className="w-full h-auto"
              style={{ filter: "drop-shadow(0 16px 40px rgba(16,24,40,0.07))" }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 max-w-lg">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
            style={{ backgroundColor: s.tagBg, color: s.tagColor }}
          >
            {s.tag}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-snug mb-5" style={{ color: "#101828" }}>
            {s.title}
          </h2>
          <p className="text-lg leading-relaxed mb-7" style={{ color: "#667085" }}>
            {s.desc}
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            {s.points.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: s.tagBg, color: s.tagColor }}
                >
                  ✓
                </span>
                <span className="text-base" style={{ color: "#344054" }}>{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href={s.cta.href}
            className="inline-flex items-center gap-2 text-base font-bold group transition"
            style={{ color: "#101828" }}
          >
            {s.cta.label}
            <span className="inline-block transition-transform group-hover:translate-x-1.5">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ── */
function HowItWorks() {
  const ref = useFadeIn();
  return (
    <section className="py-24" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #E4E7EC" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: "#101828" }}>How it works</h2>
          <p className="text-lg" style={{ color: "#667085" }}>Three steps to start trading on-chain.</p>
        </div>
        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
          style={{ transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div
                className="w-full mb-6"
                style={{ maxWidth: 280, animation: `float ${6 + i}s ease-in-out infinite` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.svg} alt={s.title} className="w-full h-52 object-contain" style={{ filter: "drop-shadow(0 8px 24px rgba(16,24,40,0.07))" }} />
              </div>
              <p className="text-xs font-black tracking-[0.2em] mb-2" style={{ color: "#D0D5DD" }}>{s.n}</p>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#101828" }}>{s.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "#667085" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ── */
function CtaBanner({ account, connect }) {
  const ref = useFadeIn();
  return (
    <section
      className="py-24 text-center"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(209,250,229,0.5) 0%, rgba(224,231,255,0.3) 50%, transparent 80%)",
        borderTop: "1px solid #E4E7EC",
      }}
    >
      <div ref={ref} className="max-w-2xl mx-auto px-4" style={{ transition: "opacity 0.7s ease, transform 0.7s ease" }}>
        <h2 className="text-5xl font-extrabold tracking-tight mb-5" style={{ color: "#101828" }}>
          Ready to start?
        </h2>
        <p className="text-xl mb-10" style={{ color: "#667085" }}>
          Connect your wallet and explore the marketplace in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/marketplace"
            className="inline-block px-10 py-4 rounded-xl text-base font-bold transition"
            style={{ backgroundColor: "#101828", color: "#FFFFFF" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1D2939"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#101828"; }}
          >
            Browse NFTs
          </Link>
          <Link
            href="/mint"
            className="inline-block px-10 py-4 rounded-xl text-base font-bold transition"
            style={{ border: "1.5px solid #D0D5DD", color: "#344054", backgroundColor: "#FFFFFF" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F7F8FA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
          >
            Mint your first NFT
          </Link>
        </div>
        {!account && (
          <p className="mt-6 text-sm" style={{ color: "#98A2B3" }}>
            <button onClick={connect} className="underline font-semibold" style={{ color: "#667085" }}>
              Connect wallet
            </button>{" "}to get started
          </p>
        )}
      </div>
    </section>
  );
}
