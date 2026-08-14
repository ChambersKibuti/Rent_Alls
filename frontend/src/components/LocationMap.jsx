import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_DEFAULTS, LEAFLET_ICON_CONFIG } from "@/lib/constants";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions(LEAFLET_ICON_CONFIG);

const DEFAULT_CENTER = MAP_DEFAULTS.CENTER;

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMap({ latitude, longitude, onPick, height = "300px" }) {
  const center = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-300" style={{ height }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%", background: "#0A0A0B" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <ClickHandler onPick={onPick} />
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} />
        )}
      </MapContainer>
    </div>
  );
}