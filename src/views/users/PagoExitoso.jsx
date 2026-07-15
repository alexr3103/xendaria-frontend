import { useNavigate } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";

export default function PagoExitoso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter={true} showCart={true} />
      </div>

      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-uva/10 shadow-[0_8px_20px_rgba(0,0,0,0.08)] p-8 text-center">
          <h2 className="text-3xl font-fredoka text-uva mb-3">Pago aprobado</h2>
          <p className="text-gris mb-6">
            Tu compra se procesó correctamente. Vas a recibir el mail de confirmación con el detalle del pedido.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/merch")}
              className="bg-fucsia text-white font-bold py-3 rounded-2xl hover:bg-fucsia/85 transition"
            >
              Volver a la tienda
            </button>

            <button
              onClick={() => navigate("/home")}
              className="bg-white text-uva font-bold py-3 rounded-2xl border border-uva/20 hover:bg-crema transition"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </main>

      <Navbar />
    </div>
  );
}