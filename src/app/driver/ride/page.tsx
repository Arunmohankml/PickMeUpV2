"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CheckCircle, Navigation2, Phone, XCircle, MapPin, Lock, KeyRound } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import PageHeader from "@/components/PageHeader";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

function DriverRideContent() {
  const t = useTranslations("Driver");
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

    if (!rideIdQuery) return;

    // Subscribe to ride updates
    const channel = supabase
      .channel(`driver-ride-updates-${rideIdQuery}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "RideRequest",
          filter: `id=eq.${rideIdQuery}`,
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setOtpError(data.error ? t("invalidOtp") : t("invalidOtp"));
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
    <div className="no-select" style={{ height: "var(--app-height)", display: "flex", flexDirection: "column", padding: 0 }}>
      <PageHeader 
        title={t("activeRide")} 
        backPath="/driver/dashboard" 
      />
      
      {/* Dynamic Status Header - Simplified */}
      <div style={{ padding: "1.2rem 1rem", background: "rgba(15, 23, 42, 0.4)", borderBottom: "1px solid var(--border)", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
           <p style={{ color: isInProgress ? "#4ade80" : "var(--primary)", fontSize: "0.8rem", fontWeight: "700" }}>
             {isInProgress ? t("tripInProgress") : t("headingToPickup")}
           </p>
        </div>
      </div>

      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
        
        {/* Client & Route Card */}
        <div className="glass-card" style={{ padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "800" }}>{ride.client_name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Phone size={14} /> {ride.client_number}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: "800", color: "#4ade80", fontSize: "1.1rem" }}>{ride.ride_fare}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ride.ride_distance}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
              <p style={{ fontSize: "0.85rem", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ride.pickup_coords}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
              <p style={{ fontSize: "0.85rem", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ride.drop_coords}</p>
            </div>
          </div>
        </div>

        {/* Phase Actions */}
        {isAccepted && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <button
               className="btn-primary active-scale"
               style={{ padding: "1.2rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
               onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`, "_blank")}
            >
              <Navigation2 size={20} /> {t("startNavigation")}
            </button>

            <div className="glass-card" style={{ padding: "1.2rem", border: "1px dashed var(--primary)" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.8rem", textAlign: "center" }}>{t("enterClientOtp")}</p>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <input
                    type="text"
                    className="input-field"
                    maxLength={4}
                    placeholder="____"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem", fontWeight: "800", marginBottom: 0, flex: 1, background: "rgba(0,0,0,0.3)" }}
                  />
                  <button onClick={verifyOtp} disabled={verifying || otpInput.length < 4} style={{ width: "60px", background: "var(--primary)", border: "none", borderRadius: "12px", color: "black", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {verifying ? <div className="spinner" style={{ borderColor: "black", borderTopColor: "transparent" }} /> : <KeyRound size={24} />}
                  </button>
                </div>
                {otpError && <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>{otpError}</p>}
            </div>
          </div>
        )}

        {isInProgress && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <button
               className="btn-primary active-scale"
               style={{ padding: "1.2rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
               onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.drop_lat},${ride.drop_lng}`, "_blank")}
            >
              {t("navigateToDrop")}
            </button>
            <button
              onClick={completeRide}
              className="btn-primary active-scale"
              style={{ padding: "1.5rem", background: "#4ade80", color: "black", fontWeight: "800", fontSize: "1.1rem" }}
            >
              {t("completeTrip")}
            </button>
          </div>
        )}

      </div>

      {/* Chat Box Integration - Moved outside for fixed positioning */}
      <ChatBox 
        rideId={ride.id} 
        currentUser={user.username} 
        otherUser={ride.client_name} 
        otherNumber={ride.client_number} 
      />

      <button
        onClick={cancelRide}
        style={{ width: "100%", background: "none", border: "none", color: "#f87171", padding: "1rem", fontSize: "0.85rem", fontWeight: "600", opacity: 0.8 }}
      >
        {t("cancelRide")}
      </button>


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
