import { useEffect, useRef } from "react";
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
const UNA_CUADRA_KM = 0.12;
const RUTA_FALLBACK_COLOR = "#AA63E0";
const RUTA_CATEGORY_COLORS = {
  imperdibles: "#F28FA0",
  historia_patrimonio: "#D1D1D1",
  arte_cultura: "#A0CDFF",
  curiosidades_leyendas: "#C69BFF",
  verde_aire_libre: "#83FFC4",
  sabores_comercios: "#FFF7A8",
};

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
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

function getRutaColor(ruta = {}) {
  return RUTA_CATEGORY_COLORS[ruta.categoria] || RUTA_FALLBACK_COLOR;
}

function distanciaKm(origen, destino) {
  const R = 6371;
  const dLat = (destino.lat - origen.lat) * (Math.PI / 180);
  const dLon = (destino.lon - origen.lon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(origen.lat * (Math.PI / 180)) *
      Math.cos(destino.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function pintarPinPorCategorias(el, punto, colorForzado = null) {
  const inactivo = punto?.activo === false;
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
  el.style.opacity = inactivo ? "0.78" : "1";
  el.style.filter = inactivo
    ? "drop-shadow(0 4px 5px rgba(74, 23, 63, 0.18)) grayscale(0.25)"
    : "drop-shadow(0 4px 5px rgba(74, 23, 63, 0.25))";

  const pin = document.createElement("span");
  pin.style.position = "absolute";
  pin.style.inset = "0";
  pin.style.background = relleno;
  pin.style.opacity = inactivo ? "0.52" : "1";
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

  if (inactivo) {
    const stripes = document.createElement("span");
    stripes.style.position = "absolute";
    stripes.style.inset = "0";
    stripes.style.background =
      "repeating-linear-gradient(135deg, rgba(64, 26, 55, 0.72) 0 3px, rgba(253, 247, 241, 0.78) 3px 6px, transparent 6px 10px)";
    stripes.style.maskImage = `url(${pointPin})`;
    stripes.style.maskSize = "contain";
    stripes.style.maskRepeat = "no-repeat";
    stripes.style.maskPosition = "center";
    stripes.style.setProperty("-webkit-mask-image", `url(${pointPin})`);
    stripes.style.setProperty("-webkit-mask-size", "contain");
    stripes.style.setProperty("-webkit-mask-repeat", "no-repeat");
    stripes.style.setProperty("-webkit-mask-position", "center");
    stripes.style.pointerEvents = "none";
    el.appendChild(stripes);
  }
}

export default function MapaAdmin({
  puntos = [],
  rutas = [],
  modo = "puntos",
  onSelectPunto,
  onPuntoCoordsChange,
  onConfirmarMovimientoLargo,
  onListo,
  puntoSeleccionado,
  rutaSeleccionada,
}) {
  const { coords } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 20000,
  });

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const puntosRef = useRef([]);
  const pointMarkersRef = useRef([]);
  const routeMarkersRef = useRef([]);
  const editableMarkerRef = useRef(null);
  const puntoSeleccionadoRef = useRef(null);

  useEffect(() => {
    puntoSeleccionadoRef.current = puntoSeleccionado;
  }, [puntoSeleccionado]);

  // ============================================================
  // Inicializar mapa
  // ============================================================
  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: xendariaMapStyle,
      center: [-58.3816, -34.6037],
      zoom: 12,
    });

    mapRef.current.on("style.load", () => {
      if (onListo) onListo(true);
    });

    return () => {
      clearPointMarkers();
      clearEditableMarker();
      clearRouteMarkers();
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const resizeMap = () => mapRef.current?.resize();
    const observer = new ResizeObserver(resizeMap);
    observer.observe(container);

    const frame = requestAnimationFrame(resizeMap);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // ============================================================
  // Render de pines
  // ============================================================
  function clearPointMarkers() {
    pointMarkersRef.current.forEach((marker) => marker.remove());
    pointMarkersRef.current = [];
  }

  function clearEditableMarker() {
    if (editableMarkerRef.current) {
      editableMarkerRef.current.remove();
      editableMarkerRef.current = null;
    }
  }

  function clearRouteMarkers() {
    routeMarkersRef.current.forEach((marker) => marker.remove());
    routeMarkersRef.current = [];
  }

  function renderMarkers(puntos) {
    if (!mapRef.current) return;

    clearPointMarkers();

    puntos.forEach((p) => {
      const lat = Number(p.lat);
      const lon = Number(p.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const el = document.createElement("div");
      const seleccionado =
        puntoSeleccionado?._id &&
        String(p._id) === String(puntoSeleccionado._id);

      el.className = "point-marker";
      el.style.width = seleccionado ? "42px" : "32px";
      el.style.height = seleccionado ? "42px" : "32px";
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.cursor = "pointer";

      pintarPinPorCategorias(el, p, seleccionado ? PIN_EN_AJUSTE_COLOR : null);

      el.addEventListener("click", () => onSelectPunto && onSelectPunto(p));

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);

      marker._xendariaPuntoId = String(p._id || "");

      pointMarkersRef.current.push(marker);
    });
  }

  function getPuntoCoords(punto) {
    const lat = Number(punto?.lat ?? punto?.ubicacion?.coordinates?.[1]);
    const lon = Number(punto?.lon ?? punto?.ubicacion?.coordinates?.[0]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lon, lat];
  }

  function renderEditableMarker(punto) {
    const map = mapRef.current;
    const coords = getPuntoCoords(punto);

    if (!map || !coords || modo !== "puntos") {
      clearEditableMarker();
      return;
    }

    if (!editableMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "point-marker-editable";
      el.style.width = "54px";
      el.style.height = "54px";
      el.style.cursor = "grab";
      pintarPinPorCategorias(el, punto);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        draggable: true,
      })
        .setLngLat(coords)
        .addTo(map);

      marker.on("dragstart", () => {
        el.style.cursor = "grabbing";
      });

      marker.on("dragend", async () => {
        el.style.cursor = "grab";

        const puntoActual = puntoSeleccionadoRef.current;
        const posicionPreviaCoords = getPuntoCoords(puntoActual);
        const puntoPersistido =
          puntosRef.current.find(
            (item) => String(item._id || "") === String(puntoActual?._id || "")
          ) || puntoActual;
        const origenCoords = getPuntoCoords(puntoPersistido);
        const next = marker.getLngLat();
        const destino = {
          lat: Number(next.lat.toFixed(7)),
          lon: Number(next.lng.toFixed(7)),
        };

        if (!origenCoords) {
          onPuntoCoordsChange?.(destino);
          return;
        }

        const origen = {
          lat: origenCoords[1],
          lon: origenCoords[0],
        };
        const distancia = distanciaKm(origen, destino);

        if (distancia > UNA_CUADRA_KM) {
          const aceptar = onConfirmarMovimientoLargo
            ? await onConfirmarMovimientoLargo({
                punto: puntoActual,
                origen,
                destino,
                distanciaMetros: distancia * 1000,
              })
            : window.confirm("Moviste el punto más de una cuadra. ¿Confirmás el ajuste?");

          if (!aceptar) {
            marker.setLngLat(posicionPreviaCoords || origenCoords);
            return;
          }
        }

        onPuntoCoordsChange?.(destino);
      });

      editableMarkerRef.current = marker;
      return;
    }

    editableMarkerRef.current.setLngLat(coords);
    const el = editableMarkerRef.current.getElement();
    el.style.cursor = "grab";
    pintarPinPorCategorias(el, punto);
  }

function getRutaFeature(ruta) {
    const coordsRuta = (ruta?.puntos || [])
      .map(getPuntoCoords)
      .filter(Boolean);

    if (coordsRuta.length < 2) return null;

    return {
      type: "Feature",
      properties: {
        id: ruta._id,
        nombre: ruta.nombre,
        categoria: ruta.categoria,
        color: getRutaColor(ruta),
      },
      geometry: {
        type: "LineString",
        coordinates: coordsRuta,
      },
    };
  }

  function ensureRouteLayer(id, color, width, opacity) {
    const map = mapRef.current;
    if (!map || map.getLayer(id)) return;

    map.addLayer({
      id,
      type: "line",
      source: id,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": opacity,
      },
    });
  }

  function setRouteSource(id, data) {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource(id)) {
      map.getSource(id).setData(data);
    } else {
      map.addSource(id, {
        type: "geojson",
        data,
      });
    }
  }

  function renderRoutes(rutas = [], rutaSeleccionada = null) {
    const map = mapRef.current;
    if (!map) return;

    const features = rutas.map(getRutaFeature).filter(Boolean);
    const selectedFeature = rutaSeleccionada ? getRutaFeature(rutaSeleccionada) : null;
    const routeColor = ["coalesce", ["get", "color"], RUTA_FALLBACK_COLOR];

    setRouteSource("admin-rutas-lineas", {
      type: "FeatureCollection",
      features,
    });
    ensureRouteLayer("admin-rutas-lineas", routeColor, 4, 0.34);

    setRouteSource("admin-ruta-seleccionada-borde", {
      type: "FeatureCollection",
      features: selectedFeature ? [selectedFeature] : [],
    });
    ensureRouteLayer("admin-ruta-seleccionada-borde", "#401A37", 10, 0.72);

    setRouteSource("admin-ruta-seleccionada", {
      type: "FeatureCollection",
      features: selectedFeature ? [selectedFeature] : [],
    });
    ensureRouteLayer("admin-ruta-seleccionada", routeColor, 6, 1);

    clearRouteMarkers();

    if (rutaSeleccionada?.puntos?.length) {
      const selectedColor = getRutaColor(rutaSeleccionada);

      rutaSeleccionada.puntos.forEach((punto, index) => {
        const coordsPunto = getPuntoCoords(punto);
        if (!coordsPunto) return;

        const el = document.createElement("button");
        el.type = "button";
        el.className = "route-marker";
        el.style.width = "38px";
        el.style.height = "38px";
        el.style.borderRadius = "9999px";
        el.style.border = "3px solid #FDF7F1";
        el.style.backgroundColor = selectedColor;
        el.style.color = "#401A37";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontWeight = "800";
        el.style.fontSize = "14px";
        el.style.fontFamily = "Nunito Sans, sans-serif";
        el.style.lineHeight = "1";
        el.style.boxShadow = "0 10px 20px rgba(64, 26, 55, 0.28)";
        el.style.cursor = "pointer";
        el.style.zIndex = "5";
        el.textContent = String(index + 1);
        el.title = punto.nombre || `Punto ${index + 1}`;
        el.addEventListener("click", () => onSelectPunto && onSelectPunto(punto));

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(coordsPunto)
          .addTo(map);

        routeMarkersRef.current.push(marker);
      });
    }
  }

  function clearRouteLines() {
    const map = mapRef.current;
    if (!map) return;

    [
      "admin-rutas-lineas",
      "admin-ruta-seleccionada-borde",
      "admin-ruta-seleccionada",
    ].forEach((id) => {
      const source = map.getSource(id);
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    });
  }

  useEffect(() => {
    if (!mapRef.current || modo !== "puntos") {
      clearEditableMarker();
      return;
    }

    puntosRef.current = puntos;
    renderMarkers(puntos);
    renderEditableMarker(puntoSeleccionado);
    clearRouteMarkers();
    clearRouteLines();
  }, [puntos, modo, puntoSeleccionado?._id]);

  useEffect(() => {
    if (modo !== "puntos") {
      clearEditableMarker();
      return;
    }

    renderEditableMarker(puntoSeleccionado);
  }, [
    modo,
    puntoSeleccionado?._id,
    puntoSeleccionado?.lat,
    puntoSeleccionado?.lon,
    puntoSeleccionado?.categoria,
    puntoSeleccionado?.activo,
    JSON.stringify(puntoSeleccionado?.categorias || []),
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || modo !== "rutas") return;

    const update = () => {
      clearPointMarkers();
      clearEditableMarker();
      renderRoutes(rutas, rutaSeleccionada);
    };

    if (!map.isStyleLoaded()) {
      map.once("load", update);
      return;
    }

    update();
  }, [rutas, rutaSeleccionada, modo]);

  // ============================================================
  // FlyTo al punto seleccionado
  // ============================================================
  useEffect(() => {
    if (!puntoSeleccionado || modo !== "puntos") return;
    if (!mapRef.current) return;

    const coords = getPuntoCoords(puntoSeleccionado);
    if (!coords) return;

    mapRef.current.flyTo({
      center: coords,
      zoom: 16,
      speed: 1.3,
      essential: true,
    });
  }, [puntoSeleccionado?._id, puntoSeleccionado?.lat, puntoSeleccionado?.lon, modo]);

  useEffect(() => {
    if (!rutaSeleccionada || modo !== "rutas" || !mapRef.current) return;

    const coordsRuta = (rutaSeleccionada.puntos || [])
      .map(getPuntoCoords)
      .filter(Boolean);

    if (coordsRuta.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    coordsRuta.forEach((coord) => bounds.extend(coord));

    mapRef.current.fitBounds(bounds, {
      padding: 80,
      maxZoom: 15,
      duration: 700,
    });
  }, [rutaSeleccionada, modo]);

  // ============================================================
  // Marker del usuario
  // ============================================================
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
