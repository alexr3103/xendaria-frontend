import { useState, useEffect } from "react";
import { categorias } from "./CategoriasFiltros";
import { calcDistance } from "../lib/calcDistance";
import cargafail from "../assets/cargafail.png";
import { 
  MapPin, 
  Lock, 
  LockOpen, 
  Navigation 
} from "lucide-react";
import BotonCerrar from "./BotonCerrar";

export default function DescripcionPunto({
  punto,
  onClose,
  userCoords,
  onVisitar,
  onNavegar,
}) {
  const { _id, nombre, direccion, descripcion, categoria, foto, lat, lon } = punto;
  const [insigniaObtenida, setInsigniaObtenida] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`insignia-${_id}`);
    if (saved === "true") setInsigniaObtenida(true);
  }, [_id]);

  function desbloquearInsignia() {
    localStorage.setItem(`insignia-${_id}`, "true");
    setInsigniaObtenida(true);
  }

  // Distancia
  let estaCerca = false;
  if (userCoords && lat && lon) {
    const dist = calcDistance(userCoords.lat, userCoords.lng, lat, lon);
    estaCerca = dist <= 100;
  }

  //Categorías 
  const Icon = categorias[categoria]?.icon;
  const label = categorias[categoria]?.label;
  const catColor = categorias[categoria]?.color;

  return (
    <div className="fixed inset-0 bg-morado/10 backdrop-blur-sm flex items-center justify-center px-4 z-[9999]">
      <div className="relative w-full max-w-[430px]">

        <div className="absolute top-8 right-1 z-[9999]">
  <BotonCerrar onClick={onClose} />
</div>
        
        {/* Card */}
        <div className="absolute top-[55px] left-0 right-0 h-[200px] bg-morado/60 rounded-t-[40px] z-0"></div>
        <div className="absolute left-1/2 -translate-x-1/2 top-[40px] z-20">
          <img
            src={foto || cargafail}
            alt={nombre}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = cargafail;
            }}
            className="w-[165px] h-[165px] rounded-full border-[6px] border-crema shadow-2xl object-cover"
          />
        </div>
        <div
          className="
            relative z-10 bg-crema rounded-[40px] shadow-xl
            mt-[165px]
            pt-[100px]
            pb-14
            px-6
            h-[75vh]
            overflow-y-auto overflow-x-hidden
          "
        >
          {/* Titulo + insignia */}
          <div className="flex justify-between items-start mb-4">
            <h1 className="font-fredoka text-morado text-[22px] font-semibold leading-tight max-w-[240px]">
              {nombre}
            </h1>
            {punto.insignia && insigniaObtenida && (
              <img
                src={punto.insignia}
                alt="Insignia"
                className="w-[65px] h-[65px] rounded-full shadow-md object-cover"
              />
            )}
          </div>
          {/* Dirección */}
          <div className="flex items-center gap-2 mb-4 text-fucsia">
            <MapPin size={32} />
            <span className="text-sm font-semibold">{direccion}</span>
          </div>
          {/* Descripción */}
          <p className="text-gris text-sm leading-relaxed mb-6">
            {descripcion}
          </p>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Insignia */}
            {punto.insignia && (
              !insigniaObtenida ? (
                <button
                  disabled={!estaCerca}
                  onClick={desbloquearInsignia}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border shadow
                    ${
                      estaCerca
                        ? "bg-uva text-crema border-uva"
                        : "bg-rosa text-uva border-fucsia cursor-not-allowed"
                    }
                  `}
                >
                  <Lock size={16} />
                  Insignia desbloqueable
                </button>
              ) : (
                <span
                  className="
                    px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 
                    bg-uva text-crema border border-uva
                  "
                >
                  ✔ Insignia obtenida
                </span>
              )
            )}
            {/* Categoría */}
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 text-gris"
              style={{ backgroundColor: catColor }}
            >
              {Icon && <Icon size={18} className="text-gris" />}
              {label}
            </span>
          </div>
          {/* Ver más */}
          <button
            disabled={!estaCerca}
            onClick={() => estaCerca && onVisitar(punto)}
            className={`
              w-full py-3 rounded-[16px] font-semibold text-base flex items-center justify-center gap-2 shadow mb-4
              ${
                estaCerca
                  ? "bg-uva text-crema hover:bg-uva/90"
                  : "bg-gris/10 text-gris/70 cursor-not-allowed"
              }
            `}
          >
            {estaCerca ? <LockOpen size={18} /> : <Lock size={18} />}
            {estaCerca ? "Ver más info" : "Visitar para ver más info"}
          </button>
          {/* Navegar */}
          <button
            onClick={() => onNavegar && onNavegar({ lat, lon })}
            className="
              w-full py-3 rounded-[16px] font-semibold text-base flex items-center justify-center gap-2 shadow 
              bg-morado text-crema hover:bg-morado/90">
            <Navigation size={18} />
            Navegar hasta acá
          </button>
        </div>
      </div>
    </div>
  );
}
