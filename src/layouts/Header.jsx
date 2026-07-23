import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ShoppingBasket } from "lucide-react";
import logoMini from "../assets/logo-mini.png";
import FilterPanel from "./FilterPanel";
import useCantidadCarrito from "../hooks/useCantidadCarrito.js";

export default function Header({
  categorias,
  filtro,
  setFiltro,
  disableFilter = false,
  showCart = false,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const cantidadCarrito = useCantidadCarrito({ activo: showCart });

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
          <h1 className="font-fredoka text-xl font-semibold tracking-wide">
            Xendaria
          </h1>
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
              <ShoppingBasket size={24} className="text-crema" />

              {cantidadCarrito > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fucsia px-1 text-[9px] font-bold leading-none text-white">
                  {cantidadCarrito}
                </span>
              )}
            </button>
          )}

          {!disableFilter && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="
                p-2 rounded-lg transition
                hover:bg-crema/10
              "
              title="Filtrar puntos"
              aria-label="Filtrar puntos"
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
