import {
  BadgeCheck,
  ExternalLink,
  FileText,
  MapPin,
  Navigation,
  Rotate3D,
  Star,
} from "lucide-react";
import { categorias } from "./CategoriasFiltros.jsx";
import cargafail from "../assets/cargafail.png";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

function getInsigniaUrl(punto = {}) {
  if (typeof punto.insignia === "string") return punto.insignia;
  return punto.insignia?.url || "";
}

function getImagenUrl(foto) {
  if (typeof foto === "string") return foto;
  return foto?.url || "";
}

export function UserPreviewCard({ punto }) {
  const categoriasPunto = getCategoriasPunto(punto).filter((categoria) => categorias[categoria]);
  const insigniaUrl = getInsigniaUrl(punto);

  return (
    <section className="ml-auto w-full max-w-[340px]">
      <div className="mb-3 flex items-center gap-2 text-uva">
        <BadgeCheck size={20} className="text-morado" />
        <h3 className="font-fredoka text-2xl">Vista previa usuario</h3>
      </div>

      <div className="w-full overflow-hidden rounded-[34px] border border-uva/10 bg-crema shadow-xl">
        <div className="h-24 bg-morado/60" />

        <div className="px-5 pb-5">
          <div className="-mt-14 flex justify-center">
            <div className="h-32 w-32 overflow-hidden rounded-full border-[5px] border-crema bg-crema shadow-xl">
              <img
                src={punto.foto || cargafail}
                alt={punto.nombre || "Vista previa"}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = cargafail;
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <h4 className="min-w-0 font-fredoka text-2xl leading-tight text-morado">
              {punto.nombre || "Nombre del punto"}
            </h4>
            {insigniaUrl && (
              <img
                src={insigniaUrl}
                alt="Insignia"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-rosa bg-white object-cover shadow-md"
              />
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 text-fucsia">
            <MapPin size={23} className="mt-0.5 shrink-0" />
            <span className="text-sm font-bold leading-snug">
              {punto.direccion || "Direccion del punto"}
            </span>
          </div>

          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-gris">
            {punto.descripcion || "Descripcion breve visible para el usuario."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {insigniaUrl && (
              <span className="inline-flex items-center gap-2 rounded-full bg-rosa px-3 py-2 text-xs font-bold text-uva">
                <BadgeCheck size={15} />
                Insignia desbloqueable
              </span>
            )}
            {categoriasPunto.map((categoriaKey) => {
              const categoria = categorias[categoriaKey];
              const Icon = categoria.icon;

              return (
                <span
                  key={categoriaKey}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-uva"
                  style={{ backgroundColor: categoria.color || "#F4EFFF" }}
                >
                  {Icon && <Icon size={15} />}
                  {categoria.label || categoriaKey}
                </span>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-uva py-3 font-bold text-crema shadow"
            >
              <FileText size={17} />
              Ver mas info
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-menta py-3 font-bold text-uva shadow"
            >
              <Rotate3D size={18} />
              Vista del lugar
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-morado py-3 font-bold text-crema shadow"
            >
              <Navigation size={17} />
              Navegar hasta aca
            </button>
          </div>

          {punto.link && (
            <a
              href={punto.link}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-morado"
            >
              <ExternalLink size={16} />
              Sitio externo
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function UserDetailPreviewCard({ punto }) {
  const categoriasPunto = getCategoriasPunto(punto).filter((categoria) => categorias[categoria]);
  const imagenDetalle = punto.foto || getImagenUrl(punto.fotos?.[0]) || cargafail;
  const historiasCount = (punto.historias || []).length;
  const multimediaCount = (punto.multimedia || []).length;

  return (
    <section className="ml-auto w-full max-w-[340px]">
      <div className="mb-3 flex items-center gap-2 text-uva">
        <FileText size={20} className="text-morado" />
        <h3 className="font-fredoka text-2xl">Vista detalle usuario</h3>
      </div>

      <div className="overflow-hidden rounded-[34px] border border-uva/10 bg-crema shadow-xl">
        <div className="relative h-40 overflow-hidden">
          <img
            src={imagenDetalle}
            alt={punto.nombre || "Detalle del punto"}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = cargafail;
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-uva/85 to-transparent px-4 pb-4 pt-12">
            <h4 className="font-fredoka text-2xl leading-tight text-crema">
              {punto.nombre || "Nombre del punto"}
            </h4>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {categoriasPunto.map((categoriaKey) => {
              const categoria = categorias[categoriaKey];
              const Icon = categoria.icon;

              return (
                <span
                  key={categoriaKey}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-uva"
                  style={{ backgroundColor: categoria.color || "#F4EFFF" }}
                >
                  {Icon && <Icon size={15} />}
                  {categoria.label || categoriaKey}
                </span>
              );
            })}
          </div>

          <div className="flex items-start gap-2 text-fucsia">
            <MapPin size={20} className="mt-0.5 shrink-0" />
            <span className="text-sm font-bold leading-snug">
              {punto.direccion || "Direccion del punto"}
            </span>
          </div>

          <div className="rounded-3xl bg-menta/65 p-4">
            <h5 className="font-fredoka text-lg text-uva">Historia</h5>
            <p className="mt-1 line-clamp-5 text-sm leading-relaxed text-gris">
              {punto.descripcion_completa ||
                punto.descripcion ||
                "Texto completo visible cuando el usuario desbloquea el detalle."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/75 px-2 py-3">
              <p className="font-fredoka text-xl text-morado">{historiasCount}</p>
              <p className="text-[11px] font-bold text-uva/65">Historias</p>
            </div>
            <div className="rounded-2xl bg-white/75 px-2 py-3">
              <p className="font-fredoka text-xl text-morado">{multimediaCount}</p>
              <p className="text-[11px] font-bold text-uva/65">Media</p>
            </div>
            <div className="rounded-2xl bg-white/75 px-2 py-3">
              <div className="flex items-center justify-center gap-1 text-fucsia">
                <Star size={17} fill="currentColor" />
                <span className="font-fredoka text-xl">0</span>
              </div>
              <p className="text-[11px] font-bold text-uva/65">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
