import { useId } from "react";
import { Image, ImageOff, Loader2, Plus, Trash2, Upload } from "lucide-react";

export default function CampoGaleriaMerch({
  imagenes = [],
  subiendo = false,
  onDelete,
  onUpload,
  showHeader = true,
}) {
  const inputId = useId();
  const slotsVacios = Math.max(1, 4 - imagenes.length);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await onUpload(file);
  }

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image size={20} className="text-morado" />
            <h4 className="font-fredoka text-xl text-uva">Galería del producto</h4>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-uva/45">
              {imagenes.length} fotos
            </span>
            <label
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-morado px-4 py-2 text-sm font-bold text-crema shadow transition hover:bg-morado/85 ${
                subiendo ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {subiendo ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Upload size={17} />
              )}
              {subiendo ? "Subiendo..." : "Subir imagen"}
            </label>
          </div>
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!showHeader && (
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-morado px-4 py-2 text-sm font-bold text-crema shadow transition hover:bg-morado/85 ${
            subiendo ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {subiendo ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <Upload size={17} />
          )}
          {subiendo ? "Subiendo..." : "Subir imagen"}
        </label>
      )}

      <div className="flex flex-wrap gap-4">
        {imagenes.map((imagen, index) => (
          <article
            key={`${imagen.url}-${index}`}
            className="group relative h-24 w-24 overflow-hidden rounded-2xl bg-crema"
          >
            {imagen.url ? (
              <img
                src={imagen.url}
                alt={`Imagen ${index + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-uva/35">
                <ImageOff size={28} />
              </div>
            )}

            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-morado px-2 py-0.5 text-[10px] font-bold text-crema shadow">
                Principal
              </span>
            )}

            <button
              type="button"
              onClick={() => onDelete(index)}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-fucsia text-crema shadow-md transition hover:bg-fucsia/85"
              title="Eliminar imagen"
              aria-label="Eliminar imagen"
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}

        {Array.from({ length: slotsVacios }).map((_, index) => (
          <label
            key={`slot-merch-${index}`}
            htmlFor={inputId}
            className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-morado/30 bg-crema/40 text-morado transition hover:bg-morado/10 ${
              subiendo ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {subiendo ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Plus size={26} />
            )}
            <span className="mt-1 text-center text-xs font-bold">
              {subiendo ? "Subiendo" : "Subir foto"}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
