import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";

import {
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  MapPin,
} from "lucide-react";

import FilterPanelAdmin from "../../layouts/FilterPanelAdmin.jsx";  
import { categorias } from "../../components/CategoriasFiltros.jsx";
import EncabezadoOrdenableAdmin from "../../components/EncabezadoOrdenableAdmin.jsx";
import PestanasAdmin from "../../components/PestanasAdmin.jsx";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

function getInsigniaUrl(punto = {}) {
  if (typeof punto.insignia === "string") return punto.insignia;
  return punto.insignia?.url || "";
}

function crearSlug(nombre = "") {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PuntosAdmin() {
  const API = import.meta.env.VITE_API_URL;

  // DATA
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // FILTROS
  const [buscar, setBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroInsignia, setFiltroInsignia] = useState(false);
  const [ordenPuntos, setOrdenPuntos] = useState({ campo: "", direccion: "" });
  const [tab, setTab] = useState("activos");

  // PAGINACIÓN
  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  const cargarPuntos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      setMensaje(null);

      const query = new URLSearchParams();

      if (buscar.trim() !== "") query.append("nombreContiene", buscar);
      if (filtroCategoria) query.append("categoria", filtroCategoria);
      query.append("incluirInactivos", "true");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/puntos?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setPuntos(Array.isArray(data) ? data : []);
      setPagina(1);
    } catch (err) {
      console.error("[cargarPuntos]", err);
      setError("No se pudieron cargar los puntos");
    } finally {
      setCargando(false);
    }
  }, [API, buscar, filtroCategoria]);

  useEffect(() => {
    cargarPuntos();
  }, [cargarPuntos]);

  // ELIMINAR
  async function eliminarPunto(id) {
    const confirmar = window.confirm("¿Seguro que querés eliminar este punto?");
    if (!confirmar) return;

    try {
      setMensaje(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/puntos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (res.ok) {
        setPuntos((prev) => prev.filter((p) => p._id !== id));
        setMensaje({ variant: "success", text: "Punto eliminado correctamente." });
      } else {
        setMensaje({ variant: "error", text: "No se pudo eliminar el punto." });
      }
    } catch {
      setMensaje({ variant: "error", text: "No se pudo eliminar el punto." });
    }
  }

  // PAGINACIÓN

  const puntosVisibles = useMemo(() => {
    const porEstado =
      tab === "inactivos"
        ? puntos.filter((punto) => punto.activo === false)
        : puntos.filter((punto) => punto.activo !== false);

    const base = filtroInsignia
      ? porEstado.filter((punto) => Boolean(getInsigniaUrl(punto)))
      : porEstado;

    if (!ordenPuntos.campo) return base;

    return [...base].sort((a, b) => {
      const valorA = String(
        ordenPuntos.campo === "direccion" ? a.direccion || "" : a.nombre || ""
      ).toLowerCase();
      const valorB = String(
        ordenPuntos.campo === "direccion" ? b.direccion || "" : b.nombre || ""
      ).toLowerCase();
      return ordenPuntos.direccion === "az"
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    });
  }, [filtroInsignia, ordenPuntos, puntos, tab]);

  const metricas = useMemo(
    () => ({
      activos: puntos.filter((punto) => punto.activo !== false).length,
      inactivos: puntos.filter((punto) => punto.activo === false).length,
    }),
    [puntos]
  );

  function cambiarOrdenPuntos(campo) {
    setOrdenPuntos((actual) => {
      if (actual.campo !== campo) return { campo, direccion: "az" };
      if (actual.direccion === "az") return { campo, direccion: "za" };
      return { campo: "", direccion: "" };
    });
    setPagina(1);
  }

  const inicio = (pagina - 1) * porPagina;
  const paginaActual = puntosVisibles.slice(inicio, inicio + porPagina);
  const totalPaginas = Math.ceil(puntosVisibles.length / porPagina);
  
  // RENDER
  return (
    <AdminStyle title="Gestión de Puntos">

      <div className="mb-5">
        <h2 className="font-fredoka text-3xl text-uva">
          {tab === "inactivos" ? "Puntos inactivos" : "Puntos activos"}
        </h2>
        <p className="text-sm text-uva/65">
          Administrá los lugares que verá el usuario en el mapa, filtros y detalle.
        </p>
      </div>

      <div className="mb-6 border-b border-uva/10 pb-4">
        <PestanasAdmin
          tabs={[
            {
              key: "activos",
              active: tab === "activos",
              icon: Eye,
              label: "Puntos activos",
              count: metricas.activos,
              onClick: () => {
                setTab("activos");
                setPagina(1);
              },
            },
            {
              key: "inactivos",
              active: tab === "inactivos",
              icon: EyeOff,
              label: "Puntos inactivos",
              count: metricas.inactivos,
              onClick: () => {
                setTab("inactivos");
                setPagina(1);
              },
            },
          ]}
        />
      </div>

      {/* PANEL DE FILTRO (TU COMPONENTE REAL) */}
      <FilterPanelAdmin
        buscar={buscar}
        setBuscar={(v) => {
          setBuscar(v);
          setPagina(1);
        }}
        filtroCategoria={filtroCategoria}
        setFiltroCategoria={(v) => {
          setFiltroCategoria(v);
          setPagina(1);
        }}
        filtroInsignia={filtroInsignia}
        setFiltroInsignia={(v) => {
          setFiltroInsignia(v);
          setPagina(1);
        }}
        crearTo="/admin/puntos/nuevopunto"
      />

      {mensaje && (
        <div className="mb-4">
          <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
        </div>
      )}

      {/* Loader */}
      {cargando && (
        <p className="text-center text-morado text-lg">Cargando puntos...</p>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* TABLA */}
      {!cargando && !error && (
        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
                <th className="px-3 py-4">
                  <EncabezadoOrdenableAdmin
                    active={ordenPuntos.campo === "nombre"}
                    direction={ordenPuntos.direccion}
                    onClick={() => cambiarOrdenPuntos("nombre")}
                  >
                    Nombre
                  </EncabezadoOrdenableAdmin>
                </th>
                <th className="p-3">Categoría</th>
                <th className="p-3">
                  <EncabezadoOrdenableAdmin
                    active={ordenPuntos.campo === "direccion"}
                    direction={ordenPuntos.direccion}
                    onClick={() => cambiarOrdenPuntos("direccion")}
                  >
                    Dirección
                  </EncabezadoOrdenableAdmin>
                </th>
                <th className="px-3 py-4">Coordenadas</th>
                <th className="px-3 py-4">Insignia</th>
                <th className="px-3 py-4 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginaActual.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-uva/10 transition hover:bg-crema/45"
                >
                  <td className="p-3 font-semibold">{p.nombre}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {getCategoriasPunto(p).map((cat) => {
                        const info = categorias[cat];
                        const Icon = info?.icon;

                        return (
                          <span
                            key={cat}
                            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold text-uva"
                            style={{
                              backgroundColor: `${info?.color || "#F4EFFF"}55`,
                              borderColor: info?.color || "#AA63E0",
                            }}
                          >
                            {Icon && <Icon size={13} />}
                            {info?.label || cat}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td className="p-3">{p.direccion || "-"}</td>

                  <td className="p-3 text-sm text-gray-700">
                    {p.lat && p.lon ? `${p.lat}, ${p.lon}` : "-"}
                  </td>

                  <td className="p-3">
                    {getInsigniaUrl(p) ? (
                      <img
                        src={getInsigniaUrl(p)}
                        alt={`Insignia de ${p.nombre}`}
                        className="h-11 w-11 rounded-full border-2 border-rosa/60 bg-crema object-cover shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-uva/35">-</span>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-3">

                      <Link
                        to={`/admin/puntos/editar/${crearSlug(p.nombre) || "punto"}/${p._id}`}
                        className="p-2 rounded-lg bg-morado/20 hover:bg-morado/30 text-morado transition"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </Link>

                      <button
                        onClick={() => eliminarPunto(p._id)}
                        className="p-2 rounded-lg bg-fucsia text-crema hover:bg-fucsia/80 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>

                      {p.activo !== false ? (
                        <Link
                          to={`/admin/mapa?punto=${p._id}`}
                          className="p-2 rounded-lg bg-uva/20 hover:bg-uva/30 text-uva transition"
                          title="Ver en mapa"
                        >
                          <MapPin size={18} />
                        </Link>
                      ) : (
                        <span
                          className="p-2 rounded-lg bg-uva/10 text-uva/35"
                          title="Los puntos inactivos no se muestran en el mapa"
                        >
                          <MapPin size={18} />
                        </span>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {puntosVisibles.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              {tab === "inactivos"
                ? "No hay puntos inactivos."
                : "No hay puntos activos."}
            </p>
          )}
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPaginas }).map((_, i) => {
            const n = i + 1;
            const activo = n === pagina;

            return (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`px-4 py-2 rounded-lg font-bold ${
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

    </AdminStyle>
  );
}
