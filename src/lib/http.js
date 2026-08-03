import { getMensajeRespuesta } from "./errores.js";

export async function apiGet(path) {
  const base = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      await getMensajeRespuesta(res, "No se pudo cargar la información solicitada.")
    );
  }
  return res.json();
}
