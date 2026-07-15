import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Heart,
  Mail,
  MapPinned,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import AdminSearchBox from "../../components/AdminSearchBox.jsx";
import Alert from "../../components/Alertas.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import FilterPill from "../../components/FilterPill.jsx";
import AdminSegmentedTabs from "../../components/AdminSegmentedTabs.jsx";
import AdminSortableHeader from "../../components/AdminSortableHeader.jsx";

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
  const [error, setError] = useState(null);
  const [errorResumen, setErrorResumen] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [buscar, setBuscar] = useState("");
  const [buscarPuntos, setBuscarPuntos] = useState("");
  const [filtroFavoritos, setFiltroFavoritos] = useState(null);
  const [ordenUsuarios, setOrdenUsuarios] = useState({ campo: "", direccion: "" });
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token, inicia sesion.");
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

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    cargarResumenPuntosPropios();
  }, [cargarResumenPuntosPropios]);

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
    <AdminStyle title="Gestion de Usuarios">
      <div className="mb-6 border-b border-uva/10 pb-3">
        <AdminSegmentedTabs
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
              <AdminSearchBox
                value={buscar}
                onChange={(value) => {
                  setBuscar(value);
                  setPagina(1);
                }}
                placeholder="Buscar usuario"
                className="flex-1 sm:max-w-[360px] sm:flex-none"
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterPill
                  active={!filtroFavoritos}
                  onClick={() => {
                    setFiltroFavoritos(null);
                    setPagina(1);
                  }}
                >
                  Todos
                </FilterPill>
                <FilterPill
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
                </FilterPill>
                <FilterPill
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
                </FilterPill>
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
                      <AdminSortableHeader
                        active={ordenUsuarios.campo === "nombre"}
                        direction={ordenUsuarios.direccion}
                        onClick={() => cambiarOrdenUsuarios("nombre")}
                      >
                        Usuario
                      </AdminSortableHeader>
                    </th>
                    <th className="p-3">
                      <AdminSortableHeader
                        active={ordenUsuarios.campo === "email"}
                        direction={ordenUsuarios.direccion}
                        onClick={() => cambiarOrdenUsuarios("email")}
                      >
                        Email
                      </AdminSortableHeader>
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
                                  Sesion actual
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
                                  ? "No podes eliminar tu usuario actual"
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
      ) : (
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
              <AdminSearchBox
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
      )}

      <ConfirmModal
        open={Boolean(usuarioAEliminar)}
        title="Eliminar usuario"
        message={`Se va a eliminar el usuario "${
          usuarioAEliminar?.nombre || usuarioAEliminar?.email || ""
        }" y tambien sus puntos propios privados. Esta accion no se puede deshacer.`}
        confirmText={eliminando ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        danger
        onCancel={() => (eliminando ? null : setUsuarioAEliminar(null))}
        onConfirm={confirmarEliminarUsuario}
      />
    </AdminStyle>
  );
}
