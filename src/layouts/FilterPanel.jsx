// src/components/FilterPanel.jsx
import { categorias as categoriasInfo } from "../components/CategoriasFiltros.jsx";

export default function FilterPanel({ categorias, filtro, setFiltro, close }) {
  return (
    <div
      className="
        fixed
        inset-x-0
        top-24
        mx-auto
        w-[90%]
        max-w-[430px]
        bg-gris/90
        text-white
        rounded-3xl
        shadow-2xl
        z-[9999]
        p-6
        animate-fade-in
      "
    >
      <h1 className="text-center font-fredoka text-xl mb-4">
        Filtrar puntos
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {categorias.map((cat) => {
          const categoria = categoriasInfo[cat];
          const Icon = categoria?.icon;

          if (!categoria || !Icon) return null;

          const isActive = filtro === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setFiltro(isActive ? null : cat);
                close();
              }}
              style={{ backgroundColor: categoria.color }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm
                shadow transition active:scale-95
                ${isActive ? "ring-4 ring-morado/60 scale-105" : ""}
              `}
            >
              <Icon size={18} className="text-gris" />
              <span className="text-gris">{categoria.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
