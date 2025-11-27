import { useEffect, useState } from "react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import { Trash2 } from "lucide-react";

export default function UsuariosAdmin() {
  const API = import.meta.env.VITE_API_URL;

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [buscar, setBuscar] = useState("");

  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  // usuarios  buscador
  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token, iniciá sesión.");
        setCargando(false);
        return;
      }

      const query = new URLSearchParams();
      if (buscar.trim() !== "") {
        query.append("nombreContiene", buscar.trim());
      }

      const url = query.toString()
        ? `${API}/api/usuarios?${query.toString()}`
        : `${API}/api/usuarios`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("Error al cargar usuarios.");
        setUsuarios([]);
        setCargando(false);
        return;
      }

      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
      setPagina(1);

    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, [buscar]);

  // Eliminar usuario
  async function eliminarUsuario(id) {
    const confirmar = window.confirm("¿Seguro que querés eliminar este usuario?");
    if (!confirmar) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUsuarios((prev) => prev.filter((u) => u._id !== id));
      } else {
        alert("No se pudo eliminar el usuario");
      }
    } catch (err) {
      alert("Error eliminando el usuario");
    }
  }

  // Paginación
  const inicio = (pagina - 1) * porPagina;
  const paginaActual = usuarios.slice(inicio, inicio + porPagina);
  const totalPaginas = Math.ceil(usuarios.length / porPagina);

  return (
    <AdminStyle title="Gestión de Usuarios">

      {/* BUSCADOR */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="
            w-full p-3 rounded-xl border border-uva/20
            focus:ring-2 focus:ring-morado/40 outline-none
            font-nunito
          "
        />
      </div>

      {cargando && (
        <p className="text-center text-morado text-lg">Cargando usuarios...</p>
      )}

      {error && (
        <p className="text-center text-red-500 font-semibold">{error}</p>
      )}

      {!cargando && !error && (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-xl p-4">

          {/* TABLA */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-crema border-b border-morado/20">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Favoritos</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginaActual.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-morado/10 hover:bg-crema/30 transition"
                >
                  <td className="p-3 font-semibold">{u.nombre}</td>

                  <td className="p-3">{u.email}</td>

                  <td className="p-3 capitalize">{u.role || "user"}</td>

                  <td className="p-3 font-bold">
                    {u.lugares_favoritos?.length || 0}
                  </td>

                  {/* TACHITO */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => eliminarUsuario(u._id)}
                      className="
                        p-2 rounded-lg bg-fucsia text-crema
                        hover:bg-fucsia/80 transition shadow
                      "
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              No hay usuarios cargados.
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
