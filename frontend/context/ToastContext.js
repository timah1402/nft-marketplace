import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

const CONFIG = {
  success: {
    bar: "bg-emerald-500",
    wrap: "bg-white border-gray-200",
    icon: "text-emerald-600",
    title: "text-gray-900",
    sym: "✓",
  },
  error: {
    bar: "bg-red-500",
    wrap: "bg-white border-gray-200",
    icon: "text-red-600",
    title: "text-gray-900",
    sym: "✕",
  },
  info: {
    bar: "bg-blue-500",
    wrap: "bg-white border-gray-200",
    icon: "text-blue-600",
    title: "text-gray-900",
    sym: "i",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = {
    success: (msg) => add(msg, "success"),
    error: (msg) => add(msg, "error"),
    info: (msg) => add(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80 pointer-events-none">
          {toasts.map((t) => {
            const c = CONFIG[t.type];
            return (
              <div
                key={t.id}
                className={`relative flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto overflow-hidden ${c.wrap}`}
                style={{ animation: "slideIn 0.2s ease-out" }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                <span className={`font-bold text-sm mt-0.5 ml-2 ${c.icon}`}>{c.sym}</span>
                <p className={`flex-1 text-sm leading-snug ${c.title}`}>{t.msg}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none transition"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
