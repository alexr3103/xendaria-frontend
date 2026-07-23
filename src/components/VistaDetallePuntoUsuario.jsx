import { Heart, Loader2, MapPin, Star } from "lucide-react";
import { useState } from "react";

import Alert from "./Alertas";
import BotonCerrar from "./BotonCerrar";
import { categorias } from "./CategoriasFiltros";
import HistoriasPunto from "./HistoriasPunto";
import MultimediaPunto from "./MultimediaPunto";
import cargafail from "../assets/cargafail.png";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

export default function VistaDetallePuntoUsuario({
  punto,
  esFavorito = false,
  animarFavorito = false,
  loadingFav = false,
  resumenCalificacion = null,
  miCalificacion = null,
  guardandoCalificacion = false,
  mensajeCalificacion = null,
  onToggleFavorito,
  onClose,
  onCalificar,
  preview = false,
}) {
  const [mostrarDescripcionCompleta, setMostrarDescripcionCompleta] =
    useState(false);

  const categoriasPunto = getCategoriasPunto(punto).filter(
    (categoria) => categorias[categoria]
  );
  const descripcionDetalle =
    punto.descripcion_completa || punto.descripcion || "";
  const descripcionEsLarga = descripcionDetalle.length > 260;

  return (
    <div
      className={`w-full bg-crema pb-24 ${
        preview ? "min-h-[720px]" : "min-h-screen"
      }`}
    >
      <div className="relative h-[260px] w-full overflow-hidden rounded-b-[40px] sm:h-[320px]">
        <div className="absolute left-0 right-0 top-5 z-[999] flex items-center justify-between px-5">
          <button
            type="button"
            disabled={loadingFav}
            onClick={onToggleFavorito}
            className={`
              relative flex h-[44px] w-[44px] items-center justify-center rounded-2xl shadow-lg
              ${esFavorito ? "bg-rosa text-fucsia" : "bg-crema text-fucsia"}
              transition active:scale-95 disabled:opacity-60
            `}
            aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart
              size={22}
              stroke="#F0288E"
              fill={esFavorito ? "#F0288E" : "none"}
              className={`transition-all duration-300 ${
                esFavorito ? "scale-110" : "scale-100"
              }`}
            />
            {animarFavorito && (
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-fucsia/40 animate-ping" />
            )}
          </button>

          <BotonCerrar onClick={onClose} />
        </div>

        <img
          src={punto.foto || cargafail}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = cargafail;
          }}
          alt={punto.nombre}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 z-[50] bg-gradient-to-t from-uva/90 via-uva/55 to-transparent px-6 pb-6 pt-16">
          <h1 className="font-fredoka text-3xl text-crema drop-shadow-md sm:text-4xl">
            {punto.nombre}
          </h1>

          {categoriasPunto.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categoriasPunto.map((categoriaKey) => {
                const categoriaInfo = categorias[categoriaKey];
                const Icon = categoriaInfo.icon;

                return (
                  <span
                    key={categoriaKey}
                    style={{ backgroundColor: categoriaInfo.color }}
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-gris shadow-md sm:text-sm"
                  >
                    {Icon && <Icon size={18} className="text-gris" />}
                    {categoriaInfo.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 px-6">
        <div className="mb-6 flex items-center gap-3 text-fucsia">
          <MapPin size={26} />
          <span className="text-[15px] font-bold leading-tight">
            {punto.direccion}
          </span>
        </div>

        <section className="mb-8 rounded-3xl bg-menta/70 p-5 shadow-sm">
          <h2 className="mb-2 font-fredoka text-xl text-uva">Descripción</h2>
          <p
            className={`whitespace-pre-line text-[15px] leading-relaxed text-gris ${
              descripcionEsLarga && !mostrarDescripcionCompleta
                ? "line-clamp-5"
                : ""
            }`}
          >
            {descripcionDetalle}
          </p>
          {descripcionEsLarga && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarDescripcionCompleta((actual) => !actual)}
                className="rounded-full border border-uva/10 bg-crema/90 px-4 py-2 text-sm font-bold text-uva shadow-sm transition active:scale-95"
              >
                {mostrarDescripcionCompleta ? "Ver menos" : "Ver más"}
              </button>
            </div>
          )}
        </section>

        <HistoriasPunto historias={punto.historias || []} />

        <section className="mb-10 border-y border-uva/10 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-fredoka text-xl text-uva">Tu calificación</h2>
              <p className="mt-1 text-sm text-gris">
                Solo podés calificar si estás en el lugar.
              </p>
            </div>
            <div className="text-right">
              <p className="font-fredoka text-2xl text-fucsia">
                {resumenCalificacion?.promedioEstrellas || 0}
              </p>
              <p className="text-[11px] font-bold text-uva">
                {resumenCalificacion?.totalCalificaciones || 0} votos
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((estrella) => {
              const activa = estrella <= (miCalificacion?.estrellas || 0);

              return (
                <button
                  key={estrella}
                  type="button"
                  onClick={() => onCalificar?.(estrella)}
                  disabled={guardandoCalificacion || !onCalificar}
                  className="p-1 text-fucsia transition active:scale-95 disabled:opacity-60"
                  aria-label={`Calificar con ${estrella} estrellas`}
                >
                  <Star
                    size={32}
                    fill={activa ? "#F0288E" : "none"}
                    strokeWidth={2.2}
                  />
                </button>
              );
            })}
            {guardandoCalificacion && (
              <Loader2 size={20} className="ml-2 animate-spin text-morado" />
            )}
          </div>

          {miCalificacion && (
            <p className="mt-2 text-sm font-bold text-uva">
              Tu puntuación: {miCalificacion.estrellas} de 5
            </p>
          )}

          {mensajeCalificacion && (
            <div className="mt-3">
              <Alert variant={mensajeCalificacion.variant}>
                {mensajeCalificacion.text}
              </Alert>
            </div>
          )}
        </section>

        {punto.insignia && (
          <div className="mb-10 flex w-full flex-col items-center rounded-3xl bg-morado/30 p-6 shadow">
            <span className="mb-3 font-fredoka text-lg text-uva">Insignia</span>
            <img
              src={punto.insignia}
              alt="Insignia"
              className="h-[160px] w-[160px] rounded-full object-cover shadow-xl"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = cargafail;
              }}
            />
          </div>
        )}

        <MultimediaPunto punto={punto} />
      </div>
    </div>
  );
}
