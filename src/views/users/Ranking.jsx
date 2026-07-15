import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  BadgeCheck,
  Crown,
  EyeOff,
  MapPin,
  Medal,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import MapaLoader from "../../components/MapaLoader.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";
import cargafail from "../../assets/cargafail.png";
import { resolveAvatarSrc, getFallbackAvatar } from "../../lib/avatarOptions.js";

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo completar la solicitud");
  }

  return data;
}

function getPodioOrdenado(top3) {
  if (top3.length < 3) return top3;
  return [top3[1], top3[0], top3[2]];
}

function formatFecha(fecha) {
  if (!fecha) return "";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Ranking() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [usuarios, setUsuarios] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [mejorVotados, setMejorVotados] = useState([]);
  const [miPosicion, setMiPosicion] = useState(null);
  const [tab, setTab] = useState("usuarios");
  const [minEstrellas, setMinEstrellas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actualizado, setActualizado] = useState(null);

  const top3 = usuarios.slice(0, 3);
  const restoUsuarios = usuarios.slice(3);
  const podio = useMemo(() => getPodioOrdenado(top3), [top3]);
  const top3MejorVotados = mejorVotados.slice(0, 3);
  const restoMejorVotados = mejorVotados.slice(3);

  const cargarRanking = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!API) return;

      if (silencioso) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const filtroVotados =
          Number(minEstrellas) > 0 ? `&minEstrellas=${minEstrellas}` : "";
        const [usuariosData, lugaresData, mejorVotadosData, posicionData] =
          await Promise.all([
          fetchJSON(`${API}/api/ranking/usuarios?limit=20`),
          fetchJSON(`${API}/api/ranking/lugares?limit=20`),
          fetchJSON(`${API}/api/ranking/mejor-votados?limit=20${filtroVotados}`),
          token
            ? fetchJSON(`${API}/api/ranking/me`, { headers })
            : Promise.resolve(null),
        ]);

        setUsuarios(Array.isArray(usuariosData.usuarios) ? usuariosData.usuarios : []);
        setLugares(Array.isArray(lugaresData.lugares) ? lugaresData.lugares : []);
        setMejorVotados(
          Array.isArray(mejorVotadosData.lugares) ? mejorVotadosData.lugares : []
        );
        setMiPosicion(posicionData);
        setActualizado(new Date());
      } catch (err) {
        setError(err.message || "No se pudo cargar el ranking.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [API, minEstrellas, token]
  );

  useEffect(() => {
    cargarRanking();
  }, [cargarRanking]);

  useEffect(() => {
    if (!API) return undefined;

    const socket = io(API, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("ranking:updated", () => {
      cargarRanking({ silencioso: true });
    });

    return () => {
      socket.disconnect();
    };
  }, [API, cargarRanking]);

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      {loading ? (
        <MapaLoader text="Cargando ranking..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <section className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-fucsia">
                <Sparkles size={17} />
                En vivo
              </p>
              <h1 className="font-fredoka text-3xl leading-tight text-morado sm:text-4xl">
                Ranking Xendaria
              </h1>
            </div>

            <button
              type="button"
              onClick={() => cargarRanking({ silencioso: true })}
              disabled={refreshing}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-morado shadow-md active:scale-95 disabled:opacity-60"
              aria-label="Actualizar ranking"
              title="Actualizar ranking"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
          </section>

          {actualizado && (
            <p className="mt-1 text-xs font-semibold text-uva/70">
              Ultima actualizacion {formatFecha(actualizado)}
            </p>
          )}

          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}

          {miPosicion?.visible === false && (
            <div className="mt-4">
              <Alert variant="info">
                <span className="inline-flex items-center gap-2">
                  <EyeOff size={17} />
                  {miPosicion.message}
                </span>
              </Alert>
            </div>
          )}

          {miPosicion?.visible !== false && miPosicion && (
            <section className="mt-5 rounded-3xl border border-uva/10 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-uva/70">
                Tu posicion actual
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-fredoka text-2xl text-morado">
                    {miPosicion.posicion ? `#${miPosicion.posicion}` : "Sin puesto"}
                  </p>
                  <p className="text-sm text-uva">
                    {miPosicion.message || "Segui explorando para subir."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <MiniMetric label="Insignias" value={miPosicion.totalInsignias || 0} />
                  <MiniMetric label="Visitados" value={miPosicion.totalVisitados || 0} />
                </div>
              </div>
            </section>
          )}

          <div className="mt-5 grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
            <TabButton active={tab === "usuarios"} onClick={() => setTab("usuarios")}>
              Exploradores
            </TabButton>
            <TabButton active={tab === "lugares"} onClick={() => setTab("lugares")}>
              Lugares
            </TabButton>
            <TabButton active={tab === "votados"} onClick={() => setTab("votados")}>
              Votados
            </TabButton>
          </div>

          {tab === "usuarios" ? (
            <section className="mt-5">
              {usuarios.length === 0 ? (
                <EmptyState text="Todavia no hay exploradores en el ranking." />
              ) : (
                <>
                  <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                    {podio.map((usuario) => (
                      <PodioUsuario key={usuario.usuarioId} usuario={usuario} />
                    ))}
                  </div>

                  <div className="mt-5 divide-y divide-uva/10 rounded-3xl bg-white px-3 shadow-sm">
                    {restoUsuarios.map((usuario) => (
                      <UsuarioRankingItem key={usuario.usuarioId} usuario={usuario} />
                    ))}
                  </div>
                </>
              )}
            </section>
          ) : tab === "lugares" ? (
            <section className="mt-5">
              {lugares.length === 0 ? (
                <EmptyState text="Todavia no hay lugares visitados." />
              ) : (
                <div className="divide-y divide-uva/10 rounded-3xl bg-white px-3 shadow-sm">
                  {lugares.map((lugar) => (
                    <LugarRankingItem
                      key={lugar.puntoId}
                      lugar={lugar}
                      onClick={() => navigate(`/punto/${lugar.puntoId}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="mt-5">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {[
                  { label: "Todas", value: 0 },
                  { label: "5", value: 5 },
                  { label: "4+", value: 4 },
                  { label: "3+", value: 3 },
                ].map((filtro) => (
                  <button
                    key={filtro.value}
                    type="button"
                    onClick={() => setMinEstrellas(filtro.value)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                      minEstrellas === filtro.value
                        ? "bg-fucsia text-white shadow"
                        : "bg-white text-uva"
                    }`}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>

              {mejorVotados.length === 0 ? (
                <EmptyState text="Todavia no hay lugares calificados con ese filtro." />
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {top3MejorVotados.map((lugar) => (
                      <LugarVotadoDestacado
                        key={lugar.puntoId}
                        lugar={lugar}
                        onClick={() => navigate(`/punto/${lugar.puntoId}`)}
                      />
                    ))}
                  </div>

                  <div className="mt-5 divide-y divide-uva/10 rounded-3xl bg-white px-3 shadow-sm">
                    {restoMejorVotados.map((lugar) => (
                      <LugarVotadoRankingItem
                        key={lugar.puntoId}
                        lugar={lugar}
                        onClick={() => navigate(`/punto/${lugar.puntoId}`)}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      )}

      <Navbar active="ranking" />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl py-2.5 text-sm font-bold transition ${
        active ? "bg-morado text-crema shadow" : "text-uva"
      }`}
    >
      {children}
    </button>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl bg-rosa/20 px-3 py-2">
      <p className="font-fredoka text-xl leading-none text-fucsia">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-uva">{label}</p>
    </div>
  );
}

function PodioUsuario({ usuario }) {
  const esPrimero = usuario.posicion === 1;
  const icono = esPrimero ? <Crown size={20} /> : <Medal size={18} />;

  return (
    <article
      className={`relative flex flex-col items-center rounded-3xl bg-white px-2 pb-4 pt-3 text-center shadow-sm ${
        esPrimero ? "min-h-[190px] border-2 border-rosa" : "min-h-[165px]"
      }`}
    >
      <div
        className={`mb-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
          esPrimero ? "bg-rosa text-fucsia" : "bg-morado/10 text-morado"
        }`}
      >
        {icono}
        #{usuario.posicion}
      </div>
      <img
        src={resolveAvatarSrc(usuario.foto)}
        alt={usuario.nombre}
        onError={(event) => {
          event.currentTarget.src = getFallbackAvatar();
        }}
        className={`rounded-full border-4 border-crema object-cover shadow ${
          esPrimero ? "h-20 w-20" : "h-16 w-16"
        }`}
      />
      <p className="mt-2 w-full truncate font-fredoka text-morado">
        {usuario.nombre}
      </p>
      <p className="text-xs font-bold text-uva">
        {usuario.totalInsignias} insignias
      </p>
      <p className="text-[11px] text-uva/70">
        {usuario.totalVisitados} visitados
      </p>
    </article>
  );
}

function UsuarioRankingItem({ usuario }) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 font-fredoka text-morado">
        #{usuario.posicion}
      </span>
      <img
        src={resolveAvatarSrc(usuario.foto)}
        alt={usuario.nombre}
        onError={(event) => {
          event.currentTarget.src = getFallbackAvatar();
        }}
        className="h-12 w-12 shrink-0 rounded-full border-2 border-crema object-cover shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-fredoka text-morado">{usuario.nombre}</p>
        <p className="truncate text-xs text-uva">
          {usuario.totalInsignias} insignias - {usuario.totalVisitados} visitados
        </p>
      </div>
      <Trophy size={20} className="shrink-0 text-fucsia" />
    </div>
  );
}

function LugarRankingItem({ lugar, onClick }) {
  const categoria = categorias[lugar.categoria];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center gap-3 py-3 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-menta/60 font-fredoka text-uva">
        #{lugar.posicion}
      </span>
      <img
        src={lugar.foto || cargafail}
        alt={lugar.nombre}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-fredoka text-morado">
          {lugar.nombre}
        </span>
        <span className="block truncate text-xs text-uva">
          {categoria?.label || lugar.categoria || "Categoria"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-rosa/20 px-2 py-1 text-xs font-bold text-fucsia">
        <MapPin size={14} />
        {lugar.totalVisitas}
      </span>
    </button>
  );
}

function LugarVotadoDestacado({ lugar, onClick }) {
  const categoria = categorias[lugar.categoria];

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-h-[190px] overflow-hidden rounded-3xl bg-white text-left shadow-sm active:scale-[0.99]"
    >
      <img
        src={lugar.foto || cargafail}
        alt={lugar.nombre}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-24 w-full object-cover"
      />
      <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-fucsia font-fredoka text-white shadow">
        #{lugar.posicion}
      </span>
      <div className="p-4">
        <p className="truncate font-fredoka text-lg text-morado">
          {lugar.nombre}
        </p>
        <p className="truncate text-xs font-semibold text-uva">
          {categoria?.label || lugar.categoria || "Categoria"}
        </p>
        <div className="mt-3">
          <RatingSummary lugar={lugar} />
        </div>
      </div>
    </button>
  );
}

function LugarVotadoRankingItem({ lugar, onClick }) {
  const categoria = categorias[lugar.categoria];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center gap-3 py-3 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fucsia/10 font-fredoka text-fucsia">
        #{lugar.posicion}
      </span>
      <img
        src={lugar.foto || cargafail}
        alt={lugar.nombre}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-fredoka text-morado">
          {lugar.nombre}
        </span>
        <span className="block truncate text-xs text-uva">
          {categoria?.label || lugar.categoria || "Categoria"}
        </span>
      </span>
      <RatingSummary lugar={lugar} compact />
    </button>
  );
}

function RatingSummary({ lugar, compact = false }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 font-bold text-fucsia ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <Star size={compact ? 15 : 17} fill="#F0288E" />
      <span>{lugar.promedioEstrellas || 0}</span>
      <span className="text-uva/70">({lugar.totalCalificaciones || 0})</span>
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-8 text-center shadow-sm">
      <BadgeCheck className="mx-auto text-morado" size={30} />
      <p className="mt-3 text-sm font-semibold text-uva">{text}</p>
    </div>
  );
}
