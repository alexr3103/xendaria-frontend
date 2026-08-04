import { createElement } from "react";
import { AlertTriangle, Check, Trash2, X } from "lucide-react";
import ModalXendaria from "./ModalXendaria.jsx";

export default function ModalConfirmacion({
  open,
  title = "Confirmar acción",
  message = "¿Querés continuar?",
  eyebrow = "Confirmación",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  danger = false,
  icon = AlertTriangle,
  confirmIcon: ConfirmIcon,
  cancelIcon: CancelIcon = X,
  onConfirm,
  onCancel,
}) {
  const IconoConfirmar = ConfirmIcon || (danger ? Trash2 : Check);

  return (
    <ModalXendaria
      open={open}
      onClose={onCancel}
      closeLabel={cancelText}
      maxWidth="max-w-md"
      header={
        <div className="bg-white px-5 pb-4 pt-5 sm:px-6">
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
              danger
                ? "bg-fucsia/10 text-fucsia"
                : "bg-morado/10 text-morado"
            }`}
          >
            {createElement(icon, { size: 22, "aria-hidden": true })}
          </span>
          <p className="mt-4 text-xs font-extrabold uppercase text-uva/55">
            {eyebrow}
          </p>
          <h2 className="font-fredoka text-2xl leading-tight text-uva sm:text-3xl">
            {title}
          </h2>
        </div>
      }
      contentClassName="bg-white px-5 pb-5 sm:px-6"
      footerClassName="border-t border-uva/10 bg-white px-5 py-4 sm:px-6"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-crema px-3 font-bold text-uva transition active:scale-[0.98]"
          >
            {CancelIcon && <CancelIcon size={17} aria-hidden="true" />}
            <span className="min-w-0 leading-tight">{cancelText}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-bold text-crema shadow-md transition active:scale-[0.98] ${
              danger ? "bg-fucsia" : "bg-morado"
            }`}
          >
            <IconoConfirmar size={17} aria-hidden="true" />
            <span className="min-w-0 leading-tight">{confirmText}</span>
          </button>
        </div>
      }
    >
      <p className="text-sm font-semibold leading-relaxed text-uva/75">
        {message}
      </p>
    </ModalXendaria>
  );
}
