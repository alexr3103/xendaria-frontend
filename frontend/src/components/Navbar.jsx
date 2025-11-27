import { ShoppingBasket, Share2, MapPin, Crown, User } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function userNav() {
  const items = [
    { to: "/proximamente", label: "Tienda", icon: <ShoppingBasket size={22} /> },
    { to: "/proximamente", label: "Rutas", icon: <Share2 size={22} /> },
    { to: "/home", label: "Inicio", icon: <MapPin size={22} /> },
    { to: "/proximamente", label: "Ranking", icon: <Crown size={22} /> },
    { to: "/perfil", label: "Perfil", icon: <User size={22} /> },
  ];
  return (
    <nav className="
      fixed bottom-4 left-1/2 -translate-x-1/2
      bg-gris text-crema
      px-6 py-3
      rounded-3xl shadow-xl
      flex justify-between items-center
      w-[90%] max-w-sm
      z-50
    ">
      {items.map((item) => (
        <NavLink
  key={item.to + "-" + item.label}
  to={item.to}
  className={({ isActive }) =>
    `
    flex flex-col items-center justify-center mx-2
    transition-all duration-200
    ${
      isActive
        ? "text-rosa scale-110"
        : "text-crema/90 hover:text-crema"
    }
  `
  }
>
          {item.icon}
          <span className="text-xs font-nunito mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
