import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Crown,
  Gift,
  Globe2,
  Heart,
  KeyRound,
  LocateFixed,
  Loader2,
  MapPin,
  MapPinned,
  Medal,
  Rotate3D,
  Save,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import Alert from "../../components/Alertas.jsx";
import ModalXendaria from "../../components/ModalXendaria.jsx";
import TextField from "../../components/Textfield.jsx";
import { normalizarConfiguracionUsuario } from "../../lib/configuracionUsuario.js";

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

async function getErrorMessage(res, fallback = "No se pudo guardar la configuración") {
  try {
    const data = await res.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function Configuraciones() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const usuarioLS = useMemo(getUsuarioLocal, []);
  const token = localStorage.getItem("token");
  const usuarioId = usuarioLS?.id || usuarioLS?._id;

  const [configuracion, setConfiguracion] = useState(normalizarConfiguracionUsuario());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [borrandoHistorial, setBorrandoHistorial] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [confirmarUbicacion, setConfirmarUbicacion] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [modalPassword, setModalPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNueva: "",
    passwordConfirm: "",
  });
  const [passwordMensaje, setPasswordMensaje] = useState(null);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarConfiguracion() {
      if (!token || !usuarioId) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API}/api/usuarios/${usuarioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          navigate("/404", { replace: true });
          return;
        }

        if (!res.ok) throw new Error("No se pudo cargar la configuración");

        const data = await res.json();
        if (!activo) return;

        setConfiguracion(normalizarConfiguracionUsuario(data.configuracion));
      } catch (error) {
        if (activo) {
          setMensaje({
            variant: "error",
            text: error.message || "No se pudo cargar la configuración",
          });
        }
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargarConfiguracion();

    return () => {
      activo = false;
    };
  }, [API, navigate, token, usuarioId]);

  function toggleConfig(key) {
    setConfiguracion((actual) => ({
      ...actual,
      [key]: !actual[key],
    }));
  }

  function toggleUbicacion() {
    if (configuracion.permitirUbicacion) {
      setConfirmarUbicacion(true);
      return;
    }

    setConfirmarUbicacion(false);
    setConfiguracion((actual) => ({
      ...actual,
      permitirUbicacion: true,
    }));
  }

  function desactivarUbicacion() {
    setConfiguracion((actual) => ({
      ...actual,
      permitirUbicacion: false,
    }));
    setConfirmarUbicacion(false);
  }

  function toggleNotificacion(key) {
    setConfiguracion((actual) => ({
      ...actual,
      notificaciones: {
        ...actual.notificaciones,
        [key]: !actual.notificaciones?.[key],
      },
    }));
  }

  function abrirModalPassword() {
    setPasswordForm({
      passwordActual: "",
      passwordNueva: "",
      passwordConfirm: "",
    });
    setPasswordMensaje(null);
    setModalPassword(true);
  }

  function cerrarModalPassword() {
    if (cambiandoPassword) return;
    setModalPassword(false);
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((actual) => ({ ...actual, [name]: value }));
  }

  function validarPasswordForm() {
    if (
      !passwordForm.passwordActual ||
      !passwordForm.passwordNueva ||
      !passwordForm.passwordConfirm
    ) {
      return "Completá todos los campos de contraseña.";
    }

    if (passwordForm.passwordNueva !== passwordForm.passwordConfirm) {
      return "Las contraseñas nuevas deben coincidir.";
    }

    if (passwordForm.passwordNueva.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!/[0-9]/.test(passwordForm.passwordNueva)) {
      return "La contraseña debe tener al menos un número.";
    }

    if (!/[A-Z]/.test(passwordForm.passwordNueva)) {
      return "La contraseña debe tener al menos una mayúscula.";
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(passwordForm.passwordNueva)) {
      return "La contraseña debe tener al menos un caracter especial.";
    }

    return "";
  }

  async function guardarPassword(event) {
    event.preventDefault();

    const errorValidacion = validarPasswordForm();
    if (errorValidacion) {
      setPasswordMensaje({ variant: "error", text: errorValidacion });
      return;
    }

    setCambiandoPassword(true);
    setPasswordMensaje(null);

    try {
      const res = await fetch(`${API}/api/usuarios/${usuarioId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "No se pudo cambiar la contraseña"));
      }

      const data = await res.json();
      setPasswordForm({
        passwordActual: "",
        passwordNueva: "",
        passwordConfirm: "",
      });
      setPasswordMensaje({
        variant: "success",
        text: data.message || "Contraseña actualizada correctamente.",
      });
    } catch (error) {
      setPasswordMensaje({
        variant: "error",
        text: error.message || "No se pudo cambiar la contraseña.",
      });
    } finally {
      setCambiandoPassword(false);
    }
  }

  function actualizarStorage(usuarioActualizado) {
    const usuarioAnterior = getUsuarioLocal() || {};

    localStorage.setItem(
      "usuario",
      JSON.stringify({
        ...usuarioAnterior,
        ...usuarioActualizado,
        id: usuarioActualizado._id || usuarioActualizado.id || usuarioId,
        token: usuarioAnterior.token,
      })
    );
    window.dispatchEvent(new Event("xendaria:configuracion-actualizada"));
  }

  async function guardarConfiguracion(event) {
    event.preventDefault();
    setSaving(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API}/api/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          configuracion,
        }),
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) throw new Error(await getErrorMessage(res));

      const data = await res.json();
      const usuarioActualizado = data.usuario || {};
      actualizarStorage(usuarioActualizado);
      setConfiguracion(normalizarConfiguracionUsuario(usuarioActualizado.configuracion));
      setMensaje({ variant: "success", text: "Configuración guardada correctamente." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo guardar la configuración.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  async function borrarHistorial() {
    setBorrandoHistorial(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API}/api/usuarios/${usuarioId}/visitados`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "No se pudo borrar el historial"));
      }

      const data = await res.json();
      const usuarioAnterior = getUsuarioLocal() || {};
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          ...usuarioAnterior,
          puntos_visitados: [],
        })
      );
      window.dispatchEvent(new Event("xendaria:configuracion-actualizada"));

      setConfirmarBorrado(false);
      setMensaje({
        variant: "success",
        text: data.message || "Historial de visitas borrado correctamente.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo borrar el historial.",
      });
    } finally {
      setBorrandoHistorial(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      <main className="mx-auto w-full max-w-xl px-4 pt-8">
        <section className="relative rounded-3xl border border-uva/10 bg-white px-5 pb-6 pt-6 shadow-lg">
          <div className="absolute right-0 top-0 z-20 translate-x-[30%] -translate-y-[30%] sm:translate-x-1/2 sm:-translate-y-1/2">
            <BotonCerrar onClick={() => navigate("/perfil")} />
          </div>

          <div className="pr-12">
            <p className="text-xs font-bold uppercase tracking-wide text-uva/45">
              Perfil
            </p>
            <h1 className="font-fredoka text-3xl leading-none text-morado">
              Configuraciones
            </h1>
            <p className="mt-2 text-sm font-semibold text-uva/65">
              Ajustá privacidad, mapa y avisos de tu experiencia.
            </p>
          </div>

          {mensaje && (
            <div className="mt-5">
              <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-crema px-4 py-5 text-uva">
              <Loader2 className="animate-spin" size={20} />
              Cargando configuración
            </div>
          ) : (
            <form onSubmit={guardarConfiguracion} className="mt-6 flex flex-col gap-6">
              <ConfigSection
                icon={UserRound}
                title="Perfil"
                description="Elegí qué partes de tu actividad se ven en tu perfil público."
              >
                <ToggleRow
                  icon={Globe2}
                  title="Perfil público"
                  description="Permite que otros vean la información pública que habilites."
                  active={configuracion.perfilPublico}
                  onClick={() => toggleConfig("perfilPublico")}
                />

                <ActionRow
                  icon={KeyRound}
                  title="Cambiar contraseña"
                  description="Disponible para cuentas creadas con email y contraseña de Xendaria."
                  actionLabel="Abrir"
                  onClick={abrirModalPassword}
                />

                <ToggleRow
                  icon={Medal}
                  title="Mostrar insignias en perfil público"
                  description="Permite que otros vean tus últimas insignias ganadas."
                  active={configuracion.mostrarInsigniasPerfil}
                  onClick={() => toggleConfig("mostrarInsigniasPerfil")}
                />

                <ToggleRow
                  icon={BookOpen}
                  title="Mostrar álbum de insignias público"
                  description="Permite que otras personas vean tus insignias ganadas y las que te faltan desbloquear."
                  active={configuracion.mostrarAlbumInsigniasPerfil}
                  onClick={() => toggleConfig("mostrarAlbumInsigniasPerfil")}
                />

                <ToggleRow
                  icon={BadgeCheck}
                  title="Mostrar contador de visitas público"
                  description="Solo muestra la cantidad total, no la lista de lugares visitados."
                  active={configuracion.mostrarContadorVisitados}
                  onClick={() => toggleConfig("mostrarContadorVisitados")}
                />

                <ToggleRow
                  icon={MapPinned}
                  title="Mostrar preferencia de lugares pública"
                  description="Controla si otras personas ven tu categoría preferida."
                  active={configuracion.mostrarPreferenciaLugaresPerfil}
                  onClick={() => toggleConfig("mostrarPreferenciaLugaresPerfil")}
                />
              </ConfigSection>

              <ConfigSection
                icon={Shield}
                title="Privacidad y ubicación"
                description="Tu ubicación se usa para saber si estás cerca de un punto, desbloquear insignias, calcular rutas y mostrarte avisos cercanos."
              >
                <ToggleRow
                  icon={LocateFixed}
                  title="Permitir usar ubicación"
                  description="Si lo apagás, Xendaria deja de pedir y actualizar tu ubicación."
                  active={configuracion.permitirUbicacion}
                  onClick={toggleUbicacion}
                />

                {confirmarUbicacion && (
                  <ConfirmarUbicacion
                    onCancel={() => setConfirmarUbicacion(false)}
                    onConfirm={desactivarUbicacion}
                  />
                )}

                <ToggleRow
                  icon={Crown}
                  title="Mostrar mi actividad en ranking"
                  description="Si lo apagás, no vas a aparecer en el ranking de usuarios."
                  active={configuracion.mostrarActividadRanking}
                  onClick={() => toggleConfig("mostrarActividadRanking")}
                />

                <ToggleRow
                  icon={MapPinned}
                  title="Mostrar contador de puntos visitados público"
                  description="Controla si otras personas ven el número de puntos visitados, no el detalle."
                  active={configuracion.mostrarPuntosVisitadosPerfil}
                  onClick={() => toggleConfig("mostrarPuntosVisitadosPerfil")}
                />

                <ToggleRow
                  icon={Heart}
                  title="Mostrar lugares favoritos públicos"
                  description="Muestra la lista de lugares que guardaste como favoritos en tu perfil público."
                  active={configuracion.mostrarFavoritosPerfil}
                  onClick={() => toggleConfig("mostrarFavoritosPerfil")}
                />

                <DangerRow
                  confirmar={confirmarBorrado}
                  loading={borrandoHistorial}
                  onStart={() => setConfirmarBorrado(true)}
                  onCancel={() => setConfirmarBorrado(false)}
                  onConfirm={borrarHistorial}
                />
              </ConfigSection>

              <ConfigSection
                icon={MapPin}
                title="Mapa"
                description="Preferencias de exploración visual."
              >
                <ToggleRow
                  icon={Rotate3D}
                  title="Activar vista 360"
                  description="Muestra el botón de vista del lugar cuando esté disponible."
                  active={configuracion.vista360Habilitada}
                  onClick={() => toggleConfig("vista360Habilitada")}
                />
              </ConfigSection>

              <ConfigSection
                icon={Bell}
                title="Notificaciones"
                description="Por ahora guardamos tu preferencia; las notificaciones push se conectan después."
              >
                <ToggleRow
                  icon={LocateFixed}
                  title="Avisar cuando estoy cerca de un punto"
                  description="Ideal para descubrir lugares sin abrir todo el tiempo el mapa."
                  active={configuracion.notificaciones?.puntosCercanos}
                  onClick={() => toggleNotificacion("puntosCercanos")}
                />

                <ToggleRow
                  icon={Medal}
                  title="Avisar insignias desbloqueables"
                  description="Te ayuda a no perder recompensas cercanas."
                  active={configuracion.notificaciones?.insignias}
                  onClick={() => toggleNotificacion("insignias")}
                />

                <ToggleRow
                  icon={Gift}
                  title="Avisar recompensas de comercios"
                  description="Para promociones o beneficios de locales asociados."
                  active={configuracion.notificaciones?.recompensas}
                  onClick={() => toggleNotificacion("recompensas")}
                />
              </ConfigSection>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/perfil")}
                  className="rounded-xl border border-uva/20 bg-white py-3 font-bold text-uva transition hover:bg-crema"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-morado py-3 font-bold text-crema shadow disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      <ModalXendaria
        open={modalPassword}
        onClose={cerrarModalPassword}
        maxWidth="max-w-md"
        header={
          <div className="bg-white px-5 pb-3 pt-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-morado/10 text-morado">
              <KeyRound size={22} />
            </span>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-uva/55">
              Seguridad
            </p>
            <h2 className="font-fredoka text-3xl leading-tight text-morado">
              Cambiar contraseña
            </h2>
            <p className="mt-1 text-sm font-semibold text-uva/60">
              Usá esta opción si tu cuenta fue creada con email y contraseña.
            </p>
          </div>
        }
        contentClassName="bg-white px-5 pb-5"
      >
        <form onSubmit={guardarPassword} className="space-y-4">
          {passwordMensaje && (
            <Alert variant={passwordMensaje.variant}>{passwordMensaje.text}</Alert>
          )}

          <TextField
            label="Contraseña actual"
            name="passwordActual"
            type="password"
            value={passwordForm.passwordActual}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-uva/10 bg-crema p-3 pr-10 font-semibold text-uva outline-none transition placeholder:text-uva/35 focus:ring-2 focus:ring-morado/60"
            required
          />

          <Alert variant="info">
            La nueva contraseña debe tener al menos 6 caracteres, un número,
            una mayúscula y un caracter especial.
          </Alert>

          <TextField
            label="Contraseña nueva"
            name="passwordNueva"
            type="password"
            value={passwordForm.passwordNueva}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-uva/10 bg-crema p-3 pr-10 font-semibold text-uva outline-none transition placeholder:text-uva/35 focus:ring-2 focus:ring-morado/60"
            required
          />

          <TextField
            label="Confirmar contraseña nueva"
            name="passwordConfirm"
            type="password"
            value={passwordForm.passwordConfirm}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-uva/10 bg-crema p-3 pr-10 font-semibold text-uva outline-none transition placeholder:text-uva/35 focus:ring-2 focus:ring-morado/60"
            required
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={cerrarModalPassword}
              disabled={cambiandoPassword}
              className="rounded-xl border border-uva/20 bg-white py-3 font-bold text-uva transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cambiandoPassword}
              className="flex items-center justify-center gap-2 rounded-xl bg-morado py-3 font-bold text-crema shadow disabled:opacity-60"
            >
              {cambiandoPassword ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Guardar
            </button>
          </div>
        </form>
      </ModalXendaria>

      <Navbar active="perfil" />
    </div>
  );
}

function ConfigSection({ icon: Icon, title, description, children }) {
  return (
    <section className="border-t border-uva/10 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
          {Icon && <Icon size={19} />}
        </span>
        <div>
          <h2 className="font-fredoka text-2xl leading-none text-uva">{title}</h2>
          {description && (
            <p className="mt-1 text-sm font-semibold leading-snug text-uva/60">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ToggleRow({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className="flex w-full items-center gap-3 rounded-2xl border border-uva/10 bg-crema px-4 py-3 text-left transition hover:border-morado/40"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-menta text-uva" : "bg-grisaceo/70 text-uva/55"
        }`}
      >
        {Icon && <Icon size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-uva">{title}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-snug text-uva/55">
          {description}
        </span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          active ? "bg-morado" : "bg-uva/20"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            active ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function ActionRow({ icon: Icon, title, description, actionLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-uva/10 bg-crema px-4 py-3 text-left transition hover:border-morado/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
        {Icon && <Icon size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-uva">{title}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-snug text-uva/55">
          {description}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-morado shadow-sm ring-1 ring-uva/10">
        {actionLabel}
      </span>
    </button>
  );
}

function ConfirmarUbicacion({ onCancel, onConfirm }) {
  return (
    <div className="rounded-2xl border border-morado/20 bg-morado/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-morado text-crema">
          <LocateFixed size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-uva">
            ¿Desactivar ubicación?
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-uva/60">
            Si la desactivás, Xendaria deja de usar tu ubicación. Si querés
            revocar el permiso, hacelo desde los permisos del sitio en el
            navegador.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-uva px-4 py-2 text-xs font-bold text-crema shadow"
            >
              Desactivar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-uva/15 bg-white px-4 py-2 text-xs font-bold text-uva"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerRow({ confirmar, loading, onStart, onCancel, onConfirm }) {
  if (confirmar) {
    return (
      <div className="rounded-2xl border border-fucsia/25 bg-fucsia/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fucsia text-crema">
            <Trash2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-uva">
              ¿Borrar historial de visitas?
            </p>
            <p className="mt-1 text-xs font-semibold text-uva/60">
              Se elimina el registro de puntos visitados. Tus insignias se conservan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-fucsia px-4 py-2 text-xs font-bold text-crema shadow disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Confirmar
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-full border border-uva/15 bg-white px-4 py-2 text-xs font-bold text-uva"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      className="flex w-full items-center gap-3 rounded-2xl border border-fucsia/20 bg-fucsia/10 px-4 py-3 text-left transition hover:bg-fucsia/15"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fucsia text-crema">
        <Trash2 size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-uva">
          Borrar historial de visitas
        </span>
        <span className="mt-0.5 block text-xs font-semibold leading-snug text-uva/55">
          Limpia tus visitas registradas sin borrar tus insignias.
        </span>
      </span>
    </button>
  );
}
