import React, { useEffect, useState } from "react";
import logo from "../assets/logo-oficial.png";
import ilustracion from "../assets/carga.png";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5; 
      });
    }, 30); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen bg-rosa/40 flex flex-col items-center justify-center px-6 py-10 text-center">

      {/* Logo */}
      <img
        src={logo}
        alt="Xendaria"
        className="w-40 mb-10"
      />

      {/* Ilustración dentro de un círculo */}
<div className="w-64 h-64 rounded-full overflow-hidden mb-10 flex items-center justify-center">
  <img
    src={ilustracion}
    alt="Ilustración Xendaria"
    className="w-full h-full object-cover"
  />
</div>


      {/* Barra */}
      <div className="w-64 h-4 bg-uva rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-uva to-morado transition-all duration-100"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-gris text-sm font-nunito mb-4">
        Cargando...
      </p>

      <p className="text-gris text-lg font-fredoka">
        Explorá la ciudad, descubrí sus secretos.
      </p>
    </div>
  );
}
