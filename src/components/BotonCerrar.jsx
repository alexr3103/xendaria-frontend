import { X } from "lucide-react";

export default function BotonCerrar({
  onClick,
  size = 22,
  className = "",
  ariaLabel = "Cerrar",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        bg-fucsia text-white
        w-[50px] h-[50px]
        flex items-center justify-center
        rounded-2xl shadow-lg
        active:scale-95 transition
        ${className}
      `}
    >
      <X size={size} />
    </button>
  );
}
