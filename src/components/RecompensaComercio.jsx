import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Gift,
  Loader2,
  LockKeyhole,
  Store,
  TicketCheck,
} from "lucide-react";

import Alert from "./Alertas.jsx";
import BotonCerrar from "./BotonCerrar.jsx";
import ModalConfirmacion from "./ModalConfirmacion.jsx";

function formatearFecha(value) {
  if (!value) return "";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}

function formatearFechaHora(value) {
  if (!value) return "";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}

function horaEnVivo(value) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(value);
}

export default function RecompensaComercio({
  idPunto,
  preview = false,
  recompensaPreview = null,
}) {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const [recompensa, setRecompensa] = useState(
    preview && recompensaPreview?.beneficio
      ? { ...recompensaPreview, estado: "disponible" }
      : null
  );
  const [cargando, setCargando] = useState(!preview);
  const [canjeando, setCanjeando] = useState(false);
  const [confirmarCanje, setConfirmarCanje] = useState(false);
  const [recompensaAbierta, setRecompensaAbierta] = useState(null);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(new Date());
  const canjeEnCursoRef = useRef(false);

  useEffect(() => {
    if (preview || !idPunto || !token) {
      setCargando(false);
      return undefined;
    }

    let activo = true;

    fetch(`${API}/api/comercios/recompensas/puntos/${idPunto}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(data?.message || "No se pudo consultar la recompensa");
        }
        return data;
      })
      .then((data) => {
        if (activo) setRecompensa(data);
      })
      .catch((fetchError) => {
        if (activo) setError(fetchError.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [API, idPunto, preview, token]);

  useEffect(() => {
    if (!recompensaAbierta) return undefined;

    const intervalo = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(intervalo);
  }, [recompensaAbierta]);

  async function abrirRecompensa() {
    if (preview || canjeEnCursoRef.current) return;

    canjeEnCursoRef.current = true;
    setCanjeando(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/comercios/recompensas/puntos/${idPunto}/canjear`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo abrir la recompensa");
      }

      setRecompensaAbierta(data.recompensa);
      setRecompensa((actual) => ({
        ...actual,
        estado: "canjeada",
        canjeadaEn: data.recompensa.canjeadaEn,
      }));
      setAhora(new Date());
      setConfirmarCanje(false);
    } catch (canjeError) {
      setConfirmarCanje(false);
      setError(canjeError.message);
    } finally {
      canjeEnCursoRef.current = false;
      setCanjeando(false);
    }
  }

  function cerrarRecompensa() {
    setRecompensaAbierta(null);
  }

  if (cargando) {
    return (
      <section className="mb-8 flex items-center gap-3 rounded-2xl bg-vainilla/55 px-4 py-4 text-uva">
        <Loader2 size={20} className="animate-spin text-morado" />
        <p className="text-sm font-bold">Consultando recompensa...</p>
      </section>
    );
  }

  if (!recompensa || recompensa.estado === "inactiva") return null;

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-3xl border border-vainilla bg-vainilla/55 shadow-sm">
        <div className="flex items-start gap-3 px-5 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-crema text-uva shadow-sm">
            <Gift size={22} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase text-uva/60">
              Beneficio por primera visita
            </p>
            <h2 className="mt-1 font-fredoka text-xl leading-tight text-uva">
              {recompensa.beneficio}
            </h2>
            {recompensa.venceEn && (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-uva/70">
                <CalendarClock size={16} />
                Disponible hasta el {formatearFecha(recompensa.venceEn)}
              </p>
            )}
          </div>
        </div>

        <EstadoRecompensa
          estado={recompensa.estado}
          preview={preview}
          onAbrir={() => setConfirmarCanje(true)}
        />

        {error && (
          <div className="px-5 pb-5">
            <Alert>{error}</Alert>
          </div>
        )}
      </section>

      <ModalConfirmacion
        open={confirmarCanje}
        title="¿Estás frente al cajero?"
        message="Esta recompensa se puede abrir una sola vez. Abrila únicamente frente al cajero o empleado y mostrale el código desde la pantalla. Cuando cierres el modal no vas a poder verlo nuevamente."
        confirmText={canjeando ? "Abriendo..." : "Abrir recompensa"}
        cancelText="Todavía no"
        onConfirm={abrirRecompensa}
        onCancel={() => !canjeando && setConfirmarCanje(false)}
      />

      {recompensaAbierta && (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center overflow-x-hidden bg-uva/45 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[32px] border border-uva/10 bg-crema px-5 pb-6 pt-8 shadow-2xl">
            <div className="absolute right-0 top-0 translate-x-[18%] -translate-y-[18%]">
              <BotonCerrar
                onClick={cerrarRecompensa}
                ariaLabel="Cerrar recompensa definitivamente"
              />
            </div>

            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-menta text-uva shadow-md">
                <TicketCheck size={32} />
              </span>
              <p className="mt-4 text-sm font-extrabold uppercase text-morado">
                Recompensa canjeada
              </p>
              <h2 className="mt-1 font-fredoka text-2xl text-uva">
                Mostrale este código al cajero
              </h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-uva/75">
                No cierres esta pantalla hasta que el empleado lo haya visto.
              </p>
            </div>

            <div className="my-6 rounded-3xl border-2 border-dashed border-morado/45 bg-white px-4 py-6 text-center">
              <p className="break-all font-fredoka text-3xl text-morado sm:text-4xl">
                {recompensaAbierta.codigo}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-menta/35 px-4 py-4 text-uva">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Store size={18} className="shrink-0" />
                {recompensaAbierta.beneficio}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 size={18} className="shrink-0 text-morado" />
                Abierta el {formatearFechaHora(recompensaAbierta.canjeadaEn)}
              </p>
              <p className="flex items-center gap-2 text-sm font-extrabold">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fucsia opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-fucsia" />
                </span>
                Pantalla activa · {horaEnVivo(ahora)}
              </p>
            </div>

            <Alert variant="info">
              Cuando cierres este modal, el código no podrá abrirse nuevamente.
            </Alert>

            <button
              type="button"
              onClick={cerrarRecompensa}
              className="mt-5 w-full rounded-2xl bg-rosa px-4 py-3 font-extrabold text-uva shadow-md active:scale-[0.98]"
            >
              El código ya fue mostrado
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function EstadoRecompensa({ estado, preview, onAbrir }) {
  if (estado === "bloqueada") {
    return (
      <div className="flex items-center gap-3 border-t border-uva/10 bg-white/45 px-5 py-4 text-uva/75">
        <LockKeyhole size={20} className="shrink-0" />
        <p className="text-sm font-bold">
          Visitá el comercio para desbloquear esta recompensa.
        </p>
      </div>
    );
  }

  if (estado === "vencida") {
    return (
      <p className="border-t border-uva/10 bg-white/45 px-5 py-4 text-sm font-bold text-uva/60">
        Esta recompensa se encuentra vencida.
      </p>
    );
  }

  if (estado === "canjeada") {
    return (
      <div className="flex items-center gap-3 border-t border-uva/10 bg-menta/35 px-5 py-4 text-uva">
        <CheckCircle2 size={20} className="shrink-0" />
        <p className="text-sm font-bold">
          Esta recompensa ya fue abierta y no puede mostrarse nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-uva/10 px-5 py-4">
      <button
        type="button"
        disabled={preview}
        onClick={onAbrir}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rosa px-4 py-3 font-extrabold text-uva shadow-md transition active:scale-[0.98] disabled:cursor-default"
      >
        <TicketCheck size={20} />
        {preview ? "Recompensa disponible" : "Canjear beneficio"}
      </button>
    </div>
  );
}
