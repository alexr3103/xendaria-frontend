import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  MapPinned,
  ReceiptText,
  RefreshCw,
  Share2,
  Star,
  TicketCheck,
  Users,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";

const RUTAS_LABELS = {
  imperdibles: "Imperdibles",
  historia_patrimonio: "Historia y patrimonio",
  arte_cultura: "Arte y cultura",
  curiosidades_leyendas: "Curiosidades y leyendas",
  verde_aire_libre: "Verde y aire libre",
  sabores_comercios: "Sabores y comercios",
};

const RUTAS_COLORS = {
  imperdibles: "#F28FA0",
  historia_patrimonio: "#D1D1D1",
  arte_cultura: "#A0CDFF",
  curiosidades_leyendas: "#C69BFF",
  verde_aire_libre: "#83FFC4",
  sabores_comercios: "#FFF7A8",
};

const BIG_NUMBER = {
  fontSize: "3.4rem",
  lineHeight: "0.95",
};

const MAIN_NUMBER = {
  fontSize: "4.4rem",
  lineHeight: "0.95",
};

const METRIC_NUMBER = {
  fontSize: "2.45rem",
  lineHeight: "0.95",
};

const METRIC_MONEY_NUMBER = {
  fontSize: "2.35rem",
  lineHeight: "0.95",
};

function getToken() {
  return localStorage.getItem("token");
}

function number(value = 0) {
  return Number(value || 0).toLocaleString("es-AR");
}

function money(value = 0) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function date(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCategoriaInfo(categoria) {
  return (
    categorias[categoria] || {
      label: categoria || "Sin categoría",
      color: "#D1D1D1",
    }
  );
}

function getRutaInfo(categoria) {
  return {
    label: RUTAS_LABELS[categoria] || categoria || "Ruta",
    color: RUTAS_COLORS[categoria] || "#AA63E0",
  };
}

export default function DashboardAdmin() {
  const API = import.meta.env.VITE_API_URL;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarDashboard() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "No se pudo cargar el dashboard");
      }

      setDashboard(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  const resumen = dashboard?.resumen || {};
  const ordenesPagadas = Number(resumen.ordenes?.porEstado?.pagada || 0);
  const ordenesProcesando = Number(resumen.ordenes?.porEstado?.procesando || 0);
  const ordenesEnviadas = Number(resumen.ordenes?.porEstado?.enviada || 0);
  const ordenesPorGestionar = ordenesPagadas + ordenesProcesando;

  const prioridades = useMemo(
    () => [
      {
        label: "Usuarios",
        value: resumen.usuarios,
        detail: "registrados",
        icon: Users,
        to: "/admin/usuarios",
        color: "bg-rosa/45",
      },
      {
        label: "Puntos",
        value: resumen.puntos?.activos,
        detail: `${number(resumen.puntos?.inactivos)} inactivos`,
        icon: MapPinned,
        to: "/admin/puntos",
        color: "bg-morado/15",
      },
      {
        label: "Visitas",
        value: resumen.visitas?.total,
        detail: `${number(dashboard?.actividadReciente?.visitas)} en 7 días`,
        icon: TicketCheck,
        to: "/ranking",
        color: "bg-menta/45",
      },
      {
        label: "Rutas",
        value: resumen.rutas?.activas,
        detail: `${number(resumen.rutas?.pausadas)} pausadas`,
        icon: Share2,
        to: "/admin/rutas",
        color: "bg-celeste/55",
      },
    ],
    [dashboard, resumen]
  );

  const alertasAdmin = useMemo(() => {
    const alertasBase = (dashboard?.alertas || []).filter(
      (alerta) => alerta.tipo !== "puntos_sin_insignia"
    );
    const tiposExistentes = new Set(alertasBase.map((alerta) => alerta.tipo));
    const bajoStock = Number(resumen.productos?.bajoStock || 0);
    const puntosInactivos = Number(resumen.puntos?.inactivos || 0);
    const productosOcultos = Number(resumen.productos?.inactivos || 0);
    const extras = [];

    if (puntosInactivos > 0 && !tiposExistentes.has("puntos_inactivos")) {
      extras.push({
        tipo: "puntos_inactivos",
        titulo: "Puntos inactivos",
        total: puntosInactivos,
        descripcion: "Revisá estos puntos para confirmar si deben seguir ocultos en el mapa.",
        to: "/admin/puntos",
        variant: "info",
      });
    }

    if (bajoStock > 0 && !tiposExistentes.has("productos_bajo_stock")) {
      extras.push({
        tipo: "productos_bajo_stock",
        titulo: "Productos con bajo stock",
        total: bajoStock,
        descripcion: "Conviene reponerlos antes de que se agoten.",
        to: "/admin/merch",
        variant: "warning",
      });
    }

    if (productosOcultos > 0 && !tiposExistentes.has("productos_ocultos")) {
      extras.push({
        tipo: "productos_ocultos",
        titulo: "Productos ocultos",
        total: productosOcultos,
        descripcion: "Controlá si siguen pausados o si ya pueden volver a publicarse.",
        to: "/admin/merch",
        variant: "info",
      });
    }

    return [...alertasBase, ...extras];
  }, [dashboard, resumen]);

  return (
    <AdminStyle title="Dashboard">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <div className="flex flex-col gap-4 border-b border-uva/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-uva">
              Panel general
            </p>
            <h2 className="font-fredoka text-4xl leading-none text-morado sm:text-5xl">
              Estado de Xendaria
            </h2>
            <p className="mt-2 max-w-2xl text-base font-extrabold leading-relaxed text-uva">
              Órdenes, alertas y movimiento real para decidir qué revisar primero.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dashboard?.updatedAt && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-uva shadow-sm">
                <Clock3 size={15} className="text-morado" />
                {date(dashboard.updatedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={cargarDashboard}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-uva px-4 text-sm font-bold text-crema shadow-md transition hover:bg-uva/90 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading && !dashboard ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <OrdenesCompraPanel
                porGestionar={ordenesPorGestionar}
                pagadas={ordenesPagadas}
                procesando={ordenesProcesando}
                enviadas={ordenesEnviadas}
                nuevas={dashboard?.actividadReciente?.ordenes}
                ingresos={resumen.ordenes?.ingresos}
                productosActivos={resumen.productos?.activos}
                productosOcultos={resumen.productos?.inactivos}
                productosSinStock={resumen.productos?.sinStock}
              />

              <AlertasAdminPanel items={alertasAdmin} highlight />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <PrioridadesPanel items={prioridades} />
              <MovimientoPanel dashboard={dashboard} resumen={resumen} />
            </div>

            <DestacadosPanel dashboard={dashboard} />
          </div>
        )}
      </div>
    </AdminStyle>
  );
}

function OrdenesCompraPanel({
  porGestionar,
  pagadas,
  procesando,
  enviadas,
  nuevas,
  ingresos,
  productosActivos,
  productosOcultos,
  productosSinStock,
}) {
  return (
    <section className="h-full rounded-[30px] border border-uva/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          icon={ReceiptText}
          title="Órdenes de compra"
          subtitle="Primero lo que necesita gestión."
        />
        <Link
          to="/admin/merch"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-uva px-4 py-2 text-sm font-extrabold text-crema shadow-sm transition hover:bg-uva/90"
        >
          Abrir merch
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="overflow-hidden rounded-[34px] border border-morado/20 bg-morado/10 px-5 py-5 text-center shadow-inner">
          <p className="font-fredoka text-morado" style={MAIN_NUMBER}>
            {number(porGestionar)}
          </p>
          <p className="mt-2 text-base font-extrabold uppercase tracking-wide text-uva">
            Por gestionar
          </p>
          <p className="text-base font-bold leading-snug text-gris">
            pagadas o en preparación
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-2">
            <OrderStatus label="Pagadas" value={pagadas} />
            <OrderStatus label="Procesando" value={procesando} />
            <OrderStatus label="Enviadas" value={enviadas} />
            <OrderStatus label="Ocultos" value={productosOcultos} />
          </div>

          <div className="grid gap-2">
            <OrderMetric label="Nuevas 7 días" value={number(nuevas)} />
            <OrderMetric label="Ingresos" value={money(ingresos)} />
            <OrderMetric label="Productos activos" value={number(productosActivos)} />
            <OrderMetric label="Sin stock" value={number(productosSinStock)} tone="warm" />
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderMetric({ label, value, tone = "normal" }) {
  const accent =
    tone === "warm"
        ? "border-vainilla bg-vainilla/45"
        : "border-uva/10 bg-crema/65";

  return (
    <div className={`rounded-3xl border px-4 py-3 text-center ${accent}`}>
      <p
        className="break-words font-fredoka text-morado"
        style={label === "Ingresos" ? METRIC_MONEY_NUMBER : METRIC_NUMBER}
      >
        {value}
      </p>
      <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-gris">
        {label}
      </p>
    </div>
  );
}

function OrderStatus({ label, value }) {
  return (
    <div className="flex min-w-0 items-center justify-center rounded-3xl border border-uva/10 bg-crema/65 px-3 py-5 text-center">
      <span className="min-w-0">
        <span className="block font-fredoka text-morado" style={BIG_NUMBER}>
          {number(value)}
        </span>
        <span className="mt-2 block text-sm font-extrabold leading-tight text-gris sm:text-base">
          {label}
        </span>
      </span>
    </div>
  );
}

function AlertasAdminPanel({ items, highlight = false }) {
  const total = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

  return (
    <section
      className={`h-full rounded-[30px] border bg-white p-5 shadow-sm ${
        highlight
          ? "border-morado/25 shadow-[0_14px_30px_rgba(64,26,55,0.08)]"
          : "border-uva/10"
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <SectionTitle
          icon={AlertTriangle}
          title="Alertas admin"
          subtitle="Pendientes que conviene resolver."
        />
        <span className="flex h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl bg-uva px-4 font-fredoka text-3xl leading-none text-crema shadow-sm">
          {number(total)}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-menta/55 px-4 py-2 text-sm font-extrabold text-uva">
          <CheckCircle2 size={18} />
          Todo está ordenado
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AlertRow key={item.tipo} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function AlertRow({ item }) {
  return (
    <Link
      to={item.to}
      className="block rounded-3xl border border-uva/10 bg-crema/80 px-5 py-4 text-uva transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold">{item.titulo}</p>
          <p className="mt-1 line-clamp-2 text-base font-bold leading-snug">
            {item.descripcion}
          </p>
        </div>
        <span className="shrink-0 rounded-2xl bg-uva px-3 py-1 text-lg font-extrabold text-crema shadow-sm">
          {number(item.total)}
        </span>
      </div>
    </Link>
  );
}

function PrioridadesPanel({ items }) {
  return (
    <section className="h-full rounded-[30px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={BarChart3}
        title="Prioridades admin"
        subtitle="Indicadores rápidos del sistema."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <PriorityCard key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}

function PriorityCard({ label, value, detail, icon: Icon, to, color }) {
  return (
    <Link
      to={to}
      className="group grid min-w-0 grid-cols-[64px_minmax(0,1fr)_64px] items-center rounded-3xl border border-uva/10 bg-crema/50 px-5 py-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-uva ${color}`}
      >
        <Icon size={22} />
      </span>
      <span className="min-w-0 text-center">
        <span className="block font-fredoka text-morado" style={BIG_NUMBER}>
          {number(value)}
        </span>
        <span className="mt-2 block truncate text-lg font-extrabold text-uva">
          {label}
        </span>
        <span className="block truncate text-base font-bold text-uva">
          {detail}
        </span>
      </span>
      <span aria-hidden="true" />
    </Link>
  );
}

function MovimientoPanel({ dashboard, resumen }) {
  return (
    <section className="rounded-[30px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={BarChart3}
        title="Movimiento"
        subtitle="Actividad de los últimos días."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Visitas 7 días" value={dashboard?.actividadReciente?.visitas} />
        <MiniStat label="Rutas hechas" value={dashboard?.actividadReciente?.rutasRealizadas} />
        <MiniStat label="Ratings nuevos" value={dashboard?.actividadReciente?.calificaciones} />
        <MiniStat label="Total ratings" value={resumen.calificaciones?.total} />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-fredoka text-2xl leading-none text-uva">
          Categorías más visitadas
        </h3>
        <CategoryBars items={dashboard?.categoriasMasVisitadas || []} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-3xl border border-uva/10 bg-crema/55 px-4 py-4 text-center">
      <p className="font-fredoka text-morado" style={BIG_NUMBER}>
        {number(value)}
      </p>
      <p className="mt-2 text-base font-extrabold uppercase tracking-wide text-uva">
        {label}
      </p>
    </div>
  );
}

function DestacadosPanel({ dashboard }) {
  return (
    <section className="rounded-[30px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={Star}
        title="Destacados"
        subtitle="Lo que está funcionando mejor."
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <CompactList
          icon={MapPinned}
          title="Puntos más visitados"
          items={(dashboard?.topPuntosVisitados || []).slice(0, 3)}
          emptyText="Todavía no hay visitas registradas."
          renderItem={(item) => (
            <PointRow
              key={item.puntoId}
              title={item.nombre}
              category={item.categoria}
              image={item.foto}
              value={`${number(item.totalVisitas)} visitas`}
              detail={`Última: ${date(item.ultimaVisita)}`}
            />
          )}
        />

        <CompactList
          icon={Share2}
          title="Rutas más hechas"
          items={(dashboard?.topRutasRealizadas || []).slice(0, 3)}
          emptyText="Todavía no hay rutas realizadas."
          renderItem={(item) => (
            <RouteRow
              key={item.rutaId}
              title={item.nombre}
              category={item.categoria}
              value={`${number(item.totalRealizaciones)} veces`}
              detail={`${number(item.cantidadPuntos)} puntos`}
            />
          )}
        />

        <CompactList
          icon={Star}
          title="Mejor calificados"
          items={(dashboard?.topPuntosCalificados || []).slice(0, 3)}
          emptyText="Todavía no hay calificaciones."
          renderItem={(item) => (
            <PointRow
              key={item.puntoId}
              title={item.nombre}
              category={item.categoria}
              image={item.foto}
              value={`${number(item.promedioEstrellas)} estrellas`}
              detail={`${number(item.totalCalificaciones)} calificaciones`}
            />
          )}
        />
      </div>
    </section>
  );
}

function CompactList({ icon: Icon, title, items, emptyText, renderItem }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-uva">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-morado/15 text-morado">
          <Icon size={18} />
        </span>
        <h3 className="font-fredoka text-2xl leading-none">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? items.map(renderItem) : <EmptyText text={emptyText} />}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-morado/15 text-morado">
        <Icon size={21} />
      </span>
      <div>
        <h3 className="font-fredoka text-3xl leading-none text-uva">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-base font-extrabold leading-snug text-uva">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryBars({ items }) {
  const max = Math.max(...items.map((item) => Number(item.totalVisitas) || 0), 1);

  if (items.length === 0) {
    return <EmptyText text="Todavía no hay categorías con visitas." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const info = getCategoriaInfo(item.categoria);
        const width = `${Math.max((item.totalVisitas / max) * 100, 8)}%`;

        return (
          <div key={item.categoria}>
            <div className="mb-1 flex items-center justify-between gap-3 text-base">
              <span className="font-extrabold text-uva">{info.label}</span>
              <span className="font-extrabold text-uva">
                {number(item.totalVisitas)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-uva/10">
              <div
                className="h-full rounded-full"
                style={{ width, backgroundColor: info.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PointRow({ title, category, image, value, detail }) {
  const info = getCategoriaInfo(category);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-crema px-3 py-2">
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-uva"
          style={{ backgroundColor: info.color }}
        >
          <MapPinned size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-uva">{title}</p>
        <p className="truncate text-sm font-bold text-uva">{detail}</p>
      </div>
      <p className="shrink-0 text-right text-sm font-extrabold text-morado">
        {value}
      </p>
    </div>
  );
}

function RouteRow({ title, category, value, detail }) {
  const info = getRutaInfo(category);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-crema px-3 py-2">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-uva"
        style={{ backgroundColor: info.color }}
      >
        <Share2 size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-uva">{title}</p>
        <p className="truncate text-sm font-bold text-uva">
          {detail} - {info.label}
        </p>
      </div>
      <p className="shrink-0 text-right text-sm font-extrabold text-morado">
        {value}
      </p>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <p className="rounded-2xl bg-crema px-4 py-3 text-base font-bold text-uva">
      {text}
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-72 animate-pulse rounded-[30px] bg-white/80" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-80 animate-pulse rounded-[30px] bg-white/80" />
      </div>
      <div className="h-[360px] animate-pulse rounded-[30px] bg-white/80" />
    </div>
  );
}
