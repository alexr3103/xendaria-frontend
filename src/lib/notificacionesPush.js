const BASE64URL_DASH_REGEX = /-/g;
const BASE64URL_UNDERSCORE_REGEX = /_/g;

function convertirClaveBase64(clave) {
  const padding = "=".repeat((4 - (clave.length % 4)) % 4);
  const base64 = (clave + padding)
    .replace(BASE64URL_DASH_REGEX, "+")
    .replace(BASE64URL_UNDERSCORE_REGEX, "/");
  const datos = window.atob(base64);

  return Uint8Array.from(datos, (caracter) => caracter.charCodeAt(0));
}

function validarSoportePush() {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error(
      "Este navegador no permite recibir notificaciones push."
    );
  }
}

async function obtenerClavePublica(API, token) {
  const res = await fetch(`${API}/api/notificaciones/push/clave-publica`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.disponible || !data?.clavePublica) {
    throw new Error(
      data?.message ||
        "Las notificaciones push todavía no están configuradas."
    );
  }

  return data.clavePublica;
}

async function guardarSuscripcion(API, token, suscripcion) {
  const res = await fetch(`${API}/api/notificaciones/push/suscripcion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(suscripcion.toJSON()),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.message || "No se pudo activar la notificacion push."
    );
  }

  return suscripcion;
}

export async function activarNotificacionesPush({ API, token }) {
  validarSoportePush();

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    throw new Error(
      "Necesitás permitir las notificaciones desde el navegador para activar este aviso."
    );
  }

  const registro = await navigator.serviceWorker.ready;
  let suscripcion = await registro.pushManager.getSubscription();

  if (!suscripcion) {
    const clavePublica = await obtenerClavePublica(API, token);
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertirClaveBase64(clavePublica),
    });
  }

  return guardarSuscripcion(API, token, suscripcion);
}

export async function desactivarNotificacionesPush({ API, token }) {
  validarSoportePush();

  const registro = await navigator.serviceWorker.ready;
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return;

  await fetch(`${API}/api/notificaciones/push/suscripcion`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: suscripcion.endpoint,
    }),
  });

  await suscripcion.unsubscribe();
}

export async function sincronizarSuscripcionPush({
  API,
  token,
  crearSiFalta = false,
}) {
  if (
    !token ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return null;
  }

  const registro = await navigator.serviceWorker.ready;
  let suscripcion = await registro.pushManager.getSubscription();

  if (!suscripcion && crearSiFalta) {
    const clavePublica = await obtenerClavePublica(API, token);
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertirClaveBase64(clavePublica),
    });
  }

  if (!suscripcion) return null;

  return guardarSuscripcion(API, token, suscripcion);
}

export async function desvincularDispositivoPush({ API, token }) {
  if (
    !token ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  const registro = await navigator.serviceWorker.ready;
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return;

  await fetch(`${API}/api/notificaciones/push/suscripcion`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: suscripcion.endpoint,
    }),
  });
}
