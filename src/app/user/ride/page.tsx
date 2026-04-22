"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation2, Star, XCircle, Car, Shield, MapPin, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/PageHeader";
import { useTranslations } from "next-intl";
import ChatBox from "@/components/ChatBox";
import { supabase } from "@/lib/supabase";

const LiveTrackingMap = dynamic(() => import("@/components/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "320px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="spinner" />
    </div>
  ),
});

function ClientRideContent() {
  const t = useTranslations("User");
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

    if (!rideIdQuery) return;

    // Subscribe to ride updates
    const channel = supabase
      .channel(`ride-updates-${rideIdQuery}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "RideRequest",
          filter: `id=eq.${rideIdQuery}`,
        },
        () => {
          // Re-fetch full data when any update occurs (location, status, etc.)
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideIdQuery]);

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
  const isScheduled = status === "scheduled";
  const hasDriverLocation = ride.driver_lat && ride.driver_lng;

  return (
    <>
    <div className="container animate-fade-in no-select" style={{ height: "calc(var(--app-height) - var(--safe-top) - var(--safe-bottom))", display: "flex", flexDirection: "column", padding: 0 }}>
      
      {/* Immersive Status Map Background/Area */}
      <div style={{ flex: 1, position: "relative", minHeight: "40dvh" }}>
        {(isAccepted || isInProgress) && hasDriverLocation ? (
          <LiveTrackingMap
            driverLat={ride.driver_lat}
            driverLng={ride.driver_lng}
            pickupLat={ride.pickup_lat}
            pickupLng={ride.pickup_lng}
            pickupLabel="Pickup"
            dropLat={ride.drop_lat}
            dropLng={ride.drop_lng}
            dropLabel="Drop"
            showDrop={isInProgress}
          />
        ) : (
          <div className="full-screen-center" style={{ 
            background: "rgba(255,255,255,0.02)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
             <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                {isScheduled ? (
                  <div style={{ background: "rgba(250,204,21,0.1)", padding: "1.5rem", borderRadius: "16px", border: "1px dashed var(--primary)", maxWidth: "80%" }}>
                    <p style={{ color: "var(--primary)", fontWeight: "700", fontSize: "0.95rem" }}>{t("captainBusy")}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.4rem" }}>{t("scheduledDesc")}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                       <div className="spinner" style={{ width: "32px", height: "32px" }} />
                       <p style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: "700" }}>
                        {isAccepted ? t("waitingGPS") : t("findingBest")}
                       </p>
                    </div>
                  </>
                )}
             </div>
          </div>
        )}

        {/* Floating Back Button (like Uber) - Hidden during searching */}
        {status !== "pending" && (
          <button 
            onClick={() => router.push("/user/book")} 
            className="active-scale"
            style={{ 
              position: "absolute", 
              top: "calc(1rem + var(--safe-top))", 
              left: "1rem", 
              zIndex: 100, 
              background: "rgba(15, 23, 42, 0.8)", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: "50%", 
              width: "44px", 
              height: "44px", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              backdropFilter: "blur(4px)",
              color: "#fff"
            }}
          >
             <ArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* Bottom Status Sheet */}
      <div className="glass-card" style={{ 
        borderTopLeftRadius: "24px", 
        borderTopRightRadius: "24px", 
        borderBottomLeftRadius: 0, 
        borderBottomRightRadius: 0,
        padding: "1.5rem",
        zIndex: 110,
        boxShadow: "0 -10px 25px rgba(0,0,0,0.5)"
      }}>
        
        {/* Status Text */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", color: isScheduled ? "var(--primary)" : (isInProgress ? "#4ade80" : "white") }}>
            {status === "pending" ? t("searching") : 
             status === "accepted" ? t("captainComing") : 
             status === "scheduled" ? t("scheduled") :
             status === "in_progress" ? t("onWay") : t("summary")}
          </h2>
        </div>

        {/* Driver Info Card - Shows when accepted */}
        {driverProfile && (
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "16px", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "2px solid var(--primary)", overflow: "hidden" }}>
                {driverProfile.captain_image && driverProfile.captain_image !== "default.jpg" ? (
                  <img src={driverProfile.captain_image} alt="Captain" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Car size={24} color="var(--primary)" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "700" }}>{driverProfile.captain_name}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{driverProfile.captain_auto} • {driverProfile.captain_number}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: "700", color: "#4ade80" }}>{ride.ride_fare}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px", color: "var(--primary)", fontSize: "0.8rem" }}>
                  <Star size={12} fill="var(--primary)" /> {driverProfile.captain_rating?.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTP Section */}
        {isAccepted && ride.otp && (
          <div style={{ background: "rgba(250,204,21,0.05)", padding: "1rem", borderRadius: "12px", border: "1px dashed rgba(250,204,21,0.3)", textAlign: "center", marginBottom: "1rem" }}>
             <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>SHARE OTP TO START RIDE</p>
             <p style={{ fontSize: "1.8rem", fontWeight: "800", letterSpacing: "0.4rem", color: "var(--primary)" }}>{ride.otp}</p>
          </div>
        )}

        {/* Cancel Button */}
        <button onClick={cancelRide} style={{ width: "100%", background: "none", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "0.8rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600" }}>
          Cancel Ride
        </button>

      </div>

      {/* Rating Overlap (Fullscreen Modal Feel) */}
      {isCompleted && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "var(--bg-dark)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          padding: "2rem",
          paddingTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
          textAlign: "center"
        }} className="animate-fade-in">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "inline-block", background: "rgba(34,197,94,0.1)", padding: "2rem", borderRadius: "50%", marginBottom: "2rem", alignSelf: "center" }}>
              <Star size={64} color="#4ade80" fill="#4ade80" />
            </div>
            <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Arrived!</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "3rem" }}>Rate your experience with {ride.driver?.username}</p>

            <div style={{ display: "flex", justifyContent: "center", gap: "0.8rem", marginBottom: "3rem" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRatingStars(s)} style={{ background: "none", border: "none" }}>
                  <Star size={42} color={s <= ratingStars ? "var(--primary)" : "rgba(255,255,255,0.05)"} fill={s <= ratingStars ? "var(--primary)" : "none"} />
                </button>
              ))}
            </div>

            <textarea 
              className="input-field"
              placeholder="Any feedback?"
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              style={{ minHeight: "100px", marginBottom: "2rem", textAlign: "center" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button className="btn-primary active-scale" onClick={() => submitRating()} disabled={isRating} style={{ width: "100%", padding: "1.2rem" }}>
              {isRating ? "Submitting..." : "Finish Trip"}
            </button>
            <button onClick={() => submitRating(true)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Skip Rating
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Chat Component moved completely outside containers to fix fixed-position bugs with transforms */}
    {driverProfile && (
      <ChatBox 
        rideId={ride.id} 
        currentUser={user.username} 
        otherUser={driverProfile.captain_name} 
        otherNumber={driverProfile.captain_number} 
      />
    )}
    </>
  );
}

export default function ClientRide() {
  return (
    <Suspense fallback={<div className="container"><div className="spinner" /></div>}>
      <ClientRideContent />
    </Suspense>
  );
}
