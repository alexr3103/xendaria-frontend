import { CalendarDays, Gift, Info, TicketCheck } from "lucide-react";

import Alert from "./Alertas.jsx";
import {
  CampoAdmin,
  SeccionPlanaAdmin,
  claseInputAdmin,
} from "./EditorAdmin.jsx";
import InterruptorActivoAdmin from "./InterruptorActivoAdmin.jsx";
import { normalizarRecompensaComercio } from "../lib/recompensaComercio.js";

export default function RecompensaComercioAdmin({ value, onChange }) {
  const recompensa = normalizarRecompensaComercio(value);

  function actualizar(campo, nuevoValor) {
    onChange?.({ ...recompensa, [campo]: nuevoValor });
  }

  return (
    <SeccionPlanaAdmin
      title="Recompensa por primera visita"
      description="Beneficio de un solo uso para este comercio."
      icon={Gift}
    >
      <Alert variant="info">
        <span className="flex items-start gap-2">
          <Info size={18} className="mt-0.5 shrink-0" />
          <span>
            El código se muestra una sola vez al usuario. El envío del código al
            comercio se realiza manualmente.
          </span>
        </span>
      </Alert>

      <CampoAdmin label="Beneficio para el usuario">
        <textarea
          className={`${claseInputAdmin} min-h-24 resize-y`}
          maxLength={180}
          placeholder="Ej: 10% de descuento en la primera compra"
          value={recompensa.beneficio}
          onChange={(event) => actualizar("beneficio", event.target.value)}
        />
      </CampoAdmin>

      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <CampoAdmin label="Código que mostrará el usuario">
          <div className="relative">
            <TicketCheck
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-morado"
            />
            <input
              className={`${claseInputAdmin} pl-12 font-bold uppercase`}
              maxLength={60}
              placeholder="Ej: GUAYOYO10"
              value={recompensa.codigo}
              onChange={(event) => actualizar("codigo", event.target.value)}
            />
          </div>
        </CampoAdmin>

        <CampoAdmin label="Vigente hasta">
          <div className="relative">
            <CalendarDays
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-morado"
            />
            <input
              type="date"
              className={`${claseInputAdmin} pl-12`}
              value={recompensa.venceEn}
              onChange={(event) => actualizar("venceEn", event.target.value)}
            />
          </div>
        </CampoAdmin>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(220px,320px)_auto] sm:items-center">
        <InterruptorActivoAdmin
          active={recompensa.activa}
          activeLabel="Recompensa activa"
          inactiveLabel="Recompensa inactiva"
          onClick={() => actualizar("activa", !recompensa.activa)}
        />

        {recompensa.totalCanjes > 0 && (
          <p className="text-sm font-bold text-uva/70">
            {recompensa.totalCanjes}{" "}
            {recompensa.totalCanjes === 1 ? "canje realizado" : "canjes realizados"}
          </p>
        )}
      </div>
    </SeccionPlanaAdmin>
  );
}
