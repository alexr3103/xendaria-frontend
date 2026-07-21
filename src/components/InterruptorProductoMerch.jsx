import { Eye, EyeOff } from "lucide-react";

export default function InterruptorProductoMerch({ active, onClick }) {
  const Icon = active ? Eye : EyeOff;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-extrabold transition ${
        active
          ? "border-morado/30 bg-morado/10 text-uva"
          : "border-uva/10 bg-white text-uva/65 hover:bg-crema"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          active ? "bg-morado text-crema" : "bg-crema text-uva"
        }`}
      >
        <Icon size={16} />
      </span>
      {active ? "Producto activo" : "Producto inactivo"}
    </button>
  );
}
