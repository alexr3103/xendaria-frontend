import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  MapPinned,
  ReceiptText,
  RefreshCw,
  Share2,
  ShoppingBasket,
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
      label: categoria || "Sin categoria",
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
  const ordenesPendientes = ordenesPagadas + ordenesProcesando;

  const prioridades = [
    {
      label: "Usuarios",
      value: resumen.usuarios,
      detail: "registrados",
      icon: Users,
      to: "/admin/usuarios",
      color: "bg-rosa/50",
    },
    {
      label: "Puntos activos",
      value: resumen.puntos?.activos,
      detail: `${number(resumen.puntos?.inactivos)} inactivos`,
      icon: MapPinned,
      to: "/admin/puntos",
      color: "bg-morado/20",
    },
    {
      label: "Visitas",
      value: resumen.visitas?.total,
      detail: `${number(dashboard?.actividadReciente?.visitas)} en 7 dias`,
      icon: TicketCheck,
      to: "/ranking",
      color: "bg-menta/45",
    },
    {
      label: "Rutas activas",
      value: resumen.rutas?.activas,
      detail: `${number(resumen.rutas?.pausadas)} pausadas`,
      icon: Share2,
      to: "/admin/rutas",
      color: "bg-celeste/55",
    },
  ];

  return (
    <AdminStyle title="Dashboard">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-uva">
              Panel general
            </p>
            <h2 className="font-fredoka text-3xl leading-none text-morado">
              Estado de Xendaria
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-bold text-uva">
              Compras, alertas y actividad para decidir que revisar primero.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarDashboard}
            disabled={loading}
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full bg-uva px-4 text-sm font-bold text-crema shadow-md transition hover:bg-uva/90 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading && !dashboard ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6">
              <OrdenesCompraPanel
                ordenesPendientes={ordenesPendientes}
                pagadas={ordenesPagadas}
                procesando={ordenesProcesando}
                enviadas={resumen.ordenes?.porEstado?.enviada}
                ingresos={resumen.ordenes?.ingresos}
                productosActivos={resumen.productos?.activos}
                productosSinStock={resumen.productos?.sinStock}
              />

              <PrioridadesPanel items={prioridades} />

              <MovimientoPanel dashboard={dashboard} resumen={resumen} />
            </div>

            <aside className="space-y-6">
              <AlertasAdminPanel items={dashboard?.alertas || []} />
              <DestacadosPanel dashboard={dashboard} />
            </aside>
          </div>
        )}
      </div>
    </AdminStyle>
  );
}

function OrdenesCompraPanel({
  ordenesPendientes,
  pagadas,
  procesando,
  enviadas,
  ingresos,
  productosActivos,
  productosSinStock,
}) {
  return (
    <section className="rounded-[28px] border border-uva/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <SectionTitle
              icon={ReceiptText}
              title="Ordenes de compra"
              subtitle="Prioridad administrativa del dia."
            />
            <Link
              to="/admin/merch"
              className="rounded-full bg-rosa px-3 py-1 text-xs font-extrabold text-uva transition hover:bg-rosa/80"
            >
              Abrir
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-uva">
                Pendientes de gestion
              </p>
              <p className="font-fredoka text-6xl leading-none text-morado">
                {number(ordenesPendientes)}
              </p>
            </div>
            <p className="max-w-sm pb-2 text-sm font-bold leading-snug text-uva">
              Ordenes pagadas o en preparacion que todavia necesitan seguimiento.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <CompraMini label="Ingresos" value={money(ingresos)} />
            <CompraMini label="Productos activos" value={number(productosActivos)} />
            <CompraMini label="Sin stock" value={number(productosSinStock)} tone="warning" />
          </div>
        </div>

        <div className="grid min-w-full gap-3 rounded-3xl bg-crema p-4 sm:grid-cols-3 lg:min-w-72 lg:grid-cols-1">
          <CompraEstado label="Pagadas" value={pagadas} color="bg-rosa" />
          <CompraEstado label="Procesando" value={procesando} color="bg-morado" />
          <CompraEstado label="Enviadas" value={enviadas} color="bg-menta" />
        </div>
      </div>
    </section>
  );
}

function CompraMini({ label, value, tone = "normal" }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${tone === "warning" ? "bg-vainilla" : "bg-crema"}`}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-uva">
        {label}
      </p>
      <p className="truncate font-extrabold text-uva">{value}</p>
    </div>
  );
}

function CompraEstado({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-extrabold text-uva">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-fredoka text-2xl leading-none text-morado">
        {number(value)}
      </span>
    </div>
  );
}

function AlertasAdminPanel({ items }) {
  const total = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

  return (
    <section className="rounded-[28px] border border-uva/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <SectionTitle
          icon={AlertTriangle}
          title="Alertas admin"
          subtitle="Pendientes importantes."
        />
        <span className="rounded-full bg-morado px-3 py-1 text-xs font-extrabold text-crema">
          {number(total)}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-menta px-4 py-2 text-sm font-extrabold text-uva">
          <CheckCircle2 size={18} />
          Todo esta ordenado
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.tipo}
              to={item.to}
              className="group block rounded-2xl bg-crema px-4 py-3 transition hover:bg-morado/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-uva">
                    {item.titulo}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-uva">
                    {item.descripcion}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-extrabold ${
                    item.variant === "warning"
                      ? "bg-vainilla text-uva"
                      : "bg-morado text-crema"
                  }`}
                >
                  {number(item.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PrioridadesPanel({ items }) {
  return (
    <section className="rounded-[28px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={BarChart3}
        title="Prioridades admin"
        subtitle="Estado general de usuarios, puntos, visitas y rutas."
      />
      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
      className="group flex min-w-0 items-center gap-3 rounded-2xl bg-crema px-4 py-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-uva ${color}`}
      >
        <Icon size={22} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold text-uva">
          {label}
        </span>
        <span className="block font-fredoka text-4xl leading-none text-morado">
          {number(value)}
        </span>
        <span className="block truncate text-xs font-extrabold text-uva">
          {detail}
        </span>
      </span>
    </Link>
  );
}

function MovimientoPanel({ dashboard, resumen }) {
  return (
    <section className="rounded-[28px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={BarChart3}
        title="Movimiento"
        subtitle="Actividad real de usuarios en la app."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MiniStat label="Visitas 7 dias" value={dashboard?.actividadReciente?.visitas} />
        <MiniStat
          label="Rutas hechas"
          value={dashboard?.actividadReciente?.rutasRealizadas}
        />
        <MiniStat
          label="Ratings nuevos"
          value={dashboard?.actividadReciente?.calificaciones}
        />
        <MiniStat label="Total ratings" value={resumen.calificaciones?.total} />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-fredoka text-2xl text-uva">
          Categorias mas visitadas
        </h3>
        <CategoryBars items={dashboard?.categoriasMasVisitadas || []} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-crema px-4 py-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-uva">
        {label}
      </p>
      <p className="font-fredoka text-3xl leading-none text-morado">
        {number(value)}
      </p>
    </div>
  );
}

function DestacadosPanel({ dashboard }) {
  return (
    <section className="rounded-[28px] border border-uva/10 bg-white p-5 shadow-sm">
      <SectionTitle
        icon={Star}
        title="Destacados"
        subtitle="Senales utiles para potenciar contenido."
      />

      <div className="mt-5 space-y-6">
        <CompactList
          icon={MapPinned}
          title="Puntos mas visitados"
          items={dashboard?.topPuntosVisitados || []}
          emptyText="Todavia no hay visitas registradas."
          renderItem={(item) => (
            <PointRow
              key={item.puntoId}
              title={item.nombre}
              category={item.categoria}
              image={item.foto}
              value={`${number(item.totalVisitas)} visitas`}
              detail={`Ultima: ${date(item.ultimaVisita)}`}
            />
          )}
        />

        <CompactList
          icon={Share2}
          title="Rutas mas hechas"
          items={dashboard?.topRutasRealizadas || []}
          emptyText="Todavia no hay rutas realizadas."
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
          items={dashboard?.topPuntosCalificados || []}
          emptyText="Todavia no hay calificaciones."
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
        <h3 className="font-fredoka text-xl leading-none">{title}</h3>
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
        <h3 className="font-fredoka text-2xl leading-none text-uva">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm font-bold text-uva">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function CategoryBars({ items }) {
  const max = Math.max(...items.map((item) => Number(item.totalVisitas) || 0), 1);

  if (items.length === 0) {
    return <EmptyText text="Todavia no hay categorias con visitas." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const info = getCategoriaInfo(item.categoria);
        const width = `${Math.max((item.totalVisitas / max) * 100, 8)}%`;

        return (
          <div key={item.categoria}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
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
        <p className="truncate font-extrabold text-uva">{title}</p>
        <p className="truncate text-xs font-bold text-uva">{detail}</p>
      </div>
      <p className="shrink-0 text-right text-xs font-extrabold text-morado">
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
        <p className="truncate font-extrabold text-uva">{title}</p>
        <p className="truncate text-xs font-bold text-uva">
          {detail} - {info.label}
        </p>
      </div>
      <p className="shrink-0 text-right text-xs font-extrabold text-morado">
        {value}
      </p>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <p className="rounded-2xl bg-crema px-4 py-3 text-sm font-bold text-uva">
      {text}
    </p>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-44 animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-80 animate-pulse rounded-[28px] bg-white/80" />
      </div>
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-96 animate-pulse rounded-[28px] bg-white/80" />
      </div>
    </div>
  );
}
