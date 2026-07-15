import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";

export default function DetalleMerch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const token = localStorage.getItem("token");

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [requiereLogin, setRequiereLogin] = useState(false);

  const [color, setColor] = useState("");
  const [talle, setTalle] = useState("");
  const [diseno, setDiseno] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
      setRequiereLogin(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [mensaje]);

  useEffect(() => {
    async function cargarProducto() {
      try {
        setError("");

        const res = await fetch(`${API}/api/merch/${id}`);

        if (!res.ok) {
          throw new Error("No se pudo cargar el producto");
        }

        const data = await res.json();
        setProducto(data);
      } catch {
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    }

    cargarProducto();
  }, [API, id]);

  const variantes = useMemo(() => producto?.variantes ?? [], [producto]);

  const tieneColor = useMemo(
    () => variantes.some((v) => v.color),
    [variantes]
  );

  const tieneTalle = useMemo(
    () => variantes.some((v) => v.talle),
    [variantes]
  );

  const tieneDiseno = useMemo(
    () => variantes.some((v) => v.diseno),
    [variantes]
  );

  const coloresDisponibles = useMemo(() => {
    return [...new Set(variantes.map((v) => v.color).filter(Boolean))];
  }, [variantes]);

  const tallesDisponibles = useMemo(() => {
    const filtradas = variantes.filter((v) => {
      if (tieneColor && color && v.color !== color) return false;
      return !!v.talle;
    });

    return [...new Set(filtradas.map((v) => v.talle).filter(Boolean))];
  }, [variantes, color, tieneColor]);

  const disenosDisponibles = useMemo(() => {
    return [...new Set(variantes.map((v) => v.diseno).filter(Boolean))];
  }, [variantes]);

  const varianteSeleccionada = useMemo(() => {
    if (!variantes.length) return null;

    return (
      variantes.find((v) => {
        if (tieneColor && color && v.color !== color) return false;
        if (tieneTalle && talle && v.talle !== talle) return false;
        if (tieneDiseno && diseno && v.diseno !== diseno) return false;

        if (tieneColor && !color) return false;
        if (tieneTalle && !talle) return false;
        if (tieneDiseno && !diseno) return false;

        return true;
      }) || null
    );
  }, [variantes, color, talle, diseno, tieneColor, tieneTalle, tieneDiseno]);

  const faltanVariantesObligatorias =
    (tieneColor && !color) ||
    (tieneTalle && !talle) ||
    (tieneDiseno && !diseno);

  const stockDisponible = useMemo(() => {
    if (variantes.length > 0) {
      return varianteSeleccionada?.stock ?? null;
    }

    return producto?.stock ?? null;
  }, [variantes, varianteSeleccionada, producto]);

  const superaStockDisponible =
    stockDisponible !== undefined &&
    stockDisponible !== null &&
    cantidad > stockDisponible;

  async function agregarAlCarrito() {
    if (!token) {
      setMensaje("Tenés que iniciar sesión para agregar productos al carrito.");
      setRequiereLogin(true);
      return;
    }

    try {
      setMensaje("");
      setRequiereLogin(false);
      setAgregando(true);

      const variante = {};
      if (color) variante.color = color;
      if (talle) variante.talle = talle;
      if (diseno) variante.diseno = diseno;

      const body = {
        idProducto: producto._id,
        cantidad,
      };

      if (Object.keys(variante).length > 0) {
        body.variante = variante;
      }

      const res = await fetch(`${API}/api/carrito/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setMensaje("Tenés que iniciar sesión para agregar productos al carrito.");
        setRequiereLogin(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "No se pudo agregar al carrito");
      }

      window.dispatchEvent(new Event("carrito-actualizado"));
      setMensaje("Producto agregado al carrito");
    } catch (err) {
      setMensaje(err.message || "No se pudo agregar al carrito");
    } finally {
      setAgregando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-morado border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-uva/10 text-center text-uva">
          {error || "Producto no encontrado"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter={true} showCart={true} />
      </div>

      {mensaje && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2rem)] max-w-sm">
          <div className="bg-white border border-uva/10 text-uva rounded-2xl px-4 py-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <p>{mensaje}</p>

            {requiereLogin && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 text-morado font-semibold hover:underline"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <BotonCerrar onClick={() => navigate("/merch")} />
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-crema aspect-square">
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-3xl font-fredoka text-uva">
                  {producto.nombre}
                </h2>
                <p className="text-morado font-bold text-2xl mt-2">
                  ${producto.precio?.toLocaleString("es-AR")}
                </p>
              </div>

              <p className="text-gris leading-relaxed">
                {producto.descripcion}
              </p>

              {producto.alertaStock === "sin_stock" && (
                <div className="bg-rosa text-white px-4 py-2 rounded-xl font-semibold w-fit">
                  Sin stock
                </div>
              )}

              {producto.alertaStock === "ultima_unidad" && (
                <div className="bg-[#FFF7A8] text-uva px-4 py-2 rounded-xl font-semibold w-fit">
                  Última unidad disponible
                </div>
              )}

              {producto.alertaStock === "ultimas_unidades" && (
                <div className="bg-menta text-uva px-4 py-2 rounded-xl font-semibold w-fit">
                  Quedan pocas unidades
                </div>
              )}

              {tieneColor && (
                <div>
                  <label className="block text-sm font-semibold text-uva mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {coloresDisponibles.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => {
                          setColor(opcion);
                          setTalle("");
                        }}
                        className={`px-4 py-2 rounded-xl border font-medium transition ${
                          color === opcion
                            ? "bg-morado text-white border-morado"
                            : "bg-white text-uva border-uva/20"
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tieneTalle && (
                <div>
                  <label className="block text-sm font-semibold text-uva mb-2">
                    Talle
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tallesDisponibles.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => setTalle(opcion)}
                        className={`px-4 py-2 rounded-xl border font-medium transition ${
                          talle === opcion
                            ? "bg-morado text-white border-morado"
                            : "bg-white text-uva border-uva/20"
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tieneDiseno && (
                <div>
                  <label className="block text-sm font-semibold text-uva mb-2">
                    Diseño
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {disenosDisponibles.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => setDiseno(opcion)}
                        className={`px-4 py-2 rounded-xl border font-medium transition ${
                          diseno === opcion
                            ? "bg-morado text-white border-morado"
                            : "bg-white text-uva border-uva/20"
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-uva mb-2">
                  Cantidad
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                    className="w-11 h-11 rounded-xl border border-uva/20 bg-white text-uva text-xl font-bold flex items-center justify-center"
                  >
                    -
                  </button>

                  <div className="min-w-[52px] text-center text-lg font-bold text-uva">
                    {cantidad}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => prev + 1)}
                    className="w-11 h-11 rounded-xl border border-uva/20 bg-white text-uva text-xl font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {superaStockDisponible && (
                <div className="bg-[#FFF7A8] border border-uva/10 text-uva rounded-xl px-4 py-3 text-sm font-medium">
                  No contamos con esa cantidad disponible en este momento.
                </div>
              )}

              <button
                onClick={agregarAlCarrito}
                disabled={
                  agregando ||
                  producto.alertaStock === "sin_stock" ||
                  stockDisponible === 0 ||
                  faltanVariantesObligatorias ||
                  superaStockDisponible
                }
                className="mt-2 bg-fucsia text-white font-bold py-3 rounded-2xl hover:bg-fucsia/85 transition disabled:opacity-50"
              >
                {agregando ? "Agregando..." : "Agregar al carrito"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Navbar />
    </div>
  );
}