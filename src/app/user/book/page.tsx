"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

const MapSelector = dynamic(() => import("@/components/MapSelector"), { 
  ssr: false,
  loading: () => <div className="spinner" />
});

export default function BookRide() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [drop, setDrop] = useState("");
  const [dropCoords, setDropCoords] = useState<[number, number] | null>(null);
  const [stand, setStand] = useState("anchamile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectingMode, setSelectingMode] = useState<"pickup" | "drop" | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Check if there is already an active ride
  useEffect(() => {
    async function checkExistingRide() {
      const res = await fetch("/api/rides/status");
      const data = await res.json();
      if (data.ride) {
        router.push("/user/ride");
      }
    }
    if (user && user.role === "user") {
      checkExistingRide();
    }
  }, [user, router]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !drop || !pickupCoords || !dropCoords) {
      alert("Please select both pickup and drop locations using the map.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rides/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup,
          pickup_lat: pickupCoords[0],
          pickup_lng: pickupCoords[1],
          drop,
          drop_lat: dropCoords[0],
          drop_lng: dropCoords[1],
          stand,
          ph_num: "Not given",
          distance: "Calculating...",
          fare: "Standard",
        }),
      });

      if (res.ok) {
        const { rideId } = await res.json();
        router.push(`/user/ride?id=${rideId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const stands = ["anchamile", "pookkottumpadam", "wandoor"];

  const handleLocationSelect = (address: string, coords: [number, number]) => {
    if (selectingMode === "pickup") {
      setPickup(address);
      setPickupCoords(coords);
    } else if (selectingMode === "drop") {
      setDrop(address);
      setDropCoords(coords);
    }
    setSelectingMode(null);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: "3rem" }}>
      <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin color="var(--primary)" /> Where to?
        </h2>

        <form onSubmit={handleBook}>
          <div className="input-group">
            <label className="input-label">Pickup Location</label>
            <div 
              onClick={() => setSelectingMode("pickup")}
              className="input-field" 
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "3.5rem" }}
            >
              <span style={{ color: pickup ? "white" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pickup || "Click to select pickup on map"}
              </span>
              <MapPin size={18} color="var(--primary)" />
            </div>
          </div>

          <div className="input-group" style={{ position: "relative" }}>
            <label className="input-label">Drop Destination</label>
            <div 
              onClick={() => setSelectingMode("drop")}
              className="input-field" 
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "3.5rem" }}
            >
              <span style={{ color: drop ? "white" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {drop || "Click to select drop on map"}
              </span>
              <MapPin size={18} color="var(--primary)" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Preferred Auto Stand</label>
            <select 
              className="input-field" 
              value={stand}
              onChange={(e) => setStand(e.target.value)}
              style={{ appearance: "none" }}
            >
              {stands.map(s => (
                <option key={s} value={s} style={{ background: "var(--bg-dark)" }}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem", padding: "1rem" }} disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : <>Request Ride <ArrowRight size={20}/></>}
          </button>
        </form>
      </div>

      {selectingMode && (
        <MapSelector 
          onSelect={handleLocationSelect} 
          onClose={() => setSelectingMode(null)} 
          initialCenter={selectingMode === "pickup" ? [11.1687, 76.2416] : [11.1687, 76.2416]}
        />
      )}
    </div>
  );
}
