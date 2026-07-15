export default function ConfirmModal({
  open,
  title = "Confirmar accion",
  message = "Queres continuar?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-uva/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-uva/10 bg-crema p-6 shadow-2xl">
        <h3 className="mb-2 font-fredoka text-2xl text-uva">{title}</h3>

        <p className="mb-6 text-sm leading-relaxed text-uva/80">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-uva/20 bg-white px-4 py-2.5 font-semibold text-uva transition hover:bg-white/70"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 font-semibold text-crema transition ${
              danger
                ? "bg-fucsia hover:bg-fucsia/80"
                : "bg-morado hover:bg-morado/80"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
