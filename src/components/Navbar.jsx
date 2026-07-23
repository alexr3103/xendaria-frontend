import {
  BookOpen,
  Crown,
  MapPin,
  Share2,
  ShoppingBasket,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useCantidadCarrito from "../hooks/useCantidadCarrito.js";

const NAV_ITEMS = [
  { to: "/merch", label: "Tienda", icon: ShoppingBasket, badge: "carrito" },
  { to: "/rutas", label: "Rutas", icon: Share2 },
  { to: "/home", label: "Inicio", icon: MapPin },
  { to: "/ranking", label: "Ranking", icon: Crown },
  { to: "/perfil", label: "Perfil", icon: User, end: true },
  { to: "/comunidad", label: "Comunidad", icon: Users },
  { to: "/perfil/insignias", label: "Album", icon: BookOpen },
];

export default function UserNav() {
  const location = useLocation();
  const itemRefs = useRef({});
  const cantidadCarrito = useCantidadCarrito();

  function itemActivo(item) {
    if (item.to === "/merch") {
      return ["/merch", "/carrito", "/checkout"].some(
        (path) =>
          location.pathname === path || location.pathname.startsWith(`${path}/`)
      );
    }

    if (item.end) return location.pathname === item.to;
    return (
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`)
    );
  }

  useEffect(() => {
    const activeItem = NAV_ITEMS.find(itemActivo);

    const activeNode = activeItem ? itemRefs.current[activeItem.to] : null;
    activeNode?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 w-[82%] max-w-[300px] -translate-x-1/2"
      aria-label="Menu principal"
    >
      <div className="relative rounded-3xl bg-gris px-3 py-2 text-crema shadow-xl">
        <span className="pointer-events-none absolute inset-y-2 right-3 z-10 w-7 rounded-r-3xl bg-gradient-to-l from-gris to-transparent" />

        <div className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const mostrarBadge =
                item.badge === "carrito" && cantidadCarrito > 0;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  ref={(node) => {
                    itemRefs.current[item.to] = node;
                  }}
                  className={({ isActive }) =>
                    `
                      relative
                      flex min-w-[58px] flex-col items-center justify-center
                      rounded-2xl px-1 py-1 transition-all duration-200
                      ${
                        isActive || itemActivo(item)
                          ? "bg-crema/10 text-rosa"
                          : "text-crema/90 active:text-crema"
                      }
                    `
                  }
                >
                  <span className="relative">
                    <Icon size={21} />
                    {mostrarBadge && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-fucsia px-0.5 text-[7px] font-extrabold leading-none text-crema shadow-sm">
                        {cantidadCarrito > 9 ? "9+" : cantidadCarrito}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold leading-none">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
