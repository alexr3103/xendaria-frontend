import { Navigate, Outlet } from "react-router-dom";

function tokenExpirado(token) {
  try {
    const payloadBase64Url = token.split(".")[1];
    const payloadBase64 = payloadBase64Url
      ?.replace(/-/g, "+")
      .replace(/_/g, "/");
    if (!payloadBase64) return true;

    const padding = "=".repeat((4 - (payloadBase64.length % 4)) % 4);
    const payload = JSON.parse(atob(payloadBase64 + padding));
    if (!payload.exp) return true;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export default function ProteccionAdmin() {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (tokenExpirado(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return <Navigate to="/login" replace />;
  }

  if (usuario?.role !== "admin") {
    return <Navigate to="/error/403" replace />;
  }

  return <Outlet />;
}
