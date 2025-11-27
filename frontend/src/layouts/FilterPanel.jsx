import {
  Star,
  Bus,
  BookOpen,
  Trees,
  Leaf,
  FerrisWheel,
  Ghost,    
} from "lucide-react";

const ICONS = {
  puntos_populares: Star,
  paradas_de_bus_turistico: Bus,
  paseo_de_la_historieta: BookOpen,
  espacios_verdes_publicos: Trees,
  espacios_verdes_privados: Leaf,
  lugares_de_esparcimiento: FerrisWheel,
  curiosos: Ghost,
};

const LABELS = {
  puntos_populares: "Populares",
  paradas_de_bus_turistico: "Bus turístico",
  paseo_de_la_historieta: "Historieta",
  espacios_verdes_publicos: "Parques",
  espacios_verdes_privados: "Jardines",
  lugares_de_esparcimiento: "Recreación",
  curiosos: "Curiosos",
};

// COLORES EXACTOS DEL MOCKUP + NUEVO
const COLORS = {
  puntos_populares: "#F28FA0",
  paradas_de_bus_turistico: "#FFF7A8",
  paseo_de_la_historieta: "#D1D1D1",
  espacios_verdes_publicos: "#83FFC4",
  espacios_verdes_privados: "#B6FF83",
  lugares_de_esparcimiento: "#A0CDFF",
  curiosos: "#C69BFF",
};

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
          const Icon = ICONS[cat];
          const label = LABELS[cat];
          const color = COLORS[cat];

          if (!Icon || !label) return null;

          const isActive = filtro === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setFiltro(isActive ? null : cat);
                close();
              }}
              style={{ backgroundColor: color }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm 
                shadow transition active:scale-95
                ${isActive ? "ring-4 ring-morado/60 scale-105" : ""}
              `}
            >
              <Icon size={18} className="text-gris" />
              <span className="text-gris">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
