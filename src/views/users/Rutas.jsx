import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  LocateFixed,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Share2,
  X,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import MapaLoader from "../../components/MapaLoader.jsx";
import useGeolocation from "../../hooks/geo.js";
import xendariaMapStyle from "../../map/xendariaMapStyle.js";
import cargafail from "../../assets/cargafail.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const CATEGORIAS_RUTAS_LABELS = {
  imperdibles: "Imperdibles",
  historia_patrimonio: "Historia y patrimonio",
  arte_cultura: "Arte y cultura",
  curiosidades_leyendas: "Curiosidades y leyendas",
  verde_aire_libre: "Verde y aire libre",
  sabores_comercios: "Sabores y comercios",
};

const CATEGORIAS_RUTAS_STYLE = {
  imperdibles: "bg-rosa/30 text-fucsia border-rosa/40",
  historia_patrimonio: "bg-grisaceo/45 text-uva border-grisaceo",
  arte_cultura: "bg-celeste/35 text-uva border-celeste/60",
  curiosidades_leyendas: "bg-lila/30 text-uva border-lila/60",
  verde_aire_libre: "bg-menta/25 text-uva border-menta/50",
  sabores_comercios: "bg-vainilla/60 text-uva border-vainilla",
};

function getToken() {
  return localStorage.getItem("token");
}

function getId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  if (valor.$oid) return valor.$oid;
  if (valor._id?.$oid) return valor._id.$oid;
  return String(valor._id || valor.id || valor);
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo completar la solicitud");
  }

  return data;
}

function getCoordsPunto(punto) {
  const lat = Number(punto?.lat);
  const lon = Number(punto?.lon);

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }

  const coordinates = punto?.ubicacion?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    return {
      lat: Number(coordinates[1]),
      lon: Number(coordinates[0]),
    };
  }

  return null;
}

function distanciaKm(origen, destino) {
  if (!origen || !destino) return Infinity;

  const lat1 = Number(origen.lat);
  const lon1 = Number(origen.lng ?? origen.lon);
  const lat2 = Number(destino.lat);
  const lon2 = Number(destino.lng ?? destino.lon);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;

  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function ordenarPuntosSugeridos(puntos = [], coordsUsuario) {
  const pendientes = puntos.filter((punto) => getCoordsPunto(punto));
  if (!coordsUsuario || pendientes.length <= 1) return pendientes;

  const ordenados = [];
  let cursor = { lat: coordsUsuario.lat, lng: coordsUsuario.lng };

  while (pendientes.length > 0) {
    let indiceCercano = 0;
    let distanciaCercana = Infinity;

    pendientes.forEach((punto, index) => {
      const puntoCoords = getCoordsPunto(punto);
      const distancia = distanciaKm(cursor, puntoCoords);

      if (distancia < distanciaCercana) {
        distanciaCercana = distancia;
        indiceCercano = index;
      }
    });

    const [siguiente] = pendientes.splice(indiceCercano, 1);
    ordenados.push(siguiente);
    const siguienteCoords = getCoordsPunto(siguiente);
    cursor = { lat: siguienteCoords.lat, lng: siguienteCoords.lon };
  }

  return ordenados;
}

function getPuntosModo(ruta, modo, coordsUsuario) {
  const ordenados = ordenarPuntosSugeridos(ruta?.puntos || [], coordsUsuario);

  if (modo === "larga") return ordenados;
  return ordenados.slice(0, Math.min(3, ordenados.length));
}

function getDistanciaRutaACoords(ruta, coordsUsuario) {
  if (!coordsUsuario) return Infinity;

  const distancias = (ruta.puntos || [])
    .map((punto) => getCoordsPunto(punto))
    .filter(Boolean)
    .map((coords) => distanciaKm(coordsUsuario, coords));

  return distancias.length ? Math.min(...distancias) : Infinity;
}

function formatDistancia(km) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function Rutas() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token = getToken();
  const { coords } = useGeolocation({
    distanceThresholdMeters: 40,
    minIntervalMs: 4000,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 20000,
  });

  const [rutas, setRutas] = useState([]);
  const [categorias, setCategorias] = useState(Object.keys(CATEGORIAS_RUTAS_LABELS));
  const [tabActiva, setTabActiva] = useState("disponibles");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [ordenCercania, setOrdenCercania] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [modoSeleccionado, setModoSeleccionado] = useState("corta");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const cargarRutas = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!API || !token) return;

      if (silencioso) setRefreshing(true);
      else setLoading(true);
      setMensaje(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [rutasData, categoriasData] = await Promise.all([
          fetchJSON(`${API}/api/rutas/con-estado`, { headers }),
          fetchJSON(`${API}/api/rutas/categorias`),
        ]);

        setRutas(Array.isArray(rutasData) ? rutasData : []);
        if (Array.isArray(categoriasData.categorias)) {
          setCategorias(categoriasData.categorias);
        }
      } catch (error) {
        setMensaje({
          variant: "error",
          text: error.message || "No se pudieron cargar las rutas.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API, token]
  );

  useEffect(() => {
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    if (!rutaSeleccionada) return;

    const progreso = rutaSeleccionada.estadoUsuario?.progreso;
    const puedeLarga = (rutaSeleccionada.puntos || []).length > 3;

    if (progreso?.modo) {
      setModoSeleccionado(progreso.modo);
      return;
    }

    setModoSeleccionado(puedeLarga ? "corta" : "corta");
  }, [rutaSeleccionada]);

  const rutasFiltradas = useMemo(() => {
    let lista = [...rutas];

    lista = lista.filter((ruta) => {
      const estado = ruta.estadoUsuario || {};
      const realizada = Boolean(estado.realizadaVersionActual);
      const pausada = Boolean(estado.pausada && !realizada);

      if (tabActiva === "pausadas") return pausada;
      if (tabActiva === "terminadas") return realizada;
      return !pausada;
    });

    if (categoriaActiva !== "todas") {
      lista = lista.filter((ruta) => ruta.categoria === categoriaActiva);
    }

    if (ordenCercania && coords) {
      lista.sort(
        (a, b) => getDistanciaRutaACoords(a, coords) - getDistanciaRutaACoords(b, coords)
      );
    }

    return lista;
  }, [categoriaActiva, coords, ordenCercania, rutas, tabActiva]);

  const conteosTabs = useMemo(
    () =>
      rutas.reduce(
        (acc, ruta) => {
          const estado = ruta.estadoUsuario || {};
          const realizada = Boolean(estado.realizadaVersionActual);
          const pausada = Boolean(estado.pausada && !realizada);

          if (realizada) acc.terminadas += 1;
          if (pausada) acc.pausadas += 1;
          else acc.disponibles += 1;

          return acc;
        },
        { disponibles: 0, pausadas: 0, terminadas: 0 }
      ),
    [rutas]
  );

  const puntosSeleccionados = useMemo(
    () => getPuntosModo(rutaSeleccionada, modoSeleccionado, coords),
    [coords, modoSeleccionado, rutaSeleccionada]
  );

  const progresoSeleccionado = rutaSeleccionada?.estadoUsuario?.progreso || null;
  const rutaSeleccionadaRealizada =
    rutaSeleccionada?.estadoUsuario?.realizadaVersionActual;
  const rutaSeleccionadaPausada = rutaSeleccionada?.estadoUsuario?.pausada;
  const rutaSeleccionadaActualizada = rutaSeleccionada?.estadoUsuario?.actualizada;

  const guardarProgreso = useCallback(
    async (ruta, modo, puntosCompletados, estado = "pausada") => {
      if (!token) {
        navigate("/login");
        return null;
      }

      return fetchJSON(`${API}/api/rutas/${ruta._id}/progreso`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modo,
          puntosCompletados,
          estado,
        }),
      });
    },
    [API, navigate, token]
  );

  async function empezarRuta({ retomar = false } = {}) {
    if (!rutaSeleccionada) return;

    const progreso = rutaSeleccionada.estadoUsuario?.progreso;
    const idsGuardados =
      retomar && progreso?.modo === modoSeleccionado
        ? progreso.puntosCompletados || []
        : [];

    setGuardandoProgreso(true);
    setMensaje(null);

    try {
      await guardarProgreso(
        rutaSeleccionada,
        modoSeleccionado,
        idsGuardados,
        "en_progreso"
      );
      navigate("/home", {
        state: {
          rutaActiva: {
            ruta: rutaSeleccionada,
            modo: modoSeleccionado,
            puntosBase: getPuntosModo(rutaSeleccionada, modoSeleccionado, coords),
            completados: idsGuardados,
            retomando: retomar,
          },
        },
      });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo iniciar la ruta.",
      });
    } finally {
      setGuardandoProgreso(false);
    }
  }

  async function descartarProgreso() {
    if (!rutaSeleccionada) return;

    setGuardandoProgreso(true);
    setMensaje(null);

    try {
      await fetchJSON(
        `${API}/api/rutas/${rutaSeleccionada._id}/progreso?modo=${modoSeleccionado}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMensaje({ variant: "success", text: "Progreso descartado." });
      setRutaSeleccionada(null);
      await cargarRutas({ silencioso: true });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo descartar el progreso.",
      });
    } finally {
      setGuardandoProgreso(false);
    }
  }


  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      {loading ? (
        <MapaLoader text="Cargando rutas..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
          <section className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-morado/12 text-morado shadow-sm ring-1 ring-morado/10">
                <Share2 size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-uva/60">
                  Rutas recomendadas
                </p>
                <h1 className="truncate font-fredoka text-3xl leading-tight text-morado sm:text-4xl">
                  Recorridos
                </h1>
                <p className="mt-1 max-w-[260px] text-xs leading-snug text-uva/70 sm:max-w-xl sm:text-sm">
                  Mira el recorrido completo, elegi una version corta o larga, y
                  empezala desde el mapa principal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => cargarRutas({ silencioso: true })}
              disabled={refreshing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-morado shadow-md ring-1 ring-uva/10 active:scale-95 disabled:opacity-60"
              aria-label="Actualizar rutas"
              title="Actualizar rutas"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
          </section>

          {mensaje && (
            <div className="mt-4">
              <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
            </div>
          )}

          <section className="mt-5">
            <div className="grid grid-cols-3 rounded-2xl bg-white/80 p-1 shadow-sm">
              <TabButton
                active={tabActiva === "disponibles"}
                onClick={() => setTabActiva("disponibles")}
              >
                Rutas
                <span>{conteosTabs.disponibles}</span>
              </TabButton>
              <TabButton
                active={tabActiva === "pausadas"}
                onClick={() => setTabActiva("pausadas")}
              >
                Pausa
                <span>{conteosTabs.pausadas}</span>
              </TabButton>
              <TabButton
                active={tabActiva === "terminadas"}
                onClick={() => setTabActiva("terminadas")}
              >
                Listas
                <span>{conteosTabs.terminadas}</span>
              </TabButton>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <Chip
                active={categoriaActiva === "todas"}
                onClick={() => setCategoriaActiva("todas")}
              >
                Todas
              </Chip>
              {categorias.map((categoria) => (
                <Chip
                  key={categoria}
                  active={categoriaActiva === categoria}
                  onClick={() => setCategoriaActiva(categoria)}
                >
                  {CATEGORIAS_RUTAS_LABELS[categoria] || categoria}
                </Chip>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOrdenCercania((actual) => !actual)}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition sm:w-fit ${
                ordenCercania
                  ? "bg-uva text-crema"
                  : "bg-white text-uva"
              }`}
            >
              <LocateFixed size={17} />
              {ordenCercania ? "Ordenadas por cercania" : "Ordenar por cercania"}
            </button>
          </section>

          <section className="mt-5">
            {rutasFiltradas.length === 0 ? (
              <EmptyState text={getEmptyText(tabActiva)} />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {rutasFiltradas.map((ruta) => (
                  <RutaCard
                    key={ruta._id}
                    ruta={ruta}
                    distancia={getDistanciaRutaACoords(ruta, coords)}
                    onClick={() => setRutaSeleccionada(ruta)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {rutaSeleccionada && (
        <RutaDetalle
          ruta={rutaSeleccionada}
          modo={modoSeleccionado}
          setModo={setModoSeleccionado}
          puntos={puntosSeleccionados}
          progreso={progresoSeleccionado}
          realizada={rutaSeleccionadaRealizada}
          pausada={rutaSeleccionadaPausada}
          actualizada={rutaSeleccionadaActualizada}
          guardando={guardandoProgreso}
          coords={coords}
          onClose={() => setRutaSeleccionada(null)}
          onEmpezar={() => empezarRuta({ retomar: false })}
          onRetomar={() => empezarRuta({ retomar: true })}
          onDescartar={descartarProgreso}
        />
      )}

      <Navbar active="rutas" />
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? "bg-uva text-crema shadow" : "bg-white text-uva"
      }`}
    >
      {children}
    </button>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm ${
        active ? "bg-morado text-crema shadow" : "text-uva/75"
      }`}
    >
      {children}
    </button>
  );
}

function getEmptyText(tab) {
  if (tab === "pausadas") return "No tenes rutas pausadas.";
  if (tab === "terminadas") return "Todavia no hay rutas terminadas.";
  return "No hay rutas disponibles con esos filtros.";
}

function CategoryBadge({ categoria }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${
        CATEGORIAS_RUTAS_STYLE[categoria] || "border-uva/10 bg-crema text-uva"
      }`}
    >
      {CATEGORIAS_RUTAS_LABELS[categoria] || categoria || "Ruta"}
    </span>
  );
}

function RutaCard({ ruta, distancia, onClick }) {
  const estado = ruta.estadoUsuario || {};
  const realizada = estado.realizadaVersionActual;
  const actualizada = estado.actualizada;
  const pausada = estado.pausada;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-[30px] bg-crema text-left shadow-xl border border-uva/10 transition active:scale-[0.99] ${
        realizada ? "opacity-35 grayscale hover:opacity-55" : ""
      }`}
    >
      {actualizada && (
        <span className="absolute right-4 top-4 z-20 h-3 w-3 rounded-full bg-menta shadow" />
      )}

      <div className="h-16 bg-morado/50" />
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-3 flex items-end justify-between gap-3">
          <PuntosMini puntos={ruta.puntos || []} />
          {Number.isFinite(distancia) && (
            <span className="mb-1 shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-morado shadow-sm">
              {formatDistancia(distancia)}
            </span>
          )}
        </div>

        <CategoryBadge categoria={ruta.categoria} />

        <h2 className="mt-3 font-fredoka text-2xl leading-tight text-morado">
          {ruta.nombre}
        </h2>
        {ruta.descripcion && (
          <p className="mt-1 line-clamp-2 text-sm text-uva/70">
            {ruta.descripcion}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill icon={<MapPin size={14} />} text={`${ruta.cantidadPuntos || 0} puntos`} />
          {realizada && (
            <StatusPill
              icon={<CheckCircle2 size={14} />}
              text="Ruta realizada"
              className="bg-menta/45 text-uva"
            />
          )}
          {pausada && !realizada && (
            <StatusPill
              icon={<Pause size={14} />}
              text="Pausada"
              className="bg-white text-morado"
            />
          )}
        </div>
      </div>
    </button>
  );
}

function StatusPill({ icon, text, className = "bg-crema text-uva" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {icon}
      {text}
    </span>
  );
}

function PuntosMini({ puntos }) {
  if (!puntos.length) return null;

  return (
    <div className="flex -space-x-2">
      {puntos.slice(0, 5).map((punto) => (
        <img
          key={getId(punto)}
          src={punto.foto || cargafail}
          alt=""
          onError={(event) => {
            event.currentTarget.src = cargafail;
          }}
          className="h-11 w-11 rounded-full border-2 border-white object-cover shadow"
        />
      ))}
      {puntos.length > 5 && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-morado text-sm font-bold text-crema shadow">
          +{puntos.length - 5}
        </span>
      )}
    </div>
  );
}

function RutaDetalle({
  ruta,
  modo,
  setModo,
  puntos,
  progreso,
  realizada,
  pausada,
  actualizada,
  guardando,
  coords,
  onClose,
  onEmpezar,
  onRetomar,
  onDescartar,
}) {
  const puedeLarga = (ruta.puntos || []).length > 3;
  const progresoDeModo = progreso?.modo === modo ? progreso : null;
  const puedeRetomar =
    pausada && progresoDeModo && !progresoDeModo.versionDesactualizada;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-uva/30 px-3 py-4 backdrop-blur-sm">
      <article className="relative max-h-[90dvh] w-full max-w-3xl overflow-hidden rounded-[32px] bg-crema shadow-2xl border border-uva/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-fucsia text-white shadow-lg"
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X size={22} />
        </button>

        <div className="max-h-[90dvh] overflow-y-auto pb-5">
          <RutaMapPreview puntos={puntos} coords={coords} />

          <div className="px-4 pt-5 sm:px-6">
            <div className="pr-12">
              <CategoryBadge categoria={ruta.categoria} />
              <h2 className="mt-3 font-fredoka text-3xl leading-tight text-morado">
                {ruta.nombre}
              </h2>
              {ruta.descripcion && (
                <p className="mt-2 text-sm text-uva/75">{ruta.descripcion}</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {realizada && (
                <StatusPill
                  icon={<CheckCircle2 size={14} />}
                  text="Ya realizada"
                  className="bg-menta/45 text-uva"
                />
              )}
              {actualizada && (
                <StatusPill
                  icon={<AlertCircle size={14} />}
                  text="Actualizada"
                  className="bg-menta/35 text-uva"
                />
              )}
              {pausada && (
                <StatusPill
                  icon={<Pause size={14} />}
                  text="Tiene progreso guardado"
                  className="bg-rosa/30 text-uva"
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-2xl bg-crema p-1">
              <ModoButton active={modo === "corta"} onClick={() => setModo("corta")}>
                Corta
              </ModoButton>
              <ModoButton
                active={modo === "larga"}
                onClick={() => setModo("larga")}
                disabled={!puedeLarga}
              >
                Larga
              </ModoButton>
            </div>

            {!puedeLarga && (
              <p className="mt-2 text-xs font-semibold text-uva/60">
                Esta ruta tiene 3 puntos, por eso solo tiene modo corto.
              </p>
            )}

            {progreso?.versionDesactualizada && (
              <div className="mt-4">
                <Alert variant="info">
                  Esta ruta cambio desde que la pausaste. Conviene empezarla de
                  nuevo para ver los puntos actualizados.
                </Alert>
              </div>
            )}

            <section className="mt-5">
              <h3 className="font-fredoka text-2xl text-uva">Orden sugerido</h3>
              <div className="mt-3 grid gap-2">
                {puntos.map((punto, index) => (
                  <PuntoOrden key={getId(punto)} punto={punto} index={index} />
                ))}
              </div>
            </section>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {puedeRetomar ? (
                <button
                  type="button"
                  onClick={onRetomar}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-morado px-5 py-3 font-bold text-crema shadow disabled:opacity-60"
                >
                  <Play size={18} />
                  Retomar ruta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onEmpezar}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-morado px-5 py-3 font-bold text-crema shadow disabled:opacity-60"
                >
                  <Play size={18} />
                  Empezar ruta
                </button>
              )}

              {progresoDeModo ? (
                <button
                  type="button"
                  onClick={onDescartar}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-fucsia/10 px-5 py-3 font-bold text-fucsia disabled:opacity-60"
                >
                  <X size={18} />
                  Descartar pausa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-crema px-5 py-3 font-bold text-uva"
                >
                  Mirar otras rutas
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function ModoButton({ active, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-morado text-crema shadow" : "text-uva"
      }`}
    >
      {children}
    </button>
  );
}

function PuntoOrden({ punto, index }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-crema px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado font-fredoka text-crema">
        {index + 1}
      </span>
      <img
        src={punto.foto || cargafail}
        alt=""
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-uva">{punto.nombre}</span>
        {punto.direccion && (
          <span className="block truncate text-xs text-uva/60">
            {punto.direccion}
          </span>
        )}
      </span>
    </div>
  );
}

function RutaMapPreview({ puntos, coords }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxgl.accessToken) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: xendariaMapStyle,
      center: [-58.3816, -34.6037],
      zoom: 12,
      interactive: true,
      attributionControl: false,
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    let cancelado = false;

    async function dibujar() {
      if (!map.loaded()) {
        map.once("load", dibujar);
        return;
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (map.getLayer("ruta-preview-linea")) {
        map.removeLayer("ruta-preview-linea");
      }
      if (map.getSource("ruta-preview")) {
        map.removeSource("ruta-preview");
      }

      const coordsPuntos = puntos.map(getCoordsPunto).filter(Boolean);
      if (coordsPuntos.length === 0) return;

      let geometry = {
        type: "LineString",
        coordinates: coordsPuntos.map((punto) => [punto.lon, punto.lat]),
      };

      if (mapboxgl.accessToken && coordsPuntos.length >= 2) {
        try {
          const waypoints = coordsPuntos
            .map((punto) => `${punto.lon},${punto.lat}`)
            .join(";");
          const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
          const response = await fetch(url);
          const data = await response.json();
          if (!cancelado && data.routes?.[0]?.geometry) {
            geometry = data.routes[0].geometry;
          }
        } catch {
          // Si Directions falla, el mapa muestra la linea simple entre puntos.
        }
      }

      if (cancelado) return;

      map.addSource("ruta-preview", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry,
        },
      });

      map.addLayer({
        id: "ruta-preview-linea",
        type: "line",
        source: "ruta-preview",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#AA63E0",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      coordsPuntos.forEach((punto, index) => {
        const el = document.createElement("div");
        el.className =
          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-morado font-bold text-white shadow";
        el.textContent = String(index + 1);

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([punto.lon, punto.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      if (coords) {
        const el = document.createElement("div");
        el.className =
          "h-4 w-4 rounded-full border-2 border-white bg-menta shadow";
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }

      const bounds = new mapboxgl.LngLatBounds();
      coordsPuntos.forEach((punto) => bounds.extend([punto.lon, punto.lat]));
      if (coords) bounds.extend([coords.lng, coords.lat]);

      map.fitBounds(bounds, {
        padding: 48,
        maxZoom: 15,
        duration: 500,
      });
    }

    dibujar();

    return () => {
      cancelado = true;
    };
  }, [coords, puntos]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex h-56 items-center justify-center bg-crema text-center text-sm font-semibold text-uva">
        No esta configurado el mapa para previsualizar la ruta.
      </div>
    );
  }

  return <div ref={containerRef} className="h-60 w-full bg-crema sm:h-72" />;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-8 text-center shadow-sm">
      <Flag className="mx-auto text-morado" size={30} />
      <p className="mt-3 text-sm font-semibold text-uva">{text}</p>
    </div>
  );
}
