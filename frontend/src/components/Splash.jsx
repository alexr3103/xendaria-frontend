import React from "react";
import logo from "../assets/logo-oficial.png";
import ilustracion from "../assets/premios.png"; 

export default function InicioScreen({ onContinue }) {
  return (
    <div className="w-screen h-screen bg-rosa/40 flex flex-col items-center justify-center px-6 text-center">
      <img
        src={logo}
        alt="Xendaria"
        className="w-40 mb-8"/>
      <div className="w-64 h-64 rounded-full overflow-hidden mb-10 flex items-center justify-center">
        <img
          src={ilustracion}
          alt="Bienvenida Xendaria"
          className="w-full h-full object-contain"/>
      </div>
      <button
        onClick={onContinue}
        className="mt-4 font-nunito text-gris text-lg">
        Continuar
      </button>
    </div>
  );
}
