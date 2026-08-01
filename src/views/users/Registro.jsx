import { useState } from "react";
import AuthLayout from "../../layouts/Auth.jsx";
import Alert from "../../components/Alertas.jsx";
import DocumentosLegales from "../../components/DocumentosLegales.jsx";
import TextField from "../../components/Textfield.jsx";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const PASSWORD_INFO =
  "La contraseña debe tener al menos 6 caracteres, un número, una mayúscula y un caracter especial.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_SPECIAL_CHARACTER_REGEX = /[!@#$%^&*(),.?":{}|<>_+=-]/;

function validarRegistro(form) {
  const nombre = form.nombre.trim();
  const email = form.email.trim();

  if (!nombre) return "Ingresá tu nombre completo.";
  if (!email) return "Ingresá tu correo electrónico.";
  if (!EMAIL_REGEX.test(email)) {
    return "Ingresá un correo electrónico válido.";
  }
  if (form.password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (!PASSWORD_NUMBER_REGEX.test(form.password)) {
    return "La contraseña debe tener al menos un número.";
  }
  if (!PASSWORD_UPPERCASE_REGEX.test(form.password)) {
    return "La contraseña debe tener al menos una mayúscula.";
  }
  if (!PASSWORD_SPECIAL_CHARACTER_REGEX.test(form.password)) {
    return "La contraseña debe tener al menos un caracter especial.";
  }
  if (form.password !== form.passwordConfirm) {
    return "Las contraseñas deben coincidir.";
  }
  if (!form.aceptaTerminos) {
    return "Debés aceptar los términos y la política de privacidad.";
  }

  return "";
}

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    passwordConfirm: "",
    aceptaTerminos: false,
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalesOpen, setLegalesOpen] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    const errorValidacion = validarRegistro(form);
    if (errorValidacion) {
      setErr(errorValidacion);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/usuarios/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nombre: form.nombre.trim(),
          email: form.email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(" • ")
          : data.message;
        throw new Error(msg || "Error al registrarse");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: data.id,
          nombre: data.nombre,
          email: data.email,
        })
      );

      setOk("Cuenta creada con éxito");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (e) {
      setErr(e.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthLayout title="Crear cuenta">
        {err && <Alert variant="error" id="register-error">{err}</Alert>}
        {ok && <Alert variant="success">{ok}</Alert>}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
          aria-describedby={err ? "register-error" : undefined}
        >
          <TextField
            label={
              <>
                Nombre completo <span className="text-fucsia">*</span>
              </>
            }
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            autoComplete="name"
            required
          />

          <TextField
            label={
              <>
                Correo electrónico <span className="text-fucsia">*</span>
              </>
            }
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Ej: juanperez@email.com"
            required
            autoComplete="email"
          />

          <Alert variant="info">{PASSWORD_INFO}</Alert>

          <TextField
            label={
              <>
                Contraseña <span className="text-fucsia">*</span>
              </>
            }
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <TextField
            label={
              <>
                Confirmar contraseña <span className="text-fucsia">*</span>
              </>
            }
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <label className="mt-1 flex cursor-pointer items-start gap-3 text-sm leading-snug text-uva">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={form.aceptaTerminos}
              onChange={handleChange}
              className="mt-0.5 h-5 w-5 shrink-0 accent-morado"
            />
            <span>
              Acepto los{" "}
              <button
                type="button"
                onClick={() => setLegalesOpen(true)}
                className="font-bold text-morado underline underline-offset-2"
              >
                términos y la política de privacidad
              </button>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-morado text-white font-bold py-3 rounded-xl hover:bg-uva active:scale-[0.98] transition-transform focus:ring-4 focus:ring-morado/30 disabled:opacity-60"
          >
            {loading ? "Creando..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-morado font-semibold hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </AuthLayout>

      <DocumentosLegales
        open={legalesOpen}
        onClose={() => setLegalesOpen(false)}
      />
    </>
  );
}
