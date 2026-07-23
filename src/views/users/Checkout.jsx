import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  PackageCheck,
  ShoppingBasket,
  Truck,
  X,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import Alert from "../../components/Alertas.jsx";

const formatoPrecio = new Intl.NumberFormat("es-AR");

const PROVINCIAS = [
  { value: "capital_federal", label: "CABA" },
  { value: "conurbano_buenos_aires", label: "GBA" },
  { value: "buenos_aires", label: "Provincia de Buenos Aires" },
  { value: "catamarca", label: "Catamarca" },
  { value: "chaco", label: "Chaco" },
  { value: "chubut", label: "Chubut" },
  { value: "cordoba", label: "Córdoba" },
  { value: "corrientes", label: "Corrientes" },
  { value: "entre_rios", label: "Entre Ríos" },
  { value: "formosa", label: "Formosa" },
  { value: "jujuy", label: "Jujuy" },
  { value: "la_pampa", label: "La Pampa" },
  { value: "la_rioja", label: "La Rioja" },
  { value: "mendoza", label: "Mendoza" },
  { value: "misiones", label: "Misiones" },
  { value: "neuquen", label: "Neuquén" },
  { value: "rio_negro", label: "Río Negro" },
  { value: "salta", label: "Salta" },
  { value: "san_juan", label: "San Juan" },
  { value: "san_luis", label: "San Luis" },
  { value: "santa_cruz", label: "Santa Cruz" },
  { value: "santa_fe", label: "Santa Fe" },
  { value: "santiago_del_estero", label: "Santiago del Estero" },
  { value: "tierra_del_fuego", label: "Tierra del Fuego" },
  { value: "tucuman", label: "Tucumán" },
];

function precio(valor = 0) {
  return `$${formatoPrecio.format(Number(valor || 0))}`;
}

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
  return PROVINCIAS.find((item) => item.value === provincia)?.label || provincia;
}

function renderVariante(variante) {
  if (!variante) return "";

  const partes = [
    variante.color ? `Color: ${variante.color}` : null,
    variante.talle ? `Talle: ${variante.talle}` : null,
    variante.diseno ? `Diseño: ${variante.diseno}` : null,
  ].filter(Boolean);

  return partes.join(" · ");
}

function validarCheckout(form) {
  const errores = {};
  const telefonoLimpio = form.telefono.replace(/\D/g, "");
  const codigoPostal = form.codigoPostal.trim();

  if (form.nombreCompleto.trim().length < 3) {
    errores.nombreCompleto = "Ingresá nombre y apellido.";
  }

  if (telefonoLimpio.length < 8) {
    errores.telefono = "Ingresá un teléfono válido.";
  }

  if (form.calle.trim().length < 2) {
    errores.calle = "Ingresá la calle.";
  }

  if (!form.numero.trim()) {
    errores.numero = "Ingresá la altura.";
  }

  if (form.ciudad.trim().length < 2) {
    errores.ciudad = "Ingresá la ciudad.";
  }

  if (!form.provincia) {
    errores.provincia = "Seleccioná una provincia o zona.";
  }

  if (!/^[a-zA-Z0-9\s-]{4,10}$/.test(codigoPostal)) {
    errores.codigoPostal = "Ingresá un código postal válido.";
  }

  if (form.referencias.length > 180) {
    errores.referencias = "Máximo 180 caracteres.";
  }

  return errores;
}

export default function Checkout() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [carrito, setCarrito] = useState(null);
  const [configEnvios, setConfigEnvios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [errores, setErrores] = useState({});
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
      setMensaje(null);
    }, 2500);

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
  const totalItems = items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

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

    setErrores((prev) => {
      if (!prev[name]) return prev;
      const siguiente = { ...prev };
      delete siguiente[name];
      return siguiente;
    });
  }

  async function finalizarCompra() {
    const erroresForm = validarCheckout(form);

    if (Object.keys(erroresForm).length > 0) {
      setErrores(erroresForm);
      setMensaje({
        variant: "error",
        text: "Revisá los datos marcados antes de continuar.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setMensaje(null);
      setProcesando(true);

      const bodyCheckout = {
        datosEnvio: {
          ...form,
          nombreCompleto: form.nombreCompleto.trim(),
          telefono: form.telefono.trim(),
          calle: form.calle.trim(),
          numero: form.numero.trim(),
          pisoDepto: form.pisoDepto.trim(),
          ciudad: form.ciudad.trim(),
          codigoPostal: form.codigoPostal.trim(),
          referencias: form.referencias.trim(),
        },
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
      setMensaje({
        variant: "error",
        text: err.message || "No se pudo finalizar la compra",
      });
    } finally {
      setProcesando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema text-morado">
        <Loader2 className="mr-2 animate-spin" size={24} />
        <span className="font-bold">Cargando checkout...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema px-4">
        <div className="rounded-3xl border border-uva/10 bg-white p-6 text-center font-bold text-uva shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema px-4">
        <div className="rounded-3xl border border-uva/10 bg-white p-6 text-center shadow-sm">
          <ShoppingBasket className="mx-auto mb-3 text-morado" size={30} />
          <p className="mb-3 font-semibold text-uva">Tu carrito está vacío</p>
          <button
            type="button"
            onClick={() => navigate("/merch")}
            className="rounded-2xl bg-morado px-4 py-2 font-bold text-white"
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
        <Header disableFilter showCart />
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
        {mensaje && (
          <div className="mb-4">
            <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
          </div>
        )}

        <section className="relative rounded-[2rem] border border-uva/10 bg-white shadow-xl">
          <div className="relative flex items-center gap-4 rounded-t-[2rem] bg-white p-4 pr-16">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-menta/45 text-uva shadow-sm ring-4 ring-white">
              <Truck size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-fredoka text-3xl leading-tight text-morado">
                Finalizar compra
              </h1>
              <p className="mt-1 text-xs font-bold leading-snug text-uva/55">
                Completá la entrega y revisá el total antes de pagar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/carrito")}
              className="absolute -right-1 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-fucsia text-white shadow-lg transition active:scale-95"
              aria-label="Volver al carrito"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoCheckout
                label="Nombre y apellido"
                name="nombreCompleto"
                placeholder="Ej: Juan Pérez"
                value={form.nombreCompleto}
                onChange={handleChange}
                error={errores.nombreCompleto}
              />
              <CampoCheckout
                label="Teléfono"
                name="telefono"
                placeholder="Ej: 11 2345 6789"
                value={form.telefono}
                onChange={handleChange}
                error={errores.telefono}
              />
              <CampoCheckout
                label="Calle"
                name="calle"
                placeholder="Ej: Av. Corrientes"
                value={form.calle}
                onChange={handleChange}
                error={errores.calle}
              />
              <CampoCheckout
                label="Altura"
                name="numero"
                placeholder="Ej: 1234"
                value={form.numero}
                onChange={handleChange}
                error={errores.numero}
              />
              <CampoCheckout
                label="Piso / depto"
                name="pisoDepto"
                placeholder="Ej: 4B"
                value={form.pisoDepto}
                onChange={handleChange}
                error={errores.pisoDepto}
              />
              <CampoCheckout
                label="Ciudad"
                name="ciudad"
                placeholder="Ej: Palermo"
                value={form.ciudad}
                onChange={handleChange}
                error={errores.ciudad}
              />
              <CampoSelectCheckout
                label="Provincia / zona"
                name="provincia"
                value={form.provincia}
                onChange={handleChange}
                error={errores.provincia}
              />
              <CampoCheckout
                label="Código postal"
                name="codigoPostal"
                placeholder="Ej: C1043"
                value={form.codigoPostal}
                onChange={handleChange}
                error={errores.codigoPostal}
              />
            </div>

            <CampoCheckout
              as="textarea"
              label="Referencias"
              name="referencias"
              placeholder="Ej: Tocar timbre, horario de entrega, color de puerta..."
              value={form.referencias}
              onChange={handleChange}
              error={errores.referencias}
            />

            <ResumenCheckout
              items={items}
              subtotal={subtotal}
              totalItems={totalItems}
              costoEnvio={costoEnvio}
              totalFinal={totalFinal}
              provincia={form.provincia}
              configEnvios={configEnvios}
              procesando={procesando}
              onPagar={finalizarCompra}
            />
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  );
}

function CampoCheckout({
  as = "input",
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
}) {
  const Component = as;

  return (
    <label className="block text-sm font-extrabold text-uva">
      {label}
      <Component
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        className={`mt-2 w-full rounded-2xl border bg-crema px-4 py-3 font-bold text-uva outline-none placeholder:text-uva/35 focus:border-morado ${
          as === "textarea" ? "min-h-[105px] resize-none" : ""
        } ${error ? "border-fucsia/60" : "border-uva/10"}`}
      />
      {error && <span className="mt-1 block text-xs text-fucsia">{error}</span>}
    </label>
  );
}

function CampoSelectCheckout({ label, name, value, onChange, error }) {
  return (
    <label className="block text-sm font-extrabold text-uva">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        className={`mt-2 w-full rounded-2xl border bg-crema px-4 py-3 font-bold text-uva outline-none focus:border-morado ${
          error ? "border-fucsia/60" : "border-uva/10"
        }`}
      >
        <option value="">Seleccionar zona</option>
        {PROVINCIAS.map((provincia) => (
          <option key={provincia.value} value={provincia.value}>
            {provincia.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-fucsia">{error}</span>}
    </label>
  );
}

function ResumenCheckout({
  items,
  subtotal,
  totalItems,
  costoEnvio,
  totalFinal,
  provincia,
  configEnvios,
  procesando,
  onPagar,
}) {
  return (
    <section className="border-t border-uva/10 pt-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-menta/35 text-uva shadow-sm">
          <PackageCheck size={22} />
        </span>
        <div>
          <h2 className="font-fredoka text-2xl leading-none text-uva">
            Resumen de compra
          </h2>
          <p className="text-xs font-bold text-uva/55">
            {totalItems} producto{totalItems === 1 ? "" : "s"} en tu pedido.
          </p>
        </div>
      </div>

      <div className="mt-4 max-h-44 space-y-3 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={`${item.idProducto}-checkout-${index}`}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <p className="line-clamp-2 font-extrabold text-uva">
                {item.cantidad} x {item.nombre}
              </p>
              {item.variante && (
                <p className="mt-1 line-clamp-1 text-xs font-bold text-uva/50">
                  {renderVariante(item.variante)}
                </p>
              )}
            </div>
            <span className="shrink-0 font-fredoka text-lg leading-none text-uva">
              {precio(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-uva/10 pt-4">
        <FilaResumen label="Subtotal" value={precio(subtotal)} />
        <FilaResumen
          label="Envío"
          value={
            provincia
              ? costoEnvio === 0
                ? "Gratis"
                : precio(costoEnvio)
              : "Elegí zona"
          }
        />
        {provincia && (
          <p className="rounded-2xl bg-menta/35 px-4 py-2 text-xs font-bold text-uva">
            Envío calculado para {labelProvincia(provincia)}.
          </p>
        )}
        {configEnvios?.envioGratisDesde ? (
          <p className="text-xs font-semibold leading-relaxed text-uva/55">
            Envío gratis en compras desde {precio(configEnvios.envioGratisDesde)}.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-uva/10 pt-4">
        <span className="font-extrabold text-uva/70">Total</span>
        <span className="font-fredoka text-3xl leading-none text-uva">
          {precio(totalFinal)}
        </span>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-uva/55">
        <CreditCard size={15} />
        Compra segura con MercadoPago desde Xendaria.
      </p>

      <button
        type="button"
        onClick={onPagar}
        disabled={procesando}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-menta px-5 py-3 font-extrabold text-uva shadow-md transition active:scale-[0.99] disabled:opacity-50"
      >
        {procesando ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={18} />
            Redirigiendo...
          </>
        ) : (
          "Pagar con MercadoPago"
        )}
      </button>
    </section>
  );
}

function FilaResumen({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-bold text-uva/60">{label}</span>
      <span className="font-extrabold text-uva">{value}</span>
    </div>
  );
}
