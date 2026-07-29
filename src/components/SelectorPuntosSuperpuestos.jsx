import { MapPin } from "lucide-react";

import { categorias as categoriasInfo } from "./CategoriasFiltros.jsx";
import ModalXendaria from "./ModalXendaria.jsx";

function getCategoriaPrincipal(punto = {}) {
  return (
    (Array.isArray(punto.categorias) && punto.categorias[0]) ||
    punto.categoria ||
    "propios"
  );
}

export default function SelectorPuntosSuperpuestos({
  puntos = [],
  onClose,
  onSelect,
}) {
  return (
    <ModalXendaria
      open={puntos.length > 1}
      onClose={onClose}
      closeLabel="Cerrar selección de lugares"
      maxWidth="max-w-md"
      header={
        <div className="border-b border-uva/10 px-5 pb-4 pt-6 pr-14">
          <p className="text-xs font-extrabold uppercase text-morado">
            Misma zona
          </p>
          <h2 className="mt-1 font-fredoka text-2xl leading-tight text-uva">
            Elegí qué lugar querés ver
          </h2>
          <p className="mt-1 text-sm font-semibold text-uva/65">
            Hay {puntos.length} puntos muy cerca entre sí.
          </p>
        </div>
      }
      contentClassName="px-5 py-2"
    >
      <div className="divide-y divide-uva/10">
        {puntos.map((punto, index) => {
          const categoria = getCategoriaPrincipal(punto);
          const categoriaInfo = categoriasInfo[categoria];
          const IconoCategoria = categoriaInfo?.icon || MapPin;
          const id = punto._id || punto.id || `${punto.nombre}-${index}`;

          return (
            <button
              key={String(id)}
              type="button"
              onClick={() => onSelect?.(punto)}
              className="flex w-full items-center gap-3 py-4 text-left active:scale-[0.99]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-uva shadow-sm"
                style={{ backgroundColor: categoriaInfo?.color || "#FF8BC6" }}
              >
                <IconoCategoria size={21} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-fredoka text-lg text-uva">
                  {punto.nombre || "Punto sin nombre"}
                </span>
                <span className="block truncate text-xs font-bold text-uva/60">
                  {categoriaInfo?.label || "Punto propio"}
                </span>
              </span>

              <span className="shrink-0 text-sm font-extrabold text-morado">
                Ver
              </span>
            </button>
          );
        })}
      </div>
    </ModalXendaria>
  );
}
