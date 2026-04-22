"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, ArrowRight, LogOut, Users } from "lucide-react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/PageHeader";
import { useTranslations } from "next-intl";

const MapSelector = dynamic(() => import("@/components/MapSelector"), { 
  ssr: false,
  loading: () => <div className="spinner" />
});

export default function BookRide() {
  const t = useTranslations("User");
  const tc = useTranslations("Common");
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [drop, setDrop] = useState("");
  const [dropCoords, setDropCoords] = useState<[number, number] | null>(null);
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
          stand: "none",
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
    <div className="no-select" style={{ height: "var(--app-height)", display: "flex", flexDirection: "column", padding: 0 }}>
      <PageHeader 
        title="PickMeUp" 
        backPath="/" 
        rightAction={
          <div style={{ display: "flex", gap: "0.8rem" }}>
             <button 
              onClick={() => router.push("/profiles")}
              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Users size={20} />
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
      
      {/* Immersive Header - Simplified since we have PageHeader */}
      <div style={{ padding: "1.5rem 1rem 0.5rem 1rem", background: "linear-gradient(to bottom, var(--bg-dark), transparent)", zIndex: 10 }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>{t("whereTo")}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{user?.username}</p>
      </div>

      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1rem" }}>
        
        {/* Destination Card (App-style) */}
        <div className="glass-card active-scale" style={{ padding: "1.5rem" }}>
          <form onSubmit={handleBook}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div 
                onClick={() => setSelectingMode("pickup")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1rem", 
                  padding: "1rem", 
                  background: "rgba(255,255,255,0.03)", 
                  borderRadius: "12px",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.9rem", color: pickup ? "white" : "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pickup || t("pickup")}
                </span>
              </div>

              <div 
                onClick={() => setSelectingMode("drop")}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "1rem", 
                  padding: "1rem", 
                  background: "rgba(255,255,255,0.03)", 
                  borderRadius: "12px",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "2px", background: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: "0.9rem", color: drop ? "white" : "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {drop || t("drop")}
                </span>
              </div>





              <button type="submit" className="btn-primary active-scale" style={{ width: "100%", padding: "1.2rem", marginTop: "0.5rem" }} disabled={isSubmitting}>
                {isSubmitting ? <span className="spinner" /> : <>{t("request")} <ArrowRight size={20}/></>}
              </button>
            </div>
          </form>
        </div>



      </div>

      {selectingMode && (
        <MapSelector 
          onSelect={handleLocationSelect} 
          onClose={() => setSelectingMode(null)} 
          initialCenter={[11.1687, 76.2416]}
        />
      )}
    </div>
  );
}
