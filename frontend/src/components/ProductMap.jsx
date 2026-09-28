// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
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
    "Tools & Equipment": "#2E5BFF",
    Vehicles: "#e11d48",
    AirBnB: "#a855f7",
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

function GoogleMapProducts({ products, onSelectProduct, selectedLatLng }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(Boolean(window.google && window.google.maps));

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    if (window.google && window.google.maps) {
      setReady(true);
      return;
    }

    const scriptId = "rentalls-google-maps-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      script.onerror = () => setReady(false);
      document.head.appendChild(script);
    }

    const waitForMap = () => {
      if (window.google && window.google.maps) {
        setReady(true);
      } else {
        setTimeout(waitForMap, 150);
      }
    };
    waitForMap();
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google?.maps) return;

    const center = { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    if (selectedLatLng) {
      mapRef.current.panTo({ lat: selectedLatLng[0], lng: selectedLatLng[1] });
      mapRef.current.setZoom(13);
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const validProducts = products.filter((p) => p.latitude && p.longitude);
    validProducts.forEach((product) => {
      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position: { lat: Number(product.latitude), lng: Number(product.longitude) },
        title: product.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: {
            Houses: "#00E676",
            "Tools & Equipment": "#2E5BFF",
            Vehicles: "#e11d48",
            AirBnB: "#a855f7",
            Other: "#71717a",
          }[product.category] || "#71717a",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#0A0A0B",
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width:180px; font-family: sans-serif; cursor:pointer;" data-product-id="${product.id}">
            <p style="font-weight:700; margin:0; color:#111827;">${product.title}</p>
            <p style="margin:2px 0 0; color:#6b7280; font-size:12px;">${product.category}</p>
            <p style="margin:6px 0 0; color:#2563eb; font-weight:700;">KSH ${product.price_per_day}/day</p>
            <p style="margin:2px 0 0; color:#16a34a; font-size:12px;">${product.location_name || ""}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open({ anchor: marker, map: mapRef.current });
      });

      infoWindow.addListener("domready", () => {
        const node = document.querySelector(`[data-product-id="${product.id}"]`);
        if (node) {
          node.addEventListener("click", () => {
            if (onSelectProduct) onSelectProduct(product);
            else navigate(`/products/${product.id}`);
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [ready, products, selectedLatLng, onSelectProduct, navigate]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return null;

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden border border-zinc-300" style={{ minHeight: "400px", height: "100%" }} />;
}

export default function ProductMap({ products, onSelectProduct, selectedLatLng }) {
  const navigate = useNavigate();
  const markers = products.filter((p) => p.latitude && p.longitude);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return <GoogleMapProducts products={products} onSelectProduct={onSelectProduct} selectedLatLng={selectedLatLng} />;
  }

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
        {markers.map((product) => (
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
