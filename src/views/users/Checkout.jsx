import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";

function calcularCostoEnvio(config, provincia, subtotal) {
  if (!provincia || !config) return 0;
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
    catamarca: "Catamarca",
    chaco: "Chaco",
    chubut: "Chubut",
    cordoba: "Córdoba",
    corrientes: "Corrientes",
    entre_rios: "Entre Ríos",
    formosa: "Formosa",
    jujuy: "Jujuy",
    la_pampa: "La Pampa",
    la_rioja: "La Rioja",
    mendoza: "Mendoza",
    misiones: "Misiones",
    neuquen: "Neuquén",
    rio_negro: "Río Negro",
    salta: "Salta",
    san_juan: "San Juan",
    san_luis: "San Luis",
    santa_cruz: "Santa Cruz",
    santa_fe: "Santa Fe",
    santiago_del_estero: "Santiago del Estero",
    tierra_del_fuego: "Tierra del Fuego",
    tucuman: "Tucumán",
  };

  return labels[provincia] || provincia;
}

function renderVariante(variante) {
  if (!variante) return "";

  const partes = [
    variante.color ? `Color: ${variante.color}` : null,
    variante.talle ? `Talle: ${variante.talle}` : null,
    variante.diseno ? `Diseño: ${variante.diseno}` : null,
  ].filter(Boolean);

  return partes.join(" | ");
}

export default function Checkout() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [carrito, setCarrito] = useState(null);
  const [configEnvios, setConfigEnvios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  const [form, setForm] = useState({
    nombreCompleto: "",
    telefono: "",
    calle: "",
    numero: "",
    pisoDepto: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    referencias: "",
  });

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
          throw new Error("No se pudo cargar el checkout");
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
        setError(err.message || "No se pudo cargar el checkout");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [API, navigate, token]);

  const items = carrito?.items ?? [];
  const subtotal = carrito?.total ?? 0;

  const costoEnvio = useMemo(() => {
    return calcularCostoEnvio(configEnvios, form.provincia, subtotal);
  }, [configEnvios, form.provincia, subtotal]);

  const totalFinal = subtotal + costoEnvio;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function finalizarCompra() {
    try {
      setMensaje("");
      setProcesando(true);

      const bodyCheckout = {
        datosEnvio: form,
      };

      const resPreferencia = await fetch(`${API}/api/ordenes/preferencia-mercadopago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyCheckout),
      });

      const dataPreferencia = await resPreferencia.json();

      if (resPreferencia.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        navigate("/login");
        return;
      }

      if (!resPreferencia.ok) {
        throw new Error(
          dataPreferencia.message || "No se pudo generar el pago"
        );
      }

      const usarSandbox = import.meta.env.VITE_MP_SANDBOX === "true";
      const urlPago = usarSandbox
        ? dataPreferencia.sandbox_init_point || dataPreferencia.init_point
        : dataPreferencia.init_point || dataPreferencia.sandbox_init_point;

      if (urlPago) {
        window.location.href = urlPago;
        return;
      }

      throw new Error("No se recibió la URL de pago");
    } catch (err) {
      setMensaje(err.message || "No se pudo finalizar la compra");
    } finally {
      setProcesando(false);
    }
  }

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-uva/10 text-center">
          <p className="text-uva font-semibold mb-3">Tu carrito está vacío</p>
          <button
            onClick={() => navigate("/merch")}
            className="bg-morado text-white px-4 py-2 rounded-xl font-bold"
          >
            Ver merch
          </button>
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-fredoka text-uva">
            Finalizar compra
          </h2>
          <BotonCerrar onClick={() => navigate("/carrito")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <section className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 p-5">
            <h3 className="font-fredoka text-xl text-uva mb-4">
              Datos de envío
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nombreCompleto"
                placeholder="Nombre completo"
                value={form.nombreCompleto}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <input
                name="telefono"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <input
                name="calle"
                placeholder="Calle"
                value={form.calle}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <input
                name="numero"
                placeholder="Número"
                value={form.numero}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <input
                name="pisoDepto"
                placeholder="Piso / Depto"
                value={form.pisoDepto}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <input
                name="ciudad"
                placeholder="Ciudad"
                value={form.ciudad}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
              <select
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none text-uva"
              >
                <option value="">Seleccionar provincia</option>
                <option value="capital_federal">Capital Federal</option>
                <option value="conurbano_buenos_aires">GCBA</option>
                <option value="buenos_aires">Buenos Aires</option>
                <option value="catamarca">Catamarca</option>
                <option value="chaco">Chaco</option>
                <option value="chubut">Chubut</option>
                <option value="cordoba">Córdoba</option>
                <option value="corrientes">Corrientes</option>
                <option value="entre_rios">Entre Ríos</option>
                <option value="formosa">Formosa</option>
                <option value="jujuy">Jujuy</option>
                <option value="la_pampa">La Pampa</option>
                <option value="la_rioja">La Rioja</option>
                <option value="mendoza">Mendoza</option>
                <option value="misiones">Misiones</option>
                <option value="neuquen">Neuquén</option>
                <option value="rio_negro">Río Negro</option>
                <option value="salta">Salta</option>
                <option value="san_juan">San Juan</option>
                <option value="san_luis">San Luis</option>
                <option value="santa_cruz">Santa Cruz</option>
                <option value="santa_fe">Santa Fe</option>
                <option value="santiago_del_estero">Santiago del Estero</option>
                <option value="tierra_del_fuego">Tierra del Fuego</option>
                <option value="tucuman">Tucumán</option>
              </select>
              <input
                name="codigoPostal"
                placeholder="Código postal"
                value={form.codigoPostal}
                onChange={handleChange}
                className="px-4 py-3 rounded-xl border border-uva/20 outline-none"
              />
            </div>

            <textarea
              name="referencias"
              placeholder="Referencias para la entrega"
              value={form.referencias}
              onChange={handleChange}
              className="w-full mt-4 px-4 py-3 rounded-xl border border-uva/20 outline-none min-h-[110px]"
            />
          </section>

          <aside className="bg-white rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-uva/10 p-5 h-fit">
            <h3 className="font-fredoka text-xl text-uva mb-4">
              Resumen final
            </h3>

            <div className="flex flex-col gap-3 mb-4">
              {items.map((item, index) => (
                <div key={`${item.idProducto}-checkout-${index}`} className="text-sm">
                  <p className="text-uva font-semibold">
                    {item.cantidad} {item.nombre}
                  </p>
                  {item.variante && (
                    <p className="text-gris text-xs mt-1">
                      {renderVariante(item.variante)}
                    </p>
                  )}
                  <p className="text-gris mt-1">
                    ${item.subtotal?.toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-gris mb-2 pt-3 border-t border-uva/10">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString("es-AR")}</span>
            </div>

            <div className="flex items-center justify-between text-gris mb-2">
              <span>Envío</span>
              <span>
                {form.provincia
                  ? costoEnvio === 0
                    ? "Gratis"
                    : `$${costoEnvio.toLocaleString("es-AR")}`
                  : "Seleccionar provincia"}
              </span>
            </div>

            <div className="flex items-center justify-between text-uva font-bold text-xl pt-4 border-t border-uva/10">
              <span>Total</span>
              <span>${totalFinal.toLocaleString("es-AR")}</span>
            </div>

            {form.provincia && (
              <p className="text-xs text-gris mt-3">
                Envío calculado para {labelProvincia(form.provincia)}.
              </p>
            )}

            {configEnvios?.envioGratisDesde ? (
              <p className="text-xs text-gris mt-2">
                Envío gratis desde $
                {configEnvios.envioGratisDesde.toLocaleString("es-AR")}.
              </p>
            ) : null}

            <button
              onClick={finalizarCompra}
              disabled={
                procesando ||
                !form.nombreCompleto ||
                !form.telefono ||
                !form.calle ||
                !form.numero ||
                !form.ciudad ||
                !form.provincia ||
                !form.codigoPostal
              }
              className="w-full mt-6 bg-fucsia text-white font-bold py-3 rounded-2xl hover:bg-fucsia/85 transition disabled:opacity-50"
            >
              {procesando ? "Redirigiendo..." : "Ir a Mercado Pago"}
            </button>
          </aside>
        </div>
      </main>

      <Navbar />
    </div>
  );
}
