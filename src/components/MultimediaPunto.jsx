import { ExternalLink } from "lucide-react";

import { categorias } from "./CategoriasFiltros";

const coloresMultimedia = Object.values(categorias)
  .filter((categoria) => categoria.label !== "Propios")
  .map((categoria) => categoria.color);

function getColorMultimedia(index) {
  return coloresMultimedia[index % coloresMultimedia.length] || "#F4EFFF";
}

function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    const id =
      url.hostname.includes("youtu.be")
        ? url.pathname.slice(1)
        : url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function spotifyEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== "open.spotify.com") return null;
    return `https://open.spotify.com/embed${url.pathname}`;
  } catch {
    return null;
  }
}

function EnlaceMultimedia({ contenido, titulo }) {
  return (
    <a
      href={contenido.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-2xl bg-crema px-4 py-3 text-uva font-semibold"
    >
      <span className="min-w-0 truncate">{titulo}</span>
      <ExternalLink size={18} className="shrink-0" />
    </a>
  );
}

function ContenidoMultimedia({ contenido }) {
  const titulo = contenido.titulo || "Contenido relacionado";

  if (contenido.tipo === "youtube") {
    const embedUrl = youtubeEmbedUrl(contenido.url);
    if (!embedUrl) return <EnlaceMultimedia contenido={contenido} titulo={titulo} />;
    return (
      <iframe
        src={embedUrl}
        title={titulo}
        className="w-full aspect-video rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  if (contenido.tipo === "spotify") {
    const embedUrl = spotifyEmbedUrl(contenido.url);
    if (!embedUrl) return <EnlaceMultimedia contenido={contenido} titulo={titulo} />;
    return (
      <iframe
        src={embedUrl}
        title={titulo}
        className="w-full h-[152px] rounded-xl"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    );
  }

  if (contenido.tipo === "imagen") {
    return (
      <img
        src={contenido.url}
        alt={titulo}
        className="w-full max-h-[360px] object-cover rounded-xl"
        loading="lazy"
      />
    );
  }

  return <EnlaceMultimedia contenido={contenido} titulo={titulo} />;
}

export default function MultimediaPunto({ punto }) {
  const contenidos = punto.multimedia || [];

  return (
    <section className="mb-20">
      <h2 className="font-fredoka text-uva text-xl mb-3">Contenido multimedia</h2>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-4">
        {contenidos.map((contenido, index) => {
          const color = getColorMultimedia(index);

          return (
          <article
            key={contenido._id || contenido.url}
            className="w-[270px] shrink-0 snap-start rounded-3xl border p-3 shadow-sm sm:w-[300px]"
            style={{
              backgroundColor: `${color}45`,
              borderColor: color,
            }}
          >
            {contenido.titulo && (
              <h3 className="font-fredoka text-uva text-lg mb-2">
                {contenido.titulo}
              </h3>
            )}
            <ContenidoMultimedia contenido={contenido} />
            {contenido.descripcion && (
              <p className="text-sm text-gris mt-3">{contenido.descripcion}</p>
            )}
            {contenido.fuente && (
              <p className="text-xs text-gris/60 mt-2">
                Fuente: {contenido.fuente}
              </p>
            )}
          </article>
          );
        })}

        {!contenidos.length && (
          <p className="text-sm text-gris/60">
            Todavía no hay contenido multimedia relacionado.
          </p>
        )}
      </div>
    </section>
  );
}
