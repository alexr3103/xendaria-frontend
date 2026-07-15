import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Loader2, MapPin, Heart, Star } from "lucide-react";

import cargafail from "../assets/cargafail.png";
import { categorias } from "./CategoriasFiltros";
import BotonCerrar from "./BotonCerrar";
import MultimediaPunto from "./MultimediaPunto";
import HistoriasPunto from "./HistoriasPunto";
import Alert from "./Alertas";
import useGeolocation from "../hooks/geo.js";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
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
  const { coords } = useGeolocation({
    distanceThresholdMeters: 25,
    minIntervalMs: 2000,
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 12000,
  });

  // Usuario logueado
  const user = JSON.parse(localStorage.getItem("usuario"));
  const idUsuario = user?.id;
  const token = localStorage.getItem("token");

  // Detectar favorito
  useEffect(() => {
    fetch(`${API}/api/puntos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          navigate("/404");
        } else {
          setPunto(data);
          if (user?.lugares_favoritos?.includes(data._id)) {
            setEsFavorito(true);
          }
        }
      })
      .catch(() => navigate("/404"));
  }, [id, API, navigate]);

  useEffect(() => {
    let activo = true;

    async function cargarCalificaciones() {
      try {
        const resumenRes = await fetch(`${API}/api/calificaciones/puntos/${id}/resumen`);
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

  if (!punto) return null;
  const {
    nombre,
    foto,
    descripcion_completa,
    direccion,
    insignia,
    _id: idPunto,
  } = punto;

  const categoriasPunto = getCategoriasPunto(punto).filter((categoria) => categorias[categoria]);

//manejar favorito
  async function toggleFavorito() {
    if (!idUsuario) return alert("Tenés que iniciar sesión para guardar favoritos.");

    setLoadingFav(true);

    try {
      let url = `${API}/api/usuarios/${idUsuario}/favorito`;

      let res;

      if (!esFavorito) {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ idPunto }),
        });
      } else {
        res = await fetch(`${url}/${idPunto}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      const data = await res.json();
      if (res.ok) {
        const nuevoValor = !esFavorito;
        setEsFavorito(nuevoValor);
        if (nuevoValor) {
          setAnimarFavorito(true);
          setTimeout(() => setAnimarFavorito(false), 600);
        }
        // actualizar usuario localStorage
        const updatedUser = {
          ...user,
          lugares_favoritos: nuevoValor
            ? [...(user.lugares_favoritos || []), idPunto]
            : (user.lugares_favoritos || []).filter((id) => id !== idPunto),
        };
        localStorage.setItem("usuario", JSON.stringify(updatedUser));
      } else {
        console.error("Error en favoritos:", data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFav(false);
    }
  }

  async function calificarPunto(estrellas) {
    if (!idUsuario || !token) {
      setMensajeCalificacion({
        variant: "error",
        text: "Tenes que iniciar sesion para calificar.",
      });
      return;
    }

    if (!coords) {
      setMensajeCalificacion({
        variant: "error",
        text: "Necesitamos tu ubicacion actual para confirmar que estas en el punto.",
      });
      return;
    }

    setGuardandoCalificacion(true);
    setMensajeCalificacion(null);

    try {
      const res = await fetch(`${API}/api/calificaciones/puntos/${idPunto}`, {
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
        throw new Error(data.message || "No se pudo guardar la calificacion.");
      }

      setMiCalificacion(data.calificacion);
      setResumenCalificacion(data.resumen);
      setMensajeCalificacion({
        variant: "success",
        text: "Calificacion guardada.",
      });
    } catch (error) {
      setMensajeCalificacion({
        variant: "error",
        text: error.message || "No se pudo guardar la calificacion.",
      });
    } finally {
      setGuardandoCalificacion(false);
    }
  }

  // ==========================
// RENDER PRINCIPAL DEL PUNTO
// ==========================
return (
  <div className="w-full min-h-screen bg-crema pb-24">

    <div className="relative w-full h-[260px] sm:h-[320px] rounded-b-[40px] overflow-hidden">

      <div className="absolute top-5 left-0 right-0 z-[999] px-5 flex justify-between items-center">

    <button
      disabled={loadingFav}
      onClick={toggleFavorito}
      className={`
        w-[44px] h-[44px] flex items-center justify-center
        rounded-2xl shadow-lg
        ${esFavorito ? "bg-rosa text-fucsia" : "bg-crema text-fucsia"}
        active:scale-95 transition relative
      `}
    >
      <Heart
        size={22}
        stroke="#F0288E"
        fill={esFavorito ? "#F0288E" : "none"}
        className={`transition-all duration-300 ${esFavorito ? "scale-110" : "scale-100"}`}
      />
      {animarFavorito && (
        <span className="absolute inset-0 rounded-2xl animate-ping bg-fucsia/40 pointer-events-none"></span>
      )}
    </button>
    <BotonCerrar
      onClick={() =>
        navigate("/home", { state: { recenterUser: Date.now() } })
      }
    />
  </div>
      <img
        src={foto || cargafail}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = cargafail;
        }}
        alt={nombre}
        className="w-full h-full object-cover"
      />
      <h1 className="absolute bottom-6 left-6 z-[50] text-crema font-fredoka text-3xl sm:text-4xl drop-shadow-md max-w-[80%]">
        {nombre}
      </h1>
      <div className="absolute bottom-6 right-6 z-[50] flex max-w-[48%] flex-wrap justify-end gap-2">
        {categoriasPunto.map((categoriaKey) => {
          const categoriaInfo = categorias[categoriaKey];
          const Icon = categoriaInfo.icon;

          return (
            <span
              key={categoriaKey}
              style={{ backgroundColor: categoriaInfo.color }}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-gris shadow-md sm:text-sm"
            >
              {Icon && <Icon size={18} className="text-gris" />}
              {categoriaInfo.label}
            </span>
          );
        })}
      </div>
    </div>
    <div className="px-6 mt-6">
      <div className="flex items-center gap-3 text-fucsia mb-6">
        <MapPin size={26} />
        <span className="font-bold text-[15px] leading-tight">{direccion}</span>
      </div>
      <div className="bg-menta/80 p-5 rounded-3xl shadow mb-10">
        <h2 className="font-fredoka text-uva text-xl mb-2">Historia</h2>
        <p className="text-gris text-[15px] leading-relaxed">
          {descripcion_completa}
        </p>
      </div>
      <HistoriasPunto historias={punto.historias || []} />
      <section className="bg-white p-5 rounded-3xl shadow mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-fredoka text-uva text-xl">Tu calificacion</h2>
            <p className="mt-1 text-sm text-gris">
              Solo podes calificar si estas en el lugar.
            </p>
          </div>
          <div className="text-right">
            <p className="font-fredoka text-2xl text-fucsia">
              {resumenCalificacion?.promedioEstrellas || 0}
            </p>
            <p className="text-[11px] font-bold text-uva">
              {resumenCalificacion?.totalCalificaciones || 0} votos
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((estrella) => {
            const activa = estrella <= (miCalificacion?.estrellas || 0);

            return (
              <button
                key={estrella}
                type="button"
                onClick={() => calificarPunto(estrella)}
                disabled={guardandoCalificacion}
                className="p-1 text-fucsia transition active:scale-95 disabled:opacity-60"
                aria-label={`Calificar con ${estrella} estrellas`}
              >
                <Star
                  size={32}
                  fill={activa ? "#F0288E" : "none"}
                  strokeWidth={2.2}
                />
              </button>
            );
          })}
          {guardandoCalificacion && (
            <Loader2 size={20} className="ml-2 animate-spin text-morado" />
          )}
        </div>

        {miCalificacion && (
          <p className="mt-2 text-sm font-bold text-uva">
            Tu puntuacion: {miCalificacion.estrellas} de 5
          </p>
        )}

        {mensajeCalificacion && (
          <div className="mt-3">
            <Alert variant={mensajeCalificacion.variant}>
              {mensajeCalificacion.text}
            </Alert>
          </div>
        )}
      </section>

      {insignia && (
        <div className="w-full bg-morado/30 p-6 rounded-3xl shadow mb-10 flex flex-col items-center">
          <span className="font-fredoka text-uva text-lg mb-3">Insignia</span>
          <img
            src={insignia}
            alt="Insignia"
            className="w-[160px] h-[160px] rounded-full object-cover shadow-xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = cargafail;
            }}
          />
        </div>
      )}
      <MultimediaPunto punto={punto} />

    </div>
  </div>
);
}
