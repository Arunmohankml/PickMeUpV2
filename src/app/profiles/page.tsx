"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Star, MapPin } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfilesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [standFilter, setStandFilter] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const url = standFilter ? `/api/profile?stand=${standFilter}` : "/api/profile";
      const res = await fetch(url);
      const data = await res.json();
      setProfiles(data.profiles || []);
    };
    fetchProfiles();
  }, [standFilter]);

  if (loading || !user) return <div className="container" style={{display:"flex", justifyContent:"center", paddingTop:"4rem"}}><div className="spinner"/></div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: "2rem" }}>
      <Link href="/user/book" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
        <ArrowLeft size={16} /> Back to Booking
      </Link>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2>Available Captains 🚖</h2>
        
        <select 
          className="input-field" 
          style={{ width: "auto", padding: "0.5rem 1rem", borderRadius: "8px" }}
          value={standFilter}
          onChange={(e) => setStandFilter(e.target.value)}
        >
          <option value="" style={{background:"#0f172a"}}>All Stands</option>
          <option value="anchamile" style={{background:"#0f172a"}}>Anchamile</option>
          <option value="pookkottumpadam" style={{background:"#0f172a"}}>Pookkottumpadam</option>
          <option value="wandoor" style={{background:"#0f172a"}}>Wandoor</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {profiles.map(profile => (
          <div key={profile.id} className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div style={{ 
                  width: "60px", 
                  height: "60px", 
                  borderRadius: "50%", 
                  overflow: "hidden", 
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "2px solid var(--primary)"
                }}>
                  {profile.captain_image && profile.captain_image !== "default.jpg" ? (
                    <img src={profile.captain_image} alt="Captain" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={24} color="var(--primary)" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{profile.captain_name}</h3>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "var(--primary)", fontSize: "0.85rem", marginTop: "4px" }}>
                    <Star size={14} fill="var(--primary)" /> {profile.captain_rating.toFixed(1)}
                  </div>
                </div>
              </div>
              {profile.captain_verified && (
                <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  VERIFIED
                </span>
              )}
            </div>

            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <MapPin size={14} /> {profile.captain_stand.toUpperCase()}
              </span>
            </div>
            
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: "1.4", fontStyle: "italic", marginBottom: "1rem" }}>
              "{profile.captain_bio}"
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.8rem" }}>
              <span>Auto: <strong style={{ color: "white" }}>{profile.captain_auto}</strong></span>
              <span>Rides: <strong style={{ color: "white" }}>{profile.rides_count}</strong></span>
            </div>
          </div>
        ))}
      </div>
      
      {profiles.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "4rem 0" }}>
          No captains found in this area.
        </div>
      )}
    </div>
  );
}
