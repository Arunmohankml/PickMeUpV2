"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, Navigation, User, Navigation2, Route, IndianRupee, Ban } from "lucide-react";

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
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

      // Check if driver already has an active ride
      const statusRes = await fetch("/api/rides/status");
      const statusData = await statusRes.json();
      if (statusData.ride && statusData.ride.is_active) {
        router.push(`/driver/ride?id=${statusData.ride.id}`);
        return;
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
    const interval = setInterval(fetchRides, 6000);
    return () => clearInterval(interval);
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
    <div className="container animate-fade-in" style={{ paddingTop: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ marginBottom: "0.25rem" }}>Ride Requests 📡</h2>
          {driverPos ? (
            <p style={{ color: "#4ade80", fontSize: "0.85rem" }}>📍 Location found</p>
          ) : (
            <p style={{ color: "#f87171", fontSize: "0.85rem" }}>📍 Enable location for accurate distances</p>
          )}
        </div>
        <button className="btn-secondary" onClick={() => router.push("/driver/profile")} style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User size={16} /> Profile
        </button>
      </div>

      {rides.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "50%", marginBottom: "1.5rem" }}>
            <Ban size={48} color="var(--text-muted)" />
          </div>
          <h3>No requests nearby</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Waiting for passengers near your stand…</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {rides.map((ride) => {
            const driverDist = rideDistances[ride.id];
            return (
              <div key={ride.id} className="glass-card" style={{ padding: "1.5rem" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "700" }}>{ride.client_name}</span>
                  <span style={{ background: "rgba(250,204,21,0.15)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600" }}>
                    {ride.client_stand.toUpperCase()}
                  </span>
                </div>

                {/* Distance Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.2rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.6rem", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>You → Pickup</p>
                    <p style={{ fontWeight: "700", color: "var(--primary)", fontSize: "0.95rem" }}>
                      {driverDist !== undefined ? `${driverDist.toFixed(1)} km` : "— km"}
                    </p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.6rem", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Trip Dist</p>
                    <p style={{ fontWeight: "700", fontSize: "0.95rem" }}>{ride.ride_distance}</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.6rem", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Fare</p>
                    <p style={{ fontWeight: "700", color: "#4ade80", fontSize: "0.95rem" }}>{ride.ride_fare}</p>
                  </div>
                </div>

                {/* Route */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <MapPin size={16} color="var(--primary)" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{ride.pickup_coords}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <Navigation size={16} color="#4ade80" style={{ marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{ride.drop_coords}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button className="btn-primary" style={{ flex: 2 }} onClick={() => acceptRide(ride.id)}>
                    Accept Ride
                  </button>
                  {ride.pickup_lat && ride.pickup_lng && (
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: "0.85rem" }}
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${ride.pickup_lat},${ride.pickup_lng}`, "_blank")}
                    >
                      <Navigation2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
