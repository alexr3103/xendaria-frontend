import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  MapPinned,
  Users,
  PlusCircle,
  Instagram,
  Youtube,
  Music2,
  Share2,
  ShoppingBasket,
  Store,
  UserRound,
} from "lucide-react";

import logoWhite from "../assets/logo_white.png";
import FlechaSubir from "../components/FlechaSubir.jsx";

function getAdminName() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    return usuario.nombre || usuario.name || usuario.email || "Admin";
  } catch {
    return "Admin";
  }
}

export default function AdminLayout({ children, title }) {
  const adminName = getAdminName();
  const navigate = useNavigate();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-crema font-nunito lg:flex">

      {/* SIDEBAR */}
      <aside className="sticky top-0 z-40 flex w-full flex-col bg-uva px-3 py-3 text-crema shadow-2xl sm:px-5 lg:h-screen lg:w-64 lg:shrink-0 lg:px-5 lg:py-10">

        {/* LOGO */}
        <div className="mb-3 flex items-center gap-3 px-2 lg:mb-10">
          <img
            src={logoWhite}
            className="h-10 w-10 object-contain drop-shadow-md lg:h-11 lg:w-11"
            alt="Logo Xendaria"
          />
          <h2 className="text-xl font-normal leading-none tracking-wide lg:text-2xl">
            Xendaria
          </h2>
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 text-sm font-medium lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 lg:text-base">

          <AdminLink to="/admin" icon={<LayoutDashboard size={20} />}>
            Dashboard
          </AdminLink>

          <AdminLink to="/admin/mapa" icon={<MapPinned size={20} />}>
            Mapa
          </AdminLink>

          <AdminLink to="/admin/puntos" icon={<PlusCircle size={20} />}>
            Puntos
          </AdminLink>

          <AdminLink to="/admin/usuarios" icon={<Users size={20} />}>
            Usuarios
          </AdminLink>

          <AdminLink to="/admin/rutas" icon={<Share2 size={20} />}>
            Rutas
          </AdminLink>

          <AdminLink to="/admin/merch" icon={<ShoppingBasket size={20} />}>
            Merch
          </AdminLink>

          <AdminLink to="/admin/comercios" icon={<Store size={20} />}>
            Comercios
          </AdminLink>

        </nav>

        {/* SEPARADOR */}
        <div className="my-6 hidden border-t border-crema/25 lg:block" />

        {/* REDES COMO ÍTEM PROFESIONAL */}
        <div className="hidden flex-col gap-3 text-base font-medium lg:flex">

          <p className="px-2 text-sm text-crema/70 tracking-wide">
            Redes oficiales
          </p>

          <div className="flex items-center gap-4 px-2">
            <a
              href="https://www.instagram.com/xendariaoficial/?igsh=czNhcTRnd2llOWcw#"
              target="_blank"
              className="hover:text-rosa transition-all"
            >
              <Instagram size={20} />
            </a>

            <a
              href="https://www.tiktok.com/@xendariaoficial?_r=1&_t=ZM-91Y0bT9zVDX"
              target="_blank"
              className="hover:text-rosa transition-all"
            >
              <Music2 size={20} />
            </a>

            <a
              href="https://www.youtube.com/@XendariaOficial"
              target="_blank"
              className="hover:text-rosa transition-all"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>

      </aside>

      {/* CONTENIDO */}
      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:h-screen lg:overflow-y-auto lg:p-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:mb-8">
          {title ? (
            <h1 className="text-3xl font-fredoka leading-none text-uva sm:text-4xl">
              {title}
            </h1>
          ) : (
            <span />
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setAdminMenuOpen((open) => !open)}
              className="flex max-w-full items-center gap-3 rounded-full border border-uva/10 bg-crema px-3 py-2 text-left shadow-sm transition hover:bg-white sm:px-4 sm:text-right"
              aria-expanded={adminMenuOpen}
              aria-label="Abrir menú de administrador"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-uva text-crema shadow-sm">
                <UserRound size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-uva/50">
                  Admin
                </p>
                <p className="max-w-44 truncate font-bold text-uva sm:max-w-56">
                  {adminName}
                </p>
              </div>
              <ChevronDown
                size={17}
                className={`text-uva/60 transition ${
                  adminMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {adminMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-2xl border border-uva/10 bg-white p-2 text-uva shadow-xl">
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-bold transition hover:bg-fucsia/10 hover:text-fucsia"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        {children}
        <FlechaSubir />
      </section>

    </main>
  );
}


/* LINK DEL SIDEBAR */
function AdminLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 transition-all cursor-pointer lg:gap-3 lg:px-4
         ${
           isActive
             ? "bg-rosa text-uva font-bold shadow-md"
             : "text-crema hover:bg-crema/10 hover:text-crema"
         }`
      }
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}
