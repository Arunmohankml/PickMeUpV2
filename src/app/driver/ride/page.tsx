"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CheckCircle, Navigation2, Phone, XCircle, MapPin, Lock, KeyRound } from "lucide-react";
import ChatBox from "@/components/ChatBox";

function DriverRideContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideIdQuery = searchParams.get("id");

  const [ride, setRide] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "driver")) router.push("/");
  }, [user, loading, router]);

  const fetchStatus = async () => {
    const url = rideIdQuery ? `/api/rides/status?rideId=${rideIdQuery}` : `/api/rides/status`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.ride && data.ride.is_active) {
      setRide(data.ride);
    } else if (!data.ride || !data.ride.is_active) {
      router.push("/driver/dashboard");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [rideIdQuery]);

  // Broadcast driver GPS to the server every 4 seconds
  useEffect(() => {
    if (!ride) return;
    let watchId: number;

    const broadcastLocation = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            fetch("/api/rides/update-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ride_id: ride.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            }).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }
    };

    broadcastLocation();
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [ride?.id]);

  const verifyOtp = async () => {
    if (!otpInput || !ride) return;
    setVerifying(true);
    setOtpError("");
    const res = await fetch("/api/rides/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ride_id: ride.id, otp: otpInput }),
    });
    if (res.ok) {
      fetchStatus();
    } else {
      const data = await res.json();
      setOtpError(data.error || "Invalid OTP");
    }
    setVerifying(false);
  };

  const completeRide = async () => {
    if (!ride) return;
    await fetch("/api/rides/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ride_id: ride.id, reason: "reached" }),
    });
    router.push("/driver/dashboard");
  };

  const cancelRide = async () => {
    if (!ride) return;
    await fetch("/api/rides/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ride_id: ride.id, reason: "driver-cancel" }),
    });
    router.push("/driver/dashboard");
  };

  if (loading || !user || !ride) return (
    <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
      <div className="spinner" />
    </div>
  );

  const isAccepted = ride.ride_status === "accepted";
  const isInProgress = ride.ride_status === "in_progress";

  return (
    <div className="container animate-fade-in" style={{ paddingTop: "2.5rem" }}>
      <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto" }}>

        {/* Status Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2>Active Ride</h2>
          <span style={{
            background: isInProgress ? "rgba(34,197,94,0.15)" : "rgba(250,204,21,0.15)",
            color: isInProgress ? "#4ade80" : "var(--primary)",
            padding: "0.3rem 0.8rem",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: "700"
          }}>
            {isInProgress ? "🚗 Ride Started" : "🔍 Heading to Pickup"}
          </span>
        </div>

        {/* Client Card */}
        <div style={{ background: "rgba(15,23,42,0.6)", padding: "1.2rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.3rem" }}>{ride.client_name}</h3>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <span style={{ background: "rgba(255,255,255,0.08)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem" }}>{ride.ride_distance}</span>
              <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700" }}>{ride.ride_fare}</span>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Phone size={14} /> {ride.client_number}
          </p>
        </div>

        {/* Route */}
        <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <MapPin size={16} color="var(--primary)" style={{ marginTop: "3px", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pickup</p>
              <p style={{ fontSize: "0.92rem" }}>{ride.pickup_coords}</p>
            </div>
          </div>
          <div style={{ height: "1px", background: "var(--border)", margin: "0.5rem 0 0.8rem 1.6rem" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
            <Navigation2 size={16} color="#4ade80" style={{ marginTop: "3px", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Drop</p>
              <p style={{ fontSize: "0.92rem" }}>{ride.drop_coords}</p>
            </div>
          </div>
        </div>

        {/* ─── PHASE 1: Navigate to Pickup + OTP Entry ─── */}
        {isAccepted && (
          <>
            {ride.pickup_lat && ride.pickup_lng && (
              <button
                className="btn-primary"
                style={{ width: "100%", marginBottom: "1rem" }}
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`, "_blank")}
              >
                <Navigation2 size={18} /> Navigate to Pickup
              </button>
            )}

            <div style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)", padding: "1.2rem", borderRadius: "12px", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Lock size={14} /> Enter the OTP from the passenger to start the ride
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  type="text"
                  className="input-field"
                  maxLength={4}
                  placeholder="_ _ _ _"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={{ textAlign: "center", letterSpacing: "0.3rem", fontSize: "1.4rem", fontWeight: "700", marginBottom: 0, flex: 1 }}
                />
                <button
                  className="btn-primary"
                  onClick={verifyOtp}
                  disabled={verifying || otpInput.length < 4}
                  style={{ padding: "0 1.2rem" }}
                >
                  {verifying ? <div className="spinner" /> : <KeyRound size={20} />}
                </button>
              </div>
              {otpError && <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" }}>❌ {otpError}</p>}
            </div>
          </>
        )}

        {/* ─── PHASE 2: Ride In Progress ─── */}
        {isInProgress && (
          <>
            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "0.8rem 1rem", borderRadius: "12px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <CheckCircle size={18} color="#4ade80" />
              <p style={{ fontSize: "0.9rem", color: "#4ade80" }}>OTP Verified — Ride started! Head to the Drop location.</p>
            </div>

            {ride.drop_lat && ride.drop_lng && (
              <button
                className="btn-primary"
                style={{ width: "100%", marginBottom: "1rem" }}
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.drop_lat},${ride.drop_lng}`, "_blank")}
              >
                <Navigation2 size={18} /> Navigate to Drop Location
              </button>
            )}

            <button
              onClick={completeRide}
              className="btn-primary"
              style={{ width: "100%", background: "#4ade80", color: "#000", marginBottom: "0.75rem", fontWeight: "700" }}
            >
              <CheckCircle size={20} /> Mark Ride as Complete
            </button>
          </>
        )}

        {/* Chat Component */}
        <ChatBox 
          rideId={ride.id} 
          currentUser={user.username} 
          otherUser={ride.client_name} 
          otherNumber={ride.client_number} 
        />

        {/* Cancel always available */}
        <button
          onClick={cancelRide}
          className="btn-secondary"
          style={{ width: "100%", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}
        >
          <XCircle size={18} style={{ marginRight: "6px" }} /> Cancel Ride
        </button>
      </div>
    </div>
  );
}

export default function DriverRide() {
  return (
    <Suspense fallback={<div className="container"><div className="spinner" /></div>}>
      <DriverRideContent />
    </Suspense>
  );
}
