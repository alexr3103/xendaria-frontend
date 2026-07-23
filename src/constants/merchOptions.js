export const TALLES_DISPONIBLES = ["XS", "S", "M", "L", "XL", "XXL"];

export const MERCH_CATEGORY_OPTIONS = [
  {
    value: "Indumentaria",
    label: "Indumentaria",
    color: "celeste",
    claseActiva: "border-celeste bg-celeste text-uva shadow",
    claseInactiva: "border-celeste bg-celeste/45 text-uva shadow-sm hover:bg-celeste/65",
    claseBadge: "border-celeste bg-celeste/45 text-uva",
  },
  {
    value: "Accesorios",
    label: "Accesorios",
    color: "lila",
    claseActiva: "border-lila bg-lila text-uva shadow",
    claseInactiva: "border-lila bg-lila/45 text-uva shadow-sm hover:bg-lila/65",
    claseBadge: "border-lila bg-lila/45 text-uva",
  },
  {
    value: "Papeleria",
    label: "Papeleria",
    color: "vainilla",
    claseActiva: "border-vainilla bg-vainilla text-uva shadow",
    claseInactiva: "border-vainilla bg-vainilla/60 text-uva shadow-sm hover:bg-vainilla/80",
    claseBadge: "border-vainilla bg-vainilla/60 text-uva",
  },
  {
    value: "Coleccionables",
    label: "Coleccionables",
    color: "rosa",
    claseActiva: "border-rosa bg-rosa text-uva shadow",
    claseInactiva: "border-rosa bg-rosa/45 text-uva shadow-sm hover:bg-rosa/65",
    claseBadge: "border-rosa bg-rosa/45 text-uva",
  },
];

export const MERCH_COLOR_OPTIONS = [
  { nombre: "Negro", swatchClassName: "bg-black" },
  { nombre: "Blanco", swatchClassName: "bg-white" },
  { nombre: "Uva", swatchClassName: "bg-uva" },
  { nombre: "Morado", swatchClassName: "bg-morado" },
  { nombre: "Fucsia", swatchClassName: "bg-fucsia" },
  { nombre: "Rosa", swatchClassName: "bg-rosa" },
  { nombre: "Menta", swatchClassName: "bg-menta" },
  { nombre: "Vainilla", swatchClassName: "bg-vainilla" },
  { nombre: "Celeste", swatchClassName: "bg-celeste" },
  { nombre: "Lila", swatchClassName: "bg-lila" },
  { nombre: "Chicle", swatchClassName: "bg-chicle" },
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
      color: "grisaceo",
      claseActiva: "border-grisaceo bg-grisaceo text-uva shadow",
      claseInactiva: "border-grisaceo bg-grisaceo/45 text-uva shadow-sm hover:bg-grisaceo/65",
      claseBadge: "border-grisaceo bg-grisaceo/45 text-uva",
    }
  );
}
