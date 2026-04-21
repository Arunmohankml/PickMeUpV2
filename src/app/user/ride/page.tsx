"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation2, Star, XCircle, Car, Shield, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import ChatBox from "@/components/ChatBox";

const LiveTrackingMap = dynamic(() => import("@/components/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "320px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="spinner" />
    </div>
  ),
});

function ClientRideContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideIdQuery = searchParams.get("id");

  const [ride, setRide] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [isRating, setIsRating] = useState(false);

  const fetchStatus = async () => {
    const url = rideIdQuery ? `/api/rides/status?rideId=${rideIdQuery}` : `/api/rides/status`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.ride) {
      // If ride was cancelled, redirect back
      if (data.ride.ride_status === "cancelled") {
        router.push("/user/book");
        return;
      }
      setRide(data.ride);
      if (data.ride.driver?.profile) setDriverProfile(data.ride.driver.profile);
    } else {
      router.push("/user/book");
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    fetchStatus();
    // Poll slower if completed
    const interval = setInterval(fetchStatus, ride?.ride_status === "completed" ? 10000 : 3000);
    return () => clearInterval(interval);
  }, [rideIdQuery, ride?.ride_status]);

  const submitRating = async (skip = false) => {
    if (!ride) return;
    setIsRating(true);
    try {
      await fetch("/api/rides/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: ride.id,
          stars: skip ? 5 : ratingStars,
          feedback: skip ? "" : ratingFeedback,
          captain_name: ride.driver.username,
        }),
      });
      router.push("/user/book");
    } catch (err) {
      alert("Error submitting rating");
    } finally {
      setIsRating(false);
    }
  };

  const cancelRide = async () => {
    if (!ride) return;
    await fetch("/api/rides/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ride_id: ride.id, reason: "client-cancel" }),
    });
    router.push("/user/book");
  };

  if (loading || !user || !ride) return (
    <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
      <div className="spinner" />
    </div>
  );

  const status = ride.ride_status || (ride.accepted_by_id ? "accepted" : "pending");
  const isAccepted = status === "accepted";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";
  const hasDriverLocation = ride.driver_lat && ride.driver_lng;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: "2rem" }}>
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* Rating Modal Overlap */}
        {isCompleted && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(15px)",
            zIndex: 1100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem",
            borderRadius: "16px"
          }}>
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ display: "inline-block", background: "rgba(34,197,94,0.15)", padding: "1.5rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
                <Star size={48} color="#4ade80" fill="#4ade80" />
              </div>
              <h2 style={{ marginBottom: "0.5rem" }}>Ride Completed!</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>How was your ride with {ride.driver?.username}?</p>

              {/* Stars */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setRatingStars(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <Star size={36} color={s <= ratingStars ? "var(--primary)" : "rgba(255,255,255,0.1)"} fill={s <= ratingStars ? "var(--primary)" : "none"} />
                  </button>
                ))}
              </div>

              <textarea 
                className="input-field"
                placeholder="Optional: Add a comment..."
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                style={{ minHeight: "80px", marginBottom: "2rem", resize: "none" }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button 
                  className="btn-primary" 
                  onClick={() => submitRating()}
                  disabled={isRating}
                  style={{ width: "100%" }}
                >
                  {isRating ? <div className="spinner" /> : "Submit Rating"}
                </button>
                <button 
                  onClick={() => submitRating(true)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}
                  disabled={isRating}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PENDING ─── */}
        {status === "pending" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "rgba(250,204,21,0.15)", padding: "2rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
              <div className="spinner" style={{ width: "56px", height: "56px", borderWidth: "4px" }} />
            </div>
            <h2>Finding your Captain…</h2>
            <p style={{ color: "var(--text-muted)", margin: "0.75rem 0 1.5rem" }}>
              Broadcasting to drivers near <strong style={{ color: "white" }}>{ride.client_stand}</strong>
            </p>
          </div>
        )}

        {/* ─── LIVE MAP (shows when driver accepted & has GPS) ─── */}
        {(isAccepted || isInProgress) && hasDriverLocation && (
          <div style={{ marginBottom: "1.5rem" }}>
            <LiveTrackingMap
              driverLat={ride.driver_lat}
              driverLng={ride.driver_lng}
              pickupLat={ride.pickup_lat}
              pickupLng={ride.pickup_lng}
              pickupLabel="Your Pickup"
              dropLat={ride.drop_lat}
              dropLng={ride.drop_lng}
              dropLabel="Your Drop"
              showDrop={isInProgress}
            />
          </div>
        )}

        {/* ─── ACCEPTED / IN PROGRESS Header ─── */}
        {(isAccepted || isInProgress) && (
          <>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h2 style={{ color: isInProgress ? "#4ade80" : "white", marginBottom: "0.3rem" }}>
                {isInProgress ? "🚗 Ride in Progress" : "🚗 Captain is on the way!"}
              </h2>
            </div>

            {/* Driver Info Card */}
            {driverProfile && (
              <div style={{ background: "rgba(15,23,42,0.6)", padding: "1rem", borderRadius: "12px", marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.1)", border: "2px solid var(--primary)", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
                    {driverProfile.captain_image && driverProfile.captain_image !== "default.jpg" ? (
                      <img src={driverProfile.captain_image} alt="Captain" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Navigation2 size={20} color="var(--primary)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "700", fontSize: "1.05rem" }}>{driverProfile.captain_name}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{driverProfile.captain_auto?.toUpperCase()} • 📞 {driverProfile.captain_number}</p>
                  </div>
                  <span style={{ background: "var(--primary)", color: "#000", padding: "0.25rem 0.5rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.85rem", display: "flex", gap: "3px", alignItems: "center" }}>
                    <Star size={13} fill="#000" /> {driverProfile.captain_rating?.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── YOUR OTP ─── */}
        {isAccepted && ride.otp && (
          <div style={{
            background: "linear-gradient(135deg, rgba(250,204,21,0.1), rgba(250,204,21,0.05))",
            border: "1px solid rgba(250,204,21,0.3)",
            padding: "1.2rem",
            borderRadius: "12px",
            marginBottom: "1.2rem",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <Shield size={13} /> Share this OTP with your Captain
            </p>
            <p style={{ fontSize: "2.5rem", fontWeight: "800", letterSpacing: "0.5rem", color: "var(--primary)" }}>
              {ride.otp}
            </p>
          </div>
        )}

        {isInProgress && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "0.75rem 1rem", borderRadius: "12px", marginBottom: "1.2rem", fontSize: "0.9rem", color: "#4ade80", textAlign: "center" }}>
            ✅ OTP verified — you're on your way!
          </div>
        )}

        {/* Route Summary */}
        <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Distance</span>
            <span style={{ fontWeight: "600" }}>{ride.ride_distance}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Fare</span>
            <span style={{ fontWeight: "700", color: "#4ade80" }}>{ride.ride_fare}</span>
          </div>
          <div style={{ height: "1px", background: "var(--border)", margin: "0.75rem 0" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <MapPin size={14} color="var(--primary)" style={{ marginTop: "3px", flexShrink: 0 }} />
            <p style={{ fontSize: "0.85rem" }}>{ride.pickup_coords}</p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <Navigation2 size={14} color="#4ade80" style={{ marginTop: "3px", flexShrink: 0 }} />
            <p style={{ fontSize: "0.85rem" }}>{ride.drop_coords}</p>
          </div>
        </div>

        {/* Chat Component */}
        {driverProfile && (
          <ChatBox 
            rideId={ride.id} 
            currentUser={user.username} 
            otherUser={driverProfile.captain_name} 
            otherNumber={driverProfile.captain_number} 
          />
        )}

        {/* Cancel — always available */}
        <button onClick={cancelRide} className="btn-secondary" style={{ width: "100%", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
          <XCircle size={18} style={{ marginRight: "8px" }} /> Cancel Ride
        </button>
      </div>
    </div>
  );
}

export default function ClientRide() {
  return (
    <Suspense fallback={<div className="container"><div className="spinner" /></div>}>
      <ClientRideContent />
    </Suspense>
  );
}
