"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, ShieldCheck, Banknote, User, Navigation } from "lucide-react";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ marginBottom: "1rem" }}>
          Welcome to <span className="title-primary">PickMeUp</span>
        </h1>
        <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", marginBottom: "2rem" }}>
          The fastest, most transparent way to book automated rides. Always on time, always upfront.
        </p>

        {user ? (
          <div className="glass-card" style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Hi {user.username}!</h2>
            <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>
              You are logged in as a <b style={{ color: "var(--text-light)", textTransform: "capitalize" }}>{user.role}</b>.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
              {user.role === "user" ? (
                <>
                  <button className="btn-primary" onClick={() => router.push("/user/book")}>
                    <Navigation size={20} /> Book a Ride
                  </button>
                  <button className="btn-secondary" onClick={() => router.push("/profiles")}>
                    <User size={20} /> View Nearby Drivers
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => router.push("/driver/dashboard")}>
                    <Navigation size={20} /> View Requests
                  </button>
                  <button className="btn-secondary" onClick={() => router.push("/driver/profile")}>
                    <User size={20} /> Edit Profile
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={logout} style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?role=user" className="btn-primary" style={{ minWidth: "220px" }}>
              <User size={20} /> Login / Register as User
            </Link>
            <Link href="/register?role=driver" className="btn-secondary" style={{ minWidth: "220px" }}>
              <Car size={20} /> Login / Register as Driver
            </Link>
          </div>
        )}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginTop: "5rem" }}>
        <div className="glass-card" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--primary)", display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <Navigation size={48} />
          </div>
          <h3>Doorstep Pickup</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>We pick you up exactly where you are with pinpoint accuracy.</p>
        </div>

        <div className="glass-card" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--primary)", display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <Banknote size={48} />
          </div>
          <h3>Flat Rates</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No surge pricing. Transparent, government-approved fares.</p>
        </div>

        <div className="glass-card" style={{ textAlign: "center" }}>
          <div style={{ color: "var(--primary)", display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <ShieldCheck size={48} />
          </div>
          <h3>Safety First</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Verified drivers and tools to keep your trips perfectly secure.</p>
        </div>
      </section>

    </div>
  );
}
