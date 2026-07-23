import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useGeolocation from "../hooks/geo.js";
import VistaDetallePuntoUsuario from "./VistaDetallePuntoUsuario.jsx";

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export default function PuntoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [punto, setPunto] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [animarFavorito, setAnimarFavorito] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [resumenCalificacion, setResumenCalificacion] = useState(null);
  const [miCalificacion, setMiCalificacion] = useState(null);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [mensajeCalificacion, setMensajeCalificacion] = useState(null);

  const user = useMemo(getUsuarioLocal, []);
  const idUsuario = user?.id;
  const token = localStorage.getItem("token");
  const { coords } = useGeolocation({
    distanceThresholdMeters: 25,
    minIntervalMs: 2000,
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 12000,
  });

  useEffect(() => {
    fetch(`${API}/api/puntos/${id}`)
      .then((res) => {
        if (res.status === 404) {
          navigate("/404", { replace: true });
          return null;
        }

        if (!res.ok) {
          throw new Error("No se pudo cargar el punto");
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (!data || data.error) {
          navigate("/404", { replace: true });
          return;
        }

        setPunto(data);
        setEsFavorito(Boolean(user?.lugares_favoritos?.includes(data._id)));
      })
      .catch(() => navigate("/404"));
  }, [id, API, navigate, user?.lugares_favoritos]);

  useEffect(() => {
    let activo = true;

    async function cargarCalificaciones() {
      try {
        const resumenRes = await fetch(
          `${API}/api/calificaciones/puntos/${id}/resumen`
        );
        const resumenData = await resumenRes.json();

        if (activo && resumenRes.ok) {
          setResumenCalificacion(resumenData);
        }

        if (!token) return;

        const miaRes = await fetch(`${API}/api/calificaciones/puntos/${id}/mia`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const miaData = await miaRes.json();

        if (activo && miaRes.ok) {
          setMiCalificacion(miaData.calificacion || null);
        }
      } catch {
        if (activo) setResumenCalificacion(null);
      }
    }

    cargarCalificaciones();

    return () => {
      activo = false;
    };
  }, [API, id, token]);

  async function toggleFavorito() {
    if (!idUsuario) {
      alert("Tenés que iniciar sesión para guardar favoritos.");
      return;
    }

    setLoadingFav(true);

    try {
      const idPunto = punto._id;
      const url = `${API}/api/usuarios/${idUsuario}/favorito`;
      const res = esFavorito
        ? await fetch(`${url}/${idPunto}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
        : await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ idPunto }),
          });

      const data = await res.json();
      if (!res.ok) {
        console.error("Error en favoritos:", data);
        return;
      }

      const nuevoValor = !esFavorito;
      setEsFavorito(nuevoValor);
      if (nuevoValor) {
        setAnimarFavorito(true);
        setTimeout(() => setAnimarFavorito(false), 600);
      }

      const updatedUser = {
        ...user,
        lugares_favoritos: nuevoValor
          ? [...(user.lugares_favoritos || []), idPunto]
          : (user.lugares_favoritos || []).filter(
              (favoritoId) => favoritoId !== idPunto
            ),
      };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFav(false);
    }
  }

  async function calificarPunto(estrellas) {
    if (!idUsuario || !token) {
      setMensajeCalificacion({
        variant: "error",
        text: "Tenés que iniciar sesión para calificar.",
      });
      return;
    }

    if (!coords) {
      setMensajeCalificacion({
        variant: "error",
        text: "Necesitamos tu ubicación actual para confirmar que estás en el punto.",
      });
      return;
    }

    setGuardandoCalificacion(true);
    setMensajeCalificacion(null);

    try {
      const res = await fetch(`${API}/api/calificaciones/puntos/${punto._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estrellas,
          lat: coords.lat,
          lng: coords.lng,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar la calificación.");
      }

      setMiCalificacion(data.calificacion);
      setResumenCalificacion(data.resumen);
      setMensajeCalificacion({
        variant: "success",
        text: "Calificación guardada.",
      });
    } catch (error) {
      setMensajeCalificacion({
        variant: "error",
        text: error.message || "No se pudo guardar la calificación.",
      });
    } finally {
      setGuardandoCalificacion(false);
    }
  }

  if (!punto) return null;

  return (
    <VistaDetallePuntoUsuario
      punto={punto}
      esFavorito={esFavorito}
      animarFavorito={animarFavorito}
      loadingFav={loadingFav}
      resumenCalificacion={resumenCalificacion}
      miCalificacion={miCalificacion}
      guardandoCalificacion={guardandoCalificacion}
      mensajeCalificacion={mensajeCalificacion}
      onToggleFavorito={toggleFavorito}
      onClose={() => navigate("/home", { state: { recenterUser: Date.now() } })}
      onCalificar={calificarPunto}
    />
  );
}
