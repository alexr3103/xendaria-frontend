import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  limpiarSesion,
  obtenerUsuarioGuardado,
  tokenVigente,
} from "../lib/sesion.js";

export default function ProteccionUsuario() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const usuario = obtenerUsuarioGuardado();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!tokenVigente(token) || !usuario) {
    limpiarSesion({ avisar: true });

    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (usuario.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
