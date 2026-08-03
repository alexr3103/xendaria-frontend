import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Loader2,
  PackageCheck,
  ShoppingBasket,
  Trash2,
  Trophy,
  UserPlus,
} from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";
import Alert from "./Alertas.jsx";
import { getMensajeError } from "../lib/errores.js";

const ICONOS_TIPO = {
  seguidor: UserPlus,
  ranking: Trophy,
  pedido: PackageCheck,
  pago: ShoppingBasket,
};

function formatearFecha(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BuzonNotificaciones({
  open,
  onClose,
  onNoLeidasChange,
}) {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const actualizarConteo = useCallback(
    (cantidad) => {
      setNoLeidas(cantidad);
      onNoLeidasChange?.(cantidad);
    },
    [onNoLeidasChange]
  );

  const cargarNotificaciones = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API}/api/notificaciones?limit=40`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "No se pudieron cargar las notificaciones."
        );
      }

      setNotificaciones(data.notificaciones || []);
      actualizarConteo(data.noLeidas || 0);
    } catch (error) {
      setMensaje({
        variant: "error",
        text:
          getMensajeError(error, "No se pudieron cargar las notificaciones."),
      });
    } finally {
      setLoading(false);
    }
  }, [API, actualizarConteo, token]);

  useEffect(() => {
    if (open) cargarNotificaciones();
  }, [cargarNotificaciones, open]);

  async function marcarLeida(notificacion) {
    if (notificacion.leida) return true;

    const res = await fetch(
      `${API}/api/notificaciones/${notificacion._id}/leida`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) return false;

    setNotificaciones((actuales) =>
      actuales.map((item) =>
        item._id === notificacion._id ? { ...item, leida: true } : item
      )
    );
    actualizarConteo(Math.max(noLeidas - 1, 0));
    return true;
  }

  async function abrirNotificacion(notificacion) {
    await marcarLeida(notificacion);
    onClose();
    navigate(notificacion.enlace || "/");
  }

  async function marcarTodas() {
    const res = await fetch(`${API}/api/notificaciones/leer-todas`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    setNotificaciones((actuales) =>
      actuales.map((item) => ({ ...item, leida: true }))
    );
    actualizarConteo(0);
  }

  async function eliminarNotificacion(event, notificacion) {
    event.stopPropagation();

    const res = await fetch(
      `${API}/api/notificaciones/${notificacion._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) return;

    setNotificaciones((actuales) =>
      actuales.filter((item) => item._id !== notificacion._id)
    );
    if (!notificacion.leida) {
      actualizarConteo(Math.max(noLeidas - 1, 0));
    }
  }

  async function borrarLeidas() {
    const res = await fetch(`${API}/api/notificaciones/leidas`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;
    setNotificaciones((actuales) => actuales.filter((item) => !item.leida));
  }

  return (
    <ModalXendaria
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      className="bg-white"
      headerClassName="rounded-t-3xl bg-uva px-5 py-5 text-crema"
      contentClassName="bg-white"
      closeLabel="Cerrar notificaciones"
      header={
        <div className="flex items-center gap-3 pr-9">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crema text-uva">
            <Bell size={21} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase text-crema/70">
              Novedades
            </p>
            <h2 className="font-fredoka text-2xl font-medium">
              Notificaciones
            </h2>
          </div>
        </div>
      }
    >
      <div className="flex max-h-[68vh] min-h-72 flex-col">
        {notificaciones.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-uva/10 px-4 py-3">
            <p className="text-sm font-semibold text-uva/65">
              {noLeidas > 0
                ? `${noLeidas} sin leer`
                : "Estás al día"}
            </p>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-morado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morado"
                >
                  <CheckCheck size={16} />
                  Leer todas
                </button>
              )}
              {notificaciones.some((item) => item.leida) && (
                <button
                  type="button"
                  onClick={borrarLeidas}
                  className="rounded-lg px-2 py-2 text-xs font-bold text-uva/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uva"
                >
                  Borrar leidas
                </button>
              )}
            </div>
          </div>
        )}

        {mensaje && (
          <div className="p-4">
            <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 px-5 py-12 text-uva">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-semibold">Cargando notificaciones</span>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-morado/10 text-morado">
              <Bell size={26} />
            </span>
            <p className="mt-4 font-fredoka text-xl font-medium text-uva">
              Todavía no hay novedades
            </p>
            <p className="mt-1 max-w-xs text-sm font-semibold text-uva/60">
              Cuando alguien te siga, cambie tu pedido o subas en el ranking,
              va a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {notificaciones.map((notificacion) => {
              const Icono = ICONOS_TIPO[notificacion.tipo] || Bell;

              return (
                <div
                  key={notificacion._id}
                  className={`group flex w-full items-start gap-3 border-b border-uva/10 px-4 py-4 text-left ${
                    notificacion.leida ? "bg-white" : "bg-morado/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => abrirNotificacion(notificacion)}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morado"
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        notificacion.leida
                          ? "bg-crema text-uva/60"
                          : "bg-morado/15 text-morado"
                      }`}
                    >
                      <Icono size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-uva">
                        {notificacion.titulo}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium leading-5 text-uva/70">
                        {notificacion.mensaje}
                      </span>
                      <span className="mt-1.5 block text-xs font-semibold text-uva/45">
                        {formatearFecha(notificacion.createdAt)}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(event) =>
                      eliminarNotificacion(event, notificacion)
                    }
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rosa transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosa"
                    title="Eliminar notificacion"
                    aria-label={`Eliminar ${notificacion.titulo}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalXendaria>
  );
}
