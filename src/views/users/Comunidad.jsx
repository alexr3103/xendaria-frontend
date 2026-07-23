import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, User, UserCheck, UserPlus, Users } from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import BuscadorAdmin from "../../components/BuscadorAdmin.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import EncabezadoVistaUsuario from "../../components/EncabezadoVistaUsuario.jsx";
import PaginacionUsuario from "../../components/PaginacionUsuario.jsx";
import BotonAccionUsuario from "../../components/BotonAccionUsuario.jsx";
import { getFallbackAvatar, resolveAvatarSrc } from "../../lib/avatarOptions.js";

const Motion = motion;
const USUARIOS_POR_PAGINA = 8;

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo completar la solicitud");
  }

  return data;
}

function actualizarUsuario(lista = [], usuarioActualizado) {
  return lista.map((usuario) =>
    usuario._id === usuarioActualizado._id
      ? { ...usuario, ...usuarioActualizado }
      : usuario
  );
}

function getMensajeVacio(tab) {
  if (tab === "siguiendo") return "Todavía no seguís a nadie.";
  if (tab === "seguidores") return "Todavía no tenés seguidores.";
  return "No encontramos perfiles públicos con ese nombre.";
}

export default function Comunidad() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const usuarioLocal = useMemo(getUsuarioLocal, []);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  const [tab, setTab] = useState("explorar");
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [pagina, setPagina] = useState(1);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token || !usuarioLocal?.id) {
      navigate("/login");
    }
  }, [navigate, token, usuarioLocal]);

  const cargarComunidad = useCallback(async () => {
    if (!API || !token) return;

    setLoading(true);
    setMensaje(null);

    try {
      const data = await fetchJSON(`${API}/api/usuarios/comunidad`, { headers });
      setSiguiendo(Array.isArray(data.siguiendo) ? data.siguiendo : []);
      setSeguidores(Array.isArray(data.seguidores) ? data.seguidores : []);
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo cargar tu comunidad.",
      });
    } finally {
      setLoading(false);
    }
  }, [API, headers, token]);

  useEffect(() => {
    cargarComunidad();
  }, [cargarComunidad]);

  useEffect(() => {
    if (!API || !token) return;

    const timeout = setTimeout(async () => {
      setBuscando(true);
      setMensaje(null);

      try {
        const params = new URLSearchParams();
        if (busqueda.trim()) params.set("q", busqueda.trim());
        params.set("limit", "30");

        const data = await fetchJSON(
          `${API}/api/usuarios/comunidad/buscar?${params.toString()}`,
          { headers }
        );
        setResultados(Array.isArray(data) ? data : []);
        setPagina(1);
      } catch (error) {
        setMensaje({
          variant: "error",
          text: error.message || "No se pudo buscar usuarios.",
        });
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [API, busqueda, headers, token]);

  const listaActiva = useMemo(() => {
    if (tab === "siguiendo") return siguiendo;
    if (tab === "seguidores") return seguidores;
    return resultados;
  }, [resultados, seguidores, siguiendo, tab]);

  const listaFiltrada = useMemo(() => {
    if (tab === "explorar" || !busqueda.trim()) return listaActiva;

    const query = busqueda.trim().toLowerCase();
    return listaActiva.filter((usuario) =>
      String(usuario.nombre || "").toLowerCase().includes(query)
    );
  }, [busqueda, listaActiva, tab]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(listaFiltrada.length / USUARIOS_POR_PAGINA)
  );
  const usuariosPagina = useMemo(() => {
    const inicio = (pagina - 1) * USUARIOS_POR_PAGINA;
    return listaFiltrada.slice(inicio, inicio + USUARIOS_POR_PAGINA);
  }, [listaFiltrada, pagina]);
  const inicioPagina = listaFiltrada.length
    ? (pagina - 1) * USUARIOS_POR_PAGINA + 1
    : 0;
  const finPagina = Math.min(pagina * USUARIOS_POR_PAGINA, listaFiltrada.length);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  async function toggleSeguir(usuario) {
    if (!usuario?._id || procesandoId) return;

    setProcesandoId(usuario._id);
    setMensaje(null);

    try {
      const data = await fetchJSON(
        `${API}/api/usuarios/comunidad/${usuario._id}/seguir`,
        {
          method: usuario.loSigo ? "DELETE" : "POST",
          headers,
        }
      );

      const actualizado = data.usuario;
      setResultados((actuales) => actualizarUsuario(actuales, actualizado));
      setSeguidores((actuales) => actualizarUsuario(actuales, actualizado));

      if (actualizado.loSigo) {
        setSiguiendo((actuales) => {
          const existe = actuales.some((item) => item._id === actualizado._id);
          return existe
            ? actualizarUsuario(actuales, actualizado)
            : [actualizado, ...actuales];
        });
      } else {
        setSiguiendo((actuales) =>
          actuales.filter((item) => item._id !== actualizado._id)
        );
      }
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo actualizar tu comunidad.",
      });
    } finally {
      setProcesandoId(null);
    }
  }

  function cambiarTab(nuevaTab) {
    setTab(nuevaTab);
    setPagina(1);
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      {loading ? (
        <CargadorMapa text="Cargando comunidad..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <EncabezadoVistaUsuario
            icon={Users}
            etiqueta="Comunidad"
            titulo="Personas"
            descripcion="Busca perfiles publicos y segui a otros exploradores."
            action={
              <BotonAccionUsuario onClick={() => navigate("/perfil")} icon={User}>
                Ir al perfil
              </BotonAccionUsuario>
            }
          />

          <section className="hidden" aria-hidden="true">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
                  <Users size={21} />
                </span>
                <p className="text-xs font-bold uppercase tracking-wide text-uva/60">
                  Comunidad
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-uva px-4 text-sm font-bold text-white shadow-sm"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            </div>

            <div className="mt-3 max-w-sm sm:max-w-xl">
              <h1 className="font-fredoka text-3xl leading-tight text-morado sm:text-4xl">
                Personas de Xendaria
              </h1>
              <p className="mt-1 text-sm font-semibold leading-snug text-uva/65 sm:text-base">
                Buscá perfiles públicos y seguí a otros exploradores.
              </p>
            </div>
          </section>

          {mensaje && (
            <div className="mt-4">
              <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
            </div>
          )}

          <section className="mt-6">
            <div className="mb-4 overflow-x-auto rounded-2xl bg-white/80 p-1 shadow-sm ring-1 ring-uva/10">
              <div className="flex min-w-max gap-1 sm:grid sm:min-w-0 sm:grid-cols-3">
                <TabComunidad
                  active={tab === "explorar"}
                  label="Explorar"
                  count={resultados.length}
                  onClick={() => cambiarTab("explorar")}
                />
                <TabComunidad
                  active={tab === "siguiendo"}
                  label="Siguiendo"
                  count={siguiendo.length}
                  onClick={() => cambiarTab("siguiendo")}
                />
                <TabComunidad
                  active={tab === "seguidores"}
                  label="Seguidores"
                  count={seguidores.length}
                  onClick={() => cambiarTab("seguidores")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BuscadorAdmin
                value={busqueda}
                onChange={(value) => {
                  setBusqueda(value);
                  setPagina(1);
                }}
                placeholder="Buscar por nombre"
                className="w-full min-w-0 bg-white sm:max-w-md"
              />

              <p className="text-sm font-bold text-uva/65">
                {listaFiltrada.length} perfiles
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-uva/10">
              {buscando && tab === "explorar" ? (
                <p className="px-4 py-8 text-center text-sm font-bold text-uva/65">
                  Buscando usuarios...
                </p>
              ) : listaFiltrada.length > 0 ? (
                <>
                  <div className="divide-y divide-uva/10">
                    {usuariosPagina.map((usuario) => (
                      <UsuarioComunidad
                        key={usuario._id}
                        usuario={usuario}
                        procesando={procesandoId === usuario._id}
                        onToggle={() => toggleSeguir(usuario)}
                        onOpen={() => navigate(`/perfil/${usuario._id}`)}
                      />
                    ))}
                  </div>
                  <PaginacionUsuario
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    inicio={inicioPagina}
                    fin={finPagina}
                    total={listaFiltrada.length}
                    onPrev={() => setPagina((actual) => Math.max(1, actual - 1))}
                    onNext={() =>
                      setPagina((actual) => Math.min(totalPaginas, actual + 1))
                    }
                  />
                </>
              ) : (
                <p className="px-4 py-8 text-center text-sm font-bold text-uva/65">
                  {getMensajeVacio(tab)}
                </p>
              )}
            </div>
          </section>
        </main>
      )}

      <Navbar active="perfil" />
    </div>
  );
}

function UsuarioComunidad({ usuario, procesando, onToggle, onOpen }) {
  return (
    <article className="flex items-center gap-3 px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar usuario={usuario} />
        <span className="min-w-0 flex-1">
          <NombreDesplazable>{usuario.nombre || "Usuario"}</NombreDesplazable>
          <span className="mt-0.5 block truncate text-xs font-semibold text-uva/60">
            {usuario.descripcion || "Perfil público"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        disabled={procesando}
        className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition disabled:opacity-60 ${
          usuario.loSigo
            ? "bg-menta/35 text-uva ring-1 ring-menta"
            : "bg-morado text-white shadow-md"
        }`}
      >
        {usuario.loSigo ? <UserCheck size={16} /> : <UserPlus size={16} />}
        <span>{usuario.loSigo ? "Siguiendo" : "Seguir"}</span>
      </button>
    </article>
  );
}

function NombreDesplazable({ children }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [overflow, setOverflow] = useState(false);
  const [distance, setDistance] = useState(0);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    function medir() {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) return;

      const nextDistance = Math.max(0, text.scrollWidth - container.clientWidth);
      setDistance(nextDistance);
      setOverflow(nextDistance > 8);
    }

    medir();
    window.addEventListener("resize", medir);

    return () => window.removeEventListener("resize", medir);
  }, [children]);

  useEffect(() => {
    return () => clearTimeout(interactionTimeoutRef.current);
  }, []);

  function pausarPorInteraccion() {
    clearTimeout(interactionTimeoutRef.current);
    setInteracting(true);
    interactionTimeoutRef.current = setTimeout(() => {
      setInteracting(false);
    }, 2500);
  }

  return (
    <span
      ref={containerRef}
      onPointerDown={pausarPorInteraccion}
      onScroll={pausarPorInteraccion}
      className="block overflow-x-auto overflow-y-hidden font-fredoka text-lg leading-tight text-uva [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      title={typeof children === "string" ? children : undefined}
    >
      {overflow && !shouldReduceMotion ? (
        <Motion.span
          ref={textRef}
          className="inline-block whitespace-nowrap pr-8"
          animate={interacting ? { x: 0 } : { x: [0, -distance] }}
          transition={{
            duration: Math.max(26, distance / 2.5),
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 4.5,
          }}
        >
          {children}
        </Motion.span>
      ) : (
        <span ref={textRef} className="block truncate">
          {children}
        </span>
      )}
    </span>
  );
}

function TabComunidad({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[112px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:min-w-0 sm:text-sm ${
        active
          ? "bg-morado text-crema shadow"
          : "text-uva/75"
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className="shrink-0 text-[11px] sm:text-xs">{count}</span>
    </button>
  );
}

function PaginacionComunidad({
  pagina,
  totalPaginas,
  inicio,
  fin,
  total,
  onPrev,
  onNext,
}) {
  const prevDisabled = pagina <= 1;
  const nextDisabled = pagina >= totalPaginas;
  const disabledClass =
    "!bg-grisaceo !text-gris/55 !shadow-none !ring-grisaceo cursor-not-allowed";

  return (
    <div className="flex flex-col gap-3 border-t border-uva/10 bg-crema/40 px-4 py-3 text-sm font-bold text-uva/65 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wide">
        {inicio}-{fin} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          className={`rounded-full bg-morado/10 px-3 py-1.5 text-xs font-extrabold text-morado ring-1 ring-morado/15 transition outline-none focus-visible:ring-2 focus-visible:ring-morado/30 ${
            prevDisabled ? disabledClass : ""
          }`}
        >
          Anterior
        </button>
        <span className="px-1 text-xs font-extrabold uppercase tracking-wide text-uva/55">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`rounded-full bg-morado px-3 py-1.5 text-xs font-extrabold text-white shadow-sm ring-1 ring-morado transition outline-none focus-visible:ring-2 focus-visible:ring-morado/30 ${
            nextDisabled ? disabledClass : ""
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function Avatar({ usuario }) {
  return (
    <img
      src={resolveAvatarSrc(usuario.foto)}
      alt={`Avatar de ${usuario.nombre || "usuario"}`}
      onError={(event) => {
        event.currentTarget.src = getFallbackAvatar();
      }}
      className="h-12 w-12 shrink-0 rounded-full border-2 border-crema object-cover"
    />
  );
}
