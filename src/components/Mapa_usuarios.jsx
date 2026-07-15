import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import useGeolocation from "../hooks/geo.js";
import pinHead from "../assets/pin-user.png";
import pointPin from "../assets/pin-point.png";
import xendariaMapStyle from "../map/xendariaMapStyle";
import { categorias as categoriasInfo } from "./CategoriasFiltros.jsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const PIN_FALLBACK_COLOR = categoriasInfo.propios?.color || "#FF8BC6";
const PIN_EN_AJUSTE_COLOR = "#8B8B8B";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

function getCategoriaPrincipal(punto = {}) {
  return (
    getCategoriasPunto(punto).find((categoria) => categoriasInfo[categoria]) ||
    "propios"
  );
}

function getColoresCategorias(punto = {}) {
  return getCategoriasPunto(punto)
    .map((categoria) => categoriasInfo[categoria]?.color)
    .filter(Boolean);
}

function getConicGradient(colors = []) {
  const step = 100 / colors.length;
  const segments = colors.map(
    (color, index) => `${color} ${index * step}% ${(index + 1) * step}%`
  );

  return `conic-gradient(${segments.join(", ")})`;
}

function pintarPinPorCategorias(el, punto, colorForzado = null) {
  const colores = getColoresCategorias(punto);
  const relleno =
    colorForzado ||
    (colores.length > 1
      ? getConicGradient(colores)
      : colores[0] || PIN_FALLBACK_COLOR);

  el.innerHTML = "";
  el.style.background = "";
  el.style.backgroundImage = `url(${pointPin})`;
  el.style.backgroundSize = "contain";
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundPosition = "center";
  el.style.maskImage = "";
  el.style.removeProperty("-webkit-mask-image");
  el.style.removeProperty("-webkit-mask-size");
  el.style.removeProperty("-webkit-mask-repeat");
  el.style.removeProperty("-webkit-mask-position");
  el.style.filter = "drop-shadow(0 4px 5px rgba(74, 23, 63, 0.25))";

  const pin = document.createElement("span");
  pin.style.position = "absolute";
  pin.style.inset = "0";
  pin.style.background = relleno;
  pin.style.maskImage = `url(${pointPin})`;
  pin.style.maskSize = "contain";
  pin.style.maskRepeat = "no-repeat";
  pin.style.maskPosition = "center";
  pin.style.setProperty("-webkit-mask-image", `url(${pointPin})`);
  pin.style.setProperty("-webkit-mask-size", "contain");
  pin.style.setProperty("-webkit-mask-repeat", "no-repeat");
  pin.style.setProperty("-webkit-mask-position", "center");
  pin.style.pointerEvents = "none";

  el.appendChild(pin);
}

export default function MapaUsuario({
  filtro = null,
  onSelectPunto,
  onCoordsChange,
  puntoPropioDraft = null,
  puntoPropioCategoria = "propios",
  puntoPropioEditandoId = null,
  onPuntoPropioCoordsChange,
  puntosPropios = [],
  puntoEnFoco = null,
  recenterToken = 0,
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
  const draftMarkerRef = useRef(null);
  const puntosRef = useRef([]);
  const puntoEnFocoHastaRef = useRef(0);

  const [rutaActiva, setRutaActiva] = useState(null);
  const [yaNotifique, setYaNotifique] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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

    mapRef.current.on("load", () => {
      setMapReady(true);
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
          } catch {
            localStorage.removeItem("puntos_xendaria");
          }
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
      const lat = Number(p.lat);
      const lon = Number(p.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const esPuntoPropio = p.origen === "usuario" || p.visibilidad === "privado";
      const esPuntoEnAjuste =
        puntoPropioEditandoId &&
        String(p._id) === String(puntoPropioEditandoId);

      const el = document.createElement("div");
      const markerSize = esPuntoPropio ? 54 : 32;
      el.className = "point-marker";
      el.style.width = `${markerSize}px`;
      el.style.height = `${markerSize}px`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.cursor = "pointer";

      pintarPinPorCategorias(
        el,
        p,
        esPuntoEnAjuste ? PIN_EN_AJUSTE_COLOR : null
      );

      el.addEventListener("click", () => onSelectPunto && onSelectPunto(p));

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);
    });
  }

  // ---------------------------
  // 🔥 ACÁ EL ÚNICO CAMBIO
  // ---------------------------
  useEffect(() => {
    if (!coords || !mapRef.current) return;

    const { lat, lng } = coords;
    const radioKm = 1;

    const puntosCercanos = puntosRef.current.filter((p) => {
      const puntoLat = Number(p.lat);
      const puntoLon = Number(p.lon);

      if (!Number.isFinite(puntoLat) || !Number.isFinite(puntoLon)) {
        return false;
      }

      return getDistance(lat, lng, puntoLat, puntoLon) <= radioKm;
    });

    const propiosValidos = puntosPropios.filter((p) => {
      const puntoLat = Number(p.lat);
      const puntoLon = Number(p.lon);

      return Number.isFinite(puntoLat) && Number.isFinite(puntoLon);
    });

    let result = [...puntosCercanos, ...propiosValidos];

    if (filtro) {
      const filtroNormalizado = filtro.trim().toLowerCase();
      result = result.filter(
        (p) =>
          getCategoriasPunto(p).some(
            (categoria) => categoria.trim().toLowerCase() === filtroNormalizado
          )
      );
    }

    renderMarkers(result);

    // 🔥 FIX FINAL: ahora muestra desde el inicio
    if (onListo && !yaNotifique) {
      onListo();
      setYaNotifique(true);
    }
  }, [coords, filtro, puntosPropios, puntoPropioEditandoId]);

  useEffect(() => {
    if (!coords || !mapRef.current || !mapReady) return;

    const { lat, lng } = coords;

    if (onCoordsChange) onCoordsChange(coords);

    if (!userMarkerRef.current) {
      const wrap = document.createElement("div");
      wrap.className = "relative flex items-center justify-center";
      wrap.style.width = "38px";
      wrap.style.height = "38px";
      wrap.style.pointerEvents = "none";

      const aura = document.createElement("div");
      aura.className =
        "absolute w-14 h-14 rounded-full bg-morado/20 animate-[ping_3s_linear_infinite]";
      aura.style.pointerEvents = "none";

      const icon = document.createElement("div");
      icon.style.width = "38px";
      icon.style.height = "38px";
      icon.style.backgroundImage = `url(${pinHead})`;
      icon.style.backgroundSize = "contain";
      icon.style.pointerEvents = "none";

      wrap.appendChild(aura);
      wrap.appendChild(icon);

      userMarkerRef.current = new mapboxgl.Marker({
        element: wrap,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      if (Date.now() >= puntoEnFocoHastaRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          speed: 1.2,
        });
      }
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);

      if (Date.now() >= puntoEnFocoHastaRef.current) {
        mapRef.current.easeTo({
          center: [lng, lat],
          zoom: rutaActiva ? 17 : 15,
          duration: 900,
        });
      }
    }
  }, [coords, rutaActiva, mapReady]);

  useEffect(() => {
    if (!recenterToken || !coords || !mapRef.current || !mapReady) return;

    puntoEnFocoHastaRef.current = 0;

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 15,
      speed: 1.2,
      essential: true,
    });
  }, [recenterToken, coords, mapReady]);

  useEffect(() => {
    if (!puntoEnFoco || !mapRef.current || !mapReady) return;

    const lat = Number(puntoEnFoco.lat);
    const lon = Number(puntoEnFoco.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    puntoEnFocoHastaRef.current = Date.now() + 4000;

    mapRef.current.flyTo({
      center: [lon, lat],
      zoom: 17,
      offset: [0, -120],
      speed: 1.15,
      essential: true,
    });
  }, [puntoEnFoco, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!puntoPropioDraft) {
      if (draftMarkerRef.current) {
        draftMarkerRef.current.remove();
        draftMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng } = puntoPropioDraft;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!draftMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "point-marker-draft";
      el.style.width = "54px";
      el.style.height = "54px";
      el.style.cursor = "grab";
      pintarPinPorCategorias(el, { categoria: puntoPropioCategoria });

      draftMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map);

      draftMarkerRef.current.on("dragend", () => {
        const next = draftMarkerRef.current.getLngLat();
        onPuntoPropioCoordsChange?.({
          lat: next.lat,
          lng: next.lng,
        }, {
          confirmado: true,
        });
      });

      map.flyTo({
        center: [lng, lat],
        zoom: 17,
        offset: [0, -160],
        speed: 1.1,
      });
    } else {
      draftMarkerRef.current.setLngLat([lng, lat]);
      pintarPinPorCategorias(draftMarkerRef.current.getElement(), {
        categoria: puntoPropioCategoria,
      });
      draftMarkerRef.current.getElement().style.cursor = "grab";
      map.easeTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16),
        offset: [0, -160],
        duration: 500,
      });
    }
  }, [puntoPropioDraft, puntoPropioCategoria, onPuntoPropioCoordsChange, mapReady]);

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
