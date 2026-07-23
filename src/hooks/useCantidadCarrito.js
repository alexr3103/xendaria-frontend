import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function useCantidadCarrito({ activo = true } = {}) {
  const API = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  const cargarCantidadCarrito = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token || !activo) {
      setCantidadCarrito(0);
      return;
    }

    try {
      const res = await fetch(`${API}/api/carrito`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setCantidadCarrito(0);
        return;
      }

      const data = await res.json();
      const items = data?.items ?? [];
      const totalItems = items.reduce(
        (acc, item) => acc + Number(item.cantidad || 0),
        0
      );

      setCantidadCarrito(totalItems);
    } catch {
      setCantidadCarrito(0);
    }
  }, [API, activo]);

  useEffect(() => {
    cargarCantidadCarrito();
  }, [cargarCantidadCarrito, location.pathname]);

  useEffect(() => {
    function actualizarBadge() {
      cargarCantidadCarrito();
    }

    window.addEventListener("carrito-actualizado", actualizarBadge);

    return () => {
      window.removeEventListener("carrito-actualizado", actualizarBadge);
    };
  }, [cargarCantidadCarrito]);

  return cantidadCarrito;
}
