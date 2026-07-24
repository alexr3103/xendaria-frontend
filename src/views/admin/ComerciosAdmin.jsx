import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  MapPin,
  MessageCircleMore,
  Phone,
  Store,
  XCircle,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import BuscadorAdmin from "../../components/BuscadorAdmin.jsx";
import PestanasAdmin from "../../components/PestanasAdmin.jsx";

const API = import.meta.env.VITE_API_URL;

const ESTADOS = {
  pendiente: {
    label: "Pendiente",
    className: "bg-vainilla text-uva",
    icon: Clock3,
  },
  contactado: {
    label: "Contactado",
    className: "bg-celeste/55 text-uva",
    icon: MessageCircleMore,
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-menta/45 text-uva",
    icon: CheckCircle2,
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-fucsia/10 text-fucsia",
    icon: XCircle,
  },
};

const TIPOS_BENEFICIO = {
  descuento: "Descuento porcentual",
  cortesia: "Producto o consumición de cortesía",
  primera_visita: "Beneficio por primera visita",
  ruta: "Beneficio al completar una ruta",
  otro: "Otro beneficio",
};

function formatearFecha(fecha) {
  if (!fecha) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
}

function normalizarBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ComerciosAdmin() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [solicitudAbierta, setSolicitudAbierta] = useState(null);
  const [actualizando, setActualizando] = useState(null);

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/comercios/solicitudes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar las solicitudes");
      }

      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cantidades = useMemo(() => {
    return solicitudes.reduce(
      (resultado, solicitud) => {
        resultado.todos += 1;
        if (resultado[solicitud.estado] !== undefined) {
          resultado[solicitud.estado] += 1;
        }
        return resultado;
      },
      {
        todos: 0,
        pendiente: 0,
        contactado: 0,
        aprobado: 0,
        rechazado: 0,
      }
    );
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    const termino = normalizarBusqueda(busqueda);

    return solicitudes.filter((solicitud) => {
      const coincideEstado =
        filtroEstado === "todos" || solicitud.estado === filtroEstado;
      const texto = normalizarBusqueda(
        [
          solicitud.nombreComercio,
          solicitud.rubro,
          solicitud.email,
          solicitud.direccion,
        ].join(" ")
      );

      return coincideEstado && (!termino || texto.includes(termino));
    });
  }, [busqueda, filtroEstado, solicitudes]);

  async function cambiarEstado(idSolicitud, estado) {
    try {
      setActualizando(idSolicitud);
      setMensaje(null);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API}/api/comercios/solicitudes/${idSolicitud}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar la solicitud");
      }

      setSolicitudes((actuales) =>
        actuales.map((solicitud) =>
          solicitud._id === idSolicitud ? data.solicitud : solicitud
        )
      );
      setMensaje({
        variant: "success",
        text: "Estado de la solicitud actualizado.",
      });
    } catch (err) {
      setMensaje({ variant: "error", text: err.message });
    } finally {
      setActualizando(null);
    }
  }

  return (
    <AdminStyle title="Comercios">
      <section>
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-morado/10 text-morado">
            <Store size={22} />
          </span>
          <div>
            <h2 className="font-fredoka text-2xl text-uva">
              Solicitudes comerciales
            </h2>
            <p className="mt-1 max-w-3xl font-semibold text-gris">
              Revisá los comercios que completaron el formulario de la landing y
              registrá el avance de cada contacto.
            </p>
          </div>
        </div>

        {mensaje && (
          <div className="mb-5 max-w-3xl">
            <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-4">
          <PestanasAdmin
            tabs={[
              {
                key: "todos",
                label: "Todas",
                count: cantidades.todos,
                active: filtroEstado === "todos",
                onClick: () => setFiltroEstado("todos"),
              },
              ...Object.entries(ESTADOS).map(([key, estado]) => ({
                key,
                label: estado.label,
                icon: estado.icon,
                count: cantidades[key],
                active: filtroEstado === key,
                onClick: () => setFiltroEstado(key),
              })),
            ]}
          />

          <BuscadorAdmin
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar comercio"
            className="w-full sm:max-w-[360px]"
          />
        </div>

        {cargando && (
          <p className="py-10 text-center text-lg font-bold text-morado">
            Cargando solicitudes...
          </p>
        )}

        {error && (
          <div className="max-w-3xl">
            <Alert>{error}</Alert>
          </div>
        )}

        {!cargando && !error && (
          <div className="overflow-hidden border-y border-uva/10">
            {solicitudesFiltradas.map((solicitud) => {
              const estado = ESTADOS[solicitud.estado] || ESTADOS.pendiente;
              const EstadoIcon = estado.icon;
              const abierta = solicitudAbierta === solicitud._id;

              return (
                <article
                  key={solicitud._id}
                  className="border-b border-uva/10 bg-white last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSolicitudAbierta(abierta ? null : solicitud._id)
                    }
                    className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-crema/45 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto_auto] sm:items-center"
                    aria-expanded={abierta}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-base text-uva">
                        {solicitud.nombreComercio}
                      </strong>
                      <span className="mt-1 block text-sm font-semibold text-gris">
                        {solicitud.rubro} · {solicitud.plan}
                      </span>
                    </span>

                    <span className="min-w-0 text-sm font-semibold text-gris">
                      <span className="block truncate">{solicitud.email}</span>
                      <span className="block sm:hidden">
                        {formatearFecha(solicitud.createdAt)}
                      </span>
                    </span>

                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${estado.className}`}
                    >
                      <EstadoIcon size={14} />
                      {estado.label}
                    </span>

                    <span className="hidden items-center gap-3 sm:flex">
                      <span className="text-sm font-bold text-uva/55">
                        {formatearFecha(solicitud.createdAt)}
                      </span>
                      <Eye size={19} className="text-morado" />
                    </span>
                  </button>

                  {abierta && (
                    <DetalleSolicitud
                      solicitud={solicitud}
                      actualizando={actualizando === solicitud._id}
                      onEstadoChange={(nuevoEstado) =>
                        cambiarEstado(solicitud._id, nuevoEstado)
                      }
                    />
                  )}
                </article>
              );
            })}

            {solicitudesFiltradas.length === 0 && (
              <div className="bg-white px-5 py-12 text-center">
                <Store className="mx-auto mb-3 text-morado/45" size={34} />
                <p className="font-bold text-uva">
                  No hay solicitudes con esos filtros.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </AdminStyle>
  );
}

function DetalleSolicitud({ solicitud, actualizando, onEstadoChange }) {
  return (
    <div className="border-t border-uva/10 bg-crema/40 px-4 py-5">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.65fr)]">
        <div className="grid gap-5 md:grid-cols-2">
          <BloqueDetalle titulo="Contacto">
            <p className="flex items-start gap-2">
              <Mail size={17} className="mt-0.5 shrink-0 text-morado" />
              <a className="break-all font-bold text-uva" href={`mailto:${solicitud.email}`}>
                {solicitud.email}
              </a>
            </p>
            <p className="flex items-start gap-2">
              <Phone size={17} className="mt-0.5 shrink-0 text-morado" />
              <a className="font-bold text-uva" href={`tel:${solicitud.telefono}`}>
                {solicitud.telefono}
              </a>
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={17} className="mt-0.5 shrink-0 text-morado" />
              <span>{solicitud.direccion}</span>
            </p>
            {solicitud.redes && <p>{solicitud.redes}</p>}
          </BloqueDetalle>

          <BloqueDetalle titulo="Beneficio propuesto">
            <p className="font-extrabold text-uva">
              {TIPOS_BENEFICIO[solicitud.tipoBeneficio] ||
                solicitud.tipoBeneficio}
            </p>
            <p>{solicitud.beneficio}</p>
          </BloqueDetalle>

          <BloqueDetalle titulo="Historia o leyenda">
            <p>{solicitud.historia || "No agregó contenido opcional."}</p>
          </BloqueDetalle>

          <BloqueDetalle titulo="Insignia">
            <p className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-morado" />
              {solicitud.quiereInsignia
                ? "Quiere sumar una insignia."
                : "No solicitó insignia."}
            </p>
            {solicitud.asociarHistoriaInsignia && (
              <p>La historia debe quedar asociada a la insignia.</p>
            )}
          </BloqueDetalle>
        </div>

        <div>
          <h3 className="mb-3 font-fredoka text-xl text-uva">
            Estado del contacto
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ESTADOS).map(([key, estado]) => {
              const Icon = estado.icon;
              const activo = solicitud.estado === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={actualizando || activo}
                  onClick={() => onEstadoChange(key)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold transition disabled:cursor-default ${
                    activo
                      ? `${estado.className} border-uva/10 shadow-sm`
                      : "border-uva/10 bg-white text-uva hover:border-morado/40"
                  }`}
                >
                  <Icon size={16} />
                  {estado.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BloqueDetalle({ titulo, children }) {
  return (
    <div>
      <h3 className="mb-2 font-fredoka text-lg text-uva">{titulo}</h3>
      <div className="grid gap-2 text-sm font-semibold leading-relaxed text-gris">
        {children}
      </div>
    </div>
  );
}
