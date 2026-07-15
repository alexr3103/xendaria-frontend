import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";

export default function Merch() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarProductos() {
      try {
        setError("");

        const res = await fetch(`${API}/api/merch`);

        if (!res.ok) {
          throw new Error("No se pudo cargar la merch");
        }

        const data = await res.json();
        setProductos(data);
      } catch {
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    }

    cargarProductos();
  }, [API]);

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter={true} showCart={true} />
      </div>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-fredoka text-uva">Merch Xendaria</h2>
          <p className="text-gris mt-2">
            Explorá los productos oficiales de la app.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-morado border-t-transparent rounded-full"></div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-rosa/30 text-uva rounded-2xl p-4 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && productos.length === 0 && (
          <div className="bg-white border border-uva/10 rounded-2xl p-6 text-center text-gris shadow-sm">
            No hay productos cargados por el momento.
          </div>
        )}

        {!loading && !error && productos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productos.map((producto) => (
              <button
                key={producto._id}
                onClick={() => navigate(`/merch/${producto._id}`)}
                className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 overflow-hidden text-left hover:scale-[1.01] transition"
              >
                <div className="aspect-square bg-crema overflow-hidden">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-fredoka text-lg text-uva">
                    {producto.nombre}
                  </h3>

                  <p className="text-sm text-gris mt-1 line-clamp-2">
                    {producto.descripcion}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-morado font-bold text-lg">
                      ${producto.precio?.toLocaleString("es-AR")}
                    </span>

                    {producto.alertaStock === "sin_stock" && (
                      <span className="text-xs font-bold text-white bg-rosa px-3 py-1 rounded-full">
                        Sin stock
                      </span>
                    )}

                    {producto.alertaStock === "ultima_unidad" && (
                      <span className="text-xs font-bold text-uva bg-[#FFF7A8] px-3 py-1 rounded-full">
                        Última unidad
                      </span>
                    )}

                    {producto.alertaStock === "ultimas_unidades" && (
                      <span className="text-xs font-bold text-uva bg-menta px-3 py-1 rounded-full">
                        Últimas unidades
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}