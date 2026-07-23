import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Heart,
  Mail,
  MapPinned,
  Pencil,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import BuscadorAdmin from "../../components/BuscadorAdmin.jsx";
import Alert from "../../components/Alertas.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";
import PildoraFiltro from "../../components/PildoraFiltro.jsx";
import PestanasAdmin from "../../components/PestanasAdmin.jsx";
import EncabezadoOrdenableAdmin from "../../components/EncabezadoOrdenableAdmin.jsx";
import InterruptorActivoAdmin from "../../components/InterruptorActivoAdmin.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";

const FORM_TITULO_INICIAL = {
  _id: "",
  categoria: "puntos_populares",
  titulo: "",
  descripcion: "",
  umbral: 10,
  activo: true,
};

const CATEGORIAS_TITULOS_ESPECIALES = {
  sin_visitas: {
    label: "Sin visitas",
    color: "#F4EFFF",
    icon: Sparkles,
  },
  con_visitas_sin_titulo: {
    label: "Con visitas sin titulo",
    color: "#D8B6FF",
    icon: Sparkles,
  },
};

function getCategoriaTitulo(categoriaKey) {
  return categorias[categoriaKey] || CATEGORIAS_TITULOS_ESPECIALES[categoriaKey];
}

const OPCIONES_CATEGORIAS_TITULOS = [
  ...Object.entries(CATEGORIAS_TITULOS_ESPECIALES),
  ...Object.entries(categorias).filter(([key]) => key !== "propios"),
];

function normalizarBusqueda(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getAdminIdActual() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.id || usuario._id || "";
  } catch {
    return "";
  }
}

export default function UsuariosAdmin() {
  const API = import.meta.env.VITE_API_URL;
  const adminIdActual = getAdminIdActual();

  const [tab, setTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [resumenPuntosPropios, setResumenPuntosPropios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [cargandoTitulos, setCargandoTitulos] = useState(true);
  const [error, setError] = useState(null);
  const [errorResumen, setErrorResumen] = useState(null);
  const [errorTitulos, setErrorTitulos] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [titulos, setTitulos] = useState([]);
  const [formTitulo, setFormTitulo] = useState(FORM_TITULO_INICIAL);
  const [guardandoTitulo, setGuardandoTitulo] = useState(false);

  const [buscar, setBuscar] = useState("");
  const [buscarPuntos, setBuscarPuntos] = useState("");
  const [filtroFavoritos, setFiltroFavoritos] = useState(null);
  const [ordenUsuarios, setOrdenUsuarios] = useState({ campo: "", direccion: "" });
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [tituloAEliminar, setTituloAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token. Iniciá sesión nuevamente.");
        setUsuarios([]);
        return;
      }

      const query = new URLSearchParams();
      if (buscar.trim() !== "") query.append("nombreContiene", buscar.trim());
      if (filtroFavoritos) query.append("filtro", filtroFavoritos);

      const url = query.toString()
        ? `${API}/api/usuarios?${query.toString()}`
        : `${API}/api/usuarios`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("Error al cargar usuarios.");
        setUsuarios([]);
        return;
      }

      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
      setPagina(1);
    } catch (err) {
      console.error("[cargarUsuarios]", err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }, [API, buscar, filtroFavoritos]);

  const cargarResumenPuntosPropios = useCallback(async () => {
    try {
      setCargandoResumen(true);
      setErrorResumen(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setErrorResumen("No hay token para cargar puntos propios.");
        setResumenPuntosPropios([]);
        return;
      }

      const res = await fetch(`${API}/api/usuarios/admin/puntos-propios/resumen`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setErrorResumen("No se pudo cargar el resumen de puntos propios.");
        setResumenPuntosPropios([]);
        return;
      }

      const data = await res.json();
      setResumenPuntosPropios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[cargarResumenPuntosPropios]", err);
      setErrorResumen("No se pudo cargar el resumen de puntos propios.");
    } finally {
      setCargandoResumen(false);
    }
  }, [API]);

  const cargarTitulos = useCallback(async () => {
    try {
      setCargandoTitulos(true);
      setErrorTitulos(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setErrorTitulos("No hay token para cargar titulos.");
        setTitulos([]);
        return;
      }

      const res = await fetch(`${API}/api/titulos?incluirInactivos=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setErrorTitulos("No se pudieron cargar los titulos.");
        setTitulos([]);
        return;
      }

      const data = await res.json();
      setTitulos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[cargarTitulos]", err);
      setErrorTitulos("No se pudieron cargar los titulos.");
    } finally {
      setCargandoTitulos(false);
    }
  }, [API]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    cargarResumenPuntosPropios();
  }, [cargarResumenPuntosPropios]);

  useEffect(() => {
    cargarTitulos();
  }, [cargarTitulos]);

  async function guardarTitulo(event) {
    event.preventDefault();
    if (guardandoTitulo) return;

    try {
      setGuardandoTitulo(true);
      setMensaje(null);

      const token = localStorage.getItem("token");
      const editando = Boolean(formTitulo._id);
      const url = editando
        ? `${API}/api/titulos/${formTitulo._id}`
        : `${API}/api/titulos`;
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoria: formTitulo.categoria,
          titulo: formTitulo.titulo,
          descripcion: formTitulo.descripcion,
          umbral: Number(formTitulo.umbral),
          activo: formTitulo.activo,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar el titulo.");
      }

      setFormTitulo(FORM_TITULO_INICIAL);
      await cargarTitulos();
      setMensaje({
        variant: "success",
        text: editando ? "Titulo actualizado." : "Titulo creado.",
      });
    } catch (err) {
      setMensaje({
        variant: "error",
        text: err.message || "No se pudo guardar el titulo.",
      });
    } finally {
      setGuardandoTitulo(false);
    }
  }

  async function alternarEstadoTitulo(titulo) {
    if (!titulo?._id || guardandoTitulo) return;

    try {
      setGuardandoTitulo(true);
      setMensaje(null);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/titulos/${titulo._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoria: titulo.categoria,
          titulo: titulo.titulo,
          descripcion: titulo.descripcion || "",
          umbral: Number(titulo.umbral || 10),
          activo: titulo.activo === false,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo cambiar el estado del titulo.");
      }

      await cargarTitulos();
      if (formTitulo._id === titulo._id) {
        setFormTitulo((actual) => ({
          ...actual,
          activo: titulo.activo === false,
        }));
      }
      setMensaje({
        variant: "success",
        text: titulo.activo === false ? "Titulo activado." : "Titulo desactivado.",
      });
    } catch (err) {
      setMensaje({
        variant: "error",
        text: err.message || "No se pudo cambiar el estado del titulo.",
      });
    } finally {
      setGuardandoTitulo(false);
    }
  }

  async function confirmarEliminarTitulo() {
    if (!tituloAEliminar) return;

    try {
      setEliminando(true);
      setMensaje(null);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/titulos/${tituloAEliminar._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo eliminar el titulo.");
      }

      setTituloAEliminar(null);
      if (formTitulo._id === tituloAEliminar._id) {
        setFormTitulo(FORM_TITULO_INICIAL);
      }
      await cargarTitulos();
      setMensaje({ variant: "success", text: "Titulo eliminado." });
    } catch (err) {
      setMensaje({
        variant: "error",
        text: err.message || "No se pudo eliminar el titulo.",
      });
    } finally {
      setEliminando(false);
    }
  }

  async function confirmarEliminarUsuario() {
    if (!usuarioAEliminar) return;
    if (eliminando) return;

    try {
      setEliminando(true);
      setMensaje(null);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/usuarios/${usuarioAEliminar._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo eliminar el usuario.");
      }

      setUsuarios((prev) => prev.filter((u) => u._id !== usuarioAEliminar._id));
      setUsuarioAEliminar(null);
      await cargarResumenPuntosPropios();

      setMensaje({
        variant: "success",
        text: `Usuario eliminado. Puntos propios eliminados: ${
          data.puntosPropiosEliminados || 0
        }.`,
      });
    } catch (err) {
      setMensaje({
        variant: "error",
        text: err.message || "Error eliminando el usuario.",
      });
    } finally {
      setEliminando(false);
    }
  }

  const totalPuntosPropios = resumenPuntosPropios.reduce(
    (total, item) => total + item.total,
    0
  );

  const resumenFiltrado = useMemo(() => {
    const query = normalizarBusqueda(buscarPuntos);
    const base = !query
      ? resumenPuntosPropios
      : resumenPuntosPropios.filter((item) => {
          const datosUsuario = normalizarBusqueda(
            `${item.usuarioNombre || ""} ${item.usuarioEmail || ""}`
          );
          const datosPuntos = normalizarBusqueda(
            (item.puntos || []).map((punto) => punto.nombre).join(" ")
          );

          return datosUsuario.includes(query) || datosPuntos.includes(query);
        });

    return base;
  }, [buscarPuntos, resumenPuntosPropios]);

  const usuariosOrdenados = useMemo(() => {
    if (!ordenUsuarios.campo) return usuarios;

    return [...usuarios].sort((a, b) => {
      const valorA =
        ordenUsuarios.campo === "email"
          ? normalizarBusqueda(a.email)
          : normalizarBusqueda(a.nombre || a.email);
      const valorB =
        ordenUsuarios.campo === "email"
          ? normalizarBusqueda(b.email)
          : normalizarBusqueda(b.nombre || b.email);
      return ordenUsuarios.direccion === "az"
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    });
  }, [ordenUsuarios, usuarios]);

  function cambiarOrdenUsuarios(campo) {
    setOrdenUsuarios((actual) => {
      if (actual.campo !== campo) return { campo, direccion: "az" };
      if (actual.direccion === "az") return { campo, direccion: "za" };
      return { campo: "", direccion: "" };
    });
    setPagina(1);
  }

  const inicio = (pagina - 1) * porPagina;
  const paginaActual = usuariosOrdenados.slice(inicio, inicio + porPagina);
  const totalPaginas = Math.ceil(usuariosOrdenados.length / porPagina);

  return (
    <AdminStyle title="Gestión de usuarios">
      <div className="mb-6 border-b border-uva/10 pb-3">
        <PestanasAdmin
          tabs={[
            {
              key: "usuarios",
              active: tab === "usuarios",
              icon: Users,
              label: "Usuarios",
              count: usuarios.length,
              onClick: () => setTab("usuarios"),
            },
            {
              key: "puntos",
              active: tab === "puntos",
              icon: MapPinned,
              label: "Puntos propios",
              count: totalPuntosPropios,
              onClick: () => setTab("puntos"),
            },
            {
              key: "titulos",
              active: tab === "titulos",
              icon: Sparkles,
              label: "Titulos",
              count: titulos.length,
              onClick: () => setTab("titulos"),
            },
          ]}
        />
      </div>

      {mensaje && (
        <div className="mb-5 max-w-3xl">
          <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
        </div>
      )}

      {tab === "usuarios" ? (
        <>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <BuscadorAdmin
                value={buscar}
                onChange={(value) => {
                  setBuscar(value);
                  setPagina(1);
                }}
                placeholder="Buscar usuario"
                className="flex-1 sm:max-w-[360px] sm:flex-none"
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                <PildoraFiltro
                  active={!filtroFavoritos}
                  onClick={() => {
                    setFiltroFavoritos(null);
                    setPagina(1);
                  }}
                >
                  Todos
                </PildoraFiltro>
                <PildoraFiltro
                  active={filtroFavoritos === "Con favoritos"}
                  onClick={() => {
                    setFiltroFavoritos(
                      filtroFavoritos === "Con favoritos" ? null : "Con favoritos"
                    );
                    setPagina(1);
                  }}
                  color="#F28FA0"
                  icon={Heart}
                >
                  Con favoritos
                </PildoraFiltro>
                <PildoraFiltro
                  active={filtroFavoritos === "Sin favoritos"}
                  onClick={() => {
                    setFiltroFavoritos(
                      filtroFavoritos === "Sin favoritos" ? null : "Sin favoritos"
                    );
                    setPagina(1);
                  }}
                  color="#D1D1D1"
                  icon={Heart}
                >
                  Sin favoritos
                </PildoraFiltro>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm font-extrabold text-uva">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {usuariosOrdenados.length} usuarios
              </span>
            </div>
          </div>

          {cargando && (
            <p className="py-8 text-center text-lg font-bold text-morado">
              Cargando usuarios...
            </p>
          )}

          {error && (
            <div className="mb-5 max-w-3xl">
              <Alert>{error}</Alert>
            </div>
          )}

          {!cargando && !error && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
                    <th className="px-3 py-4">
                      <EncabezadoOrdenableAdmin
                        active={ordenUsuarios.campo === "nombre"}
                        direction={ordenUsuarios.direccion}
                        onClick={() => cambiarOrdenUsuarios("nombre")}
                      >
                        Usuario
                      </EncabezadoOrdenableAdmin>
                    </th>
                    <th className="p-3">
                      <EncabezadoOrdenableAdmin
                        active={ordenUsuarios.campo === "email"}
                        direction={ordenUsuarios.direccion}
                        onClick={() => cambiarOrdenUsuarios("email")}
                      >
                        Email
                      </EncabezadoOrdenableAdmin>
                    </th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Favoritos</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {paginaActual.map((usuario) => {
                    const esAdminActual = usuario._id === adminIdActual;

                    return (
                      <tr
                        key={usuario._id}
                        className="border-b border-uva/10 transition hover:bg-crema/45"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-crema text-morado">
                              <UserRound size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-uva">
                                {usuario.nombre || "Usuario sin nombre"}
                              </p>
                              {esAdminActual && (
                                <p className="text-xs font-bold text-morado">
                                  Sesión actual
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gris">
                            <Mail size={15} className="text-morado" />
                            <span className="truncate">{usuario.email || "-"}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                              usuario.role === "admin"
                                ? "bg-uva text-crema"
                                : "bg-crema text-uva"
                            }`}
                          >
                            <ShieldCheck size={13} />
                            {usuario.role || "user"}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa/25 px-3 py-1 text-sm font-extrabold text-uva">
                            <Heart size={14} />
                            {usuario.lugares_favoritos?.length || 0}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setUsuarioAEliminar(usuario)}
                              disabled={esAdminActual}
                              className={`rounded-lg p-2 transition ${
                                esAdminActual
                                  ? "cursor-not-allowed bg-uva/10 text-uva/35"
                                  : "bg-fucsia text-crema hover:bg-fucsia/80"
                              }`}
                              title={
                                esAdminActual
                                  ? "No podés eliminar tu usuario actual"
                                  : "Eliminar usuario"
                              }
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {usuarios.length === 0 && (
                <p className="py-8 text-center text-gray-500">
                  No hay usuarios cargados.
                </p>
              )}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPaginas }).map((_, i) => {
                const n = i + 1;
                const activo = n === pagina;

                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPagina(n)}
                    className={`rounded-lg px-4 py-2 font-bold ${
                      activo
                        ? "bg-uva text-crema"
                        : "bg-crema text-uva hover:bg-crema/70"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : tab === "puntos" ? (
        <>
          <div className="mb-5 flex flex-col items-start gap-3">
            <div>
              <h2 className="font-fredoka text-3xl text-uva">Puntos propios</h2>
              <p className="text-sm text-uva/65">
                Esta vista es solo de control: muestra nombres y cantidad de puntos
                creados por usuario, sin exponer ubicaciones.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BuscadorAdmin
                value={buscarPuntos}
                onChange={setBuscarPuntos}
                placeholder="Buscar usuario o punto"
                className="flex-1 sm:max-w-[380px] sm:flex-none"
              />
              <div className="flex flex-wrap gap-2 text-sm font-extrabold text-uva">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                  {resumenFiltrado.length} usuarios
                </span>
              </div>
            </div>
          </div>

          {cargandoResumen && (
            <p className="py-8 text-center text-lg font-bold text-morado">
              Cargando puntos propios...
            </p>
          )}

          {errorResumen && (
            <div className="mb-5 max-w-3xl">
              <Alert>{errorResumen}</Alert>
            </div>
          )}

          {!cargandoResumen && !errorResumen && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
                    <th className="px-3 py-4">Usuario</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Puntos propios</th>
                  </tr>
                </thead>

                <tbody>
                  {resumenFiltrado.map((item) => (
                    <tr
                      key={item.usuarioId}
                      className="border-b border-uva/10 transition hover:bg-crema/45"
                    >
                      <td className="p-3 font-extrabold text-uva">
                        {item.usuarioNombre}
                      </td>
                      <td className="p-3 text-sm font-semibold text-gris">
                        {item.usuarioEmail || "-"}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex rounded-full bg-morado px-3 py-1 text-sm font-extrabold text-crema">
                          {item.total}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(item.puntos) ? item.puntos : []).map(
                            (punto) => (
                              <span
                                key={punto.id}
                                className="rounded-full bg-crema px-3 py-1 text-xs font-bold text-uva"
                              >
                                {punto.nombre}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {resumenFiltrado.length === 0 && (
                <p className="py-8 text-center text-gray-500">
                  No hay puntos propios para mostrar.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <TitulosAdminSection
          titulos={titulos}
          formTitulo={formTitulo}
          setFormTitulo={setFormTitulo}
          cargando={cargandoTitulos}
          error={errorTitulos}
          guardando={guardandoTitulo}
          onSubmit={guardarTitulo}
          onEditar={(titulo) =>
            setFormTitulo({
              _id: titulo._id,
              categoria: titulo.categoria || "puntos_populares",
              titulo: titulo.titulo || "",
              descripcion: titulo.descripcion || "",
              umbral: titulo.umbral || 10,
              activo: titulo.activo !== false,
            })
          }
          onCancelar={() => setFormTitulo(FORM_TITULO_INICIAL)}
          onEliminar={setTituloAEliminar}
          onAlternarActivo={alternarEstadoTitulo}
        />
      )}

      <ModalConfirmacion
        open={Boolean(usuarioAEliminar)}
        title="Eliminar usuario"
        message={`Se va a eliminar el usuario "${
          usuarioAEliminar?.nombre || usuarioAEliminar?.email || ""
        }" y también sus puntos propios privados. Esta acción no se puede deshacer.`}
        confirmText={eliminando ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        danger
        onCancel={() => (eliminando ? null : setUsuarioAEliminar(null))}
        onConfirm={confirmarEliminarUsuario}
      />
      <ModalConfirmacion
        open={Boolean(tituloAEliminar)}
        title="Eliminar titulo"
        message={`Se va a eliminar "${tituloAEliminar?.titulo || ""}". Los usuarios no pierden visitas, solo deja de existir esta regla de titulo.`}
        confirmText={eliminando ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        danger
        onCancel={() => (eliminando ? null : setTituloAEliminar(null))}
        onConfirm={confirmarEliminarTitulo}
      />
    </AdminStyle>
  );
}

function TitulosAdminSection({
  titulos,
  formTitulo,
  setFormTitulo,
  cargando,
  error,
  guardando,
  onSubmit,
  onEditar,
  onCancelar,
  onEliminar,
  onAlternarActivo,
}) {
  function actualizarCampo(campo, valor) {
    setFormTitulo((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="font-fredoka text-3xl text-uva">Titulos por visitas</h2>
        <p className="max-w-3xl text-sm font-semibold text-uva/65">
          Defini los nombres que se desbloquean cuando una persona visita una
          cantidad minima de puntos en una categoria.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mb-6 rounded-3xl border border-uva/10 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1.2fr_0.55fr_auto] lg:items-end">
          <label className="text-sm font-extrabold text-uva">
            Categoria
            <select
              value={formTitulo.categoria}
              onChange={(event) => actualizarCampo("categoria", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-uva/15 bg-crema px-4 py-3 font-bold text-uva outline-none focus:border-morado"
            >
              {OPCIONES_CATEGORIAS_TITULOS
                .map(([key, categoria]) => (
                  <option key={key} value={key}>
                    {categoria.label}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-sm font-extrabold text-uva">
            Titulo
            <input
              value={formTitulo.titulo}
              onChange={(event) => actualizarCampo("titulo", event.target.value)}
              placeholder="Ej: Rey de las flores"
              className="mt-1 w-full rounded-2xl border border-uva/15 bg-crema px-4 py-3 font-bold text-uva outline-none focus:border-morado"
            />
          </label>

          <label className="text-sm font-extrabold text-uva">
            Visitas
            <input
              type="number"
              min="0"
              value={formTitulo.umbral}
              onChange={(event) => actualizarCampo("umbral", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-uva/15 bg-crema px-4 py-3 font-bold text-uva outline-none focus:border-morado"
            />
          </label>

          <div className="min-w-[150px]">
            <InterruptorActivoAdmin
              active={formTitulo.activo}
              onClick={() => actualizarCampo("activo", !formTitulo.activo)}
            />
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="text-sm font-extrabold text-uva">
            Descripcion breve
            <input
              value={formTitulo.descripcion}
              onChange={(event) => actualizarCampo("descripcion", event.target.value)}
              placeholder="Texto interno para entender el criterio."
              className="mt-1 w-full rounded-2xl border border-uva/15 bg-crema px-4 py-3 font-bold text-uva outline-none focus:border-morado"
            />
          </label>

          {formTitulo._id && (
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-2xl bg-crema px-5 py-3 font-extrabold text-uva"
            >
              Cancelar edicion
            </button>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="rounded-2xl bg-morado px-6 py-3 font-extrabold text-crema shadow-md transition active:scale-95 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : formTitulo._id ? "Guardar cambios" : "Crear titulo"}
          </button>
        </div>
      </form>

      {cargando && (
        <p className="py-8 text-center text-lg font-bold text-morado">
          Cargando titulos...
        </p>
      )}

      {error && (
        <div className="mb-5 max-w-3xl">
          <Alert>{error}</Alert>
        </div>
      )}

      {!cargando && !error && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
                <th className="px-3 py-4">Titulo</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Visitas</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {titulos.map((titulo) => {
                const categoria = getCategoriaTitulo(titulo.categoria);
                const Icon = categoria?.icon || Sparkles;

                return (
                  <tr
                    key={titulo._id}
                    className="border-b border-uva/10 transition hover:bg-crema/45"
                  >
                    <td className="p-3">
                      <p className="font-extrabold text-uva">{titulo.titulo}</p>
                      {titulo.descripcion && (
                        <p className="text-sm font-semibold text-uva/60">
                          {titulo.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-extrabold text-uva"
                        style={{
                          backgroundColor: categoria?.color
                            ? `${categoria.color}55`
                            : "#F4EFFF",
                          borderColor: categoria?.color || "#B05BE8",
                        }}
                      >
                        <Icon size={15} />
                        {categoria?.label || titulo.categoria}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-morado">
                      {titulo.umbral}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          titulo.activo !== false
                            ? "bg-menta/35 text-uva"
                            : "bg-crema text-uva/50"
                        }`}
                      >
                        {titulo.activo !== false ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAlternarActivo(titulo)}
                          className={`rounded-lg p-2 transition active:scale-95 ${
                            titulo.activo !== false
                              ? "bg-uva/20 text-uva hover:bg-uva/30"
                              : "bg-uva/10 text-uva/40 hover:bg-uva/20 hover:text-uva"
                          }`}
                          title={
                            titulo.activo !== false
                              ? "Desactivar titulo"
                              : "Activar titulo"
                          }
                          aria-label={
                            titulo.activo !== false
                              ? "Desactivar titulo"
                              : "Activar titulo"
                          }
                        >
                          {titulo.activo !== false ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditar(titulo)}
                          className="rounded-lg bg-morado/20 p-2 text-morado transition hover:bg-morado/30 active:scale-95"
                          title="Editar titulo"
                          aria-label="Editar titulo"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminar(titulo)}
                          className="rounded-lg bg-fucsia p-2 text-crema transition hover:bg-fucsia/80 active:scale-95"
                          title="Eliminar titulo"
                          aria-label="Eliminar titulo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {titulos.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              No hay titulos cargados.
            </p>
          )}
        </div>
      )}
    </>
  );
}
