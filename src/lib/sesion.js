const BASE64URL_DASH_REGEX = /-/g;
const BASE64URL_UNDERSCORE_REGEX = /_/g;
const CLAVE_BIENVENIDA_POST_LOGIN = "xendaria:bienvenida-post-login";

export function marcarBienvenidaPostLogin() {
  sessionStorage.setItem(CLAVE_BIENVENIDA_POST_LOGIN, "true");
}

export function hayBienvenidaPostLogin() {
  return sessionStorage.getItem(CLAVE_BIENVENIDA_POST_LOGIN) === "true";
}

export function completarBienvenidaPostLogin() {
  sessionStorage.removeItem(CLAVE_BIENVENIDA_POST_LOGIN);
}

export function decodificarToken(token) {
  try {
    const payloadBase64Url = String(token || "").split(".")[1];
    const payloadBase64 = payloadBase64Url
      ?.replace(BASE64URL_DASH_REGEX, "+")
      .replace(BASE64URL_UNDERSCORE_REGEX, "/");

    if (!payloadBase64) return null;

    const padding = "=".repeat((4 - (payloadBase64.length % 4)) % 4);
    return JSON.parse(atob(payloadBase64 + padding));
  } catch {
    return null;
  }
}

export function tokenVigente(token) {
  const payload = decodificarToken(token);
  return Boolean(payload?.exp && payload.exp * 1000 > Date.now());
}

export function obtenerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export function limpiarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export function obtenerDestinoSesion() {
  const token = localStorage.getItem("token");
  const usuario = obtenerUsuarioGuardado();

  if (!token || !usuario) return null;

  if (!tokenVigente(token)) {
    limpiarSesion();
    return null;
  }

  return usuario.role === "admin" ? "/admin" : "/home";
}
