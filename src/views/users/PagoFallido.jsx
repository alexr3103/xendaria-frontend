import { useNavigate } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";

export default function PagoFallido() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter={true} showCart={true} />
      </div>

      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-3xl border border-uva/10 bg-white p-8 text-center shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
          <h2 className="mb-3 font-fredoka text-3xl text-uva">
            No se pudo completar el pago
          </h2>
          <p className="mb-6 text-gris">
            El pago fue cancelado o rechazado. No se genero una orden, asi que
            podes volver al carrito e intentarlo nuevamente.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/carrito")}
              className="rounded-2xl bg-fucsia py-3 font-bold text-white transition hover:bg-fucsia/85"
            >
              Volver al carrito
            </button>

            <button
              onClick={() => navigate("/merch")}
              className="rounded-2xl border border-uva/20 bg-white py-3 font-bold text-uva transition hover:bg-crema"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </main>

      <Navbar />
    </div>
  );
}
