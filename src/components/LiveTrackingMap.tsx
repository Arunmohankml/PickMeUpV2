"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Custom pulsing car marker for driver
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 40px; height: 40px;
    background: #facc15;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(250,204,21,0.3), 0 4px 12px rgba(0,0,0,0.4);
    font-size: 18px;
  ">🚗</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 32px; height: 32px;
    background: #facc15;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const dropIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 32px; height: 32px;
    background: #4ade80;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to smoothly fly the map to driver position
function FlyToDriver({ pos }: { pos: [number, number] }) {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!prevPos.current) {
      map.setView(pos, 15);
    } else {
      map.flyTo(pos, map.getZoom(), { animate: true, duration: 1.5 });
    }
    prevPos.current = pos;
  }, [pos, map]);

  return null;
}

interface LiveTrackingMapProps {
  driverLat: number;
  driverLng: number;
  pickupLat?: number;
  pickupLng?: number;
  pickupLabel?: string;
  dropLat?: number;
  dropLng?: number;
  dropLabel?: string;
  showDrop?: boolean; // only after OTP verified
}

export default function LiveTrackingMap({
  driverLat,
  driverLng,
  pickupLat,
  pickupLng,
  pickupLabel,
  dropLat,
  dropLng,
  dropLabel,
  showDrop = false,
}: LiveTrackingMapProps) {
  return (
    <div style={{
      width: "100%",
      height: "320px",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(250,204,21,0.3)",
      boxShadow: "0 0 30px rgba(250,204,21,0.1)",
      position: "relative",
    }}>
      {/* Live badge */}
      <div style={{
        position: "absolute",
        top: "12px",
        left: "12px",
        zIndex: 1000,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(250,204,21,0.4)",
        borderRadius: "20px",
        padding: "0.3rem 0.75rem",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.8rem",
        fontWeight: "700",
        color: "#facc15",
      }}>
        <span style={{
          width: "8px", height: "8px",
          background: "#4ade80",
          borderRadius: "50%",
          display: "inline-block",
          animation: "pulseDot 1.5s infinite",
        }} />
        LIVE
      </div>

      <style>{`@keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      <MapContainer
        center={[driverLat, driverLng]}
        zoom={15}
        style={{ height: "100%", width: "100%", background: "#1e293b" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />

        <FlyToDriver pos={[driverLat, driverLng]} />

        {/* Driver moving marker */}
        <Marker position={[driverLat, driverLng]} icon={driverIcon}>
          <Popup>Your Captain</Popup>
        </Marker>

        {/* Pickup pin */}
        {pickupLat && pickupLng && (
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>{pickupLabel || "Pickup"}</Popup>
          </Marker>
        )}

        {/* Drop pin — only after OTP verified */}
        {showDrop && dropLat && dropLng && (
          <Marker position={[dropLat, dropLng]} icon={dropIcon}>
            <Popup>{dropLabel || "Drop"}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
