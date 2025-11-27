import { useState } from "react";
import AuthLayout from "../../layouts/Auth.jsx";
import Alert from "../../components/Alertas.jsx";
import TextField from "../../components/TextField.jsx";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;   // 🔥 CAMBIO HECHO

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/usuarios/register`, {   // 🔥 CAMBIO HECHO
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(" • ") : data.message;
        throw new Error(msg || "Error al registrarse");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        email: data.email,
      }));

      setOk("Cuenta creada con éxito");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (e) {
      setErr(e.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Crear cuenta">
      {err && <Alert variant="error" id="register-error">{err}</Alert>}
      {ok && <Alert variant="success">{ok}</Alert>}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
        aria-describedby={err ? "register-error" : undefined}
      >
        <TextField
          label="Nombre completo"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <TextField
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <TextField
          label="Confirmar contraseña"
          name="passwordConfirm"
          type="password"
          value={form.passwordConfirm}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-morado text-white font-bold py-3 rounded-xl hover:bg-uva 
                     active:scale-[0.98] transition-transform focus:ring-4 focus:ring-morado/30 disabled:opacity-60"
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
  );
}
