"use client";

import { useState, useEffect } from "react";
import { X, Check, Globe } from "lucide-react";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    // Get current locale from cookie or localStorage
    const savedLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];
    if (savedLocale) {
      setCurrentLocale(savedLocale);
    }
  }, []);

  const handleLanguageChange = (locale: string) => {
    // Set cookie that next-intl looks for
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`; // 1 year
    setCurrentLocale(locale);
    
    // Refresh to apply changes across the app (Server & Client)
    window.location.reload();
  };

  if (!isOpen) return null;

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  ];

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        background: "var(--bg-dark)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        animation: "fade-in 0.3s ease-out"
      }}
    >
      {/* Header */}
      <div style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "800" }}>Select Language</h2>
        <button 
          onClick={onClose}
          className="active-scale"
          style={{ padding: "0.6rem", background: "rgba(255,255,255,0.05)", borderRadius: "50%", border: "none", color: "#fff" }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "1.5rem", gap: "1rem" }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="active-scale"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.5rem",
              background: currentLocale === lang.code ? "rgba(250, 204, 21, 0.1)" : "rgba(255, 255, 255, 0.03)",
              borderRadius: "20px",
              border: currentLocale === lang.code ? "2px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.05)",
              color: "#fff",
              textAlign: "left",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                background: currentLocale === lang.code ? "var(--primary)" : "rgba(255,255,255,0.05)",
                borderRadius: "14px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: currentLocale === lang.code ? "black" : "#fff"
              }}>
                <Globe size={24} />
              </div>
              <div>
                <p style={{ fontWeight: "800", fontSize: "1.1rem" }}>{lang.nativeName}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", opacity: 0.8 }}>{lang.name}</p>
              </div>
            </div>
            {currentLocale === lang.code && (
              <div style={{ background: "var(--primary)", borderRadius: "50%", padding: "4px" }}>
                <Check size={20} color="black" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", opacity: 0.6 }}>
        The app will reload to apply language changes.
      </div>
    </div>
  );
}
