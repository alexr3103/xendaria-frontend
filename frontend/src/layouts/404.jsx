import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import errorImg from "../assets/404.png"; 

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-crema flex flex-col items-center px-6 pt-28">
      <img 
        src={errorImg}
        alt="Página no encontrada"
        className="w-72 h-auto mb-8 drop-shadow-xl"/>
      <h1 className="font-fredoka text-uva text-4xl text-center mb-3">
        Error 404
      </h1>
      <p className="text-center font-nunito text-gris max-w-sm mb-10 leading-relaxed">
        Te perdiste en el hiperespacio digital. <br/>
        No traemos mapa para eso todavía.
      </p>
      <button
        onClick={() => navigate("/home")}
        className="
          flex items-center gap-2
          bg-fucsia text-crema font-fredoka
          px-6 py-3 rounded-2xl shadow-lg
          hover:bg-fucsia/90 transition
        ">
        <ArrowLeft size={20} className="text-crema" />
        Volver al inicio
      </button>
    </div>
  );
}
