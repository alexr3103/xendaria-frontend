import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { login, googleLogin } from "../../lib/api/auth.js";
import AuthLayout from "../../layouts/Auth.jsx";
import Alert from "../../components/Alertas.jsx";
import Texto from "../../components/Texto.jsx";
import { Link } from "react-router-dom";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Recuperar contraseña
  const [recuperando, setRecuperando] = useState(false);
  const [recMail, setRecMail] = useState("");
  const [recLoading, setRecLoading] = useState(false);


  // LOGIN NORMAL
  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const data = await login({ email, password });
      const usuario = data.usuario || data.user || {};
      const token = data.token || usuario.token;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      window.location.href = "/home";
    } catch (e) {
      setErr(e.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }
  // LOGIN GOOGLE
  async function handleGoogleLogin(credentialResponse) {
    setErr("");
    setMsg("");
    try {
      const data = await googleLogin(credentialResponse.credential);
      const usuario = data.usuario || data.user || {};
      const token = data.token || usuario.token;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      window.location.href = "/home";
    } catch (e) {
      setErr(e.message || "Error con Google");
    }
  }


  // RECUPERAR CONTRASEÑA

  async function handleRecuperar(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setRecLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/recuperar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: recMail }),
        }
      );

      if (!res.ok) throw new Error("No se pudo enviar el correo");

      setMsg("Te enviamos un correo para recuperar tu contraseña 💌");
      setRecMail("");
      setRecuperando(false);

      setTimeout(() => setMsg(""), 5000);
    } catch (err) {
      setErr(err.message || "Error al enviar el correo");
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthLayout title="Iniciar sesión">

        {err && <Alert variant="error">{err}</Alert>}
        {msg && <Alert variant="success">{msg}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Texto
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <Texto
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="
              mt-2 bg-morado text-white font-bold py-3 rounded-xl 
              hover:bg-uva transition disabled:opacity-60
            "
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center my-2">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="mx-3 text-gray-500 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setErr("Error con Google")}
            text="signin_with"
            shape="pill"
            width="220"
          />
        </div>

        <div className="mt-4 text-center">
          {!recuperando ? (
            <button
              className="text-morado font-semibold hover:underline text-sm"
              onClick={() => setRecuperando(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          ) : (
            <form
              onSubmit={handleRecuperar}
              className="mt-3 bg-crema/60 p-4 rounded-xl shadow-sm border border-uva/10 flex flex-col gap-3"
            >
              <Texto
                label="Ingresá tu correo"
                type="email"
                value={recMail}
                required
                onChange={(e) => setRecMail(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={recLoading}
                  className="flex-1 bg-morado text-crema px-4 py-2 rounded-xl font-semibold hover:bg-morado/80 transition disabled:opacity-50"
                >
                  {recLoading ? "Enviando..." : "Recuperar"}
                </button>

                <button
                  type="button"
                  onClick={() => setRecuperando(false)}
                  className="flex-1 bg-crema text-uva px-4 py-2 rounded-xl font-semibold hover:bg-crema/80 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="text-morado font-semibold hover:underline">
            Registrate
          </Link>
        </p>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}
