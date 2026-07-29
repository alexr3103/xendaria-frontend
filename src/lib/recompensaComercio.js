export const recompensaComercioInicial = {
  beneficio: "",
  codigo: "",
  venceEn: "",
  activa: true,
  totalCanjes: 0,
};

export function normalizarFechaRecompensa(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "";

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const getParte = (tipo) =>
    partes.find((parte) => parte.type === tipo)?.value || "";

  return `${getParte("year")}-${getParte("month")}-${getParte("day")}`;
}

export function normalizarRecompensaComercio(data = {}) {
  return {
    ...recompensaComercioInicial,
    ...data,
    venceEn: normalizarFechaRecompensa(data.venceEn),
    activa: data.activa !== false,
    totalCanjes: Number(data.totalCanjes || 0),
  };
}
