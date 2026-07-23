export default function PildoraFiltro({
  active,
  onClick,
  children,
  color,
  icon: Icon,
  claseActiva = "",
  claseInactiva = "",
}) {
  const usaClasesTailwind = claseActiva || claseInactiva;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={
        color && !usaClasesTailwind
          ? {
              backgroundColor: active ? color : `${color}55`,
              borderColor: color,
            }
          : undefined
      }
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
        active
          ? claseActiva ||
            (color
            ? "text-uva shadow"
            : "border-uva bg-uva text-crema shadow")
          : claseInactiva ||
            (color
          ? "text-uva shadow-sm"
          : "border-uva/10 bg-crema text-uva hover:bg-white")
      }`}
    >
      {Icon && (
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${
            active ? "bg-crema/70" : ""
          }`}
        >
          <Icon size={13} />
        </span>
      )}
      {children}
    </button>
  );
}
