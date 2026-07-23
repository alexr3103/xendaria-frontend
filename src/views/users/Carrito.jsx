import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import EncabezadoVistaUsuario from "../../components/EncabezadoVistaUsuario.jsx";

const formatoPrecio = new Intl.NumberFormat("es-AR");

function precio(valor = 0) {
  return `$${formatoPrecio.format(Number(valor || 0))}`;
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

export default function Carrito() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 1800);

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

        const resCarrito = await fetch(`${API}/api/carrito`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (resCarrito.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          navigate("/login");
          return;
        }

        if (!resCarrito.ok) {
          throw new Error("No se pudo cargar el carrito");
        }

        const dataCarrito = await resCarrito.json();

        setCarrito(
          dataCarrito || {
            items: [],
            total: 0,
          }
        );

      } catch (err) {
        setError(err.message || "No se pudo cargar el carrito");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [API, navigate, token]);

  async function cambiarCantidad(item, nuevaCantidad) {
    if (nuevaCantidad < 1 || actualizando) return;

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
    if (actualizando) return;

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
  const totalItems = items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema text-morado">
        <Loader2 className="mr-2 animate-spin" size={24} />
        <span className="font-bold">Cargando carrito...</span>
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

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter showCart />
      </div>

      {mensaje && (
        <div className="fixed left-1/2 top-20 z-[999] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div className="rounded-2xl border border-fucsia/25 bg-white px-4 py-3 text-center text-sm font-bold text-fucsia shadow-xl">
            {mensaje}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-5">
          <EncabezadoVistaUsuario
            icon={ShoppingBasket}
            etiqueta="Tienda oficial"
            titulo="Carrito"
            descripcion={
              items.length > 0
                ? `${totalItems} producto${totalItems === 1 ? "" : "s"} reservado${totalItems === 1 ? "" : "s"} para tu compra.`
                : "Guardá productos y continuá tu compra desde acá."
            }
            action={
              <button
                type="button"
                onClick={() => navigate("/merch")}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-rosa px-4 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98]"
              >
                <ArrowLeft size={17} />
                Tienda
              </button>
            }
          />
        </div>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-uva/10 bg-white px-6 py-12 text-center shadow-sm">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-morado/10 text-morado">
              <ShoppingBasket size={31} />
            </span>
            <h3 className="font-fredoka text-2xl text-uva">
              Tu carrito está vacío
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-uva/60">
              Explorá la tienda y agregá productos para continuar la compra.
            </p>
            <button
              type="button"
              onClick={() => navigate("/merch")}
              className="mt-5 rounded-2xl bg-morado px-5 py-3 font-extrabold text-crema shadow-md"
            >
              Ver tienda
            </button>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="divide-y divide-uva/12">
              {items.map((item, index) => (
                <ItemCarrito
                  key={`${item.idProducto}-${index}-${renderVariante(item.variante)}`}
                  item={item}
                  actualizando={actualizando}
                  onMenos={() => cambiarCantidad(item, item.cantidad - 1)}
                  onMas={() => cambiarCantidad(item, item.cantidad + 1)}
                  onEliminar={() => eliminarItem(item)}
                />
              ))}
            </section>

            <ResumenCarrito
              items={items}
              subtotal={subtotal}
              totalItems={totalItems}
              onCheckout={() => navigate("/checkout")}
            />
          </div>
        )}
      </main>

      <Navbar />
    </div>
  );
}

function ItemCarrito({ item, actualizando, onMenos, onMas, onEliminar }) {
  const varianteTexto = renderVariante(item.variante);

  return (
    <article className="py-3">
      <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-3 sm:grid-cols-[66px_minmax(0,1fr)]">
        <img
          src={item.imagen}
          alt={item.nombre}
          className="h-14 w-14 rounded-2xl bg-white object-cover shadow-sm ring-1 ring-uva/10 sm:h-16 sm:w-16"
        />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-fredoka text-base leading-tight text-uva sm:text-lg">
                {item.nombre}
              </h3>
              {varianteTexto && (
                <p className="mt-1 line-clamp-1 text-xs font-bold text-uva/55">
                  {varianteTexto}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={actualizando}
              onClick={onEliminar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fucsia/10 text-fucsia transition active:scale-95 disabled:opacity-45"
              aria-label="Eliminar producto"
              title="Eliminar producto"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center rounded-full border border-uva/10 bg-white/70 p-1">
              <button
                type="button"
                disabled={actualizando || item.cantidad <= 1}
                onClick={onMenos}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-uva disabled:opacity-35"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-[34px] text-center font-fredoka text-lg text-uva">
                {item.cantidad}
              </span>
              <button
                type="button"
                disabled={actualizando}
                onClick={onMas}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-uva disabled:opacity-35"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="min-w-[88px] shrink-0 text-right">
              <p className="whitespace-nowrap font-fredoka text-lg leading-none text-uva sm:text-xl">
                {precio(item.subtotal)}
              </p>
              <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-uva/45">
                {precio(item.precioUnitario)} c/u
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ResumenCarrito({ subtotal, totalItems, onCheckout }) {
  return (
    <aside className="h-fit border-t border-uva/10 pt-4 lg:sticky lg:top-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-uva/50">
            Total productos
          </p>
          <p className="mt-1 text-sm font-bold text-uva/60">
            {totalItems} producto{totalItems === 1 ? "" : "s"}
          </p>
        </div>
        <span className="font-fredoka text-3xl leading-none text-uva">
          {precio(subtotal)}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-menta px-5 py-3 font-extrabold text-uva shadow-md transition active:scale-[0.99]"
      >
        Continuar compra
      </button>
    </aside>
  );
}
