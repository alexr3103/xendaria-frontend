import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, Trash2 } from "lucide-react";
import Alert from "./Alertas.jsx";
import ModalXendaria from "./ModalXendaria.jsx";

export default function ModalEliminarPunto({
  open,
  nombre = "este punto",
  loading = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setMostrarPassword(false);
    }
  }, [open]);

  function confirmar(event) {
    event.preventDefault();
    if (!password || loading) return;
    onConfirm?.(password);
  }

  return (
    <ModalXendaria
      open={open}
      onClose={loading ? undefined : onCancel}
      closeLabel="Cancelar eliminación"
      maxWidth="max-w-md"
      contentClassName="overflow-y-auto"
    >
      <form onSubmit={confirmar} className="px-5 py-6 sm:px-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fucsia/10 text-fucsia">
            <Trash2 size={22} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-fucsia">
              Acción irreversible
            </p>
            <h2 className="font-fredoka text-2xl text-uva">
              Eliminar punto
            </h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gris">
          Vas a eliminar definitivamente <strong>{nombre}</strong>. Si solo
          querés ocultarlo del mapa, cancelá y usá el control de activo o
          inactivo.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-gris">
          La insignia se conservará como histórica para no alterar los álbumes
          ni el ranking.
        </p>

        <label
          htmlFor="password-eliminar-punto"
          className="mt-5 block text-sm font-bold text-uva"
        >
          Contraseña de administrador
        </label>

        <div className="relative mt-2">
          <LockKeyhole
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-uva/65"
          />
          <input
            id="password-eliminar-punto"
            type={mostrarPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            disabled={loading}
            placeholder="Ingresá tu contraseña"
            className="w-full rounded-xl border border-uva/20 bg-white py-3 pl-10 pr-12 text-uva outline-none transition focus:border-morado focus:ring-2 focus:ring-morado/20 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((actual) => !actual)}
            disabled={loading}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-uva transition active:bg-uva/10 disabled:opacity-50"
          >
            {mostrarPassword ? (
              <Eye size={19} aria-hidden="true" />
            ) : (
              <EyeOff size={19} aria-hidden="true" />
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-uva/20 bg-white px-5 py-3 font-bold text-uva transition active:bg-uva/5 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!password || loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-fucsia px-5 py-3 font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={18} aria-hidden="true" />
            )}
            {loading ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
        </div>
      </form>
    </ModalXendaria>
  );
}
