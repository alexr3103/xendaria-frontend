export const TALLES_DISPONIBLES = ["XS", "S", "M", "L", "XL", "XXL"];

export const MERCH_CATEGORY_OPTIONS = [
  { value: "Indumentaria", label: "Indumentaria", color: "#A0CDFF" },
  { value: "Accesorios", label: "Accesorios", color: "#C69BFF" },
  { value: "Papeleria", label: "Papeleria", color: "#FFF7A8" },
  { value: "Coleccionables", label: "Coleccionables", color: "#F28FA0" },
];

export const MERCH_COLOR_OPTIONS = [
  { nombre: "Negro", hex: "#000000" },
  { nombre: "Blanco", hex: "#ffffff" },
  { nombre: "Uva", hex: "#401A37" },
  { nombre: "Morado", hex: "#AA63E0" },
  { nombre: "Fucsia", hex: "#D81159" },
  { nombre: "Rosa", hex: "#F28FA0" },
  { nombre: "Menta", hex: "#83FFC4" },
  { nombre: "Vainilla", hex: "#FFF7A8" },
  { nombre: "Celeste", hex: "#A0CDFF" },
  { nombre: "Lila", hex: "#C69BFF" },
  { nombre: "Chicle", hex: "#FF8BC6" },
];

export function normalizarCategoriaMerch(categoria = "") {
  return String(categoria)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getMerchCategoryInfo(categoria = "") {
  const normalizada = normalizarCategoriaMerch(categoria);

  return (
    MERCH_CATEGORY_OPTIONS.find(
      (opcion) => normalizarCategoriaMerch(opcion.value) === normalizada
    ) || {
      value: categoria,
      label: categoria || "Sin categoria",
      color: "#D1D1D1",
    }
  );
}
