import { Navigate, Outlet } from "react-router-dom";

export default function RequireAdmin() {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (usuario?.role !== "admin") {
    return <Navigate to="/error/403" replace />;
  }

  return <Outlet />;
}
