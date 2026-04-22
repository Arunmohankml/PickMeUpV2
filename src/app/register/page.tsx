"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { UserPlus, LogIn, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

function AuthComponent() {
  const t = useTranslations("Register");
  const tc = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "user";
  const { refresh } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, phone, role }),
      });

      const data = await res.json();

      if (res.ok) {
        refresh(); // Refresh global auth state
        if (data.user.role === "driver") {
          router.push(isLogin ? "/driver/dashboard" : "/driver/profile");
        } else {
          router.push("/user/book");
        }
      } else {
        setError(data.error || "An error occurred");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-select" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "1rem" }}>
      <button 
        onClick={() => router.push("/")}
        className="active-scale"
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          color: "#fff",
          marginBottom: "1rem",
          marginTop: "var(--safe-top)"
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="animate-fade-in" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass-card active-scale" style={{ width: "100%", maxWidth: "450px" }}>
        
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.8rem" }}>
          {isLogin ? t("welcomeBack") : t("newAccount")}
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
          {t("joinAs")} <span style={{ color: "var(--primary)", fontWeight: "600", textTransform: "capitalize" }}>{role}</span>
        </p>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "0.8rem", borderRadius: "12px", color: "#f87171", marginBottom: "1.5rem", fontSize: "0.85rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">{tc("username")}</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder={tc("username")}
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">{tc("password")}</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder={tc("password")}
            />
          </div>
 
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">{tc("phone")}</label>
              <input 
                type="tel" 
                className="input-field" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                placeholder="e.g. 9876543210"
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              isLogin ? <><LogIn size={20} /> {t("login")}</> : <><UserPlus size={20} /> {t("register")}</>
            )}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {isLogin ? t("needAccount") : t("haveAccount")}{" "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}
          >
            {isLogin ? t("register") : t("login")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterLayout() {
  return (
    <Suspense fallback={<div className="container"><div className="spinner" /></div>}>
      <AuthComponent />
    </Suspense>
  );
}
