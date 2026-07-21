import { ArrowDownAZ, ArrowUpZA, ChevronsUpDown } from "lucide-react";

export default function EncabezadoOrdenableAdmin({ active, direction, onClick, children }) {
  const Icon = active
    ? direction === "az"
      ? ArrowDownAZ
      : ArrowUpZA
    : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-left font-extrabold uppercase tracking-wide transition ${
        active
          ? "bg-crema text-uva"
          : "text-uva hover:bg-crema/70 hover:text-uva"
      }`}
    >
      {children}
      <Icon size={15} className={active ? "text-morado" : "text-uva/45"} />
    </button>
  );
}
