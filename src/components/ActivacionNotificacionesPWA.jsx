import { useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";
import { useLocation } from "react-router-dom";
import Alert from "./Alertas.jsx";
import ModalXendaria from "./ModalXendaria.jsx";
import { normalizarConfiguracionUsuario } from "../lib/configuracionUsuario.js";
import { activarNotificacionesPush } from "../lib/notificacionesPush.js";
import { getMensajeError } from "../lib/errores.js";

const CLAVE_OFRECIDA = "xendaria:notificaciones-post-instalacion-ofrecidas";
const CLAVE_PENDIENTE = "xendaria:notificaciones-post-instalacion-pendientes";

function estaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    return {};
  }
}

function getUsuarioId(usuario = {}) {
  return usuario._id || usuario.id || "";
}

function marcarOfertaComoVista() {
  localStorage.setItem(CLAVE_OFRECIDA, "true");
  localStorage.removeItem(CLAVE_PENDIENTE);
}

export default function ActivacionNotificacionesPWA({
  habilitada = true,
}) {
  const API = import.meta.env.VITE_API_URL;
  const { pathname } = useLocation();
  const [instalacionDetectada, setInstalacionDetectada] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [activando, setActivando] = useState(false);
  const [activadas, setActivadas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const registrarInstalacion = () => {
      localStorage.setItem(CLAVE_PENDIENTE, "true");
      setInstalacionDetectada(true);
    };

    window.addEventListener("appinstalled", registrarInstalacion);
    return () => {
      window.removeEventListener("appinstalled", registrarInstalacion);
    };
  }, []);

  useEffect(() => {
    if (
      !habilitada ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return undefined;
    }

    const token = localStorage.getItem("token");
    const usuario = getUsuarioLocal();
    const esAdmin = String(usuario.role || "").toLowerCase() === "admin";
    const ofertaVista = localStorage.getItem(CLAVE_OFRECIDA) === "true";
    const ofertaPendiente =
      localStorage.getItem(CLAVE_PENDIENTE) === "true" || estaInstalada();

    if (!token || esAdmin || ofertaVista || !ofertaPendiente) {
      return undefined;
    }

    if (Notification.permission !== "default") {
      marcarOfertaComoVista();
      return undefined;
    }

    const timeout = window.setTimeout(() => setAbierta(true), 900);
    return () => window.clearTimeout(timeout);
  }, [habilitada, instalacionDetectada, pathname]);

  function cerrar() {
    marcarOfertaComoVista();
    setAbierta(false);
  }

  async function activar() {
    const token = localStorage.getItem("token");
    const usuario = getUsuarioLocal();
    const usuarioId = getUsuarioId(usuario);

    if (!token || !usuarioId) {
      setError("Iniciá sesión para activar los avisos en este dispositivo.");
      return;
    }

    setActivando(true);
    setError("");

    try {
      await activarNotificacionesPush({ API, token });

      const configuracionActual =
        normalizarConfiguracionUsuario(usuario.configuracion);
      const configuracion = {
        ...configuracionActual,
        notificaciones: {
          ...configuracionActual.notificaciones,
          recompensas: true,
          rutas: true,
          compras: true,
        },
      };

      const res = await fetch(`${API}/api/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ configuracion }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "No se pudieron guardar tus preferencias."
        );
      }

      const usuarioActualizado = data?.usuario || {};
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          ...usuario,
          ...usuarioActualizado,
          id: usuarioActualizado._id || usuarioActualizado.id || usuarioId,
          configuracion,
        })
      );
      window.dispatchEvent(new Event("xendaria:configuracion-actualizada"));
      marcarOfertaComoVista();
      setActivadas(true);
    } catch (err) {
      setError(
        getMensajeError(err, "No se pudieron activar las notificaciones.")
      );
    } finally {
      setActivando(false);
    }
  }

  return (
    <ModalXendaria
      open={abierta}
      onClose={activando ? undefined : cerrar}
      closeLabel="Cerrar activación de notificaciones"
      maxWidth="max-w-sm"
      className="border-morado/20 bg-white"
      contentClassName="p-5 sm:p-6"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-morado/10 text-morado">
          {activadas ? (
            <Check aria-hidden="true" size={29} />
          ) : (
            <BellRing aria-hidden="true" size={27} />
          )}
        </span>

        <h2 className="mt-4 font-fredoka text-2xl font-semibold text-uva">
          {activadas ? "Avisos activados" : "¿Activamos los avisos?"}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-uva/75">
          {activadas
            ? "Este dispositivo ya puede recibir novedades de rutas, recompensas y compras."
            : "Te avisaremos cuando haya rutas nuevas, recompensas de comercios y cambios en tus compras."}
        </p>

        {error && (
          <div className="mt-4 text-left">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {activadas ? (
          <button
            type="button"
            onClick={() => setAbierta(false)}
            className="mt-6 min-h-11 w-full rounded-xl bg-morado px-4 font-bold text-crema shadow-md transition active:scale-[0.98]"
          >
            Genial
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={cerrar}
              disabled={activando}
              className="min-h-11 rounded-xl bg-rosa px-3 font-bold text-uva shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={activar}
              disabled={activando}
              className="min-h-11 rounded-xl bg-morado px-3 font-bold text-crema shadow-md transition active:scale-[0.98] disabled:opacity-60"
            >
              {activando ? "Activando..." : "Activar avisos"}
            </button>
          </div>
        )}
      </div>
    </ModalXendaria>
  );
}
