import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { MAP_DEFAULTS, LEAFLET_ICON_CONFIG } from "@/lib/constants";

// Fix default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions(LEAFLET_ICON_CONFIG);

const DEFAULT_CENTER = MAP_DEFAULTS.CENTER;

function FlyToHandler({ selectedLatLng }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLatLng) {
      map.flyTo(selectedLatLng, 13, { duration: 1 });
    }
  }, [selectedLatLng]);
  return null;
}

function createCustomIcon(category) {
  const colors = {
    Houses: "#00E676",
    Tools: "#2E5BFF",
    Equipment: "#FF9800",
    Vehicles: "#e11d48",
    Electronics: "#a855f7",
    Furniture: "#facc15",
    Other: "#71717a",
  };
  const color = colors[category] || colors.Other;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #0A0A0B;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

export default function ProductMap({ products, onSelectProduct, selectedLatLng }) {
  const navigate = useNavigate();
  const markers = products.filter(p => p.latitude && p.longitude);

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-300 h-full" style={{ minHeight: "400px", height: "100%" }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        style={{ height: "100%", width: "100%", background: "#0A0A0B" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <FlyToHandler selectedLatLng={selectedLatLng} />
        {markers.map(product => (
          <Marker
            key={product.id}
            position={[product.latitude, product.longitude]}
            icon={createCustomIcon(product.category)}
          >
            <Popup>
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(product);
                  else navigate(`/products/${product.id}`);
                }}
              >
                <p className="font-bold text-sm text-zinc-900">{product.title}</p>
                <p className="text-xs text-zinc-400">{product.category}</p>
                <p className="text-sm font-bold text-blue-600 mt-1">KSH {product.price_per_day}/day</p>
                <p className="text-xs text-green-600">{product.location_name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
