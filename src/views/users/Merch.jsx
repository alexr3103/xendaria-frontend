import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Search,
  ShoppingBasket,
  Sparkles,
  X,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import EncabezadoVistaUsuario from "../../components/EncabezadoVistaUsuario.jsx";
import {
  getMerchCategoryInfo,
  MERCH_CATEGORY_OPTIONS,
} from "../../constants/merchOptions.js";

const formatoPrecio = new Intl.NumberFormat("es-AR");
const CLAVES_VARIANTE = ["color", "talle", "diseno"];

function precio(valor = 0) {
  return `$${formatoPrecio.format(Number(valor || 0))}`;
}

function getImagenProducto(producto = {}) {
  if (producto.imagen) return producto.imagen;
  return producto.imagenes?.[0]?.url || "";
}

function getStockTotal(producto = {}) {
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  if (variantes.length > 0) {
    return variantes.reduce((acc, variante) => acc + Number(variante.stock || 0), 0);
  }

  return Number(producto.stock || 0);
}

function getAlertaStock(producto = {}) {
  const stock = getStockTotal(producto);

  if (stock <= 0) return { tipo: "sin_stock", label: "Sin stock" };
  if (stock === 1) return { tipo: "ultima_unidad", label: "Ultima unidad" };
  if (stock <= 3) return { tipo: "ultimas_unidades", label: "Quedan pocas" };

  return null;
}

function getClavesVariantes(producto = {}) {
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];

  return CLAVES_VARIANTE.filter((clave) =>
    variantes.some((variante) => Boolean(variante[clave]))
  );
}

function getOpcionesVariante(producto = {}, clave, seleccion = {}) {
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  const indiceClave = CLAVES_VARIANTE.indexOf(clave);

  return [
    ...new Set(
      variantes
        .filter((variante) =>
          CLAVES_VARIANTE.slice(0, indiceClave).every(
            (claveAnterior) =>
              !seleccion[claveAnterior] ||
              !variante[claveAnterior] ||
              variante[claveAnterior] === seleccion[claveAnterior]
          )
        )
        .map((variante) => variante[clave])
        .filter(Boolean)
    ),
  ];
}

function buscarVariante(producto = {}, seleccion = {}) {
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  const claves = getClavesVariantes(producto);

  if (!variantes.length) return null;
  if (claves.some((clave) => !seleccion[clave])) return null;

  return (
    variantes.find((variante) =>
      claves.every((clave) => variante[clave] === seleccion[clave])
    ) || null
  );
}

function getVarianteAutomatica(producto = {}) {
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  if (variantes.length !== 1) return null;

  const variante = variantes[0];
  const resultado = {};
  CLAVES_VARIANTE.forEach((clave) => {
    if (variante[clave]) resultado[clave] = variante[clave];
  });

  return resultado;
}

function getBodyCarrito(producto, seleccion = {}, cantidad = 1) {
  const variante = {};

  CLAVES_VARIANTE.forEach((clave) => {
    if (seleccion[clave]) variante[clave] = seleccion[clave];
  });

  const body = {
    idProducto: producto._id,
    cantidad,
  };

  if (Object.keys(variante).length > 0) {
    body.variante = variante;
  }

  return body;
}

export default function Merch() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [mensaje, setMensaje] = useState(null);
  const [agregandoId, setAgregandoId] = useState("");
  const [productoRapido, setProductoRapido] = useState(null);
  const [seleccionRapida, setSeleccionRapida] = useState({});
  const [cantidadRapida, setCantidadRapida] = useState(1);

  useEffect(() => {
    async function cargarProductos() {
      try {
        setError("");

        const res = await fetch(`${API}/api/merch`);

        if (!res.ok) {
          throw new Error("No se pudo cargar la merch");
        }

        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    }

    cargarProductos();
  }, [API]);

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => setMensaje(null), 1800);
    return () => clearTimeout(timer);
  }, [mensaje]);

  const categoriasDisponibles = useMemo(() => {
    const usadas = new Set(
      productos.map((producto) => getMerchCategoryInfo(producto.categoria).value)
    );

    return MERCH_CATEGORY_OPTIONS.filter((categoria) => usadas.has(categoria.value));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const categoria = getMerchCategoryInfo(producto.categoria);
      const coincideCategoria =
        categoriaFiltro === "todos" || categoria.value === categoriaFiltro;

      if (!coincideCategoria) return false;
      if (!query) return true;

      return [producto.nombre, producto.descripcion, categoria.label]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(query));
    });
  }, [busqueda, categoriaFiltro, productos]);

  async function agregarProducto(producto, seleccion = {}, cantidad = 1) {
    const token = localStorage.getItem("token");

    if (!token) {
      setMensaje({
        variant: "error",
        text: "Tenés que iniciar sesión para agregar productos.",
        action: "Iniciar sesión",
      });
      return;
    }

    try {
      setAgregandoId(producto._id);

      const res = await fetch(`${API}/api/carrito/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(getBodyCarrito(producto, seleccion, cantidad)),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setMensaje({
          variant: "error",
          text: "Tu sesión venció. Iniciá sesión de nuevo.",
          action: "Ir al login",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "No se pudo agregar al carrito");
      }

      window.dispatchEvent(new Event("carrito-actualizado"));
      setProductoRapido(null);
      setSeleccionRapida({});
      setCantidadRapida(1);
      setMensaje({
        variant: "success",
        text: "Producto agregado al carrito.",
        action: "Ver carrito",
      });
    } catch (err) {
      setMensaje({
        variant: "error",
        text: err.message || "No se pudo agregar al carrito.",
      });
    } finally {
      setAgregandoId("");
    }
  }

  function handleAgregarRapido(producto) {
    const alerta = getAlertaStock(producto);
    if (alerta?.tipo === "sin_stock") return;

    const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
    const varianteUnica = getVarianteAutomatica(producto);

    if (variantes.length === 0 || varianteUnica) {
      agregarProducto(producto, varianteUnica || {}, 1);
      return;
    }

    setProductoRapido(producto);
    setSeleccionRapida({});
    setCantidadRapida(1);
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter showCart />
      </div>

      {mensaje && (
        <div className="fixed left-1/2 top-20 z-[999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div
            className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold shadow-xl ${
              mensaje.variant === "success"
                ? "border-menta/40 bg-menta text-uva"
                : "border-fucsia/25 bg-white text-fucsia"
            }`}
          >
            <p>{mensaje.text}</p>
            {mensaje.action && (
              <button
                type="button"
                onClick={() =>
                  mensaje.action.includes("carrito")
                    ? navigate("/carrito")
                    : navigate("/login")
                }
                className="mt-2 rounded-full bg-uva px-4 py-1.5 text-xs text-crema"
              >
                {mensaje.action}
              </button>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <section className="mb-5 space-y-4">
          <EncabezadoVistaUsuario
            icon={ShoppingBasket}
            etiqueta="Tienda oficial"
            titulo="Merch"
            descripcion="Productos para llevarte un pedacito de la aventura."
          />

          <label className="flex h-12 items-center gap-2 rounded-full border border-uva/20 bg-white px-4 text-uva shadow-sm">
            <Search size={18} className="shrink-0 text-uva/55" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar producto"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-uva/40"
            />
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategoriaFiltro("todos")}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                categoriaFiltro === "todos"
                  ? "border-uva bg-uva text-crema"
                  : "border-uva/15 bg-white text-uva"
              }`}
            >
              Todos
            </button>

            {categoriasDisponibles.map((categoria) => (
              <button
                key={categoria.value}
                type="button"
                onClick={() => setCategoriaFiltro(categoria.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                  categoriaFiltro === categoria.value
                    ? categoria.claseActiva
                    : categoria.claseInactiva
                }`}
              >
                {categoria.label}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="flex min-h-[35vh] items-center justify-center text-morado">
            <Loader2 className="mr-2 animate-spin" size={24} />
            <span className="font-bold">Cargando tienda...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-rosa/30 bg-white p-5 text-center font-bold text-uva shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && productos.length === 0 && (
          <EmptyShop
            title="Todavía no hay productos"
            text="Cuando se cargue merch, va a aparecer acá como catálogo."
          />
        )}

        {!loading && !error && productos.length > 0 && productosFiltrados.length === 0 && (
          <EmptyShop
            title="No encontramos productos"
            text="Probá con otra categoría o limpiá la búsqueda."
          />
        )}

        {!loading && !error && productosFiltrados.length > 0 && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {productosFiltrados.map((producto) => (
              <ProductoCatalogo
                key={producto._id}
                producto={producto}
                agregando={agregandoId === producto._id}
                onOpen={() => navigate(`/merch/${producto._id}`)}
                onAdd={() => handleAgregarRapido(producto)}
              />
            ))}
          </section>
        )}
      </main>

      <SelectorRapido
        producto={productoRapido}
        seleccion={seleccionRapida}
        setSeleccion={setSeleccionRapida}
        cantidad={cantidadRapida}
        setCantidad={setCantidadRapida}
        agregando={agregandoId === productoRapido?._id}
        onClose={() => setProductoRapido(null)}
        onConfirm={() => agregarProducto(productoRapido, seleccionRapida, cantidadRapida)}
      />

      <Navbar />
    </div>
  );
}

function EmptyShop({ title, text }) {
  return (
    <div className="rounded-3xl border border-uva/10 bg-white px-6 py-10 text-center shadow-sm">
      <Sparkles className="mx-auto mb-3 text-morado" size={28} />
      <h3 className="font-fredoka text-2xl text-uva">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-uva/60">{text}</p>
    </div>
  );
}

function ProductoCatalogo({ producto, agregando, onOpen, onAdd }) {
  const categoria = getMerchCategoryInfo(producto.categoria);
  const alerta = getAlertaStock(producto);
  const sinStock = alerta?.tipo === "sin_stock";
  const imagen = getImagenProducto(producto);

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-uva/10 bg-white shadow-sm transition active:scale-[0.99]">
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-[4/4.6] overflow-hidden bg-crema text-left"
      >
        {imagen ? (
          <img
            src={imagen}
            alt={producto.nombre}
            className="h-full w-full object-cover transition duration-300 group-active:scale-105 sm:group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-crema text-uva/35">
            <ShoppingBasket size={32} />
          </div>
        )}

        <span className={`absolute left-2 top-2 rounded-full border px-2 py-1 text-[10px] font-extrabold ${categoria.claseBadge}`}>
          {categoria.label}
        </span>

        {alerta && (
          <span
            className={`absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
              sinStock ? "bg-fucsia text-crema" : "bg-vainilla text-uva"
            }`}
          >
            {alerta.label}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <h3 className="line-clamp-2 min-h-[2.5rem] font-fredoka text-base leading-tight text-uva">
            {producto.nombre}
          </h3>
        </button>

        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="font-fredoka text-xl leading-none text-morado">
            {precio(producto.precio)}
          </span>

          <button
            type="button"
            onClick={onAdd}
            disabled={agregando || sinStock}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              sinStock
                ? "border-uva/10 bg-uva/10 text-uva/35"
                : "border-morado/20 bg-morado/10 text-morado hover:bg-morado/20"
            }`}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            title={sinStock ? "Sin stock" : "Agregar al carrito"}
          >
            {agregando ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Plus size={20} strokeWidth={2.8} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function SelectorRapido({
  producto,
  seleccion,
  setSeleccion,
  cantidad,
  setCantidad,
  agregando,
  onClose,
  onConfirm,
}) {
  if (!producto) return null;

  const claves = getClavesVariantes(producto);
  const varianteSeleccionada = buscarVariante(producto, seleccion);
  const stockDisponible = varianteSeleccionada?.stock ?? 0;
  const faltanOpciones = claves.some((clave) => !seleccion[clave]);
  const sinStock = !faltanOpciones && stockDisponible <= 0;
  const cantidadInvalida = !faltanOpciones && cantidad > stockDisponible;
  const imagen = getImagenProducto(producto);
  const categoria = getMerchCategoryInfo(producto.categoria);

  function actualizarSeleccion(clave, valor) {
    setSeleccion((actual) => {
      const siguiente = { ...actual, [clave]: valor };
      const indice = CLAVES_VARIANTE.indexOf(clave);

      CLAVES_VARIANTE.slice(indice + 1).forEach((clavePosterior) => {
        delete siguiente[clavePosterior];
      });

      return siguiente;
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-uva/35 px-3 pb-3 backdrop-blur-sm sm:items-center sm:pb-0">
      <section className="relative w-full max-w-md rounded-[2rem] border border-uva/10 bg-white shadow-2xl">
        <div className="relative flex items-center gap-4 rounded-t-[2rem] bg-crema p-4 pr-16">
          <img
            src={imagen}
            alt=""
            className="h-24 w-24 shrink-0 rounded-[1.6rem] object-cover shadow-md ring-4 ring-white"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-uva/50">
              Elegí opciones
            </p>
            <h3 className="line-clamp-2 font-fredoka text-2xl leading-tight text-morado">
              {producto.nombre}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${categoria.claseBadge}`}>
                {categoria.label}
              </span>
              <span className="font-fredoka text-xl leading-none text-uva">
                {precio(producto.precio)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-1 -top-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fucsia text-white shadow-lg transition active:scale-95"
            aria-label="Cerrar selector"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto px-4 py-5">
          <div className="space-y-4">
            {claves.map((clave) => {
              const opciones = getOpcionesVariante(producto, clave, seleccion);

              return (
                <div key={clave}>
                  <p className="mb-2 text-sm font-extrabold capitalize text-uva">
                    {clave === "diseno" ? "Diseño" : clave}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opciones.map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => actualizarSeleccion(clave, opcion)}
                        className={`rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                          seleccion[clave] === opcion
                            ? "border-morado bg-morado text-crema shadow-sm"
                            : "border-uva/15 bg-crema text-uva active:bg-morado/10"
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div>
              <p className="mb-2 text-sm font-extrabold text-uva">Cantidad</p>
              <div className="flex w-fit items-center rounded-full border border-uva/10 bg-crema p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-uva"
                >
                  -
                </button>
                <span className="min-w-[44px] text-center font-fredoka text-xl text-morado">
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad((actual) => actual + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-uva"
                >
                  +
                </button>
              </div>
            </div>

            {!faltanOpciones && (
              <p className="rounded-2xl bg-crema px-4 py-3 text-sm font-bold text-uva/70">
                {sinStock
                  ? "Esa variante no tiene stock."
                  : `Stock disponible: ${stockDisponible}`}
              </p>
            )}

            {cantidadInvalida && (
              <p className="rounded-2xl border border-vainilla bg-vainilla/55 px-4 py-3 text-sm font-bold text-uva">
                No contamos con esa cantidad disponible.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 rounded-b-[2rem] border-t border-uva/10 bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-crema font-extrabold text-uva"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={agregando || faltanOpciones || sinStock || cantidadInvalida}
            className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-rosa font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
          >
            {agregando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.8} />}
            Agregar
          </button>
        </div>
      </section>
    </div>
  );
}
