import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save } from "lucide-react";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import Alert from "../../components/Alertas.jsx";
import TextField from "../../components/Textfield.jsx";
import { categorias } from "../../components/CategoriasFiltros.jsx";
import { getCategoriaImagen } from "../../lib/categoriaImagenes.js";
import {
  DEFAULT_AVATARS,
  getFallbackAvatar,
  resolveAvatarSrc,
} from "../../lib/avatarOptions.js";

const DESCRIPCION_MAX_LENGTH = 150;

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

function esFotoGoogle(value = "") {
  return /googleusercontent\.com|ggpht\.com/i.test(String(value));
}

async function getErrorMessage(res) {
  try {
    const data = await res.json();
    return data?.message || "No se pudo guardar el perfil";
  } catch {
    return "No se pudo guardar el perfil";
  }
}

export default function EditarPerfil() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const usuarioLS = useMemo(getUsuarioLocal, []);
  const token = localStorage.getItem("token");
  const usuarioId = usuarioLS?.id || usuarioLS?._id;

  const [form, setForm] = useState({
    nombre: usuarioLS?.nombre || "",
    foto: usuarioLS?.foto || "",
    fotoGoogle: usuarioLS?.fotoGoogle || "",
    descripcion: usuarioLS?.descripcion || "",
    categoriaFavorita: usuarioLS?.configuracion?.categoriaFavorita || "",
    configuracion: usuarioLS?.configuracion || {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
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

        if (!res.ok) throw new Error("No se pudo cargar el perfil");

        const data = await res.json();
        if (!activo) return;

        setForm({
          nombre: data.nombre || "",
          foto: data.foto || "",
          fotoGoogle: data.fotoGoogle || "",
          descripcion: data.descripcion || "",
          categoriaFavorita: data.configuracion?.categoriaFavorita || "",
          configuracion: data.configuracion || {},
        });
      } catch (err) {
        if (activo) setError(err.message || "No se pudo cargar el perfil");
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, [API, navigate, token, usuarioId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  function seleccionarAvatar(value) {
    setForm((actual) => ({ ...actual, foto: value }));
  }

  function seleccionarCategoriaFavorita(categoria) {
    setForm((actual) => ({ ...actual, categoriaFavorita: categoria }));
  }

  const fotoGoogleDisponible =
    form.fotoGoogle || (esFotoGoogle(form.foto) ? form.foto : "");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API}/api/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          foto: form.foto.trim(),
          fotoGoogle: fotoGoogleDisponible,
          descripcion: form.descripcion.trim().slice(0, DESCRIPCION_MAX_LENGTH),
          configuracion: {
            ...form.configuracion,
            categoriaFavorita: form.categoriaFavorita,
          },
        }),
      });

      if (res.status === 404) {
        navigate("/404", { replace: true });
        return;
      }

      if (!res.ok) throw new Error(await getErrorMessage(res));

      const data = await res.json();
      const usuarioActualizado = data.usuario || {};
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

      navigate("/perfil");
    } catch (err) {
      setError(err.message || "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter />
      </div>

      <main className="mx-auto w-full max-w-xl px-4 pt-8">
        <div className="relative rounded-3xl border border-uva/10 bg-white px-5 pb-6 pt-6 shadow-lg">
          <div className="absolute right-0 top-0 z-20 translate-x-[30%] -translate-y-[30%] sm:translate-x-1/2 sm:-translate-y-1/2">
            <BotonCerrar onClick={() => navigate("/perfil")} />
          </div>

          <div className="pr-12">
            <h1 className="font-fredoka text-3xl text-morado">
              Editar perfil
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="relative h-32 w-32">
                <div className="absolute inset-0 rounded-full bg-menta"></div>
                <img
                  src={resolveAvatarSrc(form.foto)}
                  alt="Avatar"
                  onError={(event) => {
                    event.currentTarget.src = getFallbackAvatar();
                  }}
                  className="relative z-10 h-32 w-32 rounded-full border-4 border-crema object-cover"
                />
              </div>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-crema px-4 py-5 text-uva">
                <Loader2 className="animate-spin" size={20} />
                Cargando datos
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-uva">
                    Elegir avatar
                  </span>
                  <div className="-mx-1 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-3 px-1">
                      {fotoGoogleDisponible && (
                          <button
                          type="button"
                          onClick={() => seleccionarAvatar(fotoGoogleDisponible)}
                          className="flex w-20 shrink-0 flex-col items-center gap-1"
                          aria-pressed={form.foto === fotoGoogleDisponible}
                        >
                          <img
                            src={fotoGoogleDisponible}
                            alt="Foto de perfil de Google"
                            onError={(event) => {
                              event.currentTarget.src = getFallbackAvatar();
                            }}
                            className={`h-16 w-16 rounded-full border-4 object-cover transition ${
                              form.foto === fotoGoogleDisponible
                                ? "border-rosa scale-105 shadow-md"
                                : "border-crema"
                            }`}
                          />
                          <span className="w-full truncate text-center text-[11px] font-bold text-uva">
                            Google
                          </span>
                        </button>
                      )}

                      {DEFAULT_AVATARS.map((avatar) => {
                        const selected = form.foto === avatar.value;

                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => seleccionarAvatar(avatar.value)}
                            className="flex w-20 shrink-0 flex-col items-center gap-1"
                            aria-pressed={selected}
                          >
                            <img
                              src={avatar.src}
                              alt={`Avatar ${avatar.label}`}
                              className={`h-16 w-16 rounded-full border-4 object-cover transition ${
                                selected
                                  ? "border-rosa scale-105 shadow-md"
                                  : "border-crema"
                              }`}
                            />
                            <span className="w-full truncate text-center text-[11px] font-bold text-uva">
                              {avatar.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <TextField
                  label="Nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  maxLength={80}
                  required
                />

                <label className="flex flex-col text-sm font-semibold text-uva">
                  Descripción corta
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    maxLength={DESCRIPCION_MAX_LENGTH}
                    placeholder="Contá algo breve sobre tu forma de explorar."
                    className="mt-1 min-h-24 w-full resize-y rounded-xl border border-gray-300 bg-white p-3 text-sm font-semibold text-uva outline-none transition placeholder:text-uva/35 focus:ring-2 focus:ring-morado/60"
                  />
                  <span className="mt-1 text-xs font-semibold text-uva/50">
                    {form.descripcion.length}/{DESCRIPCION_MAX_LENGTH} caracteres
                  </span>
                </label>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-uva">
                    Categoria favorita
                  </span>
                  <div className="-mx-1 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-3 px-1">
                      {Object.entries(categorias).map(([value, categoria]) => {
                        const imagen = getCategoriaImagen(value);
                        const selected = form.categoriaFavorita === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => seleccionarCategoriaFavorita(value)}
                            className="flex w-24 shrink-0 flex-col items-center gap-1"
                            aria-pressed={selected}
                          >
                            <span
                              className={`h-20 w-20 overflow-hidden rounded-full border-4 bg-crema transition ${
                                selected
                                  ? "border-rosa scale-105 shadow-md"
                                  : "border-crema"
                              }`}
                            >
                              {imagen && (
                                <img
                                  src={imagen}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </span>
                            <span className="w-full truncate text-center text-[11px] font-bold text-uva">
                              {categoria.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

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
              </>
            )}
          </form>
        </div>
      </main>

      <Navbar active="perfil" />
    </div>
  );
}
