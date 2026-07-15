import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";

function renderVariante(variante) {
  if (!variante) return "";

  const partes = [
    variante.color ? `Color: ${variante.color}` : null,
    variante.talle ? `Talle: ${variante.talle}` : null,
    variante.diseno ? `Diseño: ${variante.diseno}` : null,
  ].filter(Boolean);

  return partes.join(" | ");
}

function calcularCostoEnvio(config, provincia, subtotal) {
  if (!provincia || !config) return null;
  if (subtotal >= config.envioGratisDesde) return 0;

  if (provincia === "capital_federal") return config.costos.capital_federal;
  if (provincia === "conurbano_buenos_aires") {
    return config.costos.conurbano_buenos_aires;
  }
  if (provincia === "buenos_aires") return config.costos.buenos_aires;

  return config.costos.resto_pais;
}

function labelProvincia(provincia) {
  const labels = {
    capital_federal: "Capital Federal",
    conurbano_buenos_aires: "GCBA",
    buenos_aires: "Buenos Aires",
    resto_pais: "Resto del país",
  };

  return labels[provincia] || provincia;
}

export default function Carrito() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [carrito, setCarrito] = useState(null);
  const [configEnvios, setConfigEnvios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const [mostrarEnvio, setMostrarEnvio] = useState(false);
  const [provinciaEnvio, setProvinciaEnvio] = useState("");

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 1500);

    return () => clearTimeout(timer);
  }, [mensaje]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function cargarDatos() {
      try {
        setError("");

        const [resCarrito, resEnvios] = await Promise.all([
          fetch(`${API}/api/carrito`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API}/api/envios`),
        ]);

        if (resCarrito.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          navigate("/login");
          return;
        }

        if (!resCarrito.ok) {
          throw new Error("No se pudo cargar el carrito");
        }

        if (!resEnvios.ok) {
          throw new Error("No se pudo cargar la configuración de envíos");
        }

        const dataCarrito = await resCarrito.json();
        const dataEnvios = await resEnvios.json();

        setCarrito(
          dataCarrito || {
            items: [],
            total: 0,
          }
        );

        setConfigEnvios(dataEnvios);
      } catch (err) {
        setError(err.message || "No se pudo cargar el carrito");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [API, navigate, token]);

  async function cambiarCantidad(item, nuevaCantidad) {
    if (nuevaCantidad < 1) return;

    try {
      setMensaje("");
      setActualizando(true);

      const body = {
        cantidad: nuevaCantidad,
      };

      if (item.variante) {
        body.variante = item.variante;
      }

      const res = await fetch(`${API}/api/carrito/items/${item.idProducto}`, {
        method: "PATCH",
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
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar la cantidad");
      }

      setCarrito(
        data || {
          items: [],
          total: 0,
        }
      );

      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (err) {
      setMensaje(err.message || "No se pudo actualizar la cantidad");
    } finally {
      setActualizando(false);
    }
  }

  async function eliminarItem(item) {
    try {
      setMensaje("");
      setActualizando(true);

      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (item.variante) {
        options.body = JSON.stringify({ variante: item.variante });
      }

      const res = await fetch(`${API}/api/carrito/items/${item.idProducto}`, options);
      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }

      setCarrito(
        data || {
          items: [],
          total: 0,
        }
      );

      window.dispatchEvent(new Event("carrito-actualizado"));
    } catch (err) {
      setMensaje(err.message || "No se pudo eliminar el producto");
    } finally {
      setActualizando(false);
    }
  }

  const items = carrito?.items ?? [];
  const subtotal = carrito?.total ?? 0;

  const costoEnvioEstimado = useMemo(() => {
    return calcularCostoEnvio(configEnvios, provinciaEnvio, subtotal);
  }, [configEnvios, provinciaEnvio, subtotal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-morado border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-uva/10 text-center text-uva">
          {error}
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
          <div className="bg-white border border-uva/10 text-uva rounded-2xl px-4 py-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.12)] text-center">
            {mensaje}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-fredoka text-uva">Tu carrito</h2>
          <BotonCerrar onClick={() => navigate("/merch")} />
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-uva/10 p-8 text-center">
            <p className="text-gris mb-2 font-semibold">Tu carrito está vacío</p>
            <p className="text-sm text-gris mb-4">
              Explorá la merch para agregar productos a tu compra.
            </p>
            <button
              onClick={() => navigate("/merch")}
              className="bg-morado text-white font-bold px-5 py-3 rounded-2xl hover:bg-uva transition"
            >
              Ver merch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-4">
              {items.map((item, index) => (
                <div
                  key={`${item.idProducto}-${index}-${renderVariante(item.variante)}`}
                  className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 p-4"
                >
                  <div className="flex gap-4 items-start">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-24 h-24 rounded-2xl object-cover bg-crema"
                    />

                    <div className="flex-1">
                      <h3 className="font-fredoka text-lg text-uva">
                        {item.nombre}
                      </h3>

                      {item.variante && (
                        <p className="text-sm text-gris mt-1">
                          {renderVariante(item.variante)}
                        </p>
                      )}

                      <p className="text-morado font-bold mt-2">
                        ${item.precioUnitario?.toLocaleString("es-AR")}
                      </p>

                      <div className="flex items-center gap-3 mt-4">
                        <button
                          type="button"
                          disabled={actualizando}
                          onClick={() => cambiarCantidad(item, item.cantidad - 1)}
                          className="w-10 h-10 rounded-xl border border-uva/20 bg-white text-uva text-xl font-bold flex items-center justify-center disabled:opacity-50"
                        >
                          -
                        </button>

                        <div className="min-w-[42px] text-center text-lg font-bold text-uva">
                          {item.cantidad}
                        </div>

                        <button
                          type="button"
                          disabled={actualizando}
                          onClick={() => cambiarCantidad(item, item.cantidad + 1)}
                          className="w-10 h-10 rounded-xl border border-uva/20 bg-white text-uva text-xl font-bold flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          disabled={actualizando}
                          onClick={() => eliminarItem(item)}
                          className="ml-auto w-10 h-10 rounded-xl border border-uva/20 bg-white text-rosa hover:text-fucsia transition disabled:opacity-50 flex items-center justify-center"
                          aria-label="Eliminar producto"
                          title="Eliminar producto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 p-5 h-fit relative">
              <h3 className="font-fredoka text-xl text-uva mb-4">
                Resumen
              </h3>

              <div className="mb-4">
                <p className="text-gris font-semibold mb-3">Productos</p>

                <div className="flex flex-col gap-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.idProducto}-resumen-${index}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-gris leading-snug">
                        {item.cantidad} {item.nombre}
                      </span>
                      <span className="text-uva font-semibold whitespace-nowrap">
                        ${item.subtotal?.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-gris mb-3 pt-3 border-t border-uva/10">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>

              <div className="flex items-center justify-between text-gris mb-3">
                <span>Envío</span>
                <button
                  type="button"
                  onClick={() => setMostrarEnvio(true)}
                  className="text-sm text-morado font-semibold hover:underline"
                >
                  Calcular envío
                </button>
              </div>

              <div className="flex items-center justify-between text-uva font-bold text-xl pt-4 border-t border-uva/10">
                <span>Total estimado</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>

              <p className="text-xs text-gris mt-3 leading-relaxed">
                El costo de envío se calcula según la ubicación al momento de finalizar la compra.
              </p>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-fucsia text-white font-bold py-3 rounded-2xl hover:bg-fucsia/85 transition"
              >
                Continuar compra
              </button>

              {mostrarEnvio && (
                <div className="absolute inset-0 bg-black/10 rounded-3xl flex items-center justify-center p-4">
                  <div className="w-full bg-white border border-uva/10 rounded-2xl shadow-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-fredoka text-lg text-uva">
                        Calcular envío
                      </h4>
                      <button
                        type="button"
                        onClick={() => setMostrarEnvio(false)}
                        className="text-uva font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <label className="block text-sm font-semibold text-uva mb-2">
                      Provincia / zona
                    </label>

                    <select
                      value={provinciaEnvio}
                      onChange={(e) => setProvinciaEnvio(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-uva/20 outline-none text-uva"
                    >
                      <option value="">Seleccionar</option>
                      <option value="capital_federal">Capital Federal</option>
                      <option value="conurbano_buenos_aires">GCBA</option>
                      <option value="buenos_aires">Buenos Aires</option>
                      <option value="resto_pais">Resto del país</option>
                    </select>

                    {provinciaEnvio && costoEnvioEstimado !== null && (
                      <div className="mt-4 bg-crema border border-uva/10 rounded-xl px-4 py-3">
                        <p className="text-sm text-gris">
                          Zona seleccionada:{" "}
                          <span className="font-semibold text-uva">
                            {labelProvincia(provinciaEnvio)}
                          </span>
                        </p>

                        <p className="text-sm text-gris mt-2">
                          Costo estimado:{" "}
                          <span className="font-bold text-uva">
                            {costoEnvioEstimado === 0
                              ? "Envío gratis"
                              : `$${costoEnvioEstimado.toLocaleString("es-AR")}`}
                          </span>
                        </p>
                      </div>
                    )}

                    {configEnvios?.envioGratisDesde ? (
                      <p className="text-xs text-gris mt-4 leading-relaxed">
                        Envío gratis en compras desde $
                        {configEnvios.envioGratisDesde.toLocaleString("es-AR")}.
                      </p>
                    ) : (
                      <p className="text-xs text-gris mt-4 leading-relaxed">
                        Este valor es estimado y no se suma todavía al total del carrito.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}