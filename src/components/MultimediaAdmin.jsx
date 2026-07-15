import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Image,
  Loader2,
  Music2,
  Plus,
  Rotate3D,
  Trash2,
  XCircle,
  Youtube,
} from "lucide-react";
import Alert from "./Alertas.jsx";

const TIPOS = [
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "spotify", label: "Spotify", icon: Music2 },
  { value: "imagen", label: "Imagen externa", icon: Image },
  { value: "enlace", label: "Enlace", icon: ExternalLink },
];

const EMPTY_FORM = {
  tipo: "youtube",
  url: "",
  titulo: "",
  descripcion: "",
};

const fieldClass =
  "w-full min-w-0 rounded-2xl border border-uva/10 bg-crema px-4 py-3 text-uva outline-none transition placeholder:text-uva/35 focus:border-morado focus:ring-2 focus:ring-morado/15";

export default function MultimediaAdmin({ punto, onChange }) {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  function actualizarForm(event) {
    setForm((actual) => ({
      ...actual,
      [event.target.name]: event.target.value,
    }));
  }

  async function agregarContenido() {
    setGuardando(true);
    setMensaje(null);

    try {
      const response = await fetch(`${API}/api/puntos/${punto._id}/multimedia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "No se pudo agregar");

      onChange({
        ...punto,
        multimedia: [...(punto.multimedia || []), data.contenido],
      });
      setForm(EMPTY_FORM);
      setMensaje({ variant: "success", text: "Contenido multimedia agregado." });
    } catch (error) {
      setMensaje({ variant: "error", text: error.message });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarContenido(multimediaId) {
    setMensaje(null);

    try {
      const response = await fetch(
        `${API}/api/puntos/${punto._id}/multimedia/${multimediaId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "No se pudo eliminar");

      onChange({
        ...punto,
        multimedia: (punto.multimedia || []).filter(
          (contenido) => contenido._id !== multimediaId
        ),
      });
    } catch (error) {
      setMensaje({ variant: "error", text: error.message });
    }
  }

  async function verificarVista360() {
    setVerificando(true);
    setMensaje(null);

    try {
      const response = await fetch(
        `${API}/api/puntos/${punto._id}/vista-360/verificar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ radio: 100 }),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "No se pudo verificar");
      onChange({ ...punto, vista360: data.vista360 });
    } catch (error) {
      setMensaje({ variant: "error", text: error.message });
    } finally {
      setVerificando(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      {mensaje && <Alert variant={mensaje.variant}>{mensaje.text}</Alert>}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,1.4fr)]">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-uva/80">
          Tipo
          <select
            name="tipo"
            value={form.tipo}
            onChange={actualizarForm}
            className={fieldClass}
          >
            {TIPOS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-uva/80">
          Titulo
          <input
            name="titulo"
            value={form.titulo}
            onChange={actualizarForm}
            className={fieldClass}
          />
        </label>

        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-uva/80">
          URL
          <input
            name="url"
            type="url"
            value={form.url}
            onChange={actualizarForm}
            placeholder="https://..."
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold text-uva/80">
        Descripcion
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={actualizarForm}
          className={`${fieldClass} h-24 resize-none`}
        />
      </label>

      <button
        type="button"
        disabled={guardando || !form.url}
        onClick={agregarContenido}
        className="self-start flex items-center gap-2 bg-morado text-crema px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50"
      >
        {guardando ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        Agregar contenido
      </button>

      <div className="flex flex-col gap-2">
        {(punto.multimedia || []).map((contenido) => {
          const config = TIPOS.find((tipo) => tipo.value === contenido.tipo);
          const Icon = config?.icon || ExternalLink;

          return (
            <div
              key={contenido._id}
              className="flex items-center gap-3 border border-uva/10 p-3 rounded-xl"
            >
              <Icon size={20} className="text-morado shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-uva truncate">
                  {contenido.titulo || config?.label || "Contenido"}
                </p>
                <p className="text-xs text-gris/60 truncate">{contenido.url}</p>
              </div>
              <button
                type="button"
                title="Eliminar contenido"
                onClick={() => eliminarContenido(contenido._id)}
                className="p-2 text-fucsia hover:bg-fucsia/10 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-uva/10 pt-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Rotate3D className="text-morado" size={22} />
          <h3 className="font-fredoka text-lg text-uva">Vista 360</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            disabled={verificando}
            onClick={verificarVista360}
            className="self-start flex items-center gap-2 bg-uva text-crema px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50"
          >
            {verificando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Rotate3D size={18} />
            )}
            Verificar Street View
          </button>

          {punto.vista360?.ultimaVerificacion ? (
            punto.vista360.disponible ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 size={22} className="animate-pulse" />
                Vista disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-fucsia">
                <XCircle size={22} className="animate-pulse" />
                Vista no disponible
              </span>
            )
          ) : (
            <span className="text-sm text-gris/60">Sin verificar</span>
          )}
        </div>
      </div>
    </section>
  );
}
