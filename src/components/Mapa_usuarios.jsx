import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import useGeolocation from "../hooks/geo.js";
import pinHead from "../assets/pin-user.png";
import pointPin from "../assets/pin-point.png";
import xendariaMapStyle from "../map/xendariaMapStyle";
import { categorias as categoriasInfo } from "./CategoriasFiltros.jsx";
import SelectorPuntosSuperpuestos from "./SelectorPuntosSuperpuestos.jsx";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const PIN_FALLBACK_COLOR = categoriasInfo.propios?.color || "#FF8BC6";
const PIN_EN_AJUSTE_COLOR = "#8B8B8B";
const RADIO_PUNTOS_CERCANOS_KM = 1.5;
const CATEGORIA_COMERCIOS = "comercios";
const DISTANCIA_SUPERPOSICION_KM = 0.035;

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

function puntoTieneCategoria(punto, categoriaBuscada) {
  const normalizada = String(categoriaBuscada || "").trim().toLowerCase();

  return getCategoriasPunto(punto).some(
    (categoria) => String(categoria).trim().toLowerCase() === normalizada
  );
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
  console.log("coords usuario:", coords);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const ubicacionInicialCentradaRef = useRef(false);
  const draftMarkerRef = useRef(null);
  const puntosRef = useRef([]);
  const puntoEnFocoHastaRef = useRef(0);
  const comerciosEncuadradosRef = useRef(false);

  const [rutaActiva, setRutaActiva] = useState(null);
  const [yaNotifique, setYaNotifique] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [puntosVersion, setPuntosVersion] = useState(0);
  const [puntosSuperpuestos, setPuntosSuperpuestos] = useState([]);

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

  async function obtenerRuta(origen, destinoPunto) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${origen.lng},${origen.lat};${destinoPunto.lon},${destinoPunto.lat}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;
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
              setPuntosVersion((version) => version + 1);
            }
          } catch {
            localStorage.removeItem("puntos_xendaria");
          }
        }

        const res = await fetch(`${API}/api/puntos`);
        const data = await res.json();

        if (Array.isArray(data)) {
          puntosRef.current = data;
          setPuntosVersion((version) => version + 1);
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

    const puntosRenderizables = puntos
      .map((punto) => ({
        punto,
        lat: Number(punto.lat),
        lon: Number(punto.lon),
      }))
      .filter(
        ({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon)
      );

    const gruposSuperpuestos = [];

    puntosRenderizables.forEach((punto) => {
      const grupoExistente = gruposSuperpuestos.find((grupo) =>
        grupo.some(
          (otroPunto) =>
            getDistance(
              punto.lat,
              punto.lon,
              otroPunto.lat,
              otroPunto.lon
            ) <= DISTANCIA_SUPERPOSICION_KM
        )
      );

      if (grupoExistente) {
        grupoExistente.push(punto);
      } else {
        gruposSuperpuestos.push([punto]);
      }
    });

    gruposSuperpuestos.forEach((grupo) => {
      const [{ punto: p, lat, lon }] = grupo;
      const puntosDelGrupo = grupo.map(({ punto }) => punto);
      const esGrupo = grupo.length > 1;
      const esPuntoPropio =
        p.origen === "usuario" || p.visibilidad === "privado";
      const esPuntoEnAjuste = grupo.some(
        ({ punto }) =>
          puntoPropioEditandoId &&
          String(punto._id) === String(puntoPropioEditandoId)
      );
      const puntoVisual = esGrupo
        ? {
            categorias: puntosDelGrupo.flatMap((punto) =>
              getCategoriasPunto(punto)
            ),
          }
        : p;

      const el = document.createElement("div");
      const markerSize = esGrupo ? 48 : esPuntoPropio ? 40 : 32;
      el.className = "point-marker";
      el.style.width = `${markerSize}px`;
      el.style.height = `${markerSize}px`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.cursor = "pointer";
      el.style.zIndex = esGrupo || !esPuntoPropio ? "21" : "20";
      el.title = esGrupo
        ? `${grupo.length} puntos cercanos`
        : p.nombre || "Punto del mapa";
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", el.title);

      pintarPinPorCategorias(
        el,
        puntoVisual,
        esPuntoEnAjuste ? PIN_EN_AJUSTE_COLOR : null
      );

      if (esGrupo) {
        const badge = document.createElement("span");
        badge.textContent = String(grupo.length);
        badge.setAttribute("aria-hidden", "true");
        badge.style.position = "absolute";
        badge.style.top = "-9px";
        badge.style.right = "-10px";
        badge.style.minWidth = "25px";
        badge.style.height = "25px";
        badge.style.padding = "0 6px";
        badge.style.display = "flex";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        badge.style.borderRadius = "999px";
        badge.style.border = "2px solid #FFF8F2";
        badge.style.background = "#E5005A";
        badge.style.color = "#FFFFFF";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "800";
        badge.style.lineHeight = "1";
        badge.style.boxShadow = "0 3px 8px rgba(74, 23, 63, 0.28)";
        badge.style.pointerEvents = "none";
        el.appendChild(badge);
      }

      const abrirPunto = () => {
        if (esGrupo) {
          setPuntosSuperpuestos(puntosDelGrupo);
          return;
        }
        onSelectPunto?.(p);
      };

      el.addEventListener("click", abrirPunto);
      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirPunto();
        }
      });

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);
    });
  }

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const filtroNormalizado = String(filtro || "").trim().toLowerCase();
    const mostrarTodosComercios = filtroNormalizado === CATEGORIA_COMERCIOS;

    const puntosConCoordenadas = puntosRef.current.filter((p) => {
      const puntoLat = Number(p.lat);
      const puntoLon = Number(p.lon);

      return Number.isFinite(puntoLat) && Number.isFinite(puntoLon);
    });

    if (mostrarTodosComercios) {
      const comercios = puntosConCoordenadas.filter((punto) =>
        puntoTieneCategoria(punto, CATEGORIA_COMERCIOS)
      );

      renderMarkers(comercios);

      if (comercios.length > 0 && !comerciosEncuadradosRef.current) {
        const bounds = new mapboxgl.LngLatBounds();

        comercios.forEach((comercio) => {
          bounds.extend([Number(comercio.lon), Number(comercio.lat)]);
        });

        if (comercios.length === 1) {
          mapRef.current.flyTo({
            center: [Number(comercios[0].lon), Number(comercios[0].lat)],
            zoom: 15,
            speed: 1.1,
            essential: true,
          });
        } else {
          mapRef.current.fitBounds(bounds, {
            padding: { top: 150, right: 48, bottom: 130, left: 48 },
            maxZoom: 14,
            duration: 900,
          });
        }

        comerciosEncuadradosRef.current = true;
      }

      if (onListo && !yaNotifique) {
        onListo();
        setYaNotifique(true);
      }
      return;
    }

    comerciosEncuadradosRef.current = false;

    if (!coords) {
      renderMarkers([]);
      return;
    }

    const { lat, lng } = coords;
    const puntosCercanos = puntosConCoordenadas.filter((p) => {
      const puntoLat = Number(p.lat);
      const puntoLon = Number(p.lon);
      return (
        getDistance(lat, lng, puntoLat, puntoLon) <= RADIO_PUNTOS_CERCANOS_KM
      );
    });

    const propiosValidos = puntosPropios.filter((p) => {
      const puntoLat = Number(p.lat);
      const puntoLon = Number(p.lon);

      return Number.isFinite(puntoLat) && Number.isFinite(puntoLon);
    });

    let result = [...puntosCercanos, ...propiosValidos];

    if (filtro) {
      result = result.filter((p) => puntoTieneCategoria(p, filtroNormalizado));
    }

    renderMarkers(result);

    if (onListo && !yaNotifique) {
      onListo();
      setYaNotifique(true);
    }
  }, [
    coords,
    filtro,
    mapReady,
    puntosPropios,
    puntoPropioEditandoId,
    puntosVersion,
    onListo,
    yaNotifique,
  ]);

  useEffect(() => {
    if (!coords || !mapRef.current || !mapReady) return;

    const { lat, lng } = coords;

    if (onCoordsChange) onCoordsChange(coords);

    if (!userMarkerRef.current) {
      const wrap = document.createElement("div");
      wrap.className = "relative flex items-center justify-center";
      wrap.style.width = "32px";
      wrap.style.height = "32px";
      wrap.style.pointerEvents = "none";
      wrap.style.zIndex = "1";

      const aura = document.createElement("div");
      aura.className =
        "absolute w-11 h-11 rounded-full bg-morado/15 animate-[ping_3s_linear_infinite]";
      aura.style.pointerEvents = "none";

      const icon = document.createElement("div");
      icon.style.width = "32px";
      icon.style.height = "32px";
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
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [coords, mapReady, onCoordsChange]);

  useEffect(() => {
    console.log("auto center check", {
      coords,
      mapReady,
      destino,
      rutaActiva,
      puntoEnFoco,
      yaCentro: ubicacionInicialCentradaRef.current,
      hayMapa: !!mapRef.current,
    });

    if (!coords || !mapRef.current || !mapReady) return;
    if (ubicacionInicialCentradaRef.current) return;
    if (destino || rutaActiva || puntoEnFoco) return;

    ubicacionInicialCentradaRef.current = true;

    console.log("centrando mapa en:", coords);

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 15,
      speed: 1.2,
      essential: true,
    });
  }, [coords, mapReady, destino, rutaActiva, puntoEnFoco]);

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
        onPuntoPropioCoordsChange?.(
          {
            lat: next.lat,
            lng: next.lng,
          },
          {
            confirmado: true,
          }
        );
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

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0" />
      <SelectorPuntosSuperpuestos
        puntos={puntosSuperpuestos}
        onClose={() => setPuntosSuperpuestos([])}
        onSelect={(punto) => {
          setPuntosSuperpuestos([]);
          onSelectPunto?.(punto);
        }}
      />
    </>
  );
}