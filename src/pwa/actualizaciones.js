export const EVENTO_ACTUALIZACION_PWA =
  "xendaria:actualizacion-disponible";

const INTERVALO_REVISION_MS = 30 * 60 * 1000;

let registroActual = null;
let actualizacionPendiente = null;
let versionAvisada = null;
let actualizacionPospuesta = false;

function emitirActualizacion(detalle = {}) {
  if (actualizacionPospuesta) return;

  actualizacionPendiente = {
    registration: detalle.registration || registroActual,
    version: detalle.version || null,
  };

  window.dispatchEvent(
    new CustomEvent(EVENTO_ACTUALIZACION_PWA, {
      detail: actualizacionPendiente,
    })
  );
}

function revisarWorkerEnEspera(registration) {
  if (registration?.waiting && navigator.serviceWorker.controller) {
    emitirActualizacion({ registration });
  }
}

async function revisarVersionPublicada() {
  if (!import.meta.env.PROD) return;

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return;

    const data = await response.json();
    const versionPublicada = String(data.version || "");
    const versionActual = String(import.meta.env.VITE_BUILD_VERSION || "");

    if (
      versionPublicada &&
      versionActual &&
      versionPublicada !== versionActual &&
      versionPublicada !== versionAvisada
    ) {
      versionAvisada = versionPublicada;
      emitirActualizacion({ version: versionPublicada });
    }
  } catch {
    // Una revision fallida no interrumpe el uso normal de la app.
  }
}

function observarActualizaciones(registration) {
  registroActual = registration;
  revisarWorkerEnEspera(registration);

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;

    worker.addEventListener("statechange", () => {
      if (
        worker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        revisarWorkerEnEspera(registration);
      }
    });
  });
}

export function registrarPWA() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      observarActualizaciones(registration);
      await revisarVersionPublicada();

      const revisar = () => {
        registration.update().catch(() => {});
        revisarWorkerEnEspera(registration);
        revisarVersionPublicada();
      };

      window.addEventListener("focus", revisar);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          revisar();
        }
      });
      window.setInterval(revisar, INTERVALO_REVISION_MS);
    } catch (error) {
      console.error("Error al registrar el Service Worker:", error);
    }
  });
}

export function obtenerActualizacionPendiente() {
  if (registroActual?.waiting && navigator.serviceWorker.controller) {
    return {
      registration: registroActual,
      version: actualizacionPendiente?.version || null,
    };
  }

  return actualizacionPendiente;
}

export function descartarActualizacionPendiente() {
  actualizacionPospuesta = true;
  actualizacionPendiente = null;
}
