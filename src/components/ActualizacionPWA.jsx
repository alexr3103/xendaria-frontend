import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";
import {
  descartarActualizacionPendiente,
  EVENTO_ACTUALIZACION_PWA,
  obtenerActualizacionPendiente,
} from "../pwa/actualizaciones.js";

export default function ActualizacionPWA() {
  const [actualizacion, setActualizacion] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    const pendiente = obtenerActualizacionPendiente();
    if (pendiente) setActualizacion(pendiente);

    const mostrarActualizacion = (event) => {
      setActualizacion(event.detail || {});
    };

    window.addEventListener(
      EVENTO_ACTUALIZACION_PWA,
      mostrarActualizacion
    );

    return () => {
      window.removeEventListener(
        EVENTO_ACTUALIZACION_PWA,
        mostrarActualizacion
      );
    };
  }, []);

  const posponer = () => {
    descartarActualizacionPendiente();
    setActualizacion(null);
  };

  const actualizar = () => {
    setActualizando(true);

    const workerEnEspera = actualizacion?.registration?.waiting;
    if (!workerEnEspera) {
      window.location.reload();
      return;
    }

    let recargando = false;
    const recargar = () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      recargar,
      { once: true }
    );
    workerEnEspera.postMessage({ type: "SKIP_WAITING" });
    window.setTimeout(recargar, 8000);
  };

  return (
    <ModalXendaria
      open={Boolean(actualizacion)}
      showClose={false}
      maxWidth="max-w-sm"
      className="border-morado/20 bg-white"
      contentClassName="p-5 sm:p-6"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-morado/10 text-morado">
          <RefreshCw
            aria-hidden="true"
            className={actualizando ? "animate-spin" : ""}
            size={28}
          />
        </span>

        <h2 className="mt-4 font-fredoka text-2xl font-semibold text-uva">
          Nueva versión disponible
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-uva/75">
          Actualizá Xendaria para recibir las últimas mejoras y correcciones.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={posponer}
            disabled={actualizando}
            className="min-h-11 rounded-xl border border-uva/20 bg-crema px-3 font-bold text-uva transition active:scale-[0.98] disabled:opacity-50"
          >
            Más tarde
          </button>
          <button
            type="button"
            onClick={actualizar}
            disabled={actualizando}
            className="min-h-11 rounded-xl bg-morado px-3 font-bold text-crema shadow-md transition active:scale-[0.98] disabled:opacity-60"
          >
            {actualizando ? "Actualizando..." : "Actualizar ahora"}
          </button>
        </div>
      </div>
    </ModalXendaria>
  );
}
