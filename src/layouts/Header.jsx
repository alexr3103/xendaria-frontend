import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Filter, ShoppingBasket } from "lucide-react";
import logoMini from "../assets/logo-mini.png";
import FilterPanel from "./FilterPanel";
import useCantidadCarrito from "../hooks/useCantidadCarrito.js";
import BuzonNotificaciones from "../components/BuzonNotificaciones.jsx";
import { sincronizarSuscripcionPush } from "../lib/notificacionesPush.js";

export default function Header({
  categorias,
  filtro,
  setFiltro,
  disableFilter = false,
  showCart = false,
}) {
  const [open, setOpen] = useState(false);
  const [buzonAbierto, setBuzonAbierto] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const cantidadCarrito = useCantidadCarrito({ activo: showCart });

  const cargarConteoNotificaciones = useCallback(async () => {
    if (!token) {
      setNotificacionesNoLeidas(0);
      return;
    }

    try {
      const res = await fetch(`${API}/api/notificaciones?limit=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setNotificacionesNoLeidas(data?.noLeidas || 0);
      }
    } catch {
      // La campana no debe bloquear la navegacion si el backend esta offline.
    }
  }, [API, token]);

  useEffect(() => {
    cargarConteoNotificaciones();
    sincronizarSuscripcionPush({ API, token }).catch(() => {});

    const interval = window.setInterval(cargarConteoNotificaciones, 60000);
    window.addEventListener("focus", cargarConteoNotificaciones);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", cargarConteoNotificaciones);
    };
  }, [API, cargarConteoNotificaciones, token]);

  return (
    <>
      <header className="w-full bg-gris text-white py-3 px-4 flex justify-between items-center shadow-md z-50 relative">
        {/* LOGO + NOMBRE */}
        <a
          href="https://xendaria.com.ar"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-menta"
          aria-label="Visitar la web de Xendaria"
        >
          <img
            src={logoMini}
            alt="Xendaria logo"
            className="w-10 h-10 rounded-xl"
          />
          <h1 className="font-fredoka text-xl font-semibold tracking-wide">
            Xendaria
          </h1>
        </a>

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

          {token && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setBuzonAbierto(true);
              }}
              className="relative rounded-lg p-2 transition hover:bg-crema/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-menta"
              title="Ver notificaciones"
              aria-label={
                notificacionesNoLeidas > 0
                  ? `Ver notificaciones, ${notificacionesNoLeidas} sin leer`
                  : "Ver notificaciones"
              }
            >
              <Bell
                size={24}
                className={
                  buzonAbierto || notificacionesNoLeidas > 0
                    ? "text-menta"
                    : "text-crema"
                }
              />

              {notificacionesNoLeidas > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fucsia px-1 text-[9px] font-bold leading-none text-white">
                  {notificacionesNoLeidas > 99
                    ? "99+"
                    : notificacionesNoLeidas}
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

      <BuzonNotificaciones
        open={buzonAbierto}
        onClose={() => setBuzonAbierto(false)}
        onNoLeidasChange={setNotificacionesNoLeidas}
      />
    </>
  );
}
