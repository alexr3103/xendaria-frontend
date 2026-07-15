import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  GitMerge,
  ListFilter,
  Loader2,
  MapPin,
  MapPinned,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import MapaAdmin from "../../components/Mapa_admin.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import XendariaModal from "../../components/XendariaModal.jsx";
import AdminActiveToggle from "../../components/AdminActiveToggle.jsx";
import FilterPill from "../../components/FilterPill.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";

const CATEGORIAS_RUTAS_LABELS = {
  imperdibles: "Imperdibles",
  historia_patrimonio: "Historia y patrimonio",
  arte_cultura: "Arte y cultura",
  curiosidades_leyendas: "Curiosidades y leyendas",
  verde_aire_libre: "Verde y aire libre",
  sabores_comercios: "Sabores y comercios",
};

const CATEGORIAS_RUTAS_COLOR = {
  imperdibles: "#F28FA0",
  historia_patrimonio: "#D1D1D1",
  arte_cultura: "#A0CDFF",
  curiosidades_leyendas: "#C69BFF",
  verde_aire_libre: "#83FFC4",
  sabores_comercios: "#FFF7A8",
};

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

export default function MapaAdminWrapper() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [searchParams] = useSearchParams();
  const idDesdeURL = searchParams.get("punto");

  const [vista, setVista] = useState("puntos");
  const [categoriaPunto, setCategoriaPunto] = useState("todas");
  const [categoriaRuta, setCategoriaRuta] = useState("todas");
  const [busquedaPunto, setBusquedaPunto] = useState("");
  const [puntos, setPuntos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [duplicados, setDuplicados] = useState([]);
  const [fusionandoDuplicados, setFusionandoDuplicados] = useState(false);
  const [modalDuplicadosOpen, setModalDuplicadosOpen] = useState(false);
  const [duplicadoActualIndex, setDuplicadoActualIndex] = useState(0);
  const [errorFusionDuplicados, setErrorFusionDuplicados] = useState("");
  const [movimientoPendiente, setMovimientoPendiente] = useState(null);
  const resolverMovimientoRef = useRef(null);

  const puntosFiltrados = useMemo(() => {
    const busqueda = busquedaPunto.trim().toLowerCase();

    return puntos.filter((punto) => {
      const filtroInactivos = categoriaPunto === "inactivos";
      const coincideCategoria =
        categoriaPunto === "todas" ||
        (filtroInactivos && punto.activo === false) ||
        getCategoriasPunto(punto).includes(categoriaPunto);

      if (!coincideCategoria) return false;
      if (!busqueda) return true;

      return [punto.nombre, punto.direccion, punto.descripcion]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(busqueda));
    });
  }, [busquedaPunto, categoriaPunto, puntos]);

  const rutasFiltradas = useMemo(() => {
    if (categoriaRuta === "todas") return rutas;
    return rutas.filter((ruta) => ruta.categoria === categoriaRuta);
  }, [categoriaRuta, rutas]);

  const categoriasPuntosDisponibles = useMemo(() => {
    const usadas = new Set(puntos.flatMap(getCategoriasPunto).filter(Boolean));
    return Object.entries(categorias).filter(([key]) => usadas.has(key));
  }, [puntos]);

  const categoriasRutasDisponibles = useMemo(() => {
    const usadas = new Set(rutas.map((ruta) => ruta.categoria).filter(Boolean));
    return Object.keys(CATEGORIAS_RUTAS_LABELS).filter((key) => usadas.has(key));
  }, [rutas]);

  async function cargarPuntos() {
    const query = new URLSearchParams({ incluirInactivos: "true" });
    const res = await fetch(`${API}/api/puntos?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];
    setPuntos(lista);
    return lista;
  }

  async function cargarRutas() {
    const res = await fetch(`${API}/api/rutas/admin/todas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];

    setRutas(lista);
    setRutaSeleccionada((actual) => {
      if (!actual?._id) return actual;
      return lista.find((ruta) => ruta._id === actual._id) || actual;
    });

    return lista;
  }

  async function cargarDuplicados() {
    const res = await fetch(`${API}/api/puntos/admin/duplicados`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];
    setDuplicados(lista);
    return lista;
  }

  useEffect(() => {
    cargarPuntos();
    cargarRutas();
    cargarDuplicados();
  }, []);

  useEffect(() => {
    if (!idDesdeURL || puntos.length === 0) return;

    const encontrado = puntos.find((p) => p._id === idDesdeURL);
    if (encontrado) {
      setVista("puntos");
      setPuntoSeleccionado(encontrado);
      setModoNuevo(false);
    }
  }, [idDesdeURL, puntos]);

  useEffect(() => {
    if (vista !== "rutas") return;
    const seleccionExiste =
      rutaSeleccionada &&
      rutas.some((ruta) => ruta._id === rutaSeleccionada._id);
    const seleccionCoincideFiltro =
      categoriaRuta === "todas" || rutaSeleccionada?.categoria === categoriaRuta;

    if (seleccionExiste && seleccionCoincideFiltro) {
      return;
    }

    setRutaSeleccionada(rutasFiltradas[0] || null);
  }, [categoriaRuta, rutas, rutasFiltradas, rutaSeleccionada, vista]);

  useEffect(() => {
    if (duplicados.length === 0) {
      setModalDuplicadosOpen(false);
      setDuplicadoActualIndex(0);
      return;
    }

    if (duplicadoActualIndex > duplicados.length - 1) {
      setDuplicadoActualIndex(duplicados.length - 1);
    }
  }, [duplicados.length, duplicadoActualIndex]);

  function handleSelectPunto(p) {
    setVista("puntos");
    setPuntoSeleccionado(p);
    setModoNuevo(false);
  }

  function handleNuevoPunto() {
    setVista("puntos");
    setModoNuevo(true);
    setPuntoSeleccionado({
      nombre: "",
      categoria: "puntos_populares",
      categorias: ["puntos_populares"],
      direccion: "",
      descripcion: "",
      descripcion_completa: "",
      lat: "",
      lon: "",
      foto: "",
      link: "",
      insignia: null,
      activo: true,
    });
  }

  function handlePuntoCoordsChange({ lat, lon }) {
    setPuntoSeleccionado((actual) => {
      if (!actual) return actual;

      return {
        ...actual,
        lat,
        lon,
      };
    });
  }

  function confirmarMovimientoLargo(info) {
    return new Promise((resolve) => {
      resolverMovimientoRef.current = resolve;
      setMovimientoPendiente(info);
    });
  }

  function resolverMovimientoLargo(aceptar) {
    resolverMovimientoRef.current?.(aceptar);
    resolverMovimientoRef.current = null;
    setMovimientoPendiente(null);
  }

  async function handleGuardar() {
    try {
      const { _id, ...datos } = puntoSeleccionado;

      const method = modoNuevo ? "POST" : "PATCH";
      const url = modoNuevo
        ? `${API}/api/puntos`
        : `${API}/api/puntos/${_id}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error();

      await Promise.all([cargarPuntos(), cargarRutas()]);
      setPuntoSeleccionado(null);
      setModoNuevo(false);
    } catch {
      alert("No se pudo guardar el punto");
    }
  }

  async function eliminarPunto() {
    if (!confirm("Seguro que queres eliminar este punto?")) return;

    const res = await fetch(`${API}/api/puntos/${puntoSeleccionado._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return alert("Error eliminando");

    await cargarPuntos();
    setPuntoSeleccionado(null);
  }

  function abrirModalDuplicados() {
    if (!duplicados.length) return;

    setDuplicadoActualIndex(0);
    setErrorFusionDuplicados("");
    setModalDuplicadosOpen(true);
  }

  async function fusionarDuplicadoActual() {
    const grupo = duplicados[duplicadoActualIndex];
    if (!grupo || fusionandoDuplicados) return;

    setFusionandoDuplicados(true);
    setErrorFusionDuplicados("");

    try {
      const res = await fetch(`${API}/api/puntos/admin/duplicados/fusionar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clave: grupo.clave }),
      });

      if (!res.ok) throw new Error();

      await cargarPuntos();
      const restantes = await cargarDuplicados();
      const siguienteIndex = Math.min(
        duplicadoActualIndex,
        Math.max(restantes.length - 1, 0)
      );

      setDuplicadoActualIndex(siguienteIndex);
      setModalDuplicadosOpen(restantes.length > 0);
      setPuntoSeleccionado(null);
    } catch {
      setErrorFusionDuplicados("No se pudo fusionar este grupo. Proba de nuevo.");
    } finally {
      setFusionandoDuplicados(false);
    }
  }

  return (
    <AdminStyle title="Mapa">
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <aside className="rounded-3xl border border-uva/10 bg-white p-4 shadow-xl">
          <div className="mb-4 grid grid-cols-2 rounded-2xl bg-crema p-1">
            <TabButton active={vista === "puntos"} onClick={() => setVista("puntos")}>
              <MapPinned size={17} />
              Puntos
            </TabButton>
            <TabButton active={vista === "rutas"} onClick={() => setVista("rutas")}>
              <Share2 size={17} />
              Rutas
            </TabButton>
          </div>

          {vista === "puntos" ? (
            <PuntosPanel
              puntos={puntosFiltrados}
              total={puntos.length}
              categoria={categoriaPunto}
              setCategoria={setCategoriaPunto}
              busqueda={busquedaPunto}
              setBusqueda={setBusquedaPunto}
              categoriasDisponibles={categoriasPuntosDisponibles}
              onNuevo={handleNuevoPunto}
              onSelect={handleSelectPunto}
              seleccionado={puntoSeleccionado}
              duplicadosCount={duplicados.length}
              inactivosCount={puntos.filter((punto) => punto.activo === false).length}
              onFusionarDuplicados={abrirModalDuplicados}
              fusionandoDuplicados={fusionandoDuplicados}
            />
          ) : (
            <RutasPanel
              rutas={rutasFiltradas}
              total={rutas.length}
              categoria={categoriaRuta}
              setCategoria={setCategoriaRuta}
              categoriasDisponibles={categoriasRutasDisponibles}
              onSelect={setRutaSeleccionada}
              seleccionada={rutaSeleccionada}
            />
          )}
        </aside>

        <section
          className={`grid min-h-[calc(100vh-9rem)] items-stretch gap-5 ${
            vista === "puntos" && puntoSeleccionado
              ? "xl:grid-cols-[1fr_auto]"
              : "xl:grid-cols-1"
          }`}
        >
          <div className="relative h-full min-h-[64vh] overflow-hidden rounded-3xl border border-uva/10 shadow-xl xl:min-h-[calc(100vh-9rem)]">
            <MapaAdmin
              modo={vista}
              puntos={puntosFiltrados}
              rutas={rutas}
              onSelectPunto={handleSelectPunto}
              onSelectRuta={setRutaSeleccionada}
              onPuntoCoordsChange={handlePuntoCoordsChange}
              onConfirmarMovimientoLargo={confirmarMovimientoLargo}
              puntoSeleccionado={puntoSeleccionado}
              rutaSeleccionada={rutaSeleccionada}
            />
          </div>

          {vista === "puntos" && puntoSeleccionado && (
            <PuntoPanel
              puntoSeleccionado={puntoSeleccionado}
              setPuntoSeleccionado={setPuntoSeleccionado}
              modoNuevo={modoNuevo}
              onGuardar={handleGuardar}
              onEliminar={eliminarPunto}
              onCerrar={() => setPuntoSeleccionado(null)}
            />
          )}
        </section>
      </div>

      <DuplicadosFusionModal
        open={modalDuplicadosOpen}
        grupos={duplicados}
        index={duplicadoActualIndex}
        loading={fusionandoDuplicados}
        error={errorFusionDuplicados}
        onClose={() => {
          setModalDuplicadosOpen(false);
          setErrorFusionDuplicados("");
        }}
        onPrev={() =>
          setDuplicadoActualIndex((actual) => Math.max(actual - 1, 0))
        }
        onNext={() =>
          setDuplicadoActualIndex((actual) =>
            Math.min(actual + 1, duplicados.length - 1)
          )
        }
        onConfirm={fusionarDuplicadoActual}
      />

      <ConfirmarMovimientoPuntoModal
        open={Boolean(movimientoPendiente)}
        distanciaMetros={movimientoPendiente?.distanciaMetros}
        onCancel={() => resolverMovimientoLargo(false)}
        onConfirm={() => resolverMovimientoLargo(true)}
      />
    </AdminStyle>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
        active ? "bg-uva text-crema shadow" : "text-uva/65 hover:text-uva"
      }`}
    >
      {children}
    </button>
  );
}

function DuplicadosFusionModal({
  open,
  grupos,
  index,
  loading,
  error,
  onClose,
  onPrev,
  onNext,
  onConfirm,
}) {
  if (!open) return null;

  const grupo = grupos[index];
  if (!grupo) return null;

  const total = grupos.length;
  const puedeAnterior = index > 0 && !loading;
  const puedeSiguiente = index < total - 1 && !loading;

  return (
    <XendariaModal
      open={open}
      onClose={onClose}
      headerClassName="bg-uva px-5 pb-5 pt-6 text-crema sm:px-7"
      contentClassName="px-5 py-5 sm:px-7"
      footerClassName="flex flex-col gap-3 border-t border-uva/10 bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
      header={
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crema text-uva shadow-md">
              <GitMerge size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-crema/70">
                Revision de duplicados
              </p>
              <h3 className="font-fredoka text-2xl leading-none sm:text-3xl">
                Fusionar puntos
              </h3>
            </div>
          </div>
        </>
      }
      footer={
        <>
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <button
              type="button"
              onClick={onPrev}
              disabled={!puedeAnterior}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-uva/15 bg-crema text-uva transition hover:bg-crema/70 disabled:opacity-35"
              aria-label="Ver duplicado anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-uva/60">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!puedeSiguiente}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-uva/15 bg-crema text-uva transition hover:bg-crema/70 disabled:opacity-35"
              aria-label="Ver duplicado siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-uva/15 bg-crema px-5 py-2.5 font-bold text-uva transition hover:bg-crema/70 disabled:opacity-60"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-uva px-5 py-2.5 font-bold text-crema shadow-md transition hover:bg-uva/90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Fusionando...
                </>
              ) : (
                <>
                  <GitMerge size={18} />
                  Fusionar este grupo
                </>
              )}
            </button>
          </div>
        </>
      }
    >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-uva">
                Grupo {index + 1} de {total}
              </p>
              <p className="text-sm text-uva/65">
                {grupo.cantidad || grupo.puntos?.length || 0} puntos parecen ser el mismo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(grupo.categorias || []).map((categoria) => {
                const info = categorias[categoria];
                const Icon = info?.icon;

                return (
                  <span
                    key={categoria}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold text-uva"
                    style={{
                      backgroundColor: info?.color || "#F4EFFF",
                      borderColor: info?.color || "#AA63E0",
                    }}
                  >
                    {Icon && <Icon size={13} />}
                    {info?.label || categoria}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {(grupo.puntos || []).map((punto, puntoIndex) => (
              <article
                key={punto._id}
                className="rounded-2xl border border-uva/10 bg-white/75 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-uva">
                      {punto.nombre || "Punto sin nombre"}
                    </p>
                    <p className="text-xs text-uva/55">
                      Registro {puntoIndex + 1}
                    </p>
                  </div>
                  <span className="rounded-full bg-crema px-3 py-1 text-xs font-bold text-uva/70">
                    {String(punto._id).slice(-6)}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {getCategoriasPunto(punto).map((categoria) => {
                    const info = categorias[categoria];
                    return (
                      <span
                        key={categoria}
                        className="rounded-full px-2.5 py-1 text-xs font-bold text-uva"
                        style={{ backgroundColor: info?.color || "#F4EFFF" }}
                      >
                        {info?.label || categoria}
                      </span>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-uva/65">
                  <span className="rounded-xl bg-crema px-3 py-2">
                    Lat: {Number(punto.lat).toFixed(5)}
                  </span>
                  <span className="rounded-xl bg-crema px-3 py-2">
                    Lon: {Number(punto.lon).toFixed(5)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-uva/10 bg-white/65 p-4 text-sm leading-relaxed text-uva/75">
            Al fusionar, Xendaria conserva un solo punto, suma sus categorias y mueve las
            referencias de rutas, favoritos, visitas y calificaciones al registro principal.
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-fucsia/25 bg-fucsia/10 px-4 py-3 text-sm font-semibold text-fucsia">
              {error}
            </div>
          )}
    </XendariaModal>
  );
}

function ConfirmarMovimientoPuntoModal({
  open,
  distanciaMetros,
  onCancel,
  onConfirm,
}) {
  return (
    <XendariaModal
      open={open}
      onClose={onCancel}
      maxWidth="max-w-md"
      headerClassName="bg-uva px-5 pb-5 pt-6 text-crema"
      contentClassName="px-5 py-5"
      footerClassName="flex flex-col-reverse gap-2 border-t border-uva/10 bg-white/70 px-5 py-4 sm:flex-row sm:justify-end"
      header={
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crema text-uva shadow-md">
            <MapPin size={23} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-crema/70">
              Confirmar ubicacion
            </p>
            <h3 className="font-fredoka text-2xl leading-none">
              Movimiento grande
            </h3>
          </div>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-uva/15 bg-crema px-5 py-2.5 font-bold text-uva transition hover:bg-crema/70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-uva px-5 py-2.5 font-bold text-crema shadow-md transition hover:bg-uva/90"
          >
            Ajustar igual
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-uva/75">
        Moviste el punto mas de una cuadra
        {Number.isFinite(distanciaMetros)
          ? ` (${Math.round(distanciaMetros)} m aprox.)`
          : ""}
        . Revisalo antes de confirmar para no cambiarlo por error.
      </p>
    </XendariaModal>
  );
}

function PuntosPanel({
  puntos,
  total,
  categoria,
  setCategoria,
  busqueda,
  setBusqueda,
  categoriasDisponibles,
  onNuevo,
  onSelect,
  seleccionado,
  duplicadosCount,
  inactivosCount,
  onFusionarDuplicados,
  fusionandoDuplicados,
}) {
  return (
    <div>
      <div className="mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-uva/50">
            Mapa de puntos
          </p>
          <h2 className="font-fredoka text-2xl text-morado">
            {puntos.length} de {total}
          </h2>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onNuevo}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-morado text-crema shadow-md transition hover:bg-morado/85"
          title="Nuevo punto"
          aria-label="Nuevo punto"
        >
          <Plus size={22} />
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-uva/15 bg-crema px-3 py-2 text-uva">
          <Search size={17} className="shrink-0 text-uva/60" />
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar punto"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-uva/45"
          />
        </label>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-uva/50">
          <ListFilter size={14} />
          Filtros
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={categoria === "todas"} onClick={() => setCategoria("todas")}>
            Todas
          </FilterPill>
          <FilterPill
            active={categoria === "inactivos"}
            onClick={() => setCategoria(categoria === "inactivos" ? "todas" : "inactivos")}
            color="#D1D1D1"
            icon={EyeOff}
          >
            Inactivos ({inactivosCount})
          </FilterPill>
          {categoriasDisponibles.map(([key, cat]) => (
            <FilterPill
              key={key}
              active={categoria === key}
              onClick={() => setCategoria(key)}
              color={cat.color}
              icon={cat.icon}
            >
              {cat.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {duplicadosCount > 0 && (
        <div className="mb-4 rounded-2xl border border-rosa/40 bg-rosa/10 p-3">
          <p className="text-sm font-bold text-uva">
            {duplicadosCount} grupo{duplicadosCount === 1 ? "" : "s"} duplicado{duplicadosCount === 1 ? "" : "s"}
          </p>
          <p className="mb-3 text-xs text-uva/60">
            Se pueden fusionar en un solo punto con varias categorias.
          </p>
          <button
            type="button"
            onClick={onFusionarDuplicados}
            disabled={fusionandoDuplicados}
            className="rounded-full bg-uva px-4 py-2 text-xs font-bold text-crema shadow-sm transition hover:bg-uva/90 disabled:opacity-60"
          >
            {fusionandoDuplicados ? "Fusionando..." : "Revisar duplicados"}
          </button>
        </div>
      )}

      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1 xl:max-h-[58vh]">
        {puntos.map((p) => {
          const inactivo = p.activo === false;

          return (
            <button
              key={p._id}
              type="button"
              onClick={() => onSelect(p)}
              style={
                inactivo
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(64, 26, 55, 0.06) 0 6px, transparent 6px 12px)",
                    }
                  : undefined
              }
              className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                seleccionado?._id === p._id
                  ? "border-uva/40 bg-uva/10"
                  : inactivo
                    ? "border-uva/15 bg-white/70 opacity-80 hover:bg-crema"
                    : "border-uva/10 bg-crema/60 hover:bg-crema"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-bold text-uva">
                  {p.nombre}
                </p>
                {inactivo && (
                  <span className="shrink-0 rounded-full bg-uva/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-uva/65">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-uva/60">
                {getCategoriasPunto(p)
                  .map((key) => categorias[key]?.label || key)
                  .join(", ") || "Sin categoria"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RutasPanel({
  rutas,
  total,
  categoria,
  setCategoria,
  categoriasDisponibles,
  onSelect,
  seleccionada,
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-uva/50">
            Rutas del mapa
          </p>
          <h2 className="font-fredoka text-2xl text-morado">
            {rutas.length} de {total}
          </h2>
        </div>
        <Link
          to="/admin/rutas"
          className="rounded-full bg-uva px-4 py-2 text-sm font-bold text-crema shadow-md transition hover:bg-uva/90"
        >
          Gestionar
        </Link>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-uva/50">
          <ListFilter size={14} />
          Categorias
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={categoria === "todas"} onClick={() => setCategoria("todas")}>
            Todas
          </FilterPill>
          {categoriasDisponibles.map((key) => (
            <FilterPill
              key={key}
              active={categoria === key}
              onClick={() => setCategoria(key)}
              color={CATEGORIAS_RUTAS_COLOR[key]}
            >
              {CATEGORIAS_RUTAS_LABELS[key] || key}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1 xl:max-h-[58vh]">
        {rutas.map((ruta) => {
          const color = CATEGORIAS_RUTAS_COLOR[ruta.categoria] || "#AA63E0";
          const active = seleccionada?._id === ruta._id;

          return (
            <button
            key={ruta._id}
            type="button"
            onClick={() => onSelect(ruta)}
            style={{
              borderColor: active ? color : `${color}88`,
              backgroundColor: active ? `${color}4D` : `${color}24`,
            }}
            className="w-full rounded-2xl border px-3 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <p className="truncate font-bold text-uva">{ruta.nombre}</p>
            </div>
            <p className="mt-1 truncate pl-5 text-sm text-uva/65">
              {(ruta.puntos || []).length || ruta.cantidadPuntos || 0} puntos
              {" - "}
              {CATEGORIAS_RUTAS_LABELS[ruta.categoria] || ruta.categoria || "Ruta"}
            </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PuntoPanel({
  puntoSeleccionado,
  setPuntoSeleccionado,
  modoNuevo,
  onGuardar,
  onEliminar,
  onCerrar,
}) {
  const actualizarCampo = (campo, valor) => {
    setPuntoSeleccionado({
      ...puntoSeleccionado,
      [campo]: valor,
    });
  };

  return (
    <div className="relative w-full max-w-full xl:w-[390px]">
      <aside className="h-fit max-h-[80vh] w-full overflow-y-auto overflow-x-hidden rounded-3xl border border-uva/10 bg-white p-5 shadow-xl">
        <div className="absolute right-4 top-4 z-20">
          <BotonCerrar onClick={onCerrar} className="h-11 w-11 rounded-xl" />
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onGuardar();
          }}
        >
        <div className="mb-1 flex items-center gap-3 pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-crema text-morado shadow-sm">
            <MapPin size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-uva/45">
              Edicion rapida
            </p>
            <h2 className="font-fredoka text-2xl leading-none text-morado">
              {modoNuevo ? "Nuevo Punto" : "Editar Punto"}
            </h2>
          </div>
        </div>

        <Field label="Nombre">
          <input
            className="w-full min-w-0 rounded-xl border border-uva/20 bg-crema p-3 text-uva"
            value={puntoSeleccionado.nombre || ""}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
          />
        </Field>

        <Field label="Categoria">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categorias)
              .filter(([key]) => key !== "propios")
              .map(([key, categoria]) => {
                const activas = getCategoriasPunto(puntoSeleccionado);
                const active = activas.includes(key);
                const Icon = categoria.icon;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const actuales = getCategoriasPunto(puntoSeleccionado);
                      const nuevas = active
                        ? actuales.filter((item) => item !== key)
                        : [...actuales, key];

                      setPuntoSeleccionado({
                        ...puntoSeleccionado,
                        categoria: nuevas[0] || "",
                        categorias: nuevas,
                      });
                    }}
                    style={{
                      backgroundColor: active
                        ? categoria.color
                        : `${categoria.color}55`,
                      borderColor: categoria.color,
                    }}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold text-uva transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                      active ? "shadow-sm" : "shadow-sm"
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: categoria.color }}
                    >
                      <Icon size={14} />
                    </span>
                    {categoria.label}
                  </button>
                );
              })}
          </div>
        </Field>

        <Field label="Direccion">
          <input
            className="w-full min-w-0 rounded-xl border border-uva/20 bg-crema p-3 text-uva"
            value={puntoSeleccionado.direccion || ""}
            onChange={(e) => actualizarCampo("direccion", e.target.value)}
          />
        </Field>

        <Field label="Descripcion breve">
          <textarea
            className="h-28 w-full min-w-0 resize-none rounded-xl border border-uva/20 bg-crema p-3 text-uva"
            value={puntoSeleccionado.descripcion || ""}
            onChange={(e) => actualizarCampo("descripcion", e.target.value)}
          />
        </Field>

        <Field label="Coordenadas">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              className="w-full min-w-0 rounded-xl border border-uva/20 bg-crema p-3 text-uva"
              placeholder="Latitud"
              value={puntoSeleccionado.lat ?? ""}
              onChange={(e) => actualizarCampo("lat", e.target.value)}
            />

            <input
              className="w-full min-w-0 rounded-xl border border-uva/20 bg-crema p-3 text-uva"
              placeholder="Longitud"
              value={puntoSeleccionado.lon ?? ""}
              onChange={(e) => actualizarCampo("lon", e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs font-semibold text-uva/55">
            Tambien podes arrastrar el pin seleccionado en el mapa.
          </p>
        </Field>

        <Field label="Estado">
          <AdminActiveToggle
            active={puntoSeleccionado.activo !== false}
            activeLabel="Punto activo"
            inactiveLabel="Punto inactivo"
            onClick={() =>
              actualizarCampo("activo", puntoSeleccionado.activo === false)
            }
          />
        </Field>

        <div className="mt-1 flex flex-col gap-2 border-t border-crema pt-4 sm:flex-row">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center rounded-xl bg-uva px-5 py-2.5 font-semibold text-crema shadow-sm transition hover:bg-uva/90"
          >
            Guardar
          </button>

          {!modoNuevo && (
            <button
              type="button"
              onClick={onEliminar}
              className="flex items-center justify-center gap-2 rounded-xl bg-fucsia px-5 py-2.5 font-semibold text-crema transition hover:bg-fucsia/80"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          )}
        </div>
        </form>
      </aside>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-nunito text-sm font-semibold text-uva/80">
        {label}
      </label>
      {children}
    </div>
  );
}

