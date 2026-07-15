export const adminInputClass =
  "w-full min-w-0 rounded-2xl border border-uva/10 bg-crema px-4 py-3 text-uva outline-none transition placeholder:text-uva/35 focus:border-morado focus:bg-crema focus:ring-2 focus:ring-morado/15";

export function AdminEditorPage({ title, eyebrow = "Panel de edicion", actions, children }) {
  return (
    <div className="w-full overflow-x-hidden px-1">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-uva/45">
            {eyebrow}
          </p>
          <h2 className="font-fredoka text-3xl leading-none text-morado">
            {title}
          </h2>
        </div>

        {actions && <div className="flex flex-wrap justify-end gap-3">{actions}</div>}
      </div>

      {children}
    </div>
  );
}

export function AdminEditorForm({ children, onSubmit, className = "" }) {
  return (
    <form
      className={`mr-auto max-w-[1320px] rounded-[32px] border border-uva/10 bg-white p-6 shadow-sm sm:p-10 ${className}`}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

export function AdminSectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="font-fredoka text-[1.65rem] leading-none text-uva">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-uva/55">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AdminFlatSection({ icon, title, description, children, contentClassName = "space-y-10" }) {
  return (
    <section
      className="border-t border-uva/10"
      style={{ marginTop: "64px", paddingTop: "56px" }}
    >
      <AdminSectionTitle icon={icon} title={title} subtitle={description} />
      <div className={contentClassName} style={{ marginTop: "32px" }}>
        {children}
      </div>
    </section>
  );
}

export function AdminField({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-bold text-uva/80">
      {label}
      {children}
    </label>
  );
}
