"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, ShieldCheck, Banknote, User, Navigation, Globe, ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import LanguageModal from "@/components/LanguageModal";

export default function Home() {
  const t = useTranslations("Landing");
  const locale = useLocale();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const langLabels: Record<string, string> = {
    en: "English",
    ml: "മലയാളം",
    hi: "हिन्दी"
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in no-select" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: "2rem", gap: "1rem" }}>
        <div style={{ padding: "0.8rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ background: "var(--primary)", padding: "4px", borderRadius: "6px" }}>
                <Navigation size={16} color="black" />
              </div>
              <span style={{ fontWeight: "800", fontSize: "1rem", letterSpacing: "-0.5px" }}>PickMeUp</span>
            </div>
          
          <button 
            onClick={() => setIsLangOpen(true)}
            className="active-scale"
            style={{ 
              background: "rgba(250, 204, 21, 0.1)", 
              border: "1px solid var(--primary)", 
              color: "var(--primary)", 
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: "800",
              cursor: "pointer" 
            }}
          >
            {langLabels[locale] || "Language"}
          </button>
        </div>
      </div>
      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
      
      <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ padding: "1rem 1.2rem", textAlign: "center" }}>
          <h1 className="animate-slide-up" style={{ fontSize: "1.8rem", lineHeight: "1.1", marginBottom: "0.5rem", fontWeight: "800" }}>
            {t("title")}
          </h1>
          <p className="animate-fade-in" style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: "1.4", maxWidth: "280px", margin: "0 auto 1rem auto" }}>
            {t("subtitle")}
          </p>
        </div>

        {user ? (
          <div className="glass-card active-scale" style={{ padding: "1.2rem", margin: "2rem 1rem 0 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{t("hi", { name: user.username })}</h2>
            <p style={{ marginBottom: "1.2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {t("loggedInAs")} <span style={{ color: "var(--primary)", fontWeight: "500", textTransform: "capitalize" }}>{user.role}</span>
            </p>
            <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
              {user.role === "user" ? (
                <>
                  <button className="btn-primary" onClick={() => router.push("/user/book")}>
                    <Navigation size={20} /> {t("bookRide")}
                  </button>
                  <button className="btn-secondary" onClick={() => router.push("/profiles")}>
                    <User size={20} /> {t("viewDrivers")}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => router.push("/driver/dashboard")}>
                    <Navigation size={20} /> {t("viewRequests")}
                  </button>
                  <button className="btn-secondary" onClick={() => router.push("/driver/profile")}>
                    <User size={20} /> {t("editProfile")}
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={logout} style={{ color: "#ef4444", border: "none", marginTop: "0.5rem" }}>
                {t("logout")}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem", flexDirection: "column", marginTop: "2rem", padding: "0 1rem" }}>
            <Link href="/register?role=user" className="glass-card active-scale" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.2rem", textDecoration: "none", color: "white" }}>
              <div style={{ background: "rgba(250, 204, 21, 0.1)", padding: "1rem", borderRadius: "16px", color: "var(--primary)" }}>
                <User size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "2px" }}>{t("passenger")}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t("passengerDesc")}</p>
              </div>
              <ArrowRight size={20} color="var(--primary)" />
            </Link>

            <Link href="/register?role=driver" className="glass-card active-scale" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.2rem", textDecoration: "none", color: "white" }}>
              <div style={{ background: "rgba(34, 197, 94, 0.1)", padding: "1rem", borderRadius: "16px", color: "#4ade80" }}>
                <Car size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "2px" }}>{t("captain")}</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t("captainDesc")}</p>
              </div>
              <ArrowRight size={20} color="#4ade80" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
