import { Link } from "react-router-dom";
import { Award, ListFilter, Plus } from "lucide-react";
import { categorias } from "../components/CategoriasFiltros.jsx";
import BuscadorAdmin from "../components/BuscadorAdmin.jsx";
import PildoraFiltro from "../components/PildoraFiltro.jsx";

export default function AdminFilterPanel({
  buscar,
  setBuscar,
  filtroCategoria,
  setFiltroCategoria,
  filtroInsignia = false,
  setFiltroInsignia,
  crearTo,
}) {
  return (
    <div className="mb-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {crearTo && (
          <Link
            to={crearTo}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-morado px-4 text-sm font-bold text-crema shadow-md transition hover:bg-morado/85"
            title="Nuevo punto"
          >
            <Plus size={18} />
            Nuevo punto
          </Link>
        )}

        <BuscadorAdmin
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar punto"
          className="flex-1 sm:max-w-[360px] sm:flex-none"
        />
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-uva/50">
        <ListFilter size={14} />
        Categorías
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <PildoraFiltro active={!filtroCategoria} onClick={() => setFiltroCategoria(null)}>
          Todos
        </PildoraFiltro>

        {Object.entries(categorias)
          .filter(([cat]) => cat !== "propios")
          .map(([cat, info]) => (
            <PildoraFiltro
              key={cat}
              active={filtroCategoria === cat}
              onClick={() =>
                setFiltroCategoria(filtroCategoria === cat ? null : cat)
              }
              color={info.color}
              icon={info.icon}
            >
              {info.label}
            </PildoraFiltro>
          ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {setFiltroInsignia && (
          <PildoraFiltro
            active={filtroInsignia}
            onClick={() => setFiltroInsignia(!filtroInsignia)}
            icon={Award}
          >
            Con insignia
          </PildoraFiltro>
        )}
      </div>
    </div>
  );
}
