import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  BadgeCheck,
  Crown,
  EyeOff,
  Gem,
  MapPin,
  Medal,
  RefreshCw,
  Star,
  Trophy,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import EncabezadoVistaUsuario from "../../components/EncabezadoVistaUsuario.jsx";
import BotonAccionUsuario from "../../components/BotonAccionUsuario.jsx";
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
        <CargadorMapa text="Cargando ranking..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <EncabezadoVistaUsuario
            icon={Trophy}
            etiqueta="Ranking Xendaria"
            titulo="Exploradores"
            descripcion="Mirá posiciones, lugares más visitados y puntos mejor votados."
            action={
              <BotonAccionUsuario
                onClick={() => cargarRanking({ silencioso: true })}
                disabled={refreshing}
                aria-label="Actualizar ranking"
                title="Actualizar ranking"
                icon={RefreshCw}
                iconClassName={refreshing ? "animate-spin" : ""}
                className="mt-2 sm:mt-0"
              >
                Actualizar
              </BotonAccionUsuario>
            }
          />

          {actualizado && (
            <p className="mt-3 text-xs font-semibold text-uva/70">
              Última actualización {formatFecha(actualizado)}
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
            <PosicionActualRanking miPosicion={miPosicion} />
          )}

          <div className="mt-8 grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
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
                <EmptyState text="Todavía no hay exploradores en el ranking." />
              ) : (
                <>
                  <PodioExploradores podio={podio} />

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
                <EmptyState text="Todavía no hay lugares visitados." />
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
            <section className="mt-7">
              <div className="mb-6 flex gap-3 overflow-x-auto pb-1 pt-1">
                {[
                  { label: "1", value: 1 },
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "5", value: 5 },
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
                <EmptyState text="Todavía no hay lugares calificados con ese filtro." />
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

function PosicionActualRanking({ miPosicion }) {
  const totalVisitados = miPosicion.totalVisitados || 0;
  const totalInsignias = miPosicion.totalInsignias || 0;
  const posicionTexto = miPosicion.posicion ? `#${miPosicion.posicion}` : "--";

  return (
    <section className="mt-8">
      <p className="mb-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-uva/55">
        Tu posición actual
      </p>

      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <div className="absolute bottom-0 left-0 h-16 w-16 -rotate-12 rounded-[1.35rem] bg-uva shadow-lg shadow-uva/25" />
          <div className="absolute right-0 top-0 h-16 w-16 rotate-12 rounded-[1.35rem] bg-vainilla shadow-lg shadow-uva/15" />
          <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[1.55rem] bg-morado p-3 text-crema shadow-xl shadow-uva/25 ring-4 ring-white">
            <Gem size={18} className="mb-0.5 text-vainilla" />
            <span className="font-fredoka text-3xl leading-none">
              {posicionTexto}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-fredoka text-2xl leading-tight text-morado">
            {miPosicion.nombre || "Explorador Xendaria"}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-uva/65">
            {miPosicion.message || "Seguí explorando para subir posiciones."}
          </p>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <RankChip
              label="Insignias"
              value={totalInsignias}
              color={categorias.curiosos.color}
            />
            <RankChip
              label="Visitados"
              value={totalVisitados}
              color={categorias.espacios_verdes_publicos.color}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RankChip({ label, value, color }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold text-uva shadow-sm"
      style={{ backgroundColor: color }}
    >
      <span className="font-fredoka text-lg leading-none">{value}</span>
      {label}
    </span>
  );
}

function PodioExploradores({ podio }) {
  return (
    <section className="rounded-[32px] border border-morado/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-uva/60">
            Top 3
          </p>
          <h2 className="font-fredoka text-2xl leading-none text-uva">
            Podio de exploradores
          </h2>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-morado/10 text-morado shadow-sm">
          <Trophy size={22} />
        </span>
      </div>

      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {podio.map((usuario) => (
          <PodioUsuario key={usuario.usuarioId} usuario={usuario} />
        ))}
      </div>
    </section>
  );
}

function PodioUsuario({ usuario }) {
  const esPrimero = usuario.posicion === 1;
  const Icono = esPrimero ? Crown : Medal;
  const estilos = {
    1: {
      avatar: "h-20 w-20 border-vainilla",
      badge: "bg-vainilla text-uva",
      pedestal: "h-24 bg-vainilla/80 border-vainilla",
      icon: "text-uva",
    },
    2: {
      avatar: "h-16 w-16 border-celeste",
      badge: "bg-celeste text-uva",
      pedestal: "h-16 bg-celeste/70 border-celeste",
      icon: "text-uva",
    },
    3: {
      avatar: "h-16 w-16 border-rosa",
      badge: "bg-rosa text-uva",
      pedestal: "h-14 bg-rosa/70 border-rosa",
      icon: "text-uva",
    },
  }[usuario.posicion] || {
    avatar: "h-16 w-16 border-crema",
    badge: "bg-morado/10 text-morado",
    pedestal: "h-14 bg-morado/10 border-morado/20",
    icon: "text-morado",
  };

  return (
    <article className="flex min-w-0 flex-col items-center text-center">
      <div
        className={`mb-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${estilos.badge}`}
      >
        <Icono size={esPrimero ? 20 : 18} className={estilos.icon} />
        #{usuario.posicion}
      </div>
      <img
        src={resolveAvatarSrc(usuario.foto)}
        alt={usuario.nombre}
        onError={(event) => {
          event.currentTarget.src = getFallbackAvatar();
        }}
        className={`rounded-full border-4 bg-crema object-cover shadow-lg ${estilos.avatar}`}
      />
      <p className="mt-2 w-full truncate font-fredoka text-sm text-morado sm:text-base">
        {usuario.nombre}
      </p>
      <div
        className={`mt-2 flex w-full flex-col items-center justify-end rounded-t-3xl border px-1 pb-2 ${estilos.pedestal}`}
      >
        <p className="font-fredoka text-xl leading-none text-uva">
          {usuario.totalInsignias}
        </p>
        <p className="text-[10px] font-extrabold uppercase text-uva/75">
          insignias
        </p>
        <p className="text-[10px] font-bold text-uva/60">
          {usuario.totalVisitados} visitas
        </p>
      </div>
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
          {categoria?.label || lugar.categoria || "Categoría"}
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
          {categoria?.label || lugar.categoria || "Categoría"}
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
          {categoria?.label || lugar.categoria || "Categoría"}
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
