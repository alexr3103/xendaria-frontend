export default function BotonAccionUsuario({
  children,
  icon: Icon,
  iconClassName = "",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-rosa px-4 text-sm font-bold text-uva shadow-md ring-1 ring-rosa/60 active:scale-95 disabled:opacity-60 ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} className={iconClassName} />}
      {children}
    </button>
  );
}
