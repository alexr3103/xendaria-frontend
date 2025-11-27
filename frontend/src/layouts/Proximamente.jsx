import { useNavigate } from "react-router-dom";
import construyendo from "../assets/construyendo.png"; 
import { ArrowLeft } from "lucide-react";

export default function Proximamente() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-crema flex flex-col items-center pt-24 px-6">

      {/* Imagen */}
      <img
        src={construyendo}
        alt="Construyendo Xendaria"
        className="w-64 h-auto mb-8 drop-shadow-xl"
      />

      {/* Título */}
      <h1 className="font-fredoka text-uva text-4xl text-center mb-4">
        Próximamente
      </h1>

      {/* Texto */}
      <p className="text-center text-[#3E3E3E] font-nunito max-w-sm mb-10 leading-relaxed">
        Estamos trabajando para traerte una experiencia increíble.
        Esta sección estará disponible en una futura actualización.
      </p>

      {/* Botón */}
      <button
        onClick={() => navigate("/home")}
        className="
          flex items-center gap-2
          bg-fucsia text-white font-fredoka
          px-6 py-3 rounded-2xl shadow-lg
          hover:bg-fucsia/90 transition
        "
      >
        <ArrowLeft size={20} />
        Volver al inicio
      </button>
    </div>
  );
}
