"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      left: "1rem",
      right: "1rem",
      zIndex: 2000,
      background: "var(--bg-card)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--primary)",
      borderRadius: "20px",
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      animation: "slideUp 0.5s ease-out"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
        <div style={{ background: "rgba(250,204,21,0.1)", padding: "0.6rem", borderRadius: "12px", color: "var(--primary)" }}>
          <Download size={20} />
        </div>
        <div>
          <p style={{ fontSize: "0.9rem", fontWeight: "700" }}>Install PickMeUp</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Add to homescreen for fast access</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button 
          onClick={handleInstallClick}
          className="btn-primary active-scale"
          style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "10px" }}
        >
          Install
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem" }}
        >
          <X size={18} />
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
