import { BookOpen } from "lucide-react";
import cargafail from "../assets/cargafail.png";

export default function HistoriasPunto({ historias = [] }) {
  if (!historias.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 text-uva mb-3">
        <BookOpen size={22} className="text-morado" />
        <h2 className="font-fredoka text-xl">Historias del lugar</h2>
      </div>

      <div className="flex flex-col gap-4">
        {historias.map((historia, index) => (
          <article
            key={`${historia.titulo}-${index}`}
            className="bg-white rounded-xl shadow overflow-hidden"
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
              <p className="text-gris text-sm leading-relaxed whitespace-pre-line">
                {historia.contenido}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
