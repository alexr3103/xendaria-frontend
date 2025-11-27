import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import useGeolocation from "../hooks/geo.js";
import pinHead from "../assets/pin-user.png";
import pointPin from "../assets/pin-point.png";
import xendariaMapStyle from "../map/xendariaMapStyle";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// mismos filtros que el mapa de usuarios
const PIN_FILTERS = {
  puntos_populares: "hue-rotate(5deg) saturate(120%) brightness(1.05)",
  paradas_de_bus_turistico: "hue-rotate(73deg) saturate(180%) brightness(1.15)",
  paseo_de_la_historieta: "grayscale(1) brightness(1.1)",
  espacios_verdes_publicos: "hue-rotate(175deg) saturate(170%) brightness(1.1)",
  espacios_verdes_privados: "hue-rotate(118deg) saturate(190%) brightness(1.1)",
  lugares_de_esparcimiento: "hue-rotate(228deg) saturate(160%) brightness(1.1)",
  curiosos: "hue-rotate(283deg) saturate(180%) brightness(1.1)",
};

export default function MapaAdmin({ puntos = [], onSelectPunto, onListo, puntoSeleccionado }) {
  const API = import.meta.env.VITE_API_URL;

  const { coords } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 20000,
  });

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const puntosRef = useRef([]);

  const [rutaActiva, setRutaActiva] = useState(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: xendariaMapStyle,
      center: [-58.3816, -34.6037],
      zoom: 12,
    });

    mapRef.current.on("style.load", async () => {
      try {
        if (onListo) onListo(false);

        // cargar desde localStorage
        const guardados = localStorage.getItem("puntos_xendaria");
        if (guardados) {
          try {
            const parsed = JSON.parse(guardados);
            if (Array.isArray(parsed) && parsed.length > 0) {
              puntosRef.current = parsed;
              renderMarkers(parsed);
            }
          } catch {}
        }

        // cargar desde API real
        const res = await fetch(`${API}/api/puntos`);
        const data = await res.json();

        if (Array.isArray(data)) {
          puntosRef.current = data;
          localStorage.setItem("puntos_xendaria", JSON.stringify(data));
          renderMarkers(data);
        }

        if (onListo) onListo(true);
      } catch {
        if (onListo) onListo(true);
      }
    });

    return () => mapRef.current?.remove();
  }, []);

  // Render de pines
  function renderMarkers(puntos) {
    if (!mapRef.current) return;

    document
      .querySelectorAll(".mapboxgl-marker.point-marker")
      .forEach((m) => m.remove());

    puntos.forEach((p) => {
      if (!p.lat || !p.lon) return;

      const el = document.createElement("div");
      el.className = "point-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.backgroundImage = `url(${pointPin})`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.cursor = "pointer";

      const filtro = PIN_FILTERS[p.categoria] || "none";
      el.style.filter = filtro;

      el.addEventListener("click", () => onSelectPunto && onSelectPunto(p));

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lon, p.lat])
        .addTo(mapRef.current);
    });
  }

  // FlyTo al punto seleccionado
  useEffect(() => {
    if (!puntoSeleccionado) return;
    if (!mapRef.current) return;

    const { lat, lon } = puntoSeleccionado;
    if (!lat || !lon) return;

    mapRef.current.flyTo({
      center: [lon, lat],
      zoom: 16,
      speed: 1.3,
      essential: true,
    });
  }, [puntoSeleccionado]);

  // Marker del usuario
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const { lat, lng } = coords;

    if (!userMarkerRef.current) {
      const wrap = document.createElement("div");
      wrap.className = "relative flex items-center justify-center";

      const aura = document.createElement("div");
      aura.className =
        "absolute w-20 h-20 rounded-full bg-morado/20 animate-[ping_3s_linear_infinite]";

      const icon = document.createElement("div");
      icon.style.width = "38px";
      icon.style.height = "38px";
      icon.style.backgroundImage = `url(${pinHead})`;
      icon.style.backgroundSize = "contain";

      wrap.appendChild(aura);
      wrap.appendChild(icon);

      userMarkerRef.current = new mapboxgl.Marker({
        element: wrap,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [coords]);

  return <div ref={mapContainer} className="absolute inset-0" />;
}
