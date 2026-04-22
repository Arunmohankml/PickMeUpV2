"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Star, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useTranslations } from "next-intl";

export default function ProfilesPage() {
  const t = useTranslations("Profile");
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "user")) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfiles(data.profiles || []);
    };
    fetchProfiles();
  }, []);

  if (loading || !user) return <div className="container" style={{display:"flex", justifyContent:"center", paddingTop:"4rem"}}><div className="spinner"/></div>;

  return (
    <div className="no-select" style={{ minHeight: "var(--app-height)", display: "flex", flexDirection: "column" }}>
      <PageHeader title={t("captains")} backPath="/user/book" />
      
      <div className="container animate-fade-in" style={{ flex: 1, paddingTop: "1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>{t("available")}</h2>
        </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        {profiles.map(profile => (
          <div key={profile.id} className="glass-card active-scale" style={{ padding: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                <div style={{ 
                   width: "50px", 
                   height: "50px", 
                   borderRadius: "50%", 
                   overflow: "hidden", 
                   background: "rgba(255,255,255,0.05)",
                   display: "flex",
                   justifyContent: "center",
                   alignItems: "center",
                   border: "2px solid var(--primary)"
                 }}>
                  {profile.captain_image && profile.captain_image !== "default.jpg" ? (
                    <img src={profile.captain_image} alt="Captain" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={20} color="var(--primary)" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>{profile.captain_name}</h3>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "var(--primary)", fontSize: "0.8rem", marginTop: "2px" }}>
                    <Star size={12} fill="var(--primary)" /> {profile.captain_rating.toFixed(1)}
                  </div>
                </div>
              </div>
              {profile.captain_verified && (
                <span style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", padding: "0.2rem 0.4rem", borderRadius: "6px", fontSize: "0.65rem", fontWeight: "bold" }}>
                  {t("verified")}
                </span>
              )}
            </div>


            
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", lineHeight: "1.4", fontStyle: "italic", marginBottom: "1rem" }}>
              "{profile.captain_bio}"
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
              <span>{t("ridesCompleted")}: <strong style={{ color: "var(--text-light)" }}>{profile.rides_count}</strong></span>
            </div>
          </div>
        ))}
      </div>
      
      {profiles.length === 0 && (
        <div className="full-screen-center" style={{ minHeight: "50dvh" }}>
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            No captains found.
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
