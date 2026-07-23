export default function EncabezadoVistaUsuario({
  icon: Icon,
  etiqueta,
  titulo,
  descripcion,
  action,
}) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-morado/12 text-morado shadow-sm ring-1 ring-morado/10">
            <Icon size={24} />
          </span>
        )}

        <div className="min-w-0">
          {etiqueta && (
            <p className="text-xs font-bold uppercase tracking-wide text-uva/60">
              {etiqueta}
            </p>
          )}

          <h1 className="font-fredoka text-3xl leading-tight text-morado sm:text-4xl">
            {titulo}
          </h1>

          {descripcion && (
            <p className="mt-1 max-w-[260px] text-xs leading-snug text-uva/70 sm:max-w-xl sm:text-sm">
              {descripcion}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 self-end sm:self-center">{action}</div>}
    </section>
  );
}
