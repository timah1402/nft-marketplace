import "../styles/globals.css";
import { WalletProvider } from "../context/WalletContext";
import { ToastProvider } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <ToastProvider>
        <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA", color: "#101828" }}>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-10">
            <Component {...pageProps} />
          </main>
        </div>
      </ToastProvider>
    </WalletProvider>
  );
}
