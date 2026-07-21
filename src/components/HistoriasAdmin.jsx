import { Plus, Trash2 } from "lucide-react";
import SubidorImagen from "./SubidorImagen.jsx";

const HISTORIA_VACIA = {
  titulo: "",
  contenido: "",
  foto: null,
};

export default function HistoriasAdmin({ historias = [], onChange }) {
  function agregarHistoria() {
    if (historias.length >= 3) return;
    onChange([...historias, { ...HISTORIA_VACIA }]);
  }

  function actualizarHistoria(index, cambios) {
    onChange(
      historias.map((historia, posicion) =>
        posicion === index ? { ...historia, ...cambios } : historia
      )
    );
  }

  function eliminarHistoria(index) {
    onChange(historias.filter((_, posicion) => posicion !== index));
  }

  return (
    <section className="flex flex-col gap-4">
      {historias.map((historia, index) => (
        <div
          key={index}
          className="border border-uva/15 rounded-xl p-3 sm:p-4 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-fredoka text-uva">Historia {index + 1}</h3>
            <button
              type="button"
              onClick={() => eliminarHistoria(index)}
              title="Eliminar historia"
              aria-label={`Eliminar historia ${index + 1}`}
              className="p-2 rounded-lg text-fucsia hover:bg-fucsia/10"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm font-semibold text-uva/80">
            Titulo
            <input
              value={historia.titulo}
              maxLength={120}
              onChange={(event) =>
                actualizarHistoria(index, { titulo: event.target.value })
              }
              className="p-3 rounded-xl bg-crema border border-uva/20 outline-none focus:border-morado"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-uva/80">
            Contenido
            <textarea
              value={historia.contenido}
              maxLength={2000}
              onChange={(event) =>
                actualizarHistoria(index, { contenido: event.target.value })
              }
              className="p-3 rounded-xl bg-crema border border-uva/20 outline-none focus:border-morado h-36 resize-y"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-uva/80">
              Foto pequena opcional
            </span>
            <SubidorImagen
              tipo="punto"
              label="Subir foto de historia"
              value={historia.foto || ""}
              onUploadSuccess={(data) =>
                actualizarHistoria(index, { foto: data.url })
              }
            />
            <input
              type="url"
              value={historia.foto || ""}
              onChange={(event) =>
                actualizarHistoria(index, { foto: event.target.value || null })
              }
              placeholder="O pega una URL de imagen"
              className="p-3 rounded-xl bg-crema border border-uva/20 outline-none focus:border-morado"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={historias.length >= 3}
        onClick={agregarHistoria}
        className="self-start flex items-center gap-2 bg-uva text-crema px-4 py-2.5 rounded-xl font-semibold disabled:opacity-40"
      >
        <Plus size={18} />
        Agregar historia
      </button>
    </section>
  );
}
