import { useEffect, useMemo, useState } from "react";
import { Download, Share2, SquarePlus } from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";

const CLAVE_DESCARTADA = "xendaria:instalacion-descartada";
const IOS_DEVICE_REGEX = /iphone|ipad|ipod/i;

function estaInstalada() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function esDispositivoIOS() {
  if (typeof navigator === "undefined") return false;

  return (
    IOS_DEVICE_REGEX.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function fueDescartada() {
  try {
    return localStorage.getItem(CLAVE_DESCARTADA) === "true";
  } catch {
    return false;
  }
}

export default function InstalacionPWA({ habilitada = true }) {
  const [eventoInstalacion, setEventoInstalacion] = useState(null);
  const [instalada, setInstalada] = useState(estaInstalada);
  const [abierta, setAbierta] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const esIOS = useMemo(esDispositivoIOS, []);

  useEffect(() => {
    const capturarInstalacion = (event) => {
      event.preventDefault();
      setEventoInstalacion(event);
    };

    const confirmarInstalacion = () => {
      setInstalada(true);
      setEventoInstalacion(null);
      setAbierta(false);
    };

    window.addEventListener("beforeinstallprompt", capturarInstalacion);
    window.addEventListener("appinstalled", confirmarInstalacion);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturarInstalacion);
      window.removeEventListener("appinstalled", confirmarInstalacion);
    };
  }, []);

  useEffect(() => {
    if (
      !habilitada ||
      instalada ||
      fueDescartada() ||
      (!eventoInstalacion && !esIOS)
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setAbierta(true), 1200);
    return () => window.clearTimeout(timeout);
  }, [esIOS, eventoInstalacion, habilitada, instalada]);

  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE_DESCARTADA, "true");
    } catch {
      // La instalacion sigue disponible aunque el navegador bloquee el storage.
    }

    setAbierta(false);
  };

  const instalar = async () => {
    if (!eventoInstalacion) {
      cerrar();
      return;
    }

    setInstalando(true);

    try {
      await eventoInstalacion.prompt();
      const eleccion = await eventoInstalacion.userChoice;

      if (eleccion?.outcome === "accepted") {
        setInstalada(true);
      }
    } finally {
      setEventoInstalacion(null);
      setAbierta(false);
      setInstalando(false);
    }
  };

  return (
    <ModalXendaria
      open={abierta && !instalada}
      onClose={instalando ? undefined : cerrar}
      closeLabel="Cerrar instalación"
      maxWidth="max-w-sm"
      className="border-morado/20 bg-white"
      contentClassName="p-5 sm:p-6"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-morado/10 text-morado">
          <Download aria-hidden="true" size={28} />
        </span>

        <h2 className="mt-4 font-fredoka text-2xl font-semibold text-uva">
          Instalá Xendaria
        </h2>

        {esIOS && !eventoInstalacion ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-uva/75">
              Tené el mapa siempre a mano. En tu navegador, tocá{" "}
              <strong>Compartir</strong> y después{" "}
              <strong>Agregar a pantalla de inicio</strong>.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-crema px-4 py-3 text-uva">
              <Share2 aria-hidden="true" className="text-morado" size={22} />
              <span className="text-sm font-bold">Compartir</span>
              <span aria-hidden="true" className="text-uva/40">
                →
              </span>
              <SquarePlus
                aria-hidden="true"
                className="text-morado"
                size={22}
              />
            </div>

            <button
              type="button"
              onClick={cerrar}
              className="mt-5 min-h-11 w-full rounded-xl bg-morado px-4 font-bold text-crema shadow-md transition active:scale-[0.98]"
            >
              Entendido
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-uva/75">
              Accedé más rápido al mapa, tus rutas y recompensas desde la
              pantalla principal de tu dispositivo.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={cerrar}
                disabled={instalando}
                className="min-h-11 rounded-xl bg-rosa px-3 font-bold text-uva shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={instalar}
                disabled={instalando}
                className="min-h-11 rounded-xl bg-morado px-3 font-bold text-crema shadow-md transition active:scale-[0.98] disabled:opacity-60"
              >
                {instalando ? "Abriendo..." : "Instalar"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalXendaria>
  );
}
