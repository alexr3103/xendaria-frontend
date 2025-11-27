import { ArrowLeft } from "lucide-react";

export default function FormsAdmin({
  title = "Formulario",
  subtitle = "",
  icon = null,
  onSubmit,
  children,
  width = "480px",
  showBack = true,
  footer = null,
}) {
  return (
    <div
      className="bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] rounded-3xl p-6 flex flex-col"
      style={{ width }}
    >
      <div className="flex items-start justify-between mb-6">

        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-crema rounded-xl text-morado shadow-sm">
              {icon}
            </div>
          )}

          <div>
            <h1 className="font-fredoka text-3xl text-morado leading-none">
              {title}
            </h1>

            {subtitle && (
              <p className="text-gris text-sm mt-1 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl hover:bg-crema transition text-uva"
            title="Volver"
          >
            <ArrowLeft size={22} />
          </button>
        )}
      </div>
      <form
        className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2"
        style={{ scrollbarWidth: "thin" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit();
        }}
      >
        {children}
        <div className="mt-4 flex gap-3 pt-4 border-t border-crema/60">
          {footer ? (
            footer
          ) : (
            <>
              <button
                type="submit"
                className="bg-morado text-crema px-5 py-2.5 rounded-xl hover:bg-morado/80 transition font-semibold shadow-sm"
              >
                Guardar cambios
              </button>

              <button
                type="button"
                className="bg-crema text-uva px-5 py-2.5 rounded-xl hover:bg-crema/80 transition font-semibold shadow-sm"
                onClick={() => window.history.back()}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
