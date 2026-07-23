export const claseInputAdmin =
  "w-full min-w-0 rounded-2xl border border-uva/10 bg-crema px-4 py-3 text-uva outline-none transition placeholder:text-uva/35 focus:border-morado focus:bg-crema focus:ring-2 focus:ring-morado/15";

export function PaginaEditorAdmin({ title, eyebrow = "Panel de edición", actions, children }) {
  return (
    <div className="w-full overflow-x-hidden px-1">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between lg:mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-uva/45">
            {eyebrow}
          </p>
          <h2 className="font-fredoka text-2xl leading-none text-morado sm:text-3xl">
            {title}
          </h2>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

export function FormularioEditorAdmin({ children, onSubmit, className = "" }) {
  return (
    <form
      className={`mr-auto max-w-[1320px] rounded-[28px] border border-uva/10 bg-white p-4 shadow-sm sm:p-6 lg:rounded-[32px] lg:p-8 xl:p-10 ${className}`}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

export function TituloSeccionAdmin({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
        {Icon && <Icon size={20} />}
      </span>
      <div>
        <h3 className="font-fredoka text-2xl leading-none text-uva sm:text-[1.65rem]">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-uva/55">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SeccionPlanaAdmin({ icon, title, description, children, contentClassName = "space-y-10" }) {
  return (
    <section
      className="border-t border-uva/10"
      style={{ marginTop: "64px", paddingTop: "56px" }}
    >
      <TituloSeccionAdmin icon={icon} title={title} subtitle={description} />
      <div className={contentClassName} style={{ marginTop: "32px" }}>
        {children}
      </div>
    </section>
  );
}

export function CampoAdmin({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-uva/80">
      {label}
      {children}
    </label>
  );
}
