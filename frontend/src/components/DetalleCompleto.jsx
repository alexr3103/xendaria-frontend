import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { MapPin, Heart } from "lucide-react";

import cargafail from "../assets/cargafail.png";
import { categorias } from "./CategoriasFiltros";
import BotonCerrar from "./BotonCerrar";

export default function PuntoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [punto, setPunto] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [animarFavorito, setAnimarFavorito] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // Usuario logueado
  const user = JSON.parse(localStorage.getItem("usuario"));
  const idUsuario = user?.id;

  // Detectar favorito
  useEffect(() => {
    fetch(`${API}/api/puntos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          navigate("/404");
        } else {
          setPunto(data);
          if (user?.lugares_favoritos?.includes(data._id)) {
            setEsFavorito(true);
          }
        }
      })
      .catch(() => navigate("/404"));
  }, [id, API, navigate]);

  if (!punto) return null;
  const {
    nombre,
    foto,
    descripcion_completa,
    direccion,
    categoria,
    insignia,
    _id: idPunto,
  } = punto;

  const { icon: Icon, label, color: catColor } = categorias[categoria] || {};

//manejar favorito
  async function toggleFavorito() {
    if (!idUsuario) return alert("Tenés que iniciar sesión para guardar favoritos.");

    setLoadingFav(true);

    try {
      let url = `${API}/api/usuarios/${idUsuario}/favorito`;

      let res;

      if (!esFavorito) {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ idPunto }),
        });
      } else {
        res = await fetch(`${url}/${idPunto}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      const data = await res.json();
      if (res.ok) {
        const nuevoValor = !esFavorito;
        setEsFavorito(nuevoValor);
        if (nuevoValor) {
          setAnimarFavorito(true);
          setTimeout(() => setAnimarFavorito(false), 600);
        }
        // actualizar usuario localStorage
        const updatedUser = {
          ...user,
          lugares_favoritos: nuevoValor
            ? [...(user.lugares_favoritos || []), idPunto]
            : (user.lugares_favoritos || []).filter((id) => id !== idPunto),
        };
        localStorage.setItem("usuario", JSON.stringify(updatedUser));
      } else {
        console.error("Error en favoritos:", data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFav(false);
    }
  }

  // ==========================
// RENDER PRINCIPAL DEL PUNTO
// ==========================
return (
  <div className="w-full min-h-screen bg-crema pb-24">

    <div className="relative w-full h-[260px] sm:h-[320px] rounded-b-[40px] overflow-hidden">

      <div className="absolute top-5 left-0 right-0 z-[999] px-5 flex justify-between items-center">

    <button
      disabled={loadingFav}
      onClick={toggleFavorito}
      className={`
        w-[44px] h-[44px] flex items-center justify-center
        rounded-2xl shadow-lg
        ${esFavorito ? "bg-rosa text-fucsia" : "bg-crema text-fucsia"}
        active:scale-95 transition relative
      `}
    >
      <Heart
        size={22}
        stroke="#F0288E"
        fill={esFavorito ? "#F0288E" : "none"}
        className={`transition-all duration-300 ${esFavorito ? "scale-110" : "scale-100"}`}
      />
      {animarFavorito && (
        <span className="absolute inset-0 rounded-2xl animate-ping bg-fucsia/40 pointer-events-none"></span>
      )}
    </button>
    <BotonCerrar onClick={() => navigate("/home")} />
  </div>
      <img
        src={foto || cargafail}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = cargafail;
        }}
        alt={nombre}
        className="w-full h-full object-cover"
      />
      <h1 className="absolute bottom-6 left-6 z-[50] text-crema font-fredoka text-3xl sm:text-4xl drop-shadow-md max-w-[80%]">
        {nombre}
      </h1>
      <div
        style={{ backgroundColor: catColor }}
        className="absolute bottom-6 right-6 z-[50] flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-gris shadow-md"
      >
        {Icon && <Icon size={18} className="text-gris" />}
        {label}
      </div>
    </div>
    <div className="px-6 mt-6">
      <div className="flex items-center gap-3 text-fucsia mb-6">
        <MapPin size={26} />
        <span className="font-bold text-[15px] leading-tight">{direccion}</span>
      </div>
      <div className="bg-menta/80 p-5 rounded-3xl shadow mb-10">
        <h2 className="font-fredoka text-uva text-xl mb-2">Historia</h2>
        <p className="text-gris text-[15px] leading-relaxed">
          {descripcion_completa}
        </p>
      </div>
      {insignia && (
        <div className="w-full bg-morado/30 p-6 rounded-3xl shadow mb-10 flex flex-col items-center">
          <span className="font-fredoka text-uva text-lg mb-3">Insignia</span>
          <img
            src={insignia}
            alt="Insignia"
            className="w-[160px] h-[160px] rounded-full object-cover shadow-xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = cargafail;
            }}
          />
        </div>
      )}
      <h2 className="font-fredoka text-uva text-xl mb-3">Multimedia</h2>
      <div className="grid grid-cols-3 gap-3 mb-20">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              bg-gris/20 h-[90px] rounded-xl
              flex flex-col items-center justify-center gap-1
              text-gris/80 text-xs font-semibold
            "
          >
            <span className="text-[22px]">🚧</span>
            Próximamente
          </div>
        ))}
      </div>

    </div>
  </div>
);
}
