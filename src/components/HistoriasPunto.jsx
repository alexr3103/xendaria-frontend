import { BookOpen } from "lucide-react";
import { useState } from "react";
import cargafail from "../assets/cargafail.png";

export default function HistoriasPunto({ historias = [] }) {
  const [expandido, setExpandido] = useState(false);

  if (!historias.length) return null;

  const historiasVisibles = expandido ? historias : historias.slice(0, 1);
  const puedeExpandir = historias.length > 1 || historias.some(
    (historia) => (historia.contenido || "").length > 220
  );

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 text-uva mb-3">
        <BookOpen size={22} className="text-morado" />
        <h2 className="font-fredoka text-xl">Historias/leyendas del lugar</h2>
      </div>

      <div className="flex flex-col gap-4">
        {historiasVisibles.map((historia, index) => (
          <article
            key={`${historia.titulo}-${index}`}
            className="bg-white rounded-3xl shadow-sm overflow-hidden"
          >
            {historia.foto && (
              <img
                src={historia.foto}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = cargafail;
                }}
                className="w-full h-36 sm:h-44 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-fredoka text-lg text-uva mb-2">
                {historia.titulo}
              </h3>
              <p
                className={`text-gris text-sm leading-relaxed whitespace-pre-line ${
                  expandido ? "" : "line-clamp-4"
                }`}
              >
                {historia.contenido}
              </p>
            </div>
          </article>
        ))}
      </div>

      {puedeExpandir && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setExpandido((actual) => !actual)}
            className="rounded-full border border-uva/10 bg-crema/90 px-4 py-2 text-sm font-bold text-uva shadow-sm active:scale-95"
          >
            {expandido ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}
    </section>
  );
}
