import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, Lock, User } from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import EncabezadoVistaUsuario from "../../components/EncabezadoVistaUsuario.jsx";
import PaginacionUsuario from "../../components/PaginacionUsuario.jsx";
import BotonAccionUsuario from "../../components/BotonAccionUsuario.jsx";
import cargafail from "../../assets/cargafail.png";

const Motion = motion;
const INSIGNIAS_POR_PAGINA = 6;

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function getIdUsuarioActual(usuario) {
  return usuario?.id || usuario?._id || "";
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "No se pudo completar la solicitud");
    error.status = response.status;
    throw error;
  }

  return data;
}

function formatFecha(fecha) {
  if (!fecha) return "";

  try {
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getMotionProps(shouldReduceMotion, index = 0) {
  if (shouldReduceMotion) return {};

  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.24, delay: index * 0.035, ease: "easeOut" },
  };
}

export default function AlbumInsignias() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const usuarioLocal = useMemo(getUsuarioLocal, []);
  const idUsuario = id || getIdUsuarioActual(usuarioLocal);
  const esPerfilPropio = !id || String(id) === String(getIdUsuarioActual(usuarioLocal));

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [detalleAbiertoId, setDetalleAbiertoId] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token || !idUsuario) {
      navigate("/login");
    }
  }, [idUsuario, navigate, token]);

  useEffect(() => {
    let activo = true;

    async function cargarAlbum() {
      if (!API || !token || !idUsuario) return;

      setLoading(true);
      setMensaje(null);

      try {
        const data = await fetchJSON(
          `${API}/api/usuarios/${idUsuario}/album-insignias`,
          { headers }
        );

        if (!activo) return;
        setAlbum(data);
      } catch (error) {
        if (!activo) return;
        if (error.status === 404) {
          navigate("/404", { replace: true });
          return;
        }
        setMensaje({
          variant: "error",
          text: error.message || "No se pudo cargar el album de insignias.",
        });
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargarAlbum();

    return () => {
      activo = false;
    };
  }, [API, headers, idUsuario, navigate, token]);

  const insignias = Array.isArray(album?.insignias) ? album.insignias : [];
  const desbloqueadas = album?.desbloqueadas || 0;
  const total = album?.total || 0;
  const porcentaje = total ? Math.round((desbloqueadas / total) * 100) : 0;
  const totalPaginas = Math.max(
    1,
    Math.ceil(insignias.length / INSIGNIAS_POR_PAGINA)
  );
  const inicioPagina = insignias.length
    ? (pagina - 1) * INSIGNIAS_POR_PAGINA + 1
    : 0;
  const finPagina = Math.min(
    pagina * INSIGNIAS_POR_PAGINA,
    insignias.length
  );
  const insigniasPagina = insignias.slice(
    (pagina - 1) * INSIGNIAS_POR_PAGINA,
    pagina * INSIGNIAS_POR_PAGINA
  );

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      {loading ? (
        <CargadorMapa text="Cargando album..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <EncabezadoVistaUsuario
            icon={BookOpen}
            etiqueta="Insignias"
            titulo="Album"
            descripcion="Visita lugares y desbloquea sus insignias."
            action={
              <BotonAccionUsuario
                onClick={() => navigate(esPerfilPropio ? "/perfil" : `/perfil/${id}`)}
                icon={User}
              >
                Ir al perfil
              </BotonAccionUsuario>
            }
          />

          {mensaje && (
            <div className="mt-4">
              <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
            </div>
          )}

          <Motion.section
            {...getMotionProps(shouldReduceMotion)}
            className="mt-5 px-1"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-uva/55">
                  Progreso del album
                </p>
                <h2 className="mt-1 font-fredoka text-2xl leading-tight text-morado">
                  {desbloqueadas} de {total} insignias ganadas
                </h2>
              </div>

              <p className="text-sm font-extrabold text-uva/65">
                {porcentaje}% completado
              </p>
            </div>

            <div className="mt-3">
              <div className="relative h-7 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-uva/10">
                <Motion.div
                  className="h-full rounded-full bg-menta"
                  initial={shouldReduceMotion ? false : { width: 0 }}
                  animate={{ width: `${porcentaje}%` }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-uva">
                  {porcentaje}% de avance
                </span>
              </div>
            </div>
          </Motion.section>

          <section className="mt-5">
            {insignias.length === 0 ? (
              <p className="rounded-3xl bg-white px-4 py-8 text-center text-sm font-bold text-uva/65 shadow-sm ring-1 ring-uva/10">
                Todavia no hay insignias cargadas.
              </p>
            ) : (
              <Motion.div
                {...getMotionProps(shouldReduceMotion, 1)}
                className="mx-auto max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-uva/10"
              >
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 py-4 sm:px-6">
                  {insigniasPagina.map((insignia, index) => (
                    <InsigniaCard
                      key={insignia.idPunto}
                      insignia={insignia}
                      index={index}
                      shouldReduceMotion={shouldReduceMotion}
                      abierto={detalleAbiertoId === insignia.idPunto}
                      onToggle={() =>
                        setDetalleAbiertoId((actual) =>
                          actual === insignia.idPunto ? null : insignia.idPunto
                        )
                      }
                    />
                  ))}
                </div>

                {insignias.length > INSIGNIAS_POR_PAGINA && (
                  <PaginacionUsuario
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    inicio={inicioPagina}
                    fin={finPagina}
                    total={insignias.length}
                    onPrev={() => {
                      setDetalleAbiertoId(null);
                      setPagina((actual) => Math.max(1, actual - 1));
                    }}
                    onNext={() => {
                      setDetalleAbiertoId(null);
                      setPagina((actual) =>
                        Math.min(totalPaginas, actual + 1)
                      );
                    }}
                  />
                )}
              </Motion.div>
            )}
          </section>
        </main>
      )}

      <Navbar />
    </div>
  );
}

function InsigniaCard({
  insignia,
  index,
  shouldReduceMotion,
  abierto,
  onToggle,
}) {
  const desbloqueada = Boolean(insignia.desbloqueada);
  const fecha = formatFecha(insignia.fechaObtencion);

  return (
    <Motion.article
      {...getMotionProps(shouldReduceMotion, index)}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`relative flex min-h-[150px] cursor-pointer flex-col items-center rounded-[22px] px-2 py-2 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-morado/30 ${
        abierto ? "bg-crema/70" : ""
      }`}
      aria-label={`${insignia.nombre || "Insignia"} - ${
        desbloqueada ? "ganada" : "bloqueada"
      }`}
    >
      <div className="relative">
        <div
          className={`h-16 w-16 rounded-full p-1 shadow-sm sm:h-20 sm:w-20 ${
            desbloqueada ? "bg-rosa" : "bg-grisaceo"
          }`}
        >
          <img
            src={insignia.imagen || cargafail}
            alt={insignia.nombre || "Insignia"}
            onError={(event) => {
              event.currentTarget.src = cargafail;
            }}
            className={`h-full w-full rounded-full object-cover ring-[3px] ring-white ${
              desbloqueada
                ? ""
                : "grayscale blur-[1px] opacity-55 [image-rendering:pixelated]"
            }`}
          />
        </div>

        {!desbloqueada && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-uva/20">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-uva text-white shadow-md">
              <Lock size={16} />
            </span>
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 font-fredoka text-sm leading-tight text-morado sm:text-base">
        {insignia.nombre || "Punto sin nombre"}
      </p>

      {abierto && (
        <div className="mt-2 space-y-1 text-[10px] font-bold leading-snug text-uva/65 sm:text-xs">
          <p>{insignia.direccion || "Direccion no cargada"}</p>
          {desbloqueada && fecha && <p>Ganada el {fecha}</p>}
        </div>
      )}
    </Motion.article>
  );
}
