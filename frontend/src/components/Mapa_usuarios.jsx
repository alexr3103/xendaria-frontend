import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import useGeolocation from "../hooks/geo.js";
import pinHead from "../assets/pin-user.png";
import pointPin from "../assets/pin-point.png";
import xendariaMapStyle from "../map/xendariaMapStyle";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const PIN_FILTERS = {
  puntos_populares: "hue-rotate(5deg) saturate(120%) brightness(1.05)",
  paradas_de_bus_turistico: "hue-rotate(73deg) saturate(180%) brightness(1.15)",
  paseo_de_la_historieta: "grayscale(1) brightness(1.1)",
  espacios_verdes_publicos: "hue-rotate(175deg) saturate(170%) brightness(1.1)",
  espacios_verdes_privados: "hue-rotate(118deg) saturate(190%) brightness(1.1)",
  lugares_de_esparcimiento: "hue-rotate(228deg) saturate(160%) brightness(1.1)",
  curiosos: "hue-rotate(283deg) saturate(180%) brightness(1.1)",
};

export default function MapaUsuario({
  filtro = null,
  onSelectPunto,
  onCoordsChange,
  destino = null,
  onListo,
}) {
  const API = import.meta.env.VITE_API_URL;

  const { coords } = useGeolocation({
    distanceThresholdMeters: 75,
    minIntervalMs: 3000,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 20000,
  });

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const puntosRef = useRef([]);

  const [rutaActiva, setRutaActiva] = useState(null);
  const [yaNotifique, setYaNotifique] = useState(false);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async function obtenerRuta(origen, destino) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${origen.lng},${origen.lat};${destino.lon},${destino.lat}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.routes?.[0] || null;
  }

  function dibujarRuta(ruta) {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource("ruta")) {
      map.removeLayer("ruta-linea");
      map.removeSource("ruta");
    }

    map.addSource("ruta", {
      type: "geojson",
      data: { type: "Feature", geometry: ruta.geometry },
    });

    map.addLayer({
      id: "ruta-linea",
      type: "line",
      source: "ruta",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#AA63E0",
        "line-width": 5,
      },
    });

    setRutaActiva(ruta);
  }

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

        const guardados = localStorage.getItem("puntos_xendaria");
        if (guardados) {
          try {
            const parsed = JSON.parse(guardados);
            if (Array.isArray(parsed) && parsed.length > 0) {
              puntosRef.current = parsed;
            }
          } catch {}
        }

        const res = await fetch(`${API}/api/puntos`);
        const data = await res.json();

        if (Array.isArray(data)) {
          puntosRef.current = data;
          localStorage.setItem("puntos_xendaria", JSON.stringify(data));
        }
        if (onListo) onListo(true);
      } catch {
        if (onListo) onListo(true);
      }
    });

    return () => mapRef.current?.remove();
  }, []);

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

  useEffect(() => {
    if (!coords || !puntosRef.current.length || !mapRef.current) return;

    const { lat, lng } = coords;
    const radioKm = 1;

    let result = puntosRef.current.filter((p) => {
      if (!p.lat || !p.lon) return false;
      return getDistance(lat, lng, p.lat, p.lon) <= radioKm;
    });

    if (filtro) {
      result = result.filter(
        (p) =>
          (p.categoria || "").trim().toLowerCase() ===
          filtro.trim().toLowerCase()
      );
    }

    renderMarkers(result);

    if (onListo && !yaNotifique) {
      onListo();
      setYaNotifique(true);
    }
  }, [coords, filtro]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const { lat, lng } = coords;

    if (onCoordsChange) onCoordsChange(coords);

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

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        speed: 1.2,
      });
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);

      mapRef.current.easeTo({
        center: [lng, lat],
        zoom: rutaActiva ? 17 : 15,
        duration: 900,
      });
    }
  }, [coords, rutaActiva]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!destino) {
      if (map.getSource("ruta")) {
        map.removeLayer("ruta-linea");
        map.removeSource("ruta");
      }

      setRutaActiva(null);
      map.easeTo({ zoom: 15, duration: 600 });
      return;
    }

    if (coords && destino) {
      obtenerRuta({ lat: coords.lat, lng: coords.lng }, destino).then((ruta) => {
        if (ruta) dibujarRuta(ruta);
      });
    }
  }, [destino, coords]);

  return <div ref={mapContainer} className="absolute inset-0" />;
}
