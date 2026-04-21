"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { UserPlus, LogIn, ArrowLeft } from "lucide-react";

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "user";
  const { refresh } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ username, password, role }),
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
    <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "450px" }}>
        
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h2 style={{ marginBottom: "0.5rem" }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Join as a <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>{role}</strong>
        </p>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "1rem", borderRadius: "8px", color: "#f87171", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="Enter username"
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter password"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? <div className="spinner" /> : (
              isLogin ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Register</>
            )}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
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
