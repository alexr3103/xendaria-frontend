import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminStyle from "../../layouts/AdminStyle.jsx";

import {
  Pencil,
  Trash2,
  MapPin,
  SlidersHorizontal,
  Search,
} from "lucide-react";

import FilterPanelAdmin from "../../layouts/FilterPanelAdmin.jsx";  
import { categorias } from "../../components/CategoriasFiltros.jsx";

export default function PuntosAdmin() {
  const API = import.meta.env.VITE_API_URL;

  // DATA
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // FILTROS
  const [buscar, setBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  // PAGINACIÓN
  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  async function cargarPuntos() {
    try {
      setCargando(true);

      const query = new URLSearchParams();

      if (buscar.trim() !== "") query.append("nombreContiene", buscar);
      if (filtroCategoria) query.append("categoria", filtroCategoria);

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
      setError("No se pudieron cargar los puntos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPuntos();
  }, [buscar, filtroCategoria]);

  // ELIMINAR
  async function eliminarPunto(id) {
    const confirmar = window.confirm("¿Seguro que querés eliminar este punto?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API}/api/puntos/${id}`, { 
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  }
});


      if (res.ok) {
        setPuntos((prev) => prev.filter((p) => p._id !== id));
      }
    } catch {
      alert("Error eliminando el punto");
    }
  }

  // PAGINACIÓN

  const inicio = (pagina - 1) * porPagina;
  const paginaActual = puntos.slice(inicio, inicio + porPagina);
  const totalPaginas = Math.ceil(puntos.length / porPagina);
  
  // RENDER
  return (
    <AdminStyle title="Gestión de Puntos">

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
      />

      {/* NUEVO PUNTO */}
      <div className="flex justify-end mb-6">
        <Link
          to="/admin/puntos/nuevopunto"
          className="flex items-center gap-2 bg-morado text-crema px-4 py-2 rounded-xl shadow hover:bg-morado/80 transition"
        >
          + Nuevo Punto
        </Link>
      </div>

      {/* Loader */}
      {cargando && (
        <p className="text-center text-morado text-lg">Cargando puntos...</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-center text-red-500 font-semibold">{error}</p>
      )}

      {/* TABLA */}
      {!cargando && !error && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-xl p-4">

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-crema border-b border-morado/20">
                <th className="p-3">Nombre</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Dirección</th>
                <th className="p-3">Coordenadas</th>
                <th className="p-3 text-gray-400 italic">Insignia</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginaActual.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-morado/10 hover:bg-crema/30 transition"
                >
                  <td className="p-3 font-semibold">{p.nombre}</td>

                  <td className="p-3 capitalize flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full inline-block"
                      style={{ backgroundColor: categorias[p.categoria]?.color }}
                    />
                    {categorias[p.categoria]?.label}
                  </td>

                  <td className="p-3">{p.direccion || "-"}</td>

                  <td className="p-3 text-sm text-gray-700">
                    {p.lat && p.lon ? `${p.lat}, ${p.lon}` : "-"}
                  </td>

                  <td className="p-3 text-center text-gray-400">—</td>

                  <td className="p-3">
                    <div className="flex justify-center gap-3">

                      <Link
                        to={`/admin/puntos/${p._id}`}
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

                      <Link
                        to={`/admin/mapa?punto=${p._id}`}
                        className="p-2 rounded-lg bg-uva/20 hover:bg-uva/30 text-uva transition"
                        title="Ver en mapa"
                      >
                        <MapPin size={18} />
                      </Link>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {puntos.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              No hay puntos cargados.
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
