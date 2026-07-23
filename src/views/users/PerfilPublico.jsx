import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Heart, UserCheck, UserPlus } from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import Alert from "../../components/Alertas.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
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
  return String(valor._id || valor.id || valor);
}

function getIdPuntoVisitado(valor) {
  if (!valor) return "";
  if (valor.punto && typeof valor.punto === "object") return getId(valor.punto);
  return getId(valor.idPunto || valor.punto || valor.puntoId || valor);
}

function getCantidadVisitados(perfil) {
  const lista = Array.isArray(perfil?.puntos_visitados)
    ? perfil.puntos_visitados
    : [];
  const idsUnicos = new Set(lista.map(getIdPuntoVisitado).filter(Boolean));
  return idsUnicos.size || lista.length || 0;
}

function normalizarDescripcion(descripcion) {
  const texto = String(descripcion || "").trim();
  if (!texto) return "";
  return texto.length > 150 ? `${texto.slice(0, 147).trim()}...` : texto;
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

export default function PerfilPublico() {
  const { id } = useParams();
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const usuarioLocal = useMemo(getUsuarioLocal, []);

  const [perfil, setPerfil] = useState(null);
  const [comunidad, setComunidad] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [titulosPerfil, setTitulosPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (String(usuarioLocal?.id || usuarioLocal?._id) === String(id)) {
      navigate("/perfil", { replace: true });
    }
  }, [id, navigate, token, usuarioLocal]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      if (!API || !token || !id) return;

      setLoading(true);
      setMensaje(null);

      try {
        const [perfilData, comunidadData] = await Promise.all([
          fetchJSON(`${API}/api/usuarios/${id}`, { headers }),
          fetchJSON(`${API}/api/usuarios/comunidad`, { headers }),
        ]);

        if (!activo) return;
        let titulosData = null;
        try {
          titulosData = await fetchJSON(`${API}/api/titulos/usuario/${id}`, {
            headers,
          });
        } catch {
          titulosData = null;
        }

        let favoritosData = [];
        if (Array.isArray(perfilData.lugares_favoritos)) {
          try {
            favoritosData = await fetchJSON(`${API}/api/usuarios/${id}/favoritos`, {
              headers,
            });
          } catch {
            favoritosData = [];
          }
        }

        if (!activo) return;
        setPerfil(perfilData);
        setComunidad(comunidadData);
        setFavoritos(Array.isArray(favoritosData) ? favoritosData : []);
        setTitulosPerfil(titulosData);
      } catch (error) {
        if (!activo) return;
        if (error.status === 404) {
          navigate("/404", { replace: true });
          return;
        }
        setMensaje({
          variant: "error",
          text: error.message || "No se pudo cargar el perfil.",
        });
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [API, headers, id, navigate, token]);

  const loSigo = Boolean(
    comunidad?.siguiendo?.some((usuario) => usuario._id === perfil?._id)
  );
  const descripcion = normalizarDescripcion(perfil?.descripcion);
  const perfilPublico = perfil?.configuracion?.perfilPublico !== false;
  const categoriaFavorita = perfil?.configuracion?.categoriaFavorita;
  const categoriaFavoritaInfo = categorias[categoriaFavorita];
  const categoriaFavoritaImagen = getCategoriaImagen(categoriaFavorita);
  const tituloActual = titulosPerfil?.tituloActual;
  const favoritosVisibles = Array.isArray(perfil?.lugares_favoritos);
  const albumInsigniasVisible =
    perfilPublico && perfil?.configuracion?.mostrarAlbumInsigniasPerfil !== false;
  const insignias = Array.isArray(perfil?.insignias)
    ? perfil.insignias.map(normalizarInsignia).filter((insignia) => insignia.imagen)
    : [];
  const metricas = [
    Array.isArray(perfil?.puntos_visitados) && {
      label: "Visitados",
      value: getCantidadVisitados(perfil),
      highlight: true,
    },
    Array.isArray(perfil?.insignias) && {
      label: "Insignias",
      value: insignias.length,
    },
    favoritosVisibles && {
      label: "Favoritos",
      value: favoritos.length || perfil.lugares_favoritos.length,
    },
    {
      label: "Seguidores",
      value: perfil?.seguidoresCount || 0,
    },
  ].filter(Boolean);

  async function toggleSeguir() {
    if (!perfil?._id || procesando) return;

    setProcesando(true);
    setMensaje(null);

    try {
      const data = await fetchJSON(
        `${API}/api/usuarios/comunidad/${perfil._id}/seguir`,
        {
          method: loSigo ? "DELETE" : "POST",
          headers,
        }
      );

      setPerfil((actual) => ({
        ...actual,
        seguidoresCount: data.usuario?.seguidoresCount ?? actual.seguidoresCount,
      }));

      const comunidadActualizada = await fetchJSON(`${API}/api/usuarios/comunidad`, {
        headers,
      });
      setComunidad(comunidadActualizada);
    } catch (error) {
      if (error.status === 404) {
        navigate("/404", { replace: true });
        return;
      }
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo actualizar tu comunidad.",
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      {loading ? (
        <CargadorMapa text="Cargando perfil..." className="top-24 z-[999]" />
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-md lg:max-w-2xl">
            {mensaje && (
              <div className="mb-4">
                <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
              </div>
            )}

            {perfil ? (
              <section className="relative mt-16 rounded-3xl border border-uva/10 bg-white px-5 pb-6 pt-0 shadow-lg sm:px-6 lg:px-8">
                <div className="absolute right-0 top-0 z-20 translate-x-[30%] -translate-y-[30%] sm:translate-x-1/2 sm:-translate-y-1/2">
                  <BotonCerrar onClick={() => navigate("/comunidad")} />
                </div>

                <div className="mb-3 flex justify-center -mt-16">
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-menta" />
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
                  <p className="font-fredoka text-2xl leading-tight text-morado">
                    {perfil.nombre || "Xendarian"}
                  </p>
                  {descripcion && (
                    <p className="mx-auto mt-4 max-w-sm whitespace-pre-line break-words text-center text-sm font-semibold leading-relaxed text-uva/65">
                      {descripcion}
                    </p>
                  )}
                  <TituloPerfil titulo={tituloActual} />
                </div>

                <div className="mt-5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={toggleSeguir}
                    disabled={procesando || !perfilPublico}
                    className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition disabled:opacity-60 ${
                      loSigo
                        ? "bg-menta/35 text-uva ring-1 ring-menta"
                        : "bg-morado text-white shadow-md"
                    }`}
                  >
                    {loSigo ? <UserCheck size={18} /> : <UserPlus size={18} />}
                    {loSigo ? "Siguiendo" : "Seguir"}
                  </button>
                </div>

                {!perfilPublico && (
                  <p className="mt-4 rounded-2xl bg-crema px-4 py-3 text-center text-sm font-bold text-uva/65">
                    Este perfil mantiene su actividad privada.
                  </p>
                )}

                {metricas.length > 0 && (
                  <div
                    className="mt-5 grid divide-x divide-uva/10 border-y border-uva/10 py-4"
                    style={{
                      gridTemplateColumns: `repeat(${metricas.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {metricas.map((metrica) => (
                      <Metric
                        key={metrica.label}
                        label={metrica.label}
                        value={metrica.value}
                        highlight={metrica.highlight}
                      />
                    ))}
                  </div>
                )}

                {favoritosVisibles && (
                  <section className="mt-6 border-t border-uva/10 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rosa/20 text-fucsia">
                        <Heart size={18} />
                      </span>
                      <h2 className="font-fredoka text-2xl text-morado">
                        Favoritos
                      </h2>
                    </div>

                    {favoritos.length === 0 ? (
                      <p className="rounded-2xl bg-crema px-4 py-3 text-sm font-bold text-uva/65">
                        Este perfil no tiene favoritos públicos todavía.
                      </p>
                    ) : (
                      <div className="divide-y divide-uva/10">
                        {favoritos.slice(0, 5).map((favorito) => (
                          <FavoritoPublicoItem
                            key={getId(favorito)}
                            favorito={favorito}
                            onOpen={() => navigate(`/punto/${getId(favorito)}`)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {(insignias.length > 0 || albumInsigniasVisible) && (
                  <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-fredoka text-2xl text-morado">
                        Ultimas insignias
                      </h2>
                      {albumInsigniasVisible && (
                        <button
                          type="button"
                          onClick={() => navigate(`/perfil/${id}/insignias`)}
                          className="flex h-10 items-center gap-2 rounded-full bg-morado/10 px-3 text-sm font-bold text-morado"
                          aria-label="Ver álbum de insignias"
                          title="Ver álbum de insignias"
                        >
                          <BookOpen size={18} />
                          <span>Ver álbum</span>
                        </button>
                      )}
                    </div>
                    {insignias.length > 0 ? (
                      <div className="flex justify-center gap-4">
                        {insignias.slice(-3).reverse().map((insignia) => (
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
                      <p className="rounded-2xl bg-crema px-4 py-3 text-center text-sm font-bold text-uva/65">
                        Todavía no hay insignias desbloqueadas.
                      </p>
                    )}
                  </section>
                )}

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
              </section>
            ) : (
              <Alert variant="error">No se pudo mostrar este perfil.</Alert>
            )}
          </div>
        </main>
      )}

      <Navbar active="perfil" />
    </div>
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

function FavoritoPublicoItem({ favorito, onOpen }) {
  const categoria = categorias[favorito.categoria];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 items-center gap-3 py-3 text-left"
    >
      <img
        src={favorito.foto || cargafail}
        alt={favorito.nombre || "Favorito"}
        onError={(event) => {
          event.currentTarget.src = cargafail;
        }}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-fredoka text-lg leading-tight text-morado">
          {favorito.nombre || "Punto sin nombre"}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-uva/65">
          {categoria?.label || favorito.categoria || "Categoría"}
        </span>
      </span>
    </button>
  );
}
