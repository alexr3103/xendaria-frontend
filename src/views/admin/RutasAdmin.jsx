import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import BuscadorAdmin from "../../components/BuscadorAdmin.jsx";
import TituloFiltroAdmin from "../../components/TituloFiltroAdmin.jsx";
import PildoraFiltro from "../../components/PildoraFiltro.jsx";
import PestanasAdmin from "../../components/PestanasAdmin.jsx";
import { categorias as categoriasPuntos } from "../../components/CategoriasFiltros.jsx";
import cargafail from "../../assets/cargafail.png";

const CATEGORIAS_RUTAS_LABELS = {
  imperdibles: "Imperdibles",
  historia_patrimonio: "Historia y patrimonio",
  arte_cultura: "Arte y cultura",
  curiosidades_leyendas: "Curiosidades y leyendas",
  verde_aire_libre: "Verde y aire libre",
  sabores_comercios: "Sabores y comercios",
};

const CATEGORIAS_RUTAS_STYLE = {
  imperdibles: "bg-rosa/30 text-fucsia border-rosa/40",
  historia_patrimonio: "bg-grisaceo/45 text-uva border-grisaceo",
  arte_cultura: "bg-celeste/35 text-uva border-celeste/60",
  curiosidades_leyendas: "bg-lila/30 text-uva border-lila/60",
  verde_aire_libre: "bg-menta/25 text-uva border-menta/50",
  sabores_comercios: "bg-vainilla/60 text-uva border-vainilla",
};

const CATEGORIAS_RUTAS_COLOR = {
  imperdibles: "#F28FA0",
  historia_patrimonio: "#D1D1D1",
  arte_cultura: "#A0CDFF",
  curiosidades_leyendas: "#C69BFF",
  verde_aire_libre: "#83FFC4",
  sabores_comercios: "#FFF7A8",
};

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  categoria: "imperdibles",
  destacada: false,
  activa: true,
};

const inputClass =
  "w-full rounded-xl border border-uva/20 bg-crema px-3 py-3 text-uva outline-none transition focus:border-morado focus:ring-2 focus:ring-morado/20";

function getId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  if (valor.$oid) return valor.$oid;
  return String(valor._id || valor.id || valor);
}

function getToken() {
  return localStorage.getItem("token");
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "No se pudo completar la solicitud");
  }

  return data;
}

export default function RutasAdmin() {
  const API = import.meta.env.VITE_API_URL;

  const [rutas, setRutas] = useState([]);
  const [categoriasRutas, setCategoriasRutas] = useState(
    Object.keys(CATEGORIAS_RUTAS_LABELS)
  );
  const [puntos, setPuntos] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState([]);
  const [busquedaPunto, setBusquedaPunto] = useState("");
  const [busquedaRuta, setBusquedaRuta] = useState("");
  const [categoriaRutaFiltro, setCategoriaRutaFiltro] = useState("");
  const [categoriaPunto, setCategoriaPunto] = useState("");
  const [tab, setTab] = useState("activas");
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const seleccionadosIds = useMemo(
    () => new Set(puntosSeleccionados.map((punto) => getId(punto))),
    [puntosSeleccionados]
  );

  const puntosDisponibles = useMemo(
    () => puntos.filter((punto) => !seleccionadosIds.has(getId(punto))),
    [puntos, seleccionadosIds]
  );

  const metricas = useMemo(
    () => ({
      total: rutas.length,
      activas: rutas.filter((ruta) => ruta.activa !== false).length,
      inactivas: rutas.filter((ruta) => ruta.activa === false).length,
      destacadas: rutas.filter((ruta) => ruta.destacada).length,
    }),
    [rutas]
  );

  const categoriasFiltroPuntos = useMemo(
    () =>
      Object.entries(categoriasPuntos).filter(([key]) => key !== "propios"),
    []
  );

  const rutasFiltradas = useMemo(() => {
    const query = busquedaRuta.trim().toLowerCase();
    const porEstado =
      tab === "inactivas"
        ? rutas.filter((ruta) => ruta.activa === false)
        : rutas.filter((ruta) => ruta.activa !== false);

    const porCategoria = categoriaRutaFiltro
      ? porEstado.filter((ruta) => ruta.categoria === categoriaRutaFiltro)
      : porEstado;

    const base = !query
      ? porCategoria
      : porCategoria.filter((ruta) =>
          [
            ruta.nombre,
            ruta.descripcion,
            ruta.categoria,
            CATEGORIAS_RUTAS_LABELS[ruta.categoria],
          ]
            .filter(Boolean)
            .some((valor) => String(valor).toLowerCase().includes(query))
        );

    return base;
  }, [busquedaRuta, categoriaRutaFiltro, rutas, tab]);

  const cargarCategorias = useCallback(async () => {
    try {
      const data = await fetchJSON(`${API}/api/rutas/categorias`);
      if (Array.isArray(data.categorias) && data.categorias.length > 0) {
        setCategoriasRutas(data.categorias);
        setForm((actual) => ({
          ...actual,
          categoria: data.categorias.includes(actual.categoria)
            ? actual.categoria
            : data.categorias[0],
        }));
      }
    } catch {
      setCategoriasRutas(Object.keys(CATEGORIAS_RUTAS_LABELS));
    }
  }, [API]);

  const cargarRutas = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setMensaje({ variant: "error", text: "No hay token de admin." });
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const data = await fetchJSON(`${API}/api/rutas/admin/todas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRutas(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudieron cargar las rutas.",
      });
    } finally {
      setCargando(false);
    }
  }, [API]);

  const cargarPuntos = useCallback(async () => {
    const query = new URLSearchParams();
    if (busquedaPunto.trim()) query.append("nombreContiene", busquedaPunto.trim());
    if (categoriaPunto) query.append("categoria", categoriaPunto);

    try {
      setCargandoPuntos(true);
      const data = await fetchJSON(`${API}/api/puntos?${query.toString()}`);
      setPuntos(Array.isArray(data) ? data : []);
    } catch {
      setPuntos([]);
    } finally {
      setCargandoPuntos(false);
    }
  }, [API, busquedaPunto, categoriaPunto]);

  useEffect(() => {
    cargarCategorias();
    cargarRutas();
  }, [cargarCategorias, cargarRutas]);

  useEffect(() => {
    cargarPuntos();
  }, [cargarPuntos]);

  function actualizarForm(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarForm() {
    setForm({
      ...FORM_INICIAL,
      categoria: categoriasRutas[0] || FORM_INICIAL.categoria,
    });
    setPuntosSeleccionados([]);
    setEditandoId(null);
    setMensaje(null);
  }

  function agregarPunto(punto) {
    const id = getId(punto);
    if (!id || seleccionadosIds.has(id)) return;
    setPuntosSeleccionados((actuales) => [...actuales, punto]);
  }

  function quitarPunto(idPunto) {
    setPuntosSeleccionados((actuales) =>
      actuales.filter((punto) => getId(punto) !== idPunto)
    );
  }

  function editarRuta(ruta) {
    setEditandoId(ruta._id);
    setForm({
      nombre: ruta.nombre || "",
      descripcion: ruta.descripcion || "",
      categoria: ruta.categoria || categoriasRutas[0] || FORM_INICIAL.categoria,
      destacada: Boolean(ruta.destacada),
      activa: ruta.activa !== false,
    });
    setPuntosSeleccionados(Array.isArray(ruta.puntos) ? ruta.puntos : []);
    setTab("form");
    setMensaje(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarRuta(event) {
    event.preventDefault();

    if (puntosSeleccionados.length < 3) {
      setMensaje({
        variant: "error",
        text: "La ruta necesita mínimo 3 puntos existentes.",
      });
      return;
    }

    const token = getToken();
    if (!token) {
      setMensaje({ variant: "error", text: "No hay token de admin." });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const body = {
        ...form,
        puntos: puntosSeleccionados.map((punto) => getId(punto)),
      };

      await fetchJSON(
        editandoId ? `${API}/api/rutas/${editandoId}` : `${API}/api/rutas`,
        {
          method: editandoId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const mensajeExito = {
        variant: "success",
        text: editandoId ? "Ruta actualizada." : "Ruta creada.",
      };
      const volverATab = form.activa === false ? "inactivas" : "activas";

      limpiarForm();
      setMensaje(mensajeExito);
      await cargarRutas();
      setTab(volverATab);
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo guardar la ruta.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarRuta(idRuta) {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta ruta?");
    if (!confirmar) return;

    const token = getToken();
    if (!token) {
      setMensaje({ variant: "error", text: "No hay token de admin." });
      return;
    }

    try {
      await fetchJSON(`${API}/api/rutas/${idRuta}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRutas((actuales) => actuales.filter((ruta) => ruta._id !== idRuta));
      if (editandoId === idRuta) limpiarForm();
      setMensaje({ variant: "success", text: "Ruta eliminada." });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo eliminar la ruta.",
      });
    }
  }

  return (
    <AdminStyle title="Gestión de rutas">
      <div className="mb-6 flex flex-col gap-4 border-b border-uva/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <PestanasAdmin
            tabs={[
              {
                key: "activas",
                active: tab === "activas",
                icon: Eye,
                label: "Rutas activas",
                count: metricas.activas,
                onClick: () => setTab("activas"),
              },
              {
                key: "inactivas",
                active: tab === "inactivas",
                icon: EyeOff,
                label: "Rutas inactivas",
                count: metricas.inactivas,
                onClick: () => setTab("inactivas"),
              },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <MetricCard
            label="Total"
            value={metricas.total}
            icon={<Share2 size={20} />}
          />
          <MetricCard
            label="Destacadas"
            value={metricas.destacadas}
            icon={<Sparkles size={20} />}
          />
        </div>
      </div>

      {mensaje && (
        <div className="mb-5">
          <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
        </div>
      )}

      {tab === "form" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-3xl border border-uva/10 bg-white shadow-xl">
            <div className="border-b border-uva/10 bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-fucsia">
                    <Compass size={17} />
                    La app calcula el recorrido
                  </p>
                  <h2 className="font-fredoka text-3xl leading-tight text-uva">
                    {editandoId ? "Editar ruta" : "Nueva ruta"}
                  </h2>
                </div>
                {editandoId && (
                  <button
                    type="button"
                    onClick={limpiarForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-fucsia/10 px-3 py-2 text-sm font-bold text-fucsia"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={guardarRuta} className="grid gap-6 p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <label className="grid gap-1">
                  <span className="text-sm font-bold text-uva">Nombre</span>
                  <input
                    value={form.nombre}
                    onChange={(event) =>
                      actualizarForm("nombre", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Ej: San Telmo misterioso"
                    required
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-bold text-uva">Categoría</span>
                  <select
                    value={form.categoria}
                    onChange={(event) =>
                      actualizarForm("categoria", event.target.value)
                    }
                    className={inputClass}
                  >
                    {categoriasRutas.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {CATEGORIAS_RUTAS_LABELS[categoria] || categoria}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-bold text-uva">Descripción</span>
                <textarea
                  value={form.descripcion}
                  onChange={(event) =>
                    actualizarForm("descripcion", event.target.value)
                  }
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Una breve descripción de la experiencia."
                />
              </label>

              <section className="rounded-3xl border border-uva/10 bg-crema/70 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-fredoka text-2xl text-uva">
                      Puntos de la ruta
                    </h3>
                    <p className="text-sm text-uva/65">
                      Minimo 3 puntos. No tienen orden fijo para el usuario.
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-4 py-1 text-sm font-bold ${
                      puntosSeleccionados.length >= 3
                        ? "bg-menta/40 text-uva"
                        : "bg-fucsia/10 text-fucsia"
                    }`}
                  >
                    {puntosSeleccionados.length}/3 mínimo
                  </span>
                </div>

                {puntosSeleccionados.length === 0 ? (
                  <EmptyPanel text="Agregá puntos desde el buscador de la derecha." />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {puntosSeleccionados.map((punto) => (
                      <SelectedPoint
                        key={getId(punto)}
                        punto={punto}
                        onRemove={() => quitarPunto(getId(punto))}
                      />
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-3 border-t border-uva/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <ActionToggle
                    active={form.destacada}
                    icon={<Sparkles size={17} />}
                    label="Destacada"
                    onClick={() => actualizarForm("destacada", !form.destacada)}
                  />
                  <ActionToggle
                    active={form.activa}
                    icon={form.activa ? <Eye size={17} /> : <EyeOff size={17} />}
                    label={form.activa ? "Activa" : "Inactiva"}
                    onClick={() => actualizarForm("activa", !form.activa)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-morado px-5 py-3 font-bold text-crema shadow transition hover:bg-morado/85 disabled:opacity-60"
                >
                  <Check size={19} />
                  {guardando
                    ? "Guardando..."
                    : editandoId
                      ? "Guardar cambios"
                      : "Crear ruta"}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-uva/10 bg-white p-5 shadow-xl xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4">
              <h2 className="font-fredoka text-2xl text-uva">Puntos del mapa</h2>
              <p className="text-sm text-uva/65">
                Buscá y agregá solo puntos públicos existentes.
              </p>
            </div>

            <div className="grid gap-3">
              <BuscadorAdmin
                value={busquedaPunto}
                onChange={setBusquedaPunto}
                placeholder="Buscar punto"
                className="w-full bg-crema shadow-none"
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                <PildoraFiltro
                  active={!categoriaPunto}
                  onClick={() => setCategoriaPunto("")}
                >
                  Todas
                </PildoraFiltro>
                {categoriasFiltroPuntos.map(([key, categoria]) => (
                  <PildoraFiltro
                    key={key}
                    active={categoriaPunto === key}
                    onClick={() => setCategoriaPunto(key)}
                    color={categoria.color}
                    icon={categoria.icon}
                  >
                    {categoria.label}
                  </PildoraFiltro>
                ))}
              </div>
            </div>

            <div className="mt-4 max-h-[540px] overflow-y-auto pr-1">
              {cargandoPuntos ? (
                <EmptyPanel text="Cargando puntos..." />
              ) : puntosDisponibles.length === 0 ? (
                <EmptyPanel text="No hay puntos disponibles con ese filtro." />
              ) : (
                <div className="grid gap-2">
                  {puntosDisponibles.map((punto) => (
                    <AvailablePoint
                      key={getId(punto)}
                      punto={punto}
                      onAdd={() => agregarPunto(punto)}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <section>
          <div className="mb-5 flex flex-col items-start gap-3">
            <div>
              <h2 className="font-fredoka text-3xl text-uva">
                {tab === "inactivas" ? "Rutas inactivas" : "Rutas activas"}
              </h2>
              <p className="text-sm text-uva/65">
                Administrá lo que verá el usuario en la sección de rutas.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  limpiarForm();
                  setTab("form");
                }}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-morado px-4 text-sm font-bold text-crema shadow-md transition hover:bg-morado/85"
              >
                <Plus size={18} />
                Nueva ruta
              </button>

              <BuscadorAdmin
                value={busquedaRuta}
                onChange={setBusquedaRuta}
                placeholder="Buscar ruta"
                className="w-full sm:max-w-[320px]"
              />
            </div>

            <TituloFiltroAdmin>Categorías</TituloFiltroAdmin>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <PildoraFiltro
                active={!categoriaRutaFiltro}
                onClick={() => setCategoriaRutaFiltro("")}
              >
                Todas
              </PildoraFiltro>
              {categoriasRutas.map((categoria) => (
                <PildoraFiltro
                  key={categoria}
                  active={categoriaRutaFiltro === categoria}
                  onClick={() =>
                    setCategoriaRutaFiltro(
                      categoriaRutaFiltro === categoria ? "" : categoria
                    )
                  }
                  color={CATEGORIAS_RUTAS_COLOR[categoria]}
                >
                  {CATEGORIAS_RUTAS_LABELS[categoria] || categoria}
                </PildoraFiltro>
              ))}
            </div>
          </div>

          {cargando ? (
            <EmptyPanel text="Cargando rutas..." />
          ) : rutas.length === 0 ? (
            <EmptyPanel text="Todavía no hay rutas recomendadas." />
          ) : rutasFiltradas.length === 0 ? (
            <EmptyPanel text="No hay rutas con esa búsqueda." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {rutasFiltradas.map((ruta) => (
                <RouteCard
                  key={ruta._id}
                  ruta={ruta}
                  onEdit={() => editarRuta(ruta)}
                  onDelete={() => eliminarRuta(ruta._id)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </AdminStyle>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <article className="flex min-w-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-uva shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-fredoka text-xl leading-none">
          {value}
        </span>
        <span className="block truncate text-xs font-bold text-uva/65">
          {label}
        </span>
      </span>
    </article>
  );
}

function ActionToggle({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
        active
          ? "border-morado/30 bg-morado/10 text-uva"
          : "border-uva/10 bg-white text-uva/65 hover:bg-crema"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          active ? "bg-morado text-crema" : "bg-crema text-uva"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function CategoryBadge({ categoria }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${
        CATEGORIAS_RUTAS_STYLE[categoria] || "border-uva/10 bg-crema text-uva"
      }`}
    >
      {CATEGORIAS_RUTAS_LABELS[categoria] || categoria || "Ruta"}
    </span>
  );
}

function SelectedPoint({ punto, onRemove }) {
  const categoria = categoriasPuntos[punto.categoria];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm">
      <PointImage punto={punto} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-uva">{punto.nombre}</span>
        <span className="block truncate text-xs text-uva/60">
          {categoria?.label || punto.categoria || "Categoría"}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fucsia/10 text-fucsia"
        title="Quitar punto"
        aria-label="Quitar punto"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function AvailablePoint({ punto, onAdd }) {
  const categoria = categoriasPuntos[punto.categoria];

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-uva/10 bg-white px-3 py-3 text-left transition hover:bg-crema"
    >
      <PointImage punto={punto} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-uva">{punto.nombre}</span>
        <span className="block truncate text-xs text-uva/60">
          {categoria?.label || punto.categoria || "Categoría"}
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
        <Plus size={18} />
      </span>
    </button>
  );
}

function PointImage({ punto }) {
  return (
    <img
      src={punto.foto || cargafail}
      alt=""
      onError={(event) => {
        event.currentTarget.src = cargafail;
      }}
      className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm"
    />
  );
}

function RouteCard({ ruta, onEdit, onDelete }) {
  const puntos = Array.isArray(ruta.puntos) ? ruta.puntos : [];

  return (
    <article className="flex min-h-[250px] flex-col rounded-3xl border border-uva/10 bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <CategoryBadge categoria={ruta.categoria} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-morado/10 text-morado"
            title="Editar"
            aria-label="Editar ruta"
          >
            <Edit3 size={18} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-fucsia text-crema"
            title="Eliminar"
            aria-label="Eliminar ruta"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <h3 className="font-fredoka text-2xl leading-tight text-uva">
        {ruta.nombre}
      </h3>
      {ruta.descripcion && (
        <p className="mt-1 line-clamp-2 text-sm text-uva/65">
          {ruta.descripcion}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill active={ruta.activa !== false} />
        {ruta.destacada && (
          <span className="rounded-full bg-rosa/30 px-3 py-1 text-xs font-bold text-fucsia">
            Destacada
          </span>
        )}
        <span className="rounded-full bg-crema px-3 py-1 text-xs font-bold text-uva">
          {ruta.cantidadPuntos || puntos.length || 0} puntos
        </span>
      </div>

      <div className="mt-auto pt-5">
        {puntos.length === 0 ? (
          <p className="text-sm text-uva/60">Sin puntos cargados.</p>
        ) : (
          <div className="flex -space-x-2">
            {puntos.slice(0, 5).map((punto) => (
              <img
                key={getId(punto)}
                src={punto.foto || cargafail}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = cargafail;
                }}
                className="h-11 w-11 rounded-full border-2 border-white object-cover shadow"
              />
            ))}
            {puntos.length > 5 && (
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-morado text-sm font-bold text-crema shadow">
                +{puntos.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-menta/35 text-uva" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active ? <Eye size={13} /> : <EyeOff size={13} />}
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function EmptyPanel({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-uva/15 bg-white/70 px-4 py-6 text-center text-sm font-semibold text-uva/65">
      <MapPin className="mx-auto mb-2 text-morado" size={22} />
      {text}
    </div>
  );
}
