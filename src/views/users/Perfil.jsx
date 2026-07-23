import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  MapPinned,
  Mail,
  PackageCheck,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import ModalXendaria from "../../components/ModalXendaria.jsx";
import TituloPerfil from "../../components/TituloPerfil.jsx";
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

function normalizarDescripcionPerfil(descripcion) {
  const texto = String(descripcion || "").trim();
  if (!texto) return "";
  return texto.length > 150 ? `${texto.slice(0, 147).trim()}...` : texto;
}

const formatoPrecioPerfil = new Intl.NumberFormat("es-AR");

function precioPerfil(valor = 0) {
  return `$${formatoPrecioPerfil.format(Number(valor || 0))}`;
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
    const error = new Error(data?.message || "No se pudo completar la solicitud");
    error.status = response.status;
    throw error;
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
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;

  const [perfil, setPerfil] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [puntosPropios, setPuntosPropios] = useState([]);
  const [visitados, setVisitados] = useState([]);
  const [rutasRealizadas, setRutasRealizadas] = useState([]);
  const [insignias, setInsignias] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [titulosPerfil, setTitulosPerfil] = useState(null);
  const [comunidad, setComunidad] = useState({
    seguidoresCount: 0,
    siguiendoCount: 0,
  });
  const [verVisitados, setVerVisitados] = useState(false);
  const [verFavoritos, setVerFavoritos] = useState(false);
  const [verPropios, setVerPropios] = useState(false);
  const [verCalificados, setVerCalificados] = useState(false);
  const [verCompras, setVerCompras] = useState(false);
  const [modalSobreApp, setModalSobreApp] = useState(false);
  const [modalSoporte, setModalSoporte] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [favoritoEliminando, setFavoritoEliminando] = useState(null);
  const [puntoPropioEliminando, setPuntoPropioEliminando] = useState(null);
  const [loading, setLoading] = useState(true);

  const usuarioLS = useMemo(getUsuarioLocal, []);
  const token = localStorage.getItem("token");
  const usuarioId = usuarioLS?.id || usuarioLS?._id;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("seccion") === "compras") {
      setVerCompras(true);
    }
  }, [location.search]);

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
          rutasRealizadasResult,
          insigniasResult,
          calificacionesResult,
          ordenesResult,
          comunidadResult,
          titulosResult,
        ] = await Promise.allSettled([
            fetchJSON(`${API}/api/usuarios/${usuarioId}/favoritos`, { headers }),
            fetchJSON(`${API}/api/usuarios/${usuarioId}/puntos-propios`, {
              headers,
            }),
            fetchJSON(`${API}/api/usuarios/${usuarioId}/visitados`, { headers }),
            fetchJSON(`${API}/api/rutas/mis-realizadas`, { headers }),
            cargarInsigniasDesbloqueadas(API, perfilData),
            fetchJSON(`${API}/api/calificaciones/mias`, { headers }),
            fetchJSON(`${API}/api/ordenes/mis-ordenes`, { headers }),
            fetchJSON(`${API}/api/usuarios/comunidad`, { headers }),
            fetchJSON(`${API}/api/titulos/mios`, { headers }),
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
        setRutasRealizadas(
          rutasRealizadasResult.status === "fulfilled" &&
            Array.isArray(rutasRealizadasResult.value)
            ? rutasRealizadasResult.value
            : []
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
        setOrdenes(
          ordenesResult.status === "fulfilled" && Array.isArray(ordenesResult.value)
            ? ordenesResult.value
            : []
        );
        setComunidad(
          comunidadResult.status === "fulfilled" && comunidadResult.value
            ? comunidadResult.value
            : {
                seguidoresCount: perfilData.seguidoresCount || 0,
                siguiendoCount: perfilData.siguiendoCount || 0,
              }
        );
        setTitulosPerfil(
          titulosResult.status === "fulfilled" ? titulosResult.value : null
        );
      } catch (error) {
        if (!activo) return;
        if (error.status === 404) {
          navigate("/404", { replace: true });
          return;
        }
        navigate("/login");
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
  const rutasRealizadasCount = rutasRealizadas.length;
  const descripcionPerfil = normalizarDescripcionPerfil(perfil?.descripcion);
  const tituloActual = titulosPerfil?.tituloActual;
  const metricasPerfil = [
    {
      label: "Visitados",
      value: visitadosCount,
      highlight: true,
    },
    {
      label: "Insignias",
      value: insignias.length,
    },
    {
      label: "Favoritos",
      value: favoritos.length,
    },
    { label: "Propios", value: puntosPropios.length },
    {
      label: "Rutas",
      value: rutasRealizadasCount,
    },
  ].filter(Boolean);
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
    <div className="min-h-screen overflow-x-hidden bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-md lg:max-w-2xl">
          <section className="relative mt-16 rounded-3xl border border-uva/10 bg-white px-5 pb-6 pt-0 shadow-lg sm:px-6 lg:px-8">
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

            <div className="mt-3 flex justify-center gap-8">
              <IconAction
                icon={<Pencil size={19} />}
                label="Editar"
                onClick={() => navigate("/perfil/editar")}
              />
              <IconAction
                icon={<Settings size={19} />}
                label="Config"
                onClick={() => navigate("/perfil/configuracion")}
              />
            </div>

            <div className="mt-4 text-center">
              <p className="font-fredoka text-2xl font-semibold leading-tight text-morado drop-shadow-[0_1px_1px_rgba(76,25,69,0.35)]">
                {perfil.nombre || "Xendarian"}
              </p>
              <p className="mt-1 truncate text-sm text-uva">{perfil.email}</p>
            </div>

            {descripcionPerfil && (
              <p className="mx-auto mt-4 max-w-sm whitespace-pre-line break-words text-center text-sm font-semibold leading-relaxed text-uva/65">
                {descripcionPerfil}
              </p>
            )}

            <TituloPerfil titulo={tituloActual} />

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/comunidad")}
                className="flex max-w-[190px] items-center justify-center gap-2 rounded-full bg-morado/10 px-3 py-2 text-left text-uva ring-1 ring-morado/15"
                aria-label="Ir a comunidad"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-morado text-white shadow-sm">
                  <Search size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-fredoka text-base leading-none text-morado">
                    Comunidad
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold leading-tight text-uva/65">
                    <span>
                      <strong className="text-morado">
                        {comunidad.seguidoresCount || perfil?.seguidoresCount || 0}
                      </strong>{" "}
                      seguidores
                    </span>
                    <span>
                      <strong className="text-morado">
                        {comunidad.siguiendoCount || perfil?.siguiendoCount || 0}
                      </strong>{" "}
                      siguiendo
                    </span>
                  </span>
                </span>
              </button>
            </div>

            <div
              className="mt-5 grid divide-x divide-uva/10 border-y border-uva/10 py-4"
              style={{
                gridTemplateColumns: `repeat(${metricasPerfil.length}, minmax(0, 1fr))`,
              }}
            >
              {metricasPerfil.map((metrica) => (
                <Metric
                  key={metrica.label}
                  label={metrica.label}
                  value={metrica.value}
                  highlight={metrica.highlight}
                />
              ))}
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
                  onClick={() => navigate("/perfil/insignias")}
                  className="flex h-10 items-center gap-2 rounded-full bg-morado/10 px-3 text-sm font-bold text-morado"
                  aria-label="Ver álbum de insignias"
                  title="Ver álbum de insignias"
                >
                  <BookOpen size={18} />
                  <span>Ver álbum</span>
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

            {categoriaFavoritaInfo && (
              <section className="mt-6 border-t border-uva/10 pt-4">
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
              </section>
            )}

            <section className="hidden">
              <button
                type="button"
                onClick={() => navigate("/comunidad")}
                className="flex w-full items-center justify-between rounded-2xl bg-crema px-4 py-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
                  </span>
                  <span className="min-w-0">
                    <span className="block font-fredoka text-xl text-uva">
                      Comunidad
                    </span>
                    <span className="block text-xs font-semibold text-uva/60">
                      Buscá perfiles y seguí personas.
                    </span>
                  </span>
                </span>
                <span className="text-lg font-bold text-morado" aria-hidden="true">
                  {">"}
                </span>
              </button>
              <div className="mt-3 grid grid-cols-2 divide-x divide-uva/10 rounded-2xl border border-uva/10 bg-white py-3">
                <Metric
                  label="Seguidores"
                  value={comunidad.seguidoresCount || perfil?.seguidoresCount || 0}
                />
                <Metric
                  label="Siguiendo"
                  value={comunidad.siguiendoCount || perfil?.siguiendoCount || 0}
                />
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
              <ProfileToggle
                title="Compras"
                icon={<ShoppingBag className="text-morado" />}
                open={verCompras}
                onClick={() => setVerCompras((actual) => !actual)}
              >
                {ordenes.length === 0 ? (
                  <p className="px-4 py-3 text-center text-sm text-uva">
                    Todavia no tenes compras registradas.
                  </p>
                ) : (
                  <div className="divide-y divide-uva/10">
                    {ordenes.map((orden) => (
                      <CompraItem key={getId(orden)} orden={orden} />
                    ))}
                  </div>
                )}
              </ProfileToggle>

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
                icon={<Info size={20} className="text-morado" />}
                onClick={() => setModalSobreApp(true)}
              />

              <ProfileLink
                label="Soporte"
                icon={<LifeBuoy size={20} className="text-rosa" />}
                onClick={() => setModalSoporte(true)}
              />

              <button
                onClick={logout}
                className="w-full rounded-xl bg-rosa py-3 text-center font-bold text-white"
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

      <InfoPerfilModal
        open={modalSobreApp}
        onClose={() => setModalSobreApp(false)}
      />

      <SoportePerfilModal
        open={modalSoporte}
        onClose={() => setModalSoporte(false)}
      />

      <Navbar active="perfil" />
    </div>
  );
}

function InfoPerfilModal({ open, onClose }) {
  return (
    <ModalXendaria
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      header={
        <div className="bg-white px-5 pb-3 pt-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-morado/10 text-morado">
            <Info size={22} />
          </span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-uva/55">
            Sobre la app
          </p>
          <h2 className="font-fredoka text-3xl leading-tight text-morado">
            Xendaria
          </h2>
        </div>
      }
      contentClassName="bg-white px-5 pb-5"
    >
      <div className="space-y-3">
        <InfoModalItem
          icon={<MapPinned size={20} />}
          title="Exploración urbana"
          colorClassName="bg-morado/10 text-morado"
        >
          Xendaria te ayuda a descubrir puntos del mapa, rutas recomendadas,
          insignias y contenido desbloqueable mientras recorrés la ciudad.
        </InfoModalItem>

        <InfoModalItem
          icon={<ShieldCheck size={20} />}
          title="Privacidad de datos"
          colorClassName="bg-menta/35 text-uva"
        >
          Usamos tu ubicación solo para funciones de la app, como puntos cercanos,
          rutas, visitas e insignias. Desde configuraciones podés ajustar qué se
          muestra en tu perfil y ranking.
        </InfoModalItem>

        <InfoModalItem
          icon={<ShoppingBag size={20} />}
          title="Compras seguras"
          colorClassName="bg-vainilla/70 text-uva"
        >
          Las compras se procesan mediante MercadoPago. Xendaria guarda la orden
          para que puedas consultar el estado desde tu perfil.
        </InfoModalItem>
      </div>
    </ModalXendaria>
  );
}

function SoportePerfilModal({ open, onClose }) {
  return (
    <ModalXendaria
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      header={
        <div className="bg-white px-5 pb-3 pt-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rosa/25 text-uva">
            <LifeBuoy size={22} />
          </span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-uva/55">
            Soporte
          </p>
          <h2 className="font-fredoka text-3xl leading-tight text-morado">
            Estamos para ayudarte
          </h2>
        </div>
      }
      contentClassName="bg-white px-5 pb-5"
    >
      <div className="space-y-4 text-sm font-semibold leading-relaxed text-uva/75">
        <p>
          Somos una empresa pequeña en expansión, por lo que cualquier
          inconveniente con la app, pagos o demás podés contactarnos al mail:
        </p>

        <a
          href="mailto:xendariaoficial@gmail.com"
          className="flex items-center gap-3 rounded-2xl bg-crema px-4 py-3 font-extrabold text-morado shadow-sm ring-1 ring-uva/10"
        >
          <Mail size={20} className="shrink-0 text-rosa" />
          <span className="min-w-0 break-all">xendariaoficial@gmail.com</span>
        </a>

        <p>Responderemos a la brevedad posible.</p>
      </div>
    </ModalXendaria>
  );
}

function InfoModalItem({ icon, title, colorClassName, children }) {
  return (
    <section className="flex gap-3 rounded-3xl bg-crema px-4 py-4 ring-1 ring-uva/10">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClassName}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <h3 className="font-fredoka text-xl leading-tight text-morado">
          {title}
        </h3>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-uva/70">
          {children}
        </p>
      </span>
    </section>
  );
}

function IconAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-[42px] flex-col items-center justify-center px-1 text-morado"
      type="button"
    >
      {icon}
      <span className="text-[11px] font-bold leading-none text-morado">
        {label}
      </span>
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
        className="flex w-full items-center justify-between py-2 text-left text-uva"
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

function formatFechaCompra(fecha) {
  if (!fecha) return "Compra registrada";

  const fechaDate = new Date(fecha);
  if (Number.isNaN(fechaDate.getTime())) return "Compra registrada";

  return fechaDate.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getResumenCompra(orden) {
  const items = Array.isArray(orden.items) ? orden.items : [];
  const primerItem = items[0];
  const restantes = Math.max(items.length - 1, 0);

  if (!primerItem) return "Sin productos";
  if (restantes === 0) return primerItem.nombre || "Producto";

  return `${primerItem.nombre || "Producto"} + ${restantes} mas`;
}

function CompraItem({ orden }) {
  const items = Array.isArray(orden.items) ? orden.items : [];
  const primerItem = items[0] || {};
  const estado = String(orden.estado || "pagada").toLowerCase();
  const estadoLabel = {
    pagada: "Pagada",
    procesando: "Procesando",
    enviada: "Enviada",
  }[estado] || "Compra";

  return (
    <div className="flex min-w-0 items-center gap-3 py-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-morado/10 text-morado shadow-sm">
        {primerItem.imagen ? (
          <img
            src={primerItem.imagen}
            alt=""
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <PackageCheck size={24} />
        )}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-fredoka text-morado">
          {orden.numeroCompra || "Compra Xendaria"}
        </span>
        <span className="block truncate text-xs font-semibold text-uva">
          {getResumenCompra(orden)}
        </span>
        <span className="mt-1 block truncate text-[11px] font-bold text-uva/55">
          {formatFechaCompra(orden.createdAt)} · {estadoLabel}
        </span>
      </div>

      <span className="shrink-0 text-right font-fredoka text-lg leading-none text-morado">
        {precioPerfil(orden.total)}
      </span>
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

function ProfileLink({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-t border-uva/10 py-4 text-left text-uva"
      type="button"
    >
      <span className="inline-flex items-center gap-3 font-nunito font-semibold text-uva">
        {icon}
        {label}
      </span>
      <span aria-hidden="true">{">"}</span>
    </button>
  );
}
