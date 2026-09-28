import React, { useEffect, useRef, useState } from "react";
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
      if (typeof onPick === "function") onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function GoogleMapLocation({ latitude, longitude, onPick, height }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
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
    return () => {};
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google?.maps) return;

    const center = { lat: Number(latitude || DEFAULT_CENTER[0]), lng: Number(longitude || DEFAULT_CENTER[1]) };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      if (typeof onPick === "function") {
        mapRef.current.addListener("click", (event) => {
          onPick(event.latLng.lat(), event.latLng.lng());
        });
      }
    }

    mapRef.current.setCenter(center);

    if (markerRef.current) markerRef.current.setMap(null);
    if (latitude && longitude) {
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
      });
    }
  }, [ready, latitude, longitude, onPick]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return null;

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden border border-zinc-300" style={{ height }} />;
}

export default function LocationMap({ latitude, longitude, onPick, height = "300px" }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const center = latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER;

  if (apiKey) {
    return <GoogleMapLocation latitude={latitude} longitude={longitude} onPick={onPick} height={height} />;
  }

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