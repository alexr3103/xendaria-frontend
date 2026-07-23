import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Camera,
  Eraser,
  FileText,
  ImageOff,
  Images,
  Info,
  Loader2,
  MapPinned,
  Plus,
  Save,
  Trash2,
  Undo2,
  Video,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import SubidorImagen from "../../components/SubidorImagen.jsx";
import MultimediaAdmin from "../../components/MultimediaAdmin.jsx";
import HistoriasAdmin from "../../components/HistoriasAdmin.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";
import {
  TarjetaDetalleUsuario,
  TarjetaVistaUsuario,
} from "../../components/VistaPreviaPuntoAdmin.jsx";
import {
  FormularioEditorAdmin,
  CampoAdmin as Field,
  SeccionPlanaAdmin as FlatSection,
  TituloSeccionAdmin as SectionTitle,
  claseInputAdmin as inputClass,
} from "../../components/EditorAdmin.jsx";
import InterruptorActivoAdmin from "../../components/InterruptorActivoAdmin.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";

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

export default function EditarPunto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [punto, setPunto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState("");
  const [subiendoFotoGaleria, setSubiendoFotoGaleria] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] =
    useState(false);

  const categoriasActivas = useMemo(() => getCategoriasPunto(punto || {}), [punto]);

  useEffect(() => {
    async function obtenerPunto() {
      try {
        const res = await fetch(`${API}/api/puntos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          navigate("/404", { replace: true });
          return;
        }

        if (!res.ok) throw new Error("Error al cargar punto");

        const data = await res.json();
        const categoriasNormalizadas = getCategoriasPunto(data);

        setPunto({
          ...data,
          categoria: data.categoria || categoriasNormalizadas[0] || "",
          categorias: categoriasNormalizadas,
          lat: data.lat ?? "",
          lon: data.lon ?? "",
          historias: Array.isArray(data.historias) ? data.historias : [],
          multimedia: Array.isArray(data.multimedia) ? data.multimedia : [],
          fotos: Array.isArray(data.fotos) ? data.fotos : [],
          activo: data.activo !== false,
        });
      } catch {
        setMensaje({ variant: "error", text: "No se pudo cargar el punto." });
      } finally {
        setCargando(false);
      }
    }

    obtenerPunto();
  }, [API, id, navigate, token]);

  function actualizarCampo(campo, valor) {
    setPunto((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarCampos() {
    setPunto((actual) => ({
      ...actual,
      nombre: "",
      direccion: "",
      descripcion: "",
      descripcion_completa: "",
      link: "",
      foto: "",
      insignia: null,
      fotos: [],
      historias: [],
      multimedia: [],
    }));
    setMensaje({
      variant: "success",
      text: "Campos limpiados en pantalla. Guardá para aplicar los cambios.",
    });
  }

  function subirArriba() {
    document
      .querySelector("main > section")
      ?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mostrarMensajeArriba(nuevoMensaje) {
    setMensaje(nuevoMensaje);
    setTimeout(subirArriba, 0);
  }

  function toggleCategoria(categoria) {
    setPunto((actual) => {
      const actuales = getCategoriasPunto(actual);
      const nuevas = actuales.includes(categoria)
        ? actuales.filter((item) => item !== categoria)
        : [...actuales, categoria];

      return {
        ...actual,
        categoria: nuevas[0] || "",
        categorias: nuevas,
      };
    });
  }

  async function getErrorMessage(res) {
    try {
      const data = await res.json();
      if (Array.isArray(data?.message)) return data.message.join(" ");
      return data?.message || "No se pudieron guardar los cambios";
    } catch {
      return "No se pudieron guardar los cambios";
    }
  }

  async function guardarCambios() {
    setMensaje(null);
    setGuardando(true);

    try {
      const lat = Number(punto.lat);
      const lon = Number(punto.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        mostrarMensajeArriba({
          variant: "error",
          text: "Latitud y longitud deben ser números válidos.",
        });
        return;
      }

      const categoriasNormalizadas = getCategoriasPunto(punto);
      const { _id, ...dataSinId } = {
        ...punto,
        lat,
        lon,
        ubicacion: {
          type: "Point",
          coordinates: [lon, lat],
        },
        categoria: categoriasNormalizadas[0] || "",
        categorias: categoriasNormalizadas,
        insignia: getInsigniaUrl(punto) || null,
      };

      const res = await fetch(`${API}/api/puntos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataSinId),
      });

      if (!res.ok) {
        if (res.status === 404) {
          navigate("/404", { replace: true });
          return;
        }

        const errorMessage = await getErrorMessage(res);

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          mostrarMensajeArriba({
            variant: "error",
            text: "Tu sesión expiró. Iniciá sesión nuevamente para guardar cambios.",
          });
          setTimeout(() => navigate("/login", { replace: true }), 1800);
          return;
        }

        mostrarMensajeArriba({ variant: "error", text: errorMessage });
        return;
      }

      mostrarMensajeArriba({ variant: "success", text: "Cambios guardados correctamente." });
    } catch {
      mostrarMensajeArriba({
        variant: "error",
        text: "No se pudo conectar con la API para guardar los cambios.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPunto() {
    try {
      const res = await fetch(`${API}/api/puntos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) throw new Error();
      navigate("/admin/mapa");
    } catch {
      setMostrarConfirmacionEliminar(false);
      setMensaje({ variant: "error", text: "No se pudo eliminar el punto." });
    }
  }

  async function eliminarFotoGaleria(foto) {
    const publicId = foto?.publicId;

    if (!publicId) {
      setPunto((actual) => ({
        ...actual,
        fotos: (actual.fotos || []).filter((item) => item !== foto),
      }));
      return;
    }

    setEliminandoFoto(publicId);
    setMensaje(null);

    try {
      const res = await fetch(`${API}/api/upload/punto/foto`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idPunto: id, publicId }),
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) throw new Error();

      setPunto((actual) => ({
        ...actual,
        fotos: (actual.fotos || []).filter((item) => item.publicId !== publicId),
      }));
    } catch {
      setMensaje({ variant: "error", text: "No se pudo eliminar la foto." });
    } finally {
      setEliminandoFoto("");
    }
  }

  async function subirFotoGaleria(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMensaje({ variant: "error", text: "Solo se pueden subir imágenes." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ variant: "error", text: "La imagen no debe superar los 5MB." });
      return;
    }

    setSubiendoFotoGaleria(true);
    setMensaje(null);

    try {
      const formData = new FormData();
      formData.append("imagen", file);
      formData.append("idPunto", id);

      const res = await fetch(`${API}/api/upload/punto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) throw new Error(data.message || "No se pudo subir la foto.");

      setPunto((actual) => ({
        ...actual,
        fotos: [...(actual.fotos || []), data.foto || { url: data.url, publicId: data.publicId }],
      }));
    } catch (error) {
      setMensaje({ variant: "error", text: error.message });
    } finally {
      setSubiendoFotoGaleria(false);
    }
  }

  if (cargando) {
    return (
      <AdminStyle title="Editar punto">
        <div className="flex min-h-[55vh] items-center justify-center text-morado">
          <Loader2 className="mr-2 animate-spin" size={22} />
          <span className="font-bold">Cargando información...</span>
        </div>
      </AdminStyle>
    );
  }

  if (!punto) {
    return (
      <AdminStyle title="Editar punto">
        <Alert variant="error">No se pudo cargar el punto.</Alert>
      </AdminStyle>
    );
  }

  return (
    <AdminStyle title="Editar punto">
      <div className="w-full overflow-x-hidden px-1">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-uva/45">
              Panel de edición
            </p>
            <h2 className="font-fredoka text-3xl leading-none text-morado">
              {punto.nombre || "Punto sin nombre"}
            </h2>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={guardarCambios}
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-full bg-morado px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-morado/85 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarConfirmacionEliminar(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-fucsia px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-fucsia/85"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 rounded-full bg-uva px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-uva/90"
            >
              <Undo2 size={18} />
              Volver
            </button>
          </div>
        </div>

        {mensaje && <Alert variant={mensaje.variant}>{mensaje.text}</Alert>}

        <div className="mt-8 flex w-full max-w-[1180px] min-w-0 flex-col items-start gap-6 xl:flex-row">
          <FormularioEditorAdmin
            className="w-full min-w-0 xl:max-w-[830px] xl:flex-none"
            onSubmit={(event) => {
              event.preventDefault();
              guardarCambios();
            }}
          >
            <section className="space-y-9 pb-4">
              <SectionTitle
                icon={Info}
                title="Datos principales"
                subtitle="Lo básico que identifica al punto en mapa y listados."
              />

              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <Field label="Nombre del punto">
                  <input
                    className={inputClass}
                    value={punto.nombre || ""}
                    onChange={(event) => actualizarCampo("nombre", event.target.value)}
                  />
                </Field>

                <Field label="Dirección">
                  <input
                    className={inputClass}
                    value={punto.direccion || ""}
                    onChange={(event) => actualizarCampo("direccion", event.target.value)}
                  />
                </Field>
              </div>

              <div>
                <Field label="Categorías">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categorias)
                      .filter(([key]) => key !== "propios")
                      .map(([key, categoria]) => {
                        const active = categoriasActivas.includes(key);
                        const Icon = categoria.icon;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleCategoria(key)}
                            style={{
                              backgroundColor: active
                                ? categoria.color
                                : `${categoria.color}45`,
                              borderColor: categoria.color,
                            }}
                            className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold text-uva shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morado/30 active:translate-y-0"
                          >
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-crema/70"
                            >
                              <Icon size={14} />
                            </span>
                            {categoria.label}
                          </button>
                        );
                      })}
                  </div>
                </Field>
              </div>

              <Field label="Estado del punto">
                <div className="max-w-xs">
                  <InterruptorActivoAdmin
                    active={punto.activo !== false}
                    activeLabel="Punto activo"
                    inactiveLabel="Punto inactivo"
                    onClick={() => actualizarCampo("activo", punto.activo === false)}
                  />
                </div>
              </Field>
            </section>

            <FlatSection
              title="Descripciones"
              description="Resumen visible en el modal y texto extendido del detalle."
              icon={FileText}
            >
              <Field label="Descripción breve">
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  value={punto.descripcion || ""}
                  onChange={(event) => actualizarCampo("descripcion", event.target.value)}
                />
              </Field>

              <Field label="Descripción completa">
                <textarea
                  className={`${inputClass} min-h-40 resize-y`}
                  value={punto.descripcion_completa || ""}
                  onChange={(event) =>
                    actualizarCampo("descripcion_completa", event.target.value)
                  }
                />
              </Field>
            </FlatSection>

            <FlatSection
              title="Imágenes"
              description="Foto principal, insignia y galería si el punto ya tiene fotos."
              icon={Images}
            >
              <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                <ImageField
                  title="Foto principal"
                  helper="Es la imagen circular que aparece en el modal del usuario."
                  tipo="punto"
                  value={punto.foto || ""}
                  onChange={(value) => actualizarCampo("foto", value)}
                />

                <ImageField
                  title="Insignia"
                  helper="Se muestra como recompensa desbloqueable del lugar."
                  tipo="insignia"
                  idPunto={id}
                  value={getInsigniaUrl(punto)}
                  circular
                  onChange={(value) => actualizarCampo("insignia", value || null)}
                />
              </div>

              <GaleriaFotos
                fotos={punto.fotos || []}
                eliminandoFoto={eliminandoFoto}
                subiendoFoto={subiendoFotoGaleria}
                onDelete={eliminarFotoGaleria}
                onUpload={subirFotoGaleria}
              />
            </FlatSection>

            <FlatSection
              title="Ubicación y enlace"
              description="Coordenadas GeoJSON y sitio externo si existe."
              icon={MapPinned}
            >
              <Field label="Sitio web">
                <input
                  type="url"
                  className={inputClass}
                  value={punto.link || ""}
                  placeholder="https://..."
                  onChange={(event) => actualizarCampo("link", event.target.value)}
                />
              </Field>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Latitud">
                  <input
                    className={inputClass}
                    value={punto.lat ?? ""}
                    onChange={(event) => actualizarCampo("lat", event.target.value)}
                  />
                </Field>
                <Field label="Longitud">
                  <input
                    className={inputClass}
                    value={punto.lon ?? ""}
                    onChange={(event) => actualizarCampo("lon", event.target.value)}
                  />
                </Field>
              </div>
            </FlatSection>

            <FlatSection
              title={`Historias desbloqueables (${(punto.historias || []).length}/3)`}
              description="Curiosidades o leyendas que acompañan al lugar."
              icon={BookOpen}
            >
              <HistoriasAdmin
                historias={punto.historias || []}
                onChange={(historias) => actualizarCampo("historias", historias)}
              />
            </FlatSection>

            <FlatSection
              title="Multimedia y vista 360"
              description="Contenido externo y disponibilidad de Street View."
              icon={Video}
            >
              <MultimediaAdmin punto={punto} onChange={setPunto} />
            </FlatSection>

            <div className="mt-16 flex flex-wrap items-center justify-end gap-3 border-t border-uva/10 pt-8">
              <button
                type="button"
                onClick={limpiarCampos}
                className="flex items-center justify-center gap-2 rounded-full border border-fucsia/20 bg-fucsia/10 px-4 py-2.5 font-bold text-fucsia transition hover:-translate-y-0.5 hover:bg-fucsia hover:text-crema hover:shadow-md active:translate-y-0"
              >
                <Eraser size={18} />
                Limpiar campos
              </button>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className="flex items-center justify-center gap-2 rounded-full bg-morado px-5 py-2.5 font-bold text-crema shadow-md transition hover:-translate-y-0.5 hover:bg-morado/85 hover:shadow-lg disabled:opacity-60 active:translate-y-0"
              >
                {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </FormularioEditorAdmin>

          <aside className="w-full min-w-0 self-start space-y-8 xl:sticky xl:top-5 xl:w-80 xl:flex-none">
            <TarjetaVistaUsuario punto={punto} />
            <TarjetaDetalleUsuario punto={punto} />
          </aside>
        </div>
      </div>

      <ModalConfirmacion
        open={mostrarConfirmacionEliminar}
        title="Eliminar punto"
        message={`Se va a eliminar "${
          punto?.nombre || "este punto"
        }". Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        onConfirm={eliminarPunto}
        onCancel={() => setMostrarConfirmacionEliminar(false)}
      />
    </AdminStyle>
  );
}

function ImageField({ title, helper, tipo, value, onChange, circular = false, idPunto }) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-4 bg-white ${
            circular ? "rounded-full border-rosa/70" : "rounded-3xl border-crema"
          }`}
        >
          {value ? (
            <img src={value} alt={title} className="h-full w-full object-cover" />
          ) : (
            <ImageOff size={30} className="text-uva/30" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-fredoka text-xl leading-none text-uva">{title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-uva/55">{helper}</p>
            </div>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fucsia/10 text-fucsia transition hover:bg-fucsia hover:text-crema"
                title={`Quitar ${title.toLowerCase()}`}
                aria-label={`Quitar ${title.toLowerCase()}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SubidorImagen
              tipo={tipo}
              label={`Subir ${title.toLowerCase()}`}
              value={value}
              showPreview={false}
              idPunto={idPunto}
              onUploadSuccess={(data) => onChange(data.url)}
            />
            {value && (
              <span className="rounded-full bg-morado/10 px-3 py-1.5 text-xs font-bold text-morado">
                Imagen cargada
              </span>
            )}
          </div>

          <details className="group">
            <summary className="w-fit cursor-pointer text-xs font-bold text-uva/55 transition hover:text-morado">
              Editar URL manual
            </summary>
            <input
              className={`${inputClass} mt-2`}
              value={value || ""}
              placeholder="https://..."
              onChange={(event) => onChange(event.target.value)}
            />
          </details>
        </div>
      </div>
    </div>
  );
}

function GaleriaFotos({ fotos, eliminandoFoto, subiendoFoto, onDelete, onUpload }) {
  const inputId = useId();
  const slotsVacios = Math.max(1, 3 - fotos.length);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await onUpload(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-morado" />
          <h4 className="font-fredoka text-xl text-uva">Galería del punto</h4>
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-uva/45">
          {fotos.length} fotos
        </span>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-4">
        {fotos.map((foto) => {
          const url = getImagenUrl(foto);
          const publicId = foto?.publicId || url;
          const eliminando = eliminandoFoto === foto?.publicId;

          return (
            <article
              key={publicId}
              className="group relative h-24 w-24 overflow-hidden rounded-2xl bg-crema"
            >
              {url ? (
                <img src={url} alt="Foto del punto" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-uva/35">
                  <ImageOff size={28} />
                </div>
              )}
              <button
                type="button"
                disabled={eliminando}
                onClick={() => onDelete(foto)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-fucsia text-crema shadow-md transition hover:bg-fucsia/85 disabled:opacity-70"
                title="Eliminar foto"
                aria-label="Eliminar foto"
              >
                {eliminando ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
              </button>
            </article>
          );
        })}

        {Array.from({ length: slotsVacios }).map((_, index) => (
          <label
            key={`slot-galeria-${index}`}
            htmlFor={inputId}
            className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-morado/30 bg-crema/40 text-morado transition hover:bg-morado/10 ${
              subiendoFoto ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {subiendoFoto ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Plus size={26} />
            )}
            <span className="mt-1 text-center text-xs font-bold">
              {subiendoFoto ? "Subiendo" : "Subir foto"}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
