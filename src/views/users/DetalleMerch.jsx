import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  ShoppingBasket,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import {
  getMerchCategoryInfo,
} from "../../constants/merchOptions.js";

const formatoPrecio = new Intl.NumberFormat("es-AR");

function precio(valor = 0) {
  return `$${formatoPrecio.format(Number(valor || 0))}`;
}

function normalizarImagen(imagen) {
  if (!imagen) return null;
  if (typeof imagen === "string") return { url: imagen };
  return imagen.url ? imagen : null;
}

function getImagenesProducto(producto) {
  const productoSeguro = producto || {};
  const imagenesArray = Array.isArray(productoSeguro.imagenes)
    ? productoSeguro.imagenes.map(normalizarImagen).filter(Boolean)
    : [];
  const imagenLegacy = normalizarImagen(productoSeguro.imagen);
  const porUrl = new Map();

  [...imagenesArray, imagenLegacy].filter(Boolean).forEach((imagen) => {
    porUrl.set(imagen.url, imagen);
  });

  return [...porUrl.values()];
}

function getAlertaProducto(producto, stockDisponible) {
  if (producto?.alertaStock === "sin_stock" || stockDisponible === 0) {
    return {
      tipo: "sin_stock",
      label: "Sin stock",
      className: "bg-rosa text-white",
    };
  }

  if (producto?.alertaStock === "ultima_unidad") {
    return {
      tipo: "ultima_unidad",
      label: "Ultima unidad",
      className: "bg-vainilla text-uva",
    };
  }

  if (producto?.alertaStock === "ultimas_unidades") {
    return {
      tipo: "ultimas_unidades",
      label: "Quedan pocas",
      className: "bg-menta text-uva",
    };
  }

  return null;
}

function VarianteChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-extrabold transition active:scale-[0.98] ${
        active
          ? "border-morado bg-morado text-white shadow-sm"
          : "border-uva/15 bg-crema text-uva active:bg-morado/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function DetalleMerch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const token = localStorage.getItem("token");

  const [producto, setProducto] = useState(null);
  const [imagenActiva, setImagenActiva] = useState("");
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
    }, 1800);

    return () => clearTimeout(timer);
  }, [mensaje]);

  useEffect(() => {
    async function cargarProducto() {
      try {
        setError("");

        const res = await fetch(`${API}/api/merch/${id}`);

        if (res.status === 404) {
          navigate("/404", { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error("No se pudo cargar el producto");
        }

        const data = await res.json();
        const imagenes = getImagenesProducto(data);

        setProducto(data);
        setImagenActiva(imagenes[0]?.url || "");
      } catch {
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    }

    cargarProducto();
  }, [API, id, navigate]);

  const variantes = useMemo(() => producto?.variantes ?? [], [producto]);
  const imagenes = useMemo(() => getImagenesProducto(producto), [producto]);
  const categoria = getMerchCategoryInfo(producto?.categoria);

  const tieneColor = useMemo(() => variantes.some((v) => v.color), [variantes]);
  const tieneTalle = useMemo(() => variantes.some((v) => v.talle), [variantes]);
  const tieneDiseno = useMemo(() => variantes.some((v) => v.diseno), [variantes]);

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
    const filtradas = variantes.filter((v) => {
      if (tieneColor && color && v.color !== color) return false;
      if (tieneTalle && talle && v.talle !== talle) return false;
      return !!v.diseno;
    });

    return [...new Set(filtradas.map((v) => v.diseno).filter(Boolean))];
  }, [variantes, color, talle, tieneColor, tieneTalle]);

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
    if (variantes.length > 0) return varianteSeleccionada?.stock ?? null;
    return producto?.stock ?? null;
  }, [variantes, varianteSeleccionada, producto]);

  const superaStockDisponible =
    stockDisponible !== undefined &&
    stockDisponible !== null &&
    cantidad > stockDisponible;
  const alerta = getAlertaProducto(producto, stockDisponible);
  const sinStock = alerta?.tipo === "sin_stock";
  const botonDeshabilitado =
    agregando ||
    sinStock ||
    faltanVariantesObligatorias ||
    superaStockDisponible;

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
      setMensaje("Producto agregado al carrito.");
    } catch (err) {
      setMensaje(err.message || "No se pudo agregar al carrito.");
    } finally {
      setAgregando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-crema">
        <Header disableFilter showCart />
        <div className="flex min-h-[70vh] items-center justify-center text-morado">
          <Loader2 className="mr-2 animate-spin" size={24} />
          <span className="font-bold">Cargando producto...</span>
        </div>
        <Navbar />
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-crema">
        <Header disableFilter showCart />
        <main className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-3xl border border-uva/10 bg-white p-6 text-center font-bold text-uva shadow-sm">
            {error || "Producto no encontrado"}
          </div>
        </main>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter showCart />
      </div>

      {mensaje && (
        <div className="fixed left-1/2 top-20 z-[999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div className="rounded-2xl border border-uva/10 bg-white px-4 py-3 text-center text-sm font-bold text-uva shadow-xl">
            <p>{mensaje}</p>
            {requiereLogin && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 rounded-full bg-morado px-4 py-1.5 text-xs text-white"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-uva/45">
              Tienda Xendaria
            </p>
            <h1 className="font-fredoka text-3xl leading-none text-morado">
              Detalle
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/merch")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-rosa px-4 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Tienda
          </button>
        </div>

        <section className="rounded-[2rem] border border-uva/10 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)] lg:items-start">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-[1.6rem] bg-crema">
              <div className="relative aspect-square bg-crema">
                {imagenActiva ? (
                  <img
                    src={imagenActiva}
                    alt={producto.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-morado/35">
                    <ImageOff size={42} />
                  </div>
                )}

                <span className={`absolute left-3 top-3 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm ${categoria.claseBadge}`}>
                  {categoria.label}
                </span>
              </div>
            </div>

            {imagenes.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {imagenes.map((imagen, index) => (
                  <button
                    key={`${imagen.url}-${index}`}
                    type="button"
                    onClick={() => setImagenActiva(imagen.url)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition active:scale-95 ${
                      imagenActiva === imagen.url
                        ? "border-morado"
                        : "border-white opacity-80"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={imagen.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 sm:p-3 lg:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-fredoka text-3xl leading-tight text-morado">
                  {producto.nombre}
                </h2>
                <p className="mt-1 font-fredoka text-3xl leading-none text-uva">
                  {precio(producto.precio)}
                </p>
              </div>

              {alerta && (
                <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${alerta.className}`}>
                  {alerta.label}
                </span>
              )}
            </div>

            {producto.descripcion && (
              <p className="mt-4 text-sm font-semibold leading-relaxed text-uva/70">
                {producto.descripcion}
              </p>
            )}

            <div className="mt-5 space-y-4 border-t border-uva/10 pt-5">
              {tieneColor && (
                <div>
                  <p className="mb-2 text-sm font-extrabold text-uva">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {coloresDisponibles.map((opcion) => (
                      <VarianteChip
                        key={opcion}
                        active={color === opcion}
                        onClick={() => {
                          setColor(opcion);
                          setTalle("");
                          setDiseno("");
                        }}
                      >
                        {opcion}
                      </VarianteChip>
                    ))}
                  </div>
                </div>
              )}

              {tieneTalle && (
                <div>
                  <p className="mb-2 text-sm font-extrabold text-uva">Talle</p>
                  <div className="flex flex-wrap gap-2">
                    {tallesDisponibles.map((opcion) => (
                      <VarianteChip
                        key={opcion}
                        active={talle === opcion}
                        onClick={() => {
                          setTalle(opcion);
                          setDiseno("");
                        }}
                      >
                        {opcion}
                      </VarianteChip>
                    ))}
                  </div>
                </div>
              )}

              {tieneDiseno && (
                <div>
                  <p className="mb-2 text-sm font-extrabold text-uva">Diseño</p>
                  <div className="flex flex-wrap gap-2">
                    {disenosDisponibles.map((opcion) => (
                      <VarianteChip
                        key={opcion}
                        active={diseno === opcion}
                        onClick={() => setDiseno(opcion)}
                      >
                        {opcion}
                      </VarianteChip>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-extrabold text-uva">Cantidad</p>
                <div className="flex w-fit items-center gap-2 rounded-full border border-uva/10 bg-crema p-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-uva"
                    aria-label="Restar cantidad"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="min-w-[64px] px-2 text-center font-fredoka text-2xl text-morado">
                    {cantidad}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => prev + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-uva"
                    aria-label="Sumar cantidad"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {!faltanVariantesObligatorias &&
                stockDisponible !== undefined &&
                stockDisponible !== null && (
                <p className="rounded-2xl bg-crema px-4 py-3 text-sm font-bold text-uva/65">
                  {sinStock ? "No hay stock disponible." : `Stock disponible: ${stockDisponible}`}
                </p>
              )}

              {superaStockDisponible && (
                <p className="rounded-2xl border border-vainilla bg-vainilla/55 px-4 py-3 text-sm font-bold text-uva">
                  No contamos con esa cantidad disponible.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={agregarAlCarrito}
              disabled={botonDeshabilitado}
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-rosa px-5 py-4 font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
            >
              {agregando ? (
                <Loader2 className="animate-spin" size={19} />
              ) : (
                <ShoppingBasket size={19} />
              )}
              {agregando ? "Agregando..." : "Agregar al carrito"}
            </button>

            <p className="mt-3 text-center text-xs font-bold text-uva/45">
              Compra segura con MercadoPago desde Xendaria.
            </p>
          </div>
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  );
}
