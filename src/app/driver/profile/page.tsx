"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Save, LogOut } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

export default function DriverProfile() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    captain_number: "",
    captain_auto: "normal",
    captain_stand: "anchamile",
    captain_bio: "",
    captain_aadhar: "",
    captain_image: "default.jpg",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "driver")) {
      router.push("/");
    }
    if (user?.profile) {
      setFormData({
        captain_number: user.profile.captain_number,
        captain_auto: user.profile.captain_auto,
        captain_stand: user.profile.captain_stand,
        captain_bio: user.profile.captain_bio,
        captain_aadhar: user.profile.captain_aadhar,
        captain_image: user.profile.captain_image || "default.jpg",
      });
    }
  }, [user, loading, router]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setFormData({ ...formData, captain_image: data.publicUrl });
    } catch (error) {
      alert("Error uploading image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        refresh();
        alert("Profile saved successfully");
        router.push("/driver/dashboard");
      }
    } catch {
      alert("Error saving profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return <div className="container" style={{display:"flex", justifyContent:"center", paddingTop:"4rem"}}><div className="spinner"/></div>;

  return (
    <div className="no-select" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PageHeader 
        title="My Profile" 
        backPath="/driver/dashboard" 
        rightAction={
          <button 
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              refresh();
              router.push("/");
            }}
            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
          >
            <LogOut size={16} /> Logout
          </button>
        }
      />
      
      <div className="container animate-fade-in" style={{ flex: 1, paddingTop: "1.5rem" }}>
        <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto", padding: "1.5rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>Captain Details</h2>
            {user.profile?.captain_verified ? (
              <span style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "700" }}>VERIFIED</span>
            ) : (
               <span style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "700" }}>UNVERIFIED</span>
            )}
          </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
            <div style={{ 
              width: "100px", 
              height: "100px", 
              borderRadius: "50%", 
              overflow: "hidden", 
              background: "rgba(255,255,255,0.03)",
              border: "2px solid var(--primary)",
              marginBottom: "0.8rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              {formData.captain_image && formData.captain_image !== "default.jpg" ? (
                <img src={formData.captain_image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={48} color="rgba(255,255,255,0.1)" />
              )}
            </div>
            <label className="btn-secondary active-scale" style={{ cursor: isUploading ? "not-allowed" : "pointer", fontSize: "0.8rem", padding: "0.4rem 1rem", border: "none", opacity: isUploading ? 0.6 : 1 }}>
              {isUploading ? "Uploading..." : "Change Photo"}
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} disabled={isUploading} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.8rem", marginBottom: "1.2rem" }}>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: "0.75rem" }}>Full Name</label>
              <input type="text" className="input-field" value={user.username} disabled style={{ background: "rgba(255,255,255,0.02)", opacity: 0.6 }} />
            </div>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: "0.75rem" }}>Phone Number</label>
              <input type="text" name="captain_number" className="input-field" value={formData.captain_number} onChange={handleChange} placeholder="9876543210" required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1.2rem" }}>

          </div>

          <div className="input-group" style={{ marginBottom: "1.2rem" }}>
            <label className="input-label" style={{ fontSize: "0.75rem" }}>Aadhar Verification</label>
            <input type="text" name="captain_aadhar" className="input-field" value={formData.captain_aadhar} onChange={handleChange} placeholder="0000 0000 0000" />
          </div>

          <div className="input-group" style={{ marginBottom: "1.5rem" }}>
            <label className="input-label" style={{ fontSize: "0.75rem" }}>Bio</label>
            <textarea 
              name="captain_bio" 
              className="input-field" 
              maxLength={100}
              value={formData.captain_bio} 
              onChange={handleChange}
              placeholder="Driver bio..."
              style={{ minHeight: "70px", resize: "none", fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.65rem" }}>RIDES</span>
              <strong style={{ fontSize: "1.1rem" }}>{user.profile?.rides_count || 0}</strong>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "0 10px" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.65rem" }}>RATING</span>
              <strong style={{ fontSize: "1.1rem" }}>{user.profile?.captain_rating?.toFixed(1) || "5.0"}</strong>
            </div>
            <div style={{ width: "1px", background: "var(--border)", margin: "0 10px" }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.65rem" }}>LEVEL</span>
              <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>{user.profile?.captain_level?.toUpperCase() || "NEW"}</strong>
            </div>
          </div>

          <button type="submit" className="btn-primary active-scale" style={{ width: "100%", padding: "1.1rem" }} disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner" /> : "Save Profile Changes"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
