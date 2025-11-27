import { Search, SlidersHorizontal } from "lucide-react";
import { categorias } from "../components/CategoriasFiltros.jsx";

export default function AdminFilterPanel({
  buscar,
  setBuscar,
  filtroCategoria,
  setFiltroCategoria
}) {
  return (
    <div className="bg-crema p-4 rounded-2xl shadow-md mb-6 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="text-uva" />
        <h3 className="text-xl font-fredoka text-uva">Filtros</h3>
      </div>

      {/* BUSCADOR */}
      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-inner">
        <Search size={18} className="text-uva" />
        <input
          spellCheck="false"
          type="text"
          placeholder="Buscar por nombre..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="w-full outline-none bg-transparent text-uva placeholder-uva/50"
        />
      </div>

      {/* CATEGORÍAS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFiltroCategoria(null)}
          className={`py-2 rounded-xl text-sm font-semibold border 
            ${!filtroCategoria ? "bg-uva text-crema" : "bg-white text-uva"}
          `}
        >
          Todas
        </button>

        {Object.keys(categorias).map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFiltroCategoria(filtroCategoria === cat ? null : cat)
            }
            className={`py-2 rounded-xl text-sm font-semibold border transition
              ${
                filtroCategoria === cat
                  ? "bg-uva text-crema"
                  : "bg-white text-uva hover:bg-crema"
              }
            `}
          >
            {categorias[cat].label}
          </button>
        ))}
      </div>

    </div>
  );
}
