import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

const ERROR_CONTENT = {
  401: {
    title: "Sesion requerida",
    message: "Necesitás iniciar sesión para acceder a esta sección.",
    actionLabel: "Ir al login",
    actionTo: "/login",
  },
  403: {
    title: "Acceso no permitido",
    message: "Tu usuario no tiene permisos para realizar esta acción.",
    actionLabel: "Volver al inicio",
    actionTo: "/home",
  },
  500: {
    title: "Error del servidor",
    message: "Algo fallo del lado del servidor. Proba de nuevo en unos minutos.",
    actionLabel: "Volver al inicio",
    actionTo: "/home",
  },
};

export default function ErrorPage() {
  const navigate = useNavigate();
  const { code } = useParams();

  if (code === "404") {
    return <Navigate to="/404" replace />;
  }

  const content = ERROR_CONTENT[code] || {
    title: "Error inesperado",
    message: "No pudimos completar la acción solicitada.",
    actionLabel: "Volver al inicio",
    actionTo: "/home",
  };

  return (
    <main className="min-h-screen bg-crema flex items-center justify-center px-6 py-12 font-nunito">
      <section className="w-full max-w-lg bg-white border border-uva/10 shadow-2xl rounded-3xl p-8">
        <div className="w-16 h-16 rounded-2xl bg-fucsia/10 text-fucsia flex items-center justify-center mb-5">
          <AlertTriangle size={34} />
        </div>

        <p className="font-fredoka text-morado text-lg mb-1">
          Error {code || "general"}
        </p>
        <h1 className="font-fredoka text-uva text-3xl mb-4">
          {content.title}
        </h1>
        <p className="text-gris leading-relaxed mb-7">
          {content.message}
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-crema text-uva px-5 py-3 rounded-xl font-semibold hover:bg-crema/80 transition"
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            onClick={() => navigate(content.actionTo)}
            className="flex items-center gap-2 bg-morado text-crema px-5 py-3 rounded-xl font-semibold hover:bg-uva transition"
          >
            <Home size={18} />
            {content.actionLabel}
          </button>
        </div>
      </section>
    </main>
  );
}
