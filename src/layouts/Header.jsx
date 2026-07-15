import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Filter, ShoppingCart } from "lucide-react";
import logoMini from "../assets/logo-mini.png";
import FilterPanel from "./FilterPanel";

export default function Header({
  categorias,
  filtro,
  setFiltro,
  disableFilter = false,
  showCart = false,
}) {
  const [open, setOpen] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const cargarCantidadCarrito = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token || !showCart) {
      setCantidadCarrito(0);
      return;
    }

    try {
      const res = await fetch(`${API}/api/carrito`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setCantidadCarrito(0);
        return;
      }

      const data = await res.json();
      const items = data?.items ?? [];
      const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

      setCantidadCarrito(totalItems);
    } catch {
      setCantidadCarrito(0);
    }
  }, [API, showCart]);

  useEffect(() => {
    cargarCantidadCarrito();
  }, [cargarCantidadCarrito, location.pathname]);

  useEffect(() => {
    function actualizarBadge() {
      cargarCantidadCarrito();
    }

    window.addEventListener("carrito-actualizado", actualizarBadge);

    return () => {
      window.removeEventListener("carrito-actualizado", actualizarBadge);
    };
  }, [cargarCantidadCarrito]);

  return (
    <>
      <header className="w-full bg-gris text-white py-3 px-4 flex justify-between items-center shadow-md z-50 relative">
        {/* LOGO + NOMBRE */}
        <div className="flex items-center gap-3">
          <img
            src={logoMini}
            alt="Xendaria logo"
            className="w-10 h-10 rounded-xl"
          />
          <h1 className="font-fredoka text-xl tracking-wide">Xendaria</h1>
        </div>

        <div className="flex items-center gap-2">
          {showCart && (
            <button
              type="button"
              onClick={() => {
                if (!localStorage.getItem("token")) {
                  navigate("/login");
                  return;
                }

                navigate("/carrito");
              }}
              className="relative rounded-lg p-2 transition hover:bg-crema/10"
              title="Ver carrito"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={24} className="text-crema" />

              {cantidadCarrito > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-fucsia px-1 text-[11px] font-bold leading-none text-white">
                  {cantidadCarrito}
                </span>
              )}
            </button>
          )}

          {!disableFilter && (
            <button
              onClick={() => setOpen(!open)}
              className="
                p-2 rounded-lg transition
                hover:bg-crema/10
              "
            >
              <Filter
                size={26}
                className={open || filtro ? "text-menta" : "text-crema"}
              />
            </button>
          )}
        </div>
      </header>

      {!disableFilter && open && (
        <FilterPanel
          categorias={categorias}
          filtro={filtro}
          setFiltro={setFiltro}
          close={() => setOpen(false)}
        />
      )}
    </>
  );
}
