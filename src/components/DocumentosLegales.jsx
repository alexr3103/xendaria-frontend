import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";

export const VERSION_TERMINOS = "2026-07-30";

export default function DocumentosLegales({
  open,
  onClose,
  onAccept,
  accepting = false,
}) {
  const [aceptados, setAceptados] = useState(false);

  useEffect(() => {
    if (open) setAceptados(false);
  }, [open]);

  const footer = onAccept ? (
    <div className="grid gap-3">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-uva">
        <input
          type="checkbox"
          checked={aceptados}
          onChange={(event) => setAceptados(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-morado"
        />
        <span>
          Leí y acepto los términos y condiciones y la política de privacidad.
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={accepting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rosa px-3 font-bold text-uva transition active:scale-[0.98] disabled:opacity-50"
        >
          <X size={17} aria-hidden="true" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={!aceptados || accepting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-morado px-3 font-bold text-crema shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {accepting ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={17} aria-hidden="true" />
          )}
          {accepting ? "Creando cuenta..." : "Aceptar y continuar"}
        </button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-morado px-4 font-bold text-crema shadow-sm transition active:scale-[0.98]"
    >
      <Check size={17} aria-hidden="true" />
      Entendido
    </button>
  );

  return (
    <ModalXendaria
      open={open}
      onClose={accepting ? undefined : onClose}
      closeLabel="Cerrar documentos legales"
      maxWidth="max-w-xl"
      className="border-morado/20 bg-white"
      contentClassName="px-5 pb-5 pt-6 sm:px-7"
      footer={footer}
      footerClassName="border-t border-uva/10 bg-white px-5 py-4 sm:px-7"
    >
      <header className="flex items-start gap-3 border-b border-uva/10 pb-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-morado/10 text-morado">
          <ShieldCheck aria-hidden="true" size={24} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-uva/60">
            Versión {VERSION_TERMINOS}
          </p>
          <h2 className="font-fredoka text-2xl font-semibold text-uva">
            Términos y privacidad
          </h2>
        </div>
      </header>

      <div className="divide-y divide-uva/10 text-sm leading-relaxed text-uva/80">
        <section className="py-5">
          <h3 className="font-fredoka text-xl font-semibold text-uva">
            Términos y condiciones
          </h3>
          <ul className="mt-3 grid gap-2">
            <li>
              Xendaria permite explorar puntos, rutas, historias, recompensas y
              productos vinculados con recorridos urbanos.
            </li>
            <li>
              Cada persona es responsable de mantener segura su cuenta y de
              aportar información respetuosa al crear puntos propios.
            </li>
            <li>
              Las rutas y referencias del mapa son orientativas. Al caminar,
              respetá las normas viales, los horarios y las condiciones reales
              del lugar.
            </li>
            <li>
              Las compras se procesan mediante MercadoPago. Los beneficios de
              comercios pueden tener vigencia y condiciones particulares.
            </li>
            <li>
              Xendaria puede ocultar contenido o desactivar cuentas ante usos
              abusivos, fraudulentos o contrarios a estas condiciones.
            </li>
          </ul>
        </section>

        <section className="py-5">
          <h3 className="font-fredoka text-xl font-semibold text-uva">
            Política de privacidad
          </h3>
          <ul className="mt-3 grid gap-2">
            <li>
              Guardamos los datos necesarios para tu cuenta, perfil, visitas,
              insignias, favoritos, rutas, calificaciones y compras.
            </li>
            <li>
              La ubicación se usa cuando la autorizás para mostrar lugares
              cercanos y verificar acciones que requieren presencia. Xendaria
              no guarda un recorrido continuo de tus movimientos.
            </li>
            <li>
              Podés controlar la visibilidad de tu perfil, actividad, visitas,
              insignias y preferencias desde Configuración.
            </li>
            <li>
              Para prestar el servicio usamos proveedores como Google,
              Mapbox, Cloudinary, MercadoPago y servicios de correo. Xendaria
              no almacena los datos completos de tu tarjeta.
            </li>
            <li>
              Podés solicitar acceso, corrección o eliminación de tus datos
              escribiendo a xendariaoficial@gmail.com.
            </li>
            <li>
              La Agencia de Acceso a la Información Pública es la autoridad de
              control en Argentina y recibe reclamos vinculados con datos
              personales.
            </li>
          </ul>
        </section>
      </div>
    </ModalXendaria>
  );
}
