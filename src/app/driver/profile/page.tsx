"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Save } from "lucide-react";

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, captain_image: reader.result as string });
      };
      reader.readAsDataURL(file);
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
    <div className="container animate-fade-in" style={{ paddingTop: "3rem" }}>
      <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><User color="var(--primary)" /> Captain Profile</h2>
          {user.profile?.captain_verified ? (
            <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>Verified</span>
          ) : (
             <span style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>Unverified</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
            <div style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              overflow: "hidden", 
              background: "rgba(255,255,255,0.05)",
              border: "2px solid var(--primary)",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              {formData.captain_image && formData.captain_image !== "default.jpg" ? (
                <img src={formData.captain_image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={64} color="rgba(255,255,255,0.2)" />
              )}
            </div>
            <label className="btn-secondary" style={{ cursor: "pointer", fontSize: "0.9rem" }}>
              Change Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">Captain Name</label>
              <input type="text" className="input-field" value={user.username} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input type="text" name="captain_number" className="input-field" value={formData.captain_number} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="input-group">
              <label className="input-label">Auto Type</label>
              <select name="captain_auto" className="input-field" value={formData.captain_auto} onChange={handleChange} style={{ appearance: "none" }}>
                <option value="normal" style={{background:"#0f172a"}}>Normal</option>
                <option value="electric" style={{background:"#0f172a"}}>Electric</option>
                <option value="premium" style={{background:"#0f172a"}}>Premium</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Stand Location</label>
              <select name="captain_stand" className="input-field" value={formData.captain_stand} onChange={handleChange} style={{ appearance: "none" }}>
                <option value="anchamile" style={{background:"#0f172a"}}>Anchamile</option>
                <option value="pookkottumpadam" style={{background:"#0f172a"}}>Pookkottumpadam</option>
                <option value="wandoor" style={{background:"#0f172a"}}>Wandoor</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Aadhar Number (Verification)</label>
            <input type="text" name="captain_aadhar" className="input-field" value={formData.captain_aadhar} onChange={handleChange} placeholder="Enter Aadhar for verification" />
          </div>

          <div className="input-group">
            <label className="input-label">Bio (Max 100 chars)</label>
            <textarea 
              name="captain_bio" 
              className="input-field" 
              maxLength={100}
              value={formData.captain_bio} 
              onChange={handleChange}
              placeholder="Tell your riders something about yourself..."
              style={{ minHeight: "80px", resize: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", marginBottom: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rides</span>
              <strong style={{ fontSize: "1.2rem" }}>{user.profile?.rides_count || 0}</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem" }}>Rating</span>
              <strong style={{ fontSize: "1.2rem" }}>{user.profile?.captain_rating?.toFixed(1) || "5.0"}</strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem" }}>Level</span>
              <strong style={{ fontSize: "1.2rem", color: "var(--primary)" }}>{user.profile?.captain_level || "Beginner"}</strong>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner" /> : <><Save size={20} /> Save Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}
