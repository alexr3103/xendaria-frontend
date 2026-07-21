import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  LogOut,
  MapPinned,
  Medal,
  Pencil,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import Alert from "../../components/Alertas.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";
import cargafail from "../../assets/cargafail.png";
import { getFallbackAvatar, resolveAvatarSrc } from "../../lib/avatarOptions.js";
import { getCategoriaImagen } from "../../lib/categoriaImagenes.js";

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function getId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  if (valor.$oid) return valor.$oid;
  if (valor._id?.$oid) return valor._id.$oid;
  if (valor.id?.$oid) return valor.id.$oid;
  return String(valor._id || valor.id || valor);
}

function getIdPuntoVisitado(valor) {
  if (!valor) return "";
  if (valor.punto && typeof valor.punto === "object") return getId(valor.punto);
  return getId(valor.idPunto || valor.punto || valor.puntoId || valor);
}

function getListaVisitadosPerfil(perfil) {
  const posiblesCampos = [
    perfil?.puntos_visitados,
    perfil?.puntosVisitados,
    perfil?.lugares_visitados,
    perfil?.lugaresVisitados,
  ];

  return posiblesCampos.find((campo) => Array.isArray(campo)) || [];
}

function getCantidadVisitados(perfil) {
  const lista = getListaVisitadosPerfil(perfil);
  const idsUnicos = new Set(lista.map(getIdPuntoVisitado).filter(Boolean));

  return idsUnicos.size || lista.length || 0;
}

function normalizarInsignia(insignia, index) {
  if (typeof insignia === "string") {
    return {
      id: `${insignia}-${index}`,
      titulo: `Insignia ${index + 1}`,
      imagen: insignia,
    };
  }

  return {
    id:
      getId(insignia?.idPunto || insignia?.punto || insignia) ||
      `${insignia?.url || insignia?.imagen}-${index}`,
    titulo: insignia?.titulo || insignia?.nombre || `Insignia ${index + 1}`,
    imagen: insignia?.url || insignia?.foto || insignia?.imagen || null,
  };
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo completar la solicitud");
  }

  return data;
}

async function cargarFavoritosDesdePerfil(API, perfilData) {
  const favoritosApi = Array.isArray(perfilData?.lugares_favoritos)
    ? perfilData.lugares_favoritos
    : [];
  const usuarioLocal = getUsuarioLocal();
  const favoritosLocales = Array.isArray(usuarioLocal?.lugares_favoritos)
    ? usuarioLocal.lugares_favoritos
    : [];
  const favoritos = [...favoritosApi, ...favoritosLocales];

  const favoritosObjetos = favoritos.filter(
    (favorito) => favorito && typeof favorito === "object" && favorito.nombre
  );
  if (favoritosObjetos.length > 0) return favoritosObjetos;

  const ids = [...new Set(favoritos.map(getId).filter(Boolean))];
  if (ids.length === 0) return [];

  const resultados = await Promise.allSettled(
    ids.map((id) => fetchJSON(`${API}/api/puntos/${id}`))
  );

  return resultados
    .filter((resultado) => resultado.status === "fulfilled")
    .map((resultado) => resultado.value)
    .filter(Boolean);
}

async function cargarVisitadosDesdePerfil(API, perfilData) {
  const visitados = getListaVisitadosPerfil(perfilData);
  const ids = [...new Set(visitados.map(getIdPuntoVisitado).filter(Boolean))];
  if (ids.length === 0) return [];

  const fechasPorId = new Map(
    visitados
      .map((visitado) => [
        getIdPuntoVisitado(visitado),
        visitado?.fechaVisita || visitado?.visitadoEn || visitado?.fecha,
      ])
      .filter(([id]) => id)
  );

  const resultados = await Promise.allSettled(
    ids.map((id) => fetchJSON(`${API}/api/puntos/${id}`))
  );

  return resultados
    .filter((resultado) => resultado.status === "fulfilled")
    .map((resultado) => ({
      ...resultado.value,
      fechaVisita: fechasPorId.get(getId(resultado.value)),
    }))
    .filter(Boolean);
}

async function cargarInsigniasDesbloqueadas(API, perfilData) {
  const insigniasPerfil = Array.isArray(perfilData?.insignias)
    ? perfilData.insignias.map(normalizarInsignia)
    : [];

  const idsDesbloqueados = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("insignia-") && localStorage.getItem(key) === "true") {
      idsDesbloqueados.push(key.replace("insignia-", ""));
    }
  }

  const resultados = await Promise.allSettled(
    idsDesbloqueados.map((id) => fetchJSON(`${API}/api/puntos/${id}`))
  );

  const insigniasLocal = resultados
    .filter((resultado) => resultado.status === "fulfilled")
    .map((resultado) => resultado.value)
    .filter((punto) => punto?.insignia)
    .map((punto) => ({
      id: punto._id,
      titulo: punto.nombre || "Insignia",
      imagen: punto.insignia,
    }));

  const todas = [...insigniasPerfil, ...insigniasLocal];
  const porId = new Map();
  todas.forEach((insignia) => {
    if (insignia.imagen) porId.set(insignia.id || insignia.imagen, insignia);
  });

  return [...porId.values()].slice(-3).reverse();
}

export default function Perfil() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [perfil, setPerfil] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [puntosPropios, setPuntosPropios] = useState([]);
  const [visitados, setVisitados] = useState([]);
  const [insignias, setInsignias] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [verVisitados, setVerVisitados] = useState(false);
  const [verFavoritos, setVerFavoritos] = useState(false);
  const [verPropios, setVerPropios] = useState(false);
  const [verCalificados, setVerCalificados] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [favoritoEliminando, setFavoritoEliminando] = useState(null);
  const [puntoPropioEliminando, setPuntoPropioEliminando] = useState(null);
  const [loading, setLoading] = useState(true);

  const usuarioLS = useMemo(getUsuarioLocal, []);
  const token = localStorage.getItem("token");
  const usuarioId = usuarioLS?.id || usuarioLS?._id;

  useEffect(() => {
    let activo = true;

    async function cargar() {
      if (!token || !usuarioId) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setMensaje(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const perfilData = await fetchJSON(`${API}/api/usuarios/${usuarioId}`, {
          headers,
        });

        const [
          favoritosResult,
          propiosResult,
          visitadosResult,
          insigniasResult,
          calificacionesResult,
        ] = await Promise.allSettled([
            fetchJSON(`${API}/api/usuarios/${usuarioId}/favoritos`, { headers }),
            fetchJSON(`${API}/api/usuarios/${usuarioId}/puntos-propios`, {
              headers,
            }),
            fetchJSON(`${API}/api/usuarios/${usuarioId}/visitados`, { headers }),
            cargarInsigniasDesbloqueadas(API, perfilData),
            fetchJSON(`${API}/api/calificaciones/mias`, { headers }),
          ]);

        const favoritosApi =
          favoritosResult.status === "fulfilled" &&
          Array.isArray(favoritosResult.value)
            ? favoritosResult.value
            : [];
        const favoritosFallback =
          favoritosApi.length === 0
            ? await cargarFavoritosDesdePerfil(API, perfilData)
            : [];

        if (!activo) return;

        setPerfil(perfilData);
        setFavoritos(favoritosApi.length > 0 ? favoritosApi : favoritosFallback);
        setPuntosPropios(
          propiosResult.status === "fulfilled" &&
            Array.isArray(propiosResult.value)
            ? propiosResult.value
            : []
        );
        setVisitados(
          visitadosResult.status === "fulfilled" &&
            Array.isArray(visitadosResult.value)
            ? visitadosResult.value
            : await cargarVisitadosDesdePerfil(API, perfilData)
        );
        setInsignias(
          insigniasResult.status === "fulfilled" &&
            Array.isArray(insigniasResult.value)
            ? insigniasResult.value
            : []
        );
        setCalificaciones(
          calificacionesResult.status === "fulfilled" &&
            Array.isArray(calificacionesResult.value)
            ? calificacionesResult.value
            : []
        );
      } catch {
        if (activo) navigate("/login");
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [API, navigate, token, usuarioId]);

  const visitadosCount = visitados.length || getCantidadVisitados(perfil);
  const categoriaFavorita = perfil?.configuracion?.categoriaFavorita;
  const categoriaFavoritaInfo = categorias[categoriaFavorita];
  const categoriaFavoritaImagen = getCategoriaImagen(categoriaFavorita);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  async function eliminarFavorito(idPunto) {
    if (!idPunto || favoritoEliminando) return;

    setFavoritoEliminando(idPunto);
    setMensaje(null);

    try {
      const data = await fetchJSON(
        `${API}/api/usuarios/${usuarioId}/favorito/${idPunto}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFavoritos((actuales) =>
        actuales.filter((favorito) => getId(favorito) !== idPunto)
      );

      const usuarioActual = getUsuarioLocal();
      if (usuarioActual) {
        const favoritosActualizados = Array.isArray(data.favoritos)
          ? data.favoritos.map(getId)
          : (usuarioActual.lugares_favoritos || []).filter(
              (id) => getId(id) !== idPunto
            );

        localStorage.setItem(
          "usuario",
          JSON.stringify({
            ...usuarioActual,
            lugares_favoritos: favoritosActualizados,
          })
        );
      }

      setMensaje({
        variant: "success",
        text: "Favorito eliminado.",
      });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo eliminar el favorito.",
      });
    } finally {
      setFavoritoEliminando(null);
    }
  }

  async function eliminarPuntoPropio(idPunto) {
    if (!idPunto || puntoPropioEliminando) return;

    setPuntoPropioEliminando(idPunto);
    setMensaje(null);

    try {
      await fetchJSON(
        `${API}/api/usuarios/${usuarioId}/puntos-propios/${idPunto}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPuntosPropios((actuales) =>
        actuales.filter((punto) => getId(punto) !== idPunto)
      );
      setMensaje({
        variant: "success",
        text: "Punto propio eliminado.",
      });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo eliminar el punto propio.",
      });
    } finally {
      setPuntoPropioEliminando(null);
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-crema">
        <div className="sticky top-0 z-50">
          <Header disableFilter />
        </div>
        <CargadorMapa text="Cargando perfil..." className="top-24 z-[999]" />
        <Navbar active="perfil" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-crema">
        <Header disableFilter />
        <main className="px-4 pt-10">
          <Alert>No se pudo cargar tu perfil.</Alert>
        </main>
        <Navbar active="perfil" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-md lg:max-w-2xl">
          <section className="relative mt-16 rounded-3xl border border-uva/10 bg-white px-5 pb-6 pt-0 shadow-lg sm:px-6 lg:px-8">
            <div className="absolute right-0 top-0 z-20 translate-x-1/2 -translate-y-1/2">
              <BotonCerrar onClick={() => navigate("/home")} />
            </div>

            <div className="mb-3 flex justify-center -mt-16">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-menta"></div>
              <img
                src={resolveAvatarSrc(perfil.foto)}
                alt={`Avatar de ${perfil.nombre || "usuario"}`}
                onError={(event) => {
                  event.currentTarget.src = getFallbackAvatar();
                }}
                className="relative z-10 h-32 w-32 rounded-full border-4 border-crema object-cover"
              />
              </div>
            </div>

            <div className="text-center">
              <p className="font-nunito text-lg leading-tight">
                Usuario:{" "}
                <span className="font-bold text-morado">
                  {perfil.nombre || "Xendarian"}
                </span>
              </p>
              <p className="mt-1 truncate text-sm text-uva">{perfil.email}</p>
            </div>

            <div className="mt-4 flex justify-center gap-12">
              <IconAction
                icon={<Pencil size={24} />}
                label="Editar"
                onClick={() => navigate("/perfil/editar")}
              />
              <IconAction
                icon={<Settings size={24} />}
                label="Config"
                onClick={() => navigate("/proximamente")}
              />
            </div>

            {categoriaFavoritaInfo && (
              <div className="mt-5 border-t border-uva/10 pt-4">
                <p className="mb-2 text-sm font-bold text-uva">
                  Preferencia de lugares:
                </p>
                <div className="flex items-center gap-3">
                  {categoriaFavoritaImagen && (
                    <img
                      src={categoriaFavoritaImagen}
                      alt=""
                      className="h-20 w-24 shrink-0 rounded-2xl object-cover shadow-sm sm:h-24 sm:w-28"
                    />
                  )}
                  <p className="min-w-0 truncate font-fredoka text-xl text-morado">
                    {categoriaFavoritaInfo.label}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-4 divide-x divide-uva/10 border-y border-uva/10 py-4">
              <Metric label="Visitados" value={visitadosCount} highlight />
              <Metric label="Insignias" value={insignias.length} />
              <Metric label="Favoritos" value={favoritos.length} />
              <Metric label="Propios" value={puntosPropios.length} />
            </div>

            {mensaje && (
              <div className="mt-4">
                <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
              </div>
            )}

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-fredoka text-2xl text-morado">
                  Ultimas insignias
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/proximamente")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-morado/10 text-morado"
                  aria-label="Ver todas las insignias"
                  title="Ver todas las insignias"
                >
                  <Medal size={20} />
                </button>
              </div>

              {insignias.length > 0 ? (
                <div className="flex justify-center gap-4">
                  {insignias.map((insignia) => (
                    <div
                      key={insignia.id || insignia.imagen}
                      className="flex w-28 flex-col items-center gap-2"
                    >
                      <img
                        src={insignia.imagen || cargafail}
                        alt={insignia.titulo}
                        onError={(event) => {
                          event.currentTarget.src = cargafail;
                        }}
                        className="h-24 w-24 rounded-full border-4 border-rosa object-cover shadow-lg"
                      />
                      <p className="w-full truncate text-center text-xs font-bold text-uva">
                        {insignia.titulo}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-center text-sm text-uva">
                  Todavia no tenes insignias.
                </p>
              )}
            </section>

            <div className="mt-6 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
              <ProfileToggle
                title="Visitados"
                icon={<BadgeCheck className="text-fucsia" />}
                open={verVisitados}
                onClick={() => setVerVisitados((actual) => !actual)}
              >
                {visitados.length === 0 ? (
                  <p className="px-4 py-3 text-center text-sm text-uva">
                    Todavia no registraste visitas.
                  </p>
                ) : (
                  <div className="divide-y divide-uva/10">
                    {visitados.map((visitado) => (
                      <VisitadoItem
                        key={getId(visitado)}
                        visitado={visitado}
                        onOpen={() => navigate(`/punto/${getId(visitado)}`)}
                      />
                    ))}
                  </div>
                )}
              </ProfileToggle>

              <ProfileToggle
                title="Calificados"
                icon={<Star className="text-fucsia" />}
                open={verCalificados}
                onClick={() => setVerCalificados((actual) => !actual)}
              >
                {calificaciones.length === 0 ? (
                  <p className="px-4 py-3 text-center text-sm text-uva">
                    Todavia no calificaste puntos.
                  </p>
                ) : (
                  <div className="divide-y divide-uva/10">
                    {calificaciones.map((calificacion) => (
                      <CalificacionItem
                        key={getId(calificacion._id) || getId(calificacion.punto)}
                        calificacion={calificacion}
                        onOpen={() =>
                          navigate(
                            `/punto/${getId(
                              calificacion.idPunto || calificacion.punto
                            )}`
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </ProfileToggle>

              <ProfileToggle
                title="Favoritos"
                icon={<Heart className="text-rosa" />}
                open={verFavoritos}
                onClick={() => setVerFavoritos((actual) => !actual)}
              >
                {favoritos.length === 0 ? (
                  <p className="px-4 py-3 text-center text-sm text-uva">
                    Todavia no tenes favoritos.
                  </p>
                ) : (
                  <div className="divide-y divide-uva/10">
                    {favoritos.map((favorito) => (
                      <FavoritoItem
                        key={getId(favorito)}
                        favorito={favorito}
                        eliminando={favoritoEliminando === getId(favorito)}
                        onOpen={() => navigate(`/punto/${getId(favorito)}`)}
                        onDelete={() => eliminarFavorito(getId(favorito))}
                      />
                    ))}
                  </div>
                )}
              </ProfileToggle>

              <ProfileToggle
                title="Puntos propios"
                icon={<MapPinned className="text-morado" />}
                open={verPropios}
                onClick={() => setVerPropios((actual) => !actual)}
              >
                {puntosPropios.length === 0 ? (
                  <p className="px-4 py-3 text-center text-sm text-uva">
                    Todavia no creaste puntos.
                  </p>
                ) : (
                  <div className="divide-y divide-uva/10">
                    {puntosPropios.map((punto) => (
                      <PuntoPropioItem
                        key={getId(punto)}
                        punto={punto}
                        eliminando={puntoPropioEliminando === getId(punto)}
                        onOpen={() =>
                          navigate("/home", {
                            state: { puntoPropioId: getId(punto) },
                          })
                        }
                        onDelete={() => eliminarPuntoPropio(getId(punto))}
                      />
                    ))}
                  </div>
                )}
              </ProfileToggle>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <ProfileLink
                label="Sobre la app"
                onClick={() => navigate("/proximamente")}
              />

              <button
                onClick={logout}
                className="w-full rounded-xl bg-rosa py-3 text-center font-bold text-white transition hover:bg-rosa/80"
                type="button"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <LogOut size={19} />
                  Cerrar sesion
                </span>
              </button>
            </div>
          </section>
        </div>
      </main>

      <Navbar active="perfil" />
    </div>
  );
}

function IconAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center text-morado transition hover:text-uva"
      type="button"
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Metric({ label, value, highlight = false }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-start text-center">
      <p
        className={`font-fredoka text-xl font-bold leading-none ${
          highlight ? "text-fucsia" : "text-morado"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 w-full truncate px-0.5 text-[10px] font-semibold leading-tight text-uva sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function ProfileToggle({ title, icon, open, onClick, children }) {
  return (
    <div className="border-t border-uva/10 pt-3">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-2 text-left transition hover:text-morado"
        type="button"
        aria-expanded={open}
      >
        <span className="font-nunito font-semibold text-uva">{title}</span>
        <span className="flex items-center gap-2">
          {icon}
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function formatFechaVisita(fecha) {
  if (!fecha) return "Visitado";

  const fechaDate = new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) return "Visitado";

  return fechaDate.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function VisitadoItem({ visitado, onOpen }) {
  const categoria = categorias[visitado.categoria];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 items-center gap-3 py-3 text-left"
    >
      <img
        src={visitado.foto || cargafail}
        alt={visitado.nombre || "Punto visitado"}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-fredoka text-morado">
          {visitado.nombre || "Punto sin nombre"}
        </span>
        <span className="block truncate text-xs text-uva">
          {categoria?.label || visitado.categoria || "Categoria"}
        </span>
      </span>
      <span className="shrink-0 text-right text-[11px] font-bold text-fucsia">
        {formatFechaVisita(visitado.fechaVisita || visitado.visitadoEn)}
      </span>
    </button>
  );
}

function CalificacionItem({ calificacion, onOpen }) {
  const punto = calificacion.punto || {};
  const categoria = categorias[punto.categoria];
  const estrellas = Number(calificacion.estrellas) || 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 items-center gap-3 py-3 text-left"
    >
      <img
        src={punto.foto || cargafail}
        alt={punto.nombre || "Punto calificado"}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-fredoka text-morado">
          {punto.nombre || "Punto sin nombre"}
        </span>
        <span className="block truncate text-xs text-uva">
          {categoria?.label || punto.categoria || "Categoria"}
        </span>
        <span className="mt-1 flex items-center gap-0.5 text-fucsia">
          {[1, 2, 3, 4, 5].map((numero) => (
            <Star
              key={numero}
              size={14}
              fill={numero <= estrellas ? "#F0288E" : "none"}
              strokeWidth={2.2}
            />
          ))}
        </span>
      </span>
      <span className="shrink-0 text-right text-[11px] font-bold text-fucsia">
        {formatFechaVisita(calificacion.updatedAt || calificacion.fechaCalificacion)}
      </span>
    </button>
  );
}

function FavoritoItem({ favorito, eliminando, onOpen, onDelete }) {
  const categoria = categorias[favorito.categoria];

  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <img
          src={favorito.foto || cargafail}
          alt={favorito.nombre || "Favorito"}
          onError={(event) => {
            event.currentTarget.src = cargafail;
          }}
          className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
        />
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate font-fredoka text-morado">
            {favorito.nombre || "Punto sin nombre"}
          </span>
          <span className="block truncate text-xs text-uva">
            {categoria?.label || favorito.categoria || "Categoria"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={eliminando}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fucsia/10 text-fucsia disabled:opacity-60"
        aria-label="Quitar favorito"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function PuntoPropioItem({ punto, eliminando, onOpen, onDelete }) {
  const categoria = categorias[punto.categoria];

  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <MapPinned className="h-9 w-9 shrink-0 text-morado" />
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate font-fredoka text-morado">
            {punto.nombre || "Punto sin nombre"}
          </span>
          <span className="block truncate text-xs text-uva">
            {categoria?.label || punto.categoria || "Propio"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={eliminando}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fucsia/10 text-fucsia disabled:opacity-60"
        aria-label="Eliminar punto propio"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function ProfileLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-t border-uva/10 py-4 text-left transition hover:text-morado"
      type="button"
    >
      <span className="font-nunito font-semibold text-uva">{label}</span>
      <span aria-hidden="true">{">"}</span>
    </button>
  );
}
