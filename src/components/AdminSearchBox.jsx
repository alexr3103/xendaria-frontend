import { Search, X } from "lucide-react";

export default function AdminSearchBox({
  value,
  onChange,
  placeholder = "Buscar",
  className = "",
}) {
  return (
    <label
      className={`flex h-11 min-w-[220px] max-w-full items-center gap-2 rounded-full border border-uva/25 bg-crema px-3 text-uva shadow-[0_1px_0_rgba(64,26,55,0.05)] transition focus-within:border-uva/35 focus-within:shadow-[0_0_0_3px_rgba(170,99,224,0.10)] ${className}`}
    >
      <Search size={17} className="shrink-0 text-uva/60" />
      <input
        spellCheck="false"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-uva/45"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-uva transition hover:bg-rosa/35"
          aria-label="Limpiar busqueda"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
