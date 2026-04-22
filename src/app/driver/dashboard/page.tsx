"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, Navigation, User, Navigation2, Route, IndianRupee, Ban, LogOut } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

// Haversine fallback (straight-line) for driver→pickup
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverDashboard() {
  const t = useTranslations("Driver");
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideDistances, setRideDistances] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!loading && (!user || user.role !== "driver")) router.push("/");
  }, [user, loading, router]);

  // Get driver's GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Geolocation not allowed")
      );
    }
  }, []);

  // Calculate OSRM road distance from driver to pickup for each ride
  const calcDriverToPickup = async (ride: any) => {
    if (!driverPos || !ride.pickup_lat || !ride.pickup_lng) return haversineKm(driverPos?.lat || 0, driverPos?.lng || 0, ride.pickup_lat, ride.pickup_lng);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverPos.lng},${driverPos.lat};${ride.pickup_lng},${ride.pickup_lat}?overview=false`
      );
      const data = await res.json();
      if (data.routes?.[0]) return data.routes[0].distance / 1000;
    } catch {}
    return haversineKm(driverPos.lat, driverPos.lng, ride.pickup_lat, ride.pickup_lng);
  };

  const fetchRides = async () => {
    try {
      const res = await fetch("/api/rides/available");
      if (!res.ok) return;
      const data = await res.json();
      setRides(data.rides || []);

      const statusRes = await fetch("/api/rides/status");
      const statusData = await statusRes.json();
      if (statusData.ride && statusData.ride.is_active) {
        setActiveRide(statusData.ride);
      } else {
        setActiveRide(null);
      }

      // Calc distances for each ride if we have driver pos
      if (driverPos && data.rides) {
        const newDists: Record<number, number> = {};
        for (const ride of data.rides) {
          newDists[ride.id] = await calcDriverToPickup(ride);
        }
        setRideDistances(newDists);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRides();

    // Subscribe to any changes in RideRequest table
    const channel = supabase
      .channel("available-rides")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "RideRequest",
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverPos]);

  const acceptRide = async (rideId: number) => {
    const res = await fetch("/api/rides/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ride_id: rideId }),
    });
    if (res.ok) router.push(`/driver/ride?id=${rideId}`);
  };

  if (loading || !user) return <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}><div className="spinner" /></div>;

  return (
    <div className="no-select" style={{ minHeight: "var(--app-height)", display: "flex", flexDirection: "column" }}>
      <PageHeader 
        title={t("dashboard")} 
        backPath="/" 
        rightAction={
          <div style={{ display: "flex", gap: "0.8rem" }}>
             <button 
              onClick={() => router.push("/driver/profile")}
              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <User size={20} />
            </button>
            <button 
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                refresh();
                router.push("/");
              }}
              style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <LogOut size={20} />
            </button>
          </div>
        }
      />
      
      <div className="container animate-fade-in" style={{ flex: 1, paddingTop: "1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          {driverPos ? (
            <div style={{ color: "#4ade80", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{width: 6, height: 6, background: "#4ade80", borderRadius: "50%"}} /> {t("activeLocation")}
            </div>
          ) : (
            <p style={{ color: "#f87171", fontSize: "0.75rem" }}>{t("enableGPS")}</p>
          )}
        </div>

      {rides.length === 0 ? (
        <div className="full-screen-center" style={{ minHeight: "60dvh" }}>
          <div className="glass-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem", width: "100%" }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.03)", padding: "1.2rem", borderRadius: "50%", marginBottom: "1rem" }}>
              <Ban size={32} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: "1.1rem" }}>{t("noRides")}</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.4rem", fontSize: "0.9rem" }}>{t("waitingPassengers")}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {rides.map((ride) => {
            const driverDist = rideDistances[ride.id];
            return (
              <div key={ride.id} className="glass-card active-scale" style={{ padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: "700" }}>{ride.client_name}</span>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "1.2rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "10px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{t("toPickup")}</p>
                    <p style={{ fontWeight: "700", color: "var(--primary)", fontSize: "0.9rem" }}>
                      {driverDist !== undefined ? `${driverDist.toFixed(1)} km` : "— km"}
                    </p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "10px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{t("trip")}</p>
                    <p style={{ fontWeight: "700", fontSize: "0.9rem" }}>{parseFloat(ride.ride_distance).toFixed(1)} km</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "10px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{t("fare")}</p>
                    <p style={{ fontWeight: "700", color: "#4ade80", fontSize: "0.9rem" }}>₹{ride.ride_fare}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{width: 8, height: 8, borderRadius: "50%", background: "var(--primary)"}} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ride.pickup_coords}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{width: 8, height: 8, borderRadius: "50%", background: "#4ade80"}} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ride.drop_coords}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button className="btn-primary active-scale" style={{ flex: 1, padding: "0.8rem" }} onClick={() => acceptRide(ride.id)}>
                    {t("accept")}
                  </button>
                  {ride.pickup_lat && ride.pickup_lng && (
                    <button
                      className="btn-secondary active-scale"
                      style={{ width: "50px", padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`, "_blank")}
                    >
                      <Navigation2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Persistent Active Ride Indicator */}
      {activeRide && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "1rem",
          right: "1rem",
          zIndex: 1000,
          background: "var(--primary)",
          color: "black",
          padding: "1rem",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          cursor: "pointer"
        }} onClick={() => router.push(`/driver/ride?id=${activeRide.id}`)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div style={{ background: "black", borderRadius: "50%", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Navigation size={20} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: "700", opacity: 0.8 }}>{t("ongoingTrip")}</p>
              <p style={{ fontWeight: "800" }}>{activeRide.client_name}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem", fontWeight: "800" }}>
            {t("open")} <Navigation2 size={16} />
          </div>
        </div>
      )}
    </div>
  );
}
