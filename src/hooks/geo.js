import { useEffect, useRef, useState } from "react";
import { normalizarConfiguracionUsuario } from "../lib/configuracionUsuario.js";

function permiteUbicacionLocal() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    return normalizarConfiguracionUsuario(usuario?.configuracion).permitirUbicacion !== false;
  } catch {
    return true;
  }
}

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(la1) * Math.cos(la2) *
    sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function useGeolocation(options = {}) {
  const {
    distanceThresholdMeters = 75,   
    minIntervalMs = 3000,          
    ...navOpts
  } = options;

  const [coords, setCoords] = useState(null);
  const [permiteUbicacion, setPermiteUbicacion] = useState(permiteUbicacionLocal);
  const lastCoordsRef = useRef(null);
  const lastAcceptTsRef = useRef(0);

  useEffect(() => {
    const sincronizarPreferencia = () => {
      setPermiteUbicacion(permiteUbicacionLocal());
    };

    window.addEventListener("storage", sincronizarPreferencia);
    window.addEventListener("xendaria:configuracion-actualizada", sincronizarPreferencia);

    return () => {
      window.removeEventListener("storage", sincronizarPreferencia);
      window.removeEventListener("xendaria:configuracion-actualizada", sincronizarPreferencia);
    };
  }, []);

  useEffect(() => {
    if (!permiteUbicacion) {
      lastCoordsRef.current = null;
      lastAcceptTsRef.current = 0;
      setCoords(null);
      return;
    }

    if (!("geolocation" in navigator)) {
      return;
    }

    const opts = {
      enableHighAccuracy: true,   // usa el GPS real del móvil
      maximumAge: 0,              
      timeout: 8000,              
      ...navOpts,
    };

    const onSuccess = (p) => {
      const current = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
      };

      const now = Date.now();
      const last = lastCoordsRef.current;

      //aceptar la PRIMERA lectura SIEMPRE
      if (!last) {
        lastCoordsRef.current = current;
        lastAcceptTsRef.current = now;
        setCoords(current);
        return;
      }

      //evitar spam
      if (now - lastAcceptTsRef.current < minIntervalMs) return;

      //actualizar si se movió más de media cuadra
      const d = distanceMeters(last, current);

      if (d < distanceThresholdMeters) {
        return;
      }

      lastCoordsRef.current = current;
      lastAcceptTsRef.current = now;
      setCoords(current);
    };

    const onError = () => {};

    const id = navigator.geolocation.watchPosition(onSuccess, onError, opts);
    return () => navigator.geolocation.clearWatch(id);
  }, [distanceThresholdMeters, minIntervalMs, permiteUbicacion]);

  return { coords };
}
