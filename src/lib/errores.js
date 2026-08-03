const MENSAJES_POR_ESTADO = {
  400: "Revisá los datos ingresados e intentá nuevamente.",
  401: "Tu sesión venció. Iniciá sesión nuevamente.",
  403: "No tenés permiso para realizar esta acción.",
  404: "No encontramos la información solicitada.",
  409: "No pudimos completar la acción porque los datos ya existen.",
  413: "El archivo seleccionado supera el tamaño permitido.",
  429: "Realizaste demasiados intentos. Esperá un momento y volvé a probar.",
  500: "Ocurrió un inconveniente inesperado. Intentá nuevamente en unos minutos.",
  502: "El servicio no está disponible en este momento. Intentá más tarde.",
  503: "El servicio no está disponible en este momento. Intentá más tarde.",
  504: "La solicitud tardó demasiado. Intentá nuevamente.",
};

const PATRONES_TECNICOS = [
  /^http\s+\d{3}$/i,
  /\b(?:failed to fetch|network ?error|fetch failed|load failed)\b/i,
  /\b(?:econnrefused|econnreset|etimedout|enotfound)\b/i,
  /\b(?:unauthorized|forbidden|internal server error|bad request|not found)\b/i,
  /\b(?:unexpected token|json at position|body stream|aborterror)\b/i,
  /\b(?:jwt malformed|invalid signature|token expired|cast to objectid|objectid)\b/i,
  /\b(?:validationerror|mongo(?:server)?error|bsonerror|multererror)\b/i,
  /\b(?:is a required field|must be|cannot be|invalid value|duplicate key)\b/i,
  /<\/?(?:html|body|head|pre)[^>]*>/i,
  /(?:^|\s)at\s+[\w.[\]/\\-]+\s*\(/,
];

function textoDesde(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => textoDesde(item))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof valor === "string") return valor.trim();
  if (valor?.message) return textoDesde(valor.message);
  if (valor?.error) return textoDesde(valor.error);
  return "";
}

function getEstado(valor) {
  const estado = Number(valor?.status || valor?.statusCode || valor?.response?.status);
  return Number.isInteger(estado) ? estado : null;
}

export function esMensajeTecnico(mensaje) {
  const texto = textoDesde(mensaje);
  return !texto || PATRONES_TECNICOS.some((patron) => patron.test(texto));
}

export function getMensajeError(
  error,
  fallback = "No pudimos completar la acción. Intentá nuevamente."
) {
  const estado = getEstado(error);
  const mensaje = textoDesde(error);

  if (esMensajeTecnico(mensaje)) {
    return MENSAJES_POR_ESTADO[estado] || fallback;
  }

  return mensaje;
}

export async function getMensajeRespuesta(response, fallback) {
  const data = await response.json().catch(() => null);
  return getMensajeError(
    { status: response.status, message: data?.message || data?.error },
    MENSAJES_POR_ESTADO[response.status] || fallback
  );
}
