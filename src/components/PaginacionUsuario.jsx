export default function PaginacionUsuario({
  pagina,
  totalPaginas,
  inicio,
  fin,
  total,
  onPrev,
  onNext,
}) {
  const prevDisabled = pagina <= 1;
  const nextDisabled = pagina >= totalPaginas;
  const disabledClass =
    "!bg-grisaceo !text-gris/55 !shadow-none !ring-grisaceo cursor-not-allowed";

  return (
    <div className="flex flex-col gap-3 border-t border-uva/10 bg-crema/40 px-4 py-3 text-sm font-bold text-uva/65 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wide">
        {inicio}-{fin} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={prevDisabled}
          className={`rounded-full bg-morado/10 px-3 py-1.5 text-xs font-extrabold text-morado ring-1 ring-morado/15 transition outline-none focus-visible:ring-2 focus-visible:ring-morado/30 ${
            prevDisabled ? disabledClass : ""
          }`}
        >
          Anterior
        </button>
        <span className="px-1 text-xs font-extrabold uppercase tracking-wide text-uva/55">
          Pagina {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`rounded-full bg-morado px-3 py-1.5 text-xs font-extrabold text-white shadow-sm ring-1 ring-morado transition outline-none focus-visible:ring-2 focus-visible:ring-morado/30 ${
            nextDisabled ? disabledClass : ""
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
