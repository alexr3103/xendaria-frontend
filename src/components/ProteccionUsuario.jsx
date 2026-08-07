import { Navigate, Outlet, useLocation } from "react-router-dom";
import { limpiarSesion, tokenVigente } from "../lib/sesion.js";

export default function ProteccionUsuario() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token || !tokenVigente(token)) {
    limpiarSesion();

    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
