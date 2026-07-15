import { ListFilter } from "lucide-react";

export default function AdminFilterHeading({
  children,
  icon: Icon = ListFilter,
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-uva/50 ${className}`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </div>
  );
}
