"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { Search, Navigation } from "lucide-react";

interface MapSelectorProps {
  onSelect: (address: string, coords: [number, number]) => void;
  onClose: () => void;
  initialCenter?: [number, number];
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelect, onClose, initialCenter = [11.1687, 76.2416] }) => {
  const [position, setPosition] = useState<[number, number]>(initialCenter);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const provider = new OpenStreetMapProvider();

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      setAddress(data.display_name || "Unknown Location");
    } catch (error) {
      setAddress("Unknown Location");
    }
  };

  useEffect(() => {
    fetchAddress(position[0], position[1]);
  }, [position]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const results = await provider.search({ query: searchQuery });
      if (results && results.length > 0) {
        const { x, y, label } = results[0];
        const newPos: [number, number] = [y, x];
        setPosition(newPos);
        setAddress(label);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  function LocationMarker() {
    const map = useMap();
    useEffect(() => {
      map.flyTo(position, map.getZoom());
    }, [position, map]);

    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return position === null ? null : (
      <Marker position={position} />
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "var(--app-height)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-dark)",
      paddingTop: "var(--safe-top)",
      paddingBottom: "var(--safe-bottom)",
    }} className="animate-fade-in no-select">
      
      {/* Header with Search */}
      <div style={{ 
        padding: "1rem", 
        background: "rgba(15, 23, 42, 0.8)", 
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
        zIndex: 2010
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>Place Pin</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "600" }}>Cancel</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search for a location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0, paddingLeft: "2.5rem" }}
            />
            <Search size={18} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
          <button type="submit" className="btn-primary" disabled={isSearching} style={{ width: "auto", padding: "0 1rem" }}>
            {isSearching ? <div className="spinner" /> : "Find"}
          </button>
        </form>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={initialCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
        
        {/* Floating Controls Placeholder (like Current Location button) */}
        <div style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.8)",
          padding: "0.8rem",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          backdropFilter: "blur(4px)"
        }} onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              setPosition([pos.coords.latitude, pos.coords.longitude]);
            });
          }
        }}>
          <Navigation size={20} color="var(--primary)" />
        </div>
      </div>

      {/* Footer Confirm */}
      <div style={{ 
        padding: "1.5rem", 
        background: "rgba(15, 23, 42, 0.9)", 
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        zIndex: 2010
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>PICKED LOCATION</p>
          <p style={{ fontSize: "0.9rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {address || "Locating..."}
          </p>
        </div>
        <button 
          className="btn-primary active-scale" 
          onClick={() => onSelect(address, position)}
          style={{ width: "100%", padding: "1.2rem" }}
        >
          Confirm Pin Location
        </button>
      </div>
    </div>
  );
};

export default MapSelector;
