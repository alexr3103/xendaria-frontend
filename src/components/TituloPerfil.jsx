import { Sparkles } from "lucide-react";
import { categorias } from "./CategoriasFiltros.jsx";

export default function TituloPerfil({ titulo }) {
  if (!titulo?.titulo) return null;

  const categoria = categorias[titulo.categoria];
  const Icon = categoria?.icon || Sparkles;
  const color = categoria?.color || "#F4EFFF";

  return (
    <div className="mt-3 flex justify-center">
      <span className="inline-flex max-w-[calc(100vw-3rem)] items-center gap-2 rounded-full border border-uva/10 bg-crema px-3 py-2 text-uva shadow-sm">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-uva shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon size={16} />
        </span>
        <span className="min-w-0 whitespace-normal break-words text-center font-fredoka text-base leading-tight text-morado">
          {titulo.titulo}
        </span>
      </span>
    </div>
  );
}
