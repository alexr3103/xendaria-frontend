import { Search, SlidersHorizontal, Heart } from "lucide-react";

export default function FilterPanelUsuarios({
  buscar,
  setBuscar,
  filtroFavoritos,
  setFiltroFavoritos
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

      {/* FILTRO DE FAVORITOS */}
      <div className="grid grid-cols-3 gap-2">

        {/* TODOS */}
        <button
          onClick={() => setFiltroFavoritos(null)}
          className={`py-2 rounded-xl text-sm font-semibold border transition 
            ${!filtroFavoritos ? "bg-uva text-crema" : "bg-white text-uva"}`}
        >
          Todos
        </button>

        {/* CON FAVORITOS */}
        <button
          onClick={() =>
            setFiltroFavoritos(
              filtroFavoritos === "Con favoritos" ? null : "Con favoritos"
            )
          }
          className={`py-2 rounded-xl text-sm font-semibold border transition
            ${
              filtroFavoritos === "Con favoritos"
                ? "bg-uva text-crema"
                : "bg-white text-uva hover:bg-crema"
            }`}
        >
          Con favs
        </button>

        {/* SIN FAVORITOS */}
        <button
          onClick={() =>
            setFiltroFavoritos(
              filtroFavoritos === "Sin favoritos" ? null : "Sin favoritos"
            )
          }
          className={`py-2 rounded-xl text-sm font-semibold border transition
            ${
              filtroFavoritos === "Sin favoritos"
                ? "bg-uva text-crema"
                : "bg-white text-uva hover:bg-crema"
            }`}
        >
          Sin favs
        </button>

      </div>
    </div>
  );
}
