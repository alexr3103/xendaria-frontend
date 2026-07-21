import { ChevronDown } from "lucide-react";

export default function SeccionFormularioAdmin({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
}) {
  return (
    <details
      open={defaultOpen}
      className="group border border-uva/15 rounded-xl bg-white overflow-hidden"
    >
      <summary className="list-none cursor-pointer flex items-center justify-between gap-3 p-4 hover:bg-crema/50">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon size={20} className="text-morado shrink-0" />}
          <div className="min-w-0">
            <h2 className="font-fredoka text-lg text-uva">{title}</h2>
            {description && (
              <p className="text-xs sm:text-sm text-gris/60">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown
          size={20}
          className="text-uva shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-uva/10 p-4 flex flex-col gap-5">
        {children}
      </div>
    </details>
  );
}
