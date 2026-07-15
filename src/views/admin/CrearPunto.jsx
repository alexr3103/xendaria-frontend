import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  ImageOff,
  Images,
  Info,
  Loader2,
  MapPinned,
  Save,
  Trash2,
  X,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import ImageUploader from "../../components/ImageUploader.jsx";
import HistoriasAdmin from "../../components/HistoriasAdmin.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";
import {
  UserDetailPreviewCard,
  UserPreviewCard,
} from "../../components/AdminPuntoPreview.jsx";
import {
  AdminEditorForm,
  AdminEditorPage,
  AdminField,
  AdminFlatSection,
  AdminSectionTitle,
  adminInputClass,
} from "../../components/AdminEditor.jsx";
import AdminActiveToggle from "../../components/AdminActiveToggle.jsx";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

export default function CrearPunto() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [punto, setPunto] = useState({
    nombre: "",
    categoria: "",
    categorias: [],
    direccion: "",
    descripcion: "",
    descripcion_completa: "",
    foto: "",
    link: "",
    insignia: null,
    activo: true,
    lat: "",
    lon: "",
    historias: [],
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);

  const categoriasActivas = useMemo(() => getCategoriasPunto(punto), [punto]);

  async function getErrorMessage(res) {
    try {
      const data = await res.json();
      if (Array.isArray(data?.message)) return data.message.join(" ");
      return data?.message || "No se pudo crear el punto";
    } catch {
      return "No se pudo crear el punto";
    }
  }

  function actualizarCampo(campo, valor) {
    setPunto((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleCategoria(key) {
    setPunto((prev) => {
      const actuales = getCategoriasPunto(prev);
      const nuevas = actuales.includes(key)
        ? actuales.filter((categoria) => categoria !== key)
        : [...actuales, key];

      return {
        ...prev,
        categoria: nuevas[0] || "",
        categorias: nuevas,
      };
    });
  }

  async function guardarPunto() {
    setError("");
    setOk("");
    setGuardando(true);

    try {
      if (String(punto.lat).trim() === "" || String(punto.lon).trim() === "") {
        setError("Latitud y longitud son obligatorias.");
        return;
      }

      const lat = Number(punto.lat);
      const lon = Number(punto.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setError("Latitud y longitud deben ser numeros validos.");
        return;
      }

      const categoriasNormalizadas = getCategoriasPunto(punto);
      const puntoParaGuardar = {
        ...punto,
        categoria: categoriasNormalizadas[0] || "",
        categorias: categoriasNormalizadas,
        lat,
        lon,
        ubicacion: {
          type: "Point",
          coordinates: [lon, lat],
        },
      };

      const res = await fetch(`${API}/api/puntos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(puntoParaGuardar),
      });

      if (res.status === 404) {
        navigate("/404");
        return;
      }

      if ([401, 403, 500].includes(res.status)) {
        navigate(`/error/${res.status}`);
        return;
      }

      if (!res.ok) {
        setError(await getErrorMessage(res));
        return;
      }

      setOk("Punto creado correctamente");
      setTimeout(() => navigate("/admin/mapa"), 900);
    } catch {
      setError("No se pudo conectar con la API. Revisa que el backend este funcionando.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AdminStyle title="Nuevo punto">
      <AdminEditorPage
        title="Nuevo punto"
        actions={
          <>
            <button
              type="button"
              onClick={guardarPunto}
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-full bg-morado px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-morado/85 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ml-4 flex items-center justify-center gap-2 rounded-full bg-fucsia px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-fucsia/85"
            >
              <X size={18} />
              Cancelar
            </button>
          </>
        }
      >
        <div className="mb-6 space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {ok && <Alert variant="success">{ok}</Alert>}
        </div>

        <div
          className="mt-8 grid w-full max-w-[1450px] min-w-0 items-start"
          style={{
            gridTemplateColumns: "minmax(0, 1040px) clamp(240px, 22vw, 340px)",
            columnGap: "clamp(20px, 2vw, 32px)",
          }}
        >
          <AdminEditorForm
            className="min-w-0 max-w-none"
            onSubmit={(event) => {
              event.preventDefault();
              guardarPunto();
            }}
          >
          <section className="space-y-9 pb-4">
            <AdminSectionTitle
              icon={Info}
              title="Datos principales"
              subtitle="Lo basico que identifica al punto en mapa y listados."
            />

            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <AdminField label="Nombre del punto">
                <input
                  className={adminInputClass}
                  value={punto.nombre}
                  placeholder="Ej: Museo del Agua"
                  onChange={(event) => actualizarCampo("nombre", event.target.value)}
                />
              </AdminField>

              <AdminField label="Direccion">
                <input
                  className={adminInputClass}
                  placeholder="Ej: Av. Cordoba 1234"
                  value={punto.direccion}
                  onChange={(event) => actualizarCampo("direccion", event.target.value)}
                />
              </AdminField>
            </div>

            <AdminField label="Categorias">
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
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-crema/70">
                          <Icon size={14} />
                        </span>
                        {categoria.label}
                      </button>
                    );
                  })}
              </div>
            </AdminField>

            <AdminField label="Estado del punto">
              <div className="max-w-xs">
                <AdminActiveToggle
                  active={punto.activo !== false}
                  activeLabel="Punto activo"
                  inactiveLabel="Punto inactivo"
                  onClick={() => actualizarCampo("activo", punto.activo === false)}
                />
              </div>
            </AdminField>
          </section>

          <AdminFlatSection
            title="Descripciones"
            description="Resumen visible en el modal y texto extendido del detalle."
            icon={FileText}
            contentClassName="space-y-10"
          >
            <AdminField label="Descripcion breve">
              <textarea
                className={`${adminInputClass} min-h-28 resize-y`}
                placeholder="Texto corto, resumen..."
                value={punto.descripcion}
                onChange={(event) => actualizarCampo("descripcion", event.target.value)}
              />
            </AdminField>

            <AdminField label="Descripcion completa">
              <textarea
                className={`${adminInputClass} min-h-40 resize-y`}
                placeholder="Historia, detalles largos..."
                value={punto.descripcion_completa}
                onChange={(event) =>
                  actualizarCampo("descripcion_completa", event.target.value)
                }
              />
            </AdminField>
          </AdminFlatSection>

          <AdminFlatSection
            title="Imagenes"
            description="Foto principal e insignia del lugar."
            icon={Images}
          >
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              <ImageField
                title="Foto principal"
                helper="Es la imagen circular que aparece en el modal del usuario."
                tipo="punto"
                value={punto.foto}
                onChange={(value) => actualizarCampo("foto", value)}
              />

              <ImageField
                title="Insignia"
                helper="Se muestra como recompensa desbloqueable del lugar."
                tipo="insignia"
                value={punto.insignia || ""}
                circular
                onChange={(value) => actualizarCampo("insignia", value || null)}
              />
            </div>
          </AdminFlatSection>

          <AdminFlatSection
            title="Ubicacion y enlace"
            description="Coordenadas GeoJSON y sitio externo si existe."
            icon={MapPinned}
          >
            <AdminField label="Sitio web">
              <input
                type="url"
                className={adminInputClass}
                placeholder="https://sitio-oficial.com"
                value={punto.link}
                onChange={(event) => actualizarCampo("link", event.target.value)}
              />
            </AdminField>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <AdminField label="Latitud">
                <input
                  className={adminInputClass}
                  placeholder="Latitud"
                  value={punto.lat}
                  onChange={(event) => actualizarCampo("lat", event.target.value)}
                />
              </AdminField>
              <AdminField label="Longitud">
                <input
                  className={adminInputClass}
                  placeholder="Longitud"
                  value={punto.lon}
                  onChange={(event) => actualizarCampo("lon", event.target.value)}
                />
              </AdminField>
            </div>
          </AdminFlatSection>

          <AdminFlatSection
            title={`Historias desbloqueables (${punto.historias.length}/3)`}
            description="Curiosidades o leyendas que acompanan al lugar."
            icon={BookOpen}
            contentClassName="space-y-10"
          >
            <HistoriasAdmin
              historias={punto.historias}
              onChange={(historias) => actualizarCampo("historias", historias)}
            />
          </AdminFlatSection>

          <div className="mt-16 flex flex-wrap items-center justify-end gap-3 border-t border-uva/10 pt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 rounded-full bg-fucsia px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-fucsia/85"
            >
              <X size={18} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-full bg-morado px-5 py-2.5 font-bold text-crema shadow-md transition hover:bg-morado/85 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
          </AdminEditorForm>

          <aside className="sticky top-5 min-w-0 self-start space-y-8 pr-1">
            <UserPreviewCard punto={punto} />
            <UserDetailPreviewCard punto={punto} />
          </aside>
        </div>
      </AdminEditorPage>
    </AdminStyle>
  );
}

function ImageField({ title, helper, tipo, value, onChange, circular = false }) {
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
            <ImageUploader
              tipo={tipo}
              label={`Subir ${title.toLowerCase()}`}
              value={value}
              showPreview={false}
              onUploadSuccess={(data) => onChange(data.url)}
            />
            {value && (
              <span className="rounded-full bg-morado/10 px-3 py-1.5 text-xs font-bold text-morado">
                Imagen cargada
              </span>
            )}
          </div>

          <details className="group">
            <summary className="cursor-pointer text-xs font-bold text-uva/60 transition hover:text-morado">
              Editar URL manual
            </summary>
            <input
              className={`${adminInputClass} mt-3`}
              placeholder="https://..."
              value={value || ""}
              onChange={(event) => onChange(event.target.value)}
            />
          </details>
        </div>
      </div>
    </div>
  );
}
