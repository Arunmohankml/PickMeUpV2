"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { Search } from "lucide-react";

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
      width: "100%",
      height: "100%",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(4px)"
    }}>
      <div className="glass-card" style={{
        width: "90%",
        maxWidth: "800px",
        height: "80%",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem",
        position: "relative",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Select Location</h3>
          <button className="btn-secondary" onClick={onClose} style={{ padding: "0.5rem" }}>X Close</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search for a location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button type="submit" className="btn-primary" disabled={isSearching} style={{ padding: "0.8rem" }}>
            {isSearching ? <div className="spinner" /> : <Search size={20} />}
          </button>
        </form>

        <div style={{ flex: 1, borderRadius: "12px", overflow: "hidden", position: "relative", border: "1px solid var(--border)" }}>
          <MapContainer center={initialCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
          </MapContainer>
          <div style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            background: "rgba(15, 23, 42, 0.9)",
            padding: "0.8rem",
            borderRadius: "8px",
            fontSize: "0.9rem",
            zIndex: 1000,
            border: "1px solid var(--border)"
          }}>
            <p><strong>Selected:</strong> {address || "Loading..."}</p>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => onSelect(address, position)}
          style={{ width: "100%" }}
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default MapSelector;
