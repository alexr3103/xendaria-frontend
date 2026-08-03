import { useEffect, useMemo, useState } from "react";
import { Check, Sparkles, Trophy } from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";
import { categorias } from "./CategoriasFiltros.jsx";
import { getMensajeError } from "../lib/errores.js";

function getIdTitulo(titulo) {
  if (!titulo?._id) return "";
  if (titulo._id.$oid) return titulo._id.$oid;
  return String(titulo._id);
}

function getCategoriaTitulo(titulo) {
  if (titulo?.categoria === "sin_visitas") {
    return { label: "Título inicial", icon: Sparkles, color: "#F4EFFF" };
  }

  if (titulo?.categoria === "con_visitas_sin_titulo") {
    return {
      label: "Por puntos visitados",
      icon: Trophy,
      color: "#D8B6FF",
    };
  }

  return categorias[titulo?.categoria] || {
    label: "Exploración",
    icon: Trophy,
    color: "#F4EFFF",
  };
}

export default function TitulosPerfilModal({
  open,
  onClose,
  resumen,
  onGuardar,
}) {
  const [tituloElegidoId, setTituloElegidoId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const titulosDisponibles = useMemo(
    () => (Array.isArray(resumen?.desbloqueados) ? resumen.desbloqueados : []),
    [resumen?.desbloqueados]
  );
  const titulosPendientes = useMemo(
    () =>
      (Array.isArray(resumen?.titulos) ? resumen.titulos : [])
        .filter((titulo) => !titulo.desbloqueado)
        .sort((a, b) => {
          const faltanA = Number(a.umbral || 0) - Number(a.progreso || 0);
          const faltanB = Number(b.umbral || 0) - Number(b.progreso || 0);
          return faltanA - faltanB;
        }),
    [resumen?.titulos]
  );
  const tituloActualId = getIdTitulo(resumen?.tituloActual);

  useEffect(() => {
    if (!open) return;
    setTituloElegidoId(tituloActualId);
    setError("");
  }, [open, tituloActualId]);

  async function guardarTitulo() {
    if (!tituloElegidoId || tituloElegidoId === tituloActualId) {
      onClose();
      return;
    }

    try {
      setGuardando(true);
      setError("");
      await onGuardar(tituloElegidoId);
      onClose();
    } catch (err) {
      setError(
        getMensajeError(err, "No pudimos cambiar el título visible.")
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalXendaria
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      header={
        <div className="bg-white px-5 pb-4 pt-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-morado/10 text-morado">
            <Trophy size={22} />
          </span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-uva/55">
            Tu recorrido
          </p>
          <h2 className="font-fredoka text-3xl leading-tight text-morado">
            Títulos de exploración
          </h2>
        </div>
      }
      contentClassName="bg-white px-5 pb-5"
      footer={
        <div className="flex gap-3 border-t border-uva/10 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl bg-crema px-4 font-bold text-uva"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarTitulo}
            disabled={guardando || !tituloElegidoId}
            className="min-h-11 flex-1 rounded-xl bg-morado px-4 font-bold text-white disabled:opacity-55"
          >
            {guardando ? "Guardando..." : "Mostrar título"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-2xl bg-crema px-4 py-4 ring-1 ring-uva/10">
          <h3 className="font-fredoka text-xl text-morado">
            ¿Cómo se consiguen?
          </h3>
          <div className="mt-2 space-y-2 text-sm font-semibold leading-relaxed text-uva/70">
            <p>
              Los títulos que desbloqueás quedan disponibles para que elijas
              cuál mostrar.
            </p>
            <p>
              Algunos dependen del total de puntos visitados y otros de tus
              visitas dentro de cada categoría.
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-fredoka text-xl text-morado">Tus títulos</h3>
          <p className="mt-1 text-sm font-semibold text-uva/60">
            Elegí cuál querés mostrar en tu perfil.
          </p>

          <div className="mt-3 space-y-2">
            {titulosDisponibles.map((titulo) => {
              const idTitulo = getIdTitulo(titulo);
              const seleccionado = tituloElegidoId === idTitulo;
              const categoria = getCategoriaTitulo(titulo);
              const Icon = categoria.icon;

              return (
                <button
                  key={idTitulo}
                  type="button"
                  onClick={() => setTituloElegidoId(idTitulo)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 transition ${
                    seleccionado
                      ? "bg-morado/10 ring-morado"
                      : "bg-white ring-uva/10 hover:bg-crema/60"
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-uva"
                    style={{ backgroundColor: categoria.color }}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-fredoka text-lg leading-tight text-morado">
                      {titulo.titulo}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-uva/55">
                      {categoria.label}
                    </span>
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      seleccionado
                        ? "border-morado bg-morado text-white"
                        : "border-uva/20 text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <Check size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {titulosPendientes.length > 0 && (
          <section>
            <h3 className="font-fredoka text-xl text-morado">
              Próximos títulos
            </h3>
            <div className="mt-3 divide-y divide-uva/10 rounded-2xl bg-crema px-4 ring-1 ring-uva/10">
              {titulosPendientes.map((titulo) => {
                const categoria = getCategoriaTitulo(titulo);
                const faltan = Math.max(
                  0,
                  Number(titulo.umbral || 0) - Number(titulo.progreso || 0)
                );

                return (
                  <div
                    key={getIdTitulo(titulo)}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-uva">
                        {titulo.titulo}
                      </span>
                      <span className="block text-xs font-semibold text-uva/55">
                        {categoria.label}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-morado">
                      {faltan === 1 ? "Falta 1 visita" : `Faltan ${faltan} visitas`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-xl bg-fucsia/10 px-4 py-3 text-sm font-bold text-fucsia">
            {error}
          </p>
        )}
      </div>
    </ModalXendaria>
  );
}
