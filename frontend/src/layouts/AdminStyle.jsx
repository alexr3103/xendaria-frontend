import { NavLink } from "react-router-dom";
import {
  MapPinned,
  Users,
  PlusCircle,
  Settings,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";

import logoWhite from "../assets/logo_white.png";

export default function AdminLayout({ children, title }) {
  return (
    <main className="min-h-screen flex bg-crema font-nunito">

      {/* SIDEBAR */}
      <aside className="w-64 bg-uva text-crema flex flex-col py-10 px-5 shadow-2xl">

        {/* LOGO */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <img
            src={logoWhite}
            className="w-11 h-11 object-contain drop-shadow-md"
            alt="Logo Xendaria"
          />
          <h2 className="font-fredoka text-2xl tracking-wide leading-none">
            Xendaria
          </h2>
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="flex flex-col gap-1 text-base font-medium">

          <AdminLink to="/admin/mapa" icon={<MapPinned size={20} />}>
            Mapa
          </AdminLink>

          <AdminLink to="/admin/puntos" icon={<PlusCircle size={20} />}>
            Puntos
          </AdminLink>

          <AdminLink to="/admin/usuarios" icon={<Users size={20} />}>
            Usuarios
          </AdminLink>

          <AdminLink to="/admin/config" icon={<Settings size={20} />}>
            Configuración
          </AdminLink>
        </nav>

        {/* SEPARADOR */}
        <div className="my-6 border-t border-crema/25" />

        {/* REDES COMO ÍTEM PROFESIONAL */}
        <div className="flex flex-col gap-3 text-base font-medium">

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
      <section className="flex-1 p-10 overflow-y-auto">
        {title && (
          <h1 className="text-4xl font-fredoka text-uva mb-8">
            {title}
          </h1>
        )}
        {children}
      </section>

    </main>
  );
}


/* LINK DEL SIDEBAR */
function AdminLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg transition-all cursor-pointer
         ${
           isActive
             ? "bg-rosa text-uva font-bold shadow-md"
             : "text-crema hover:bg-crema/10 hover:text-crema"
         }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}
