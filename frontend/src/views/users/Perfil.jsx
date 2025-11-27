import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../layouts/Header.jsx";
import Navbar from "../../components/Navbar.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import { Pencil, Settings, Heart } from "lucide-react";
import Avatar from "../../assets/avatar.png"

export default function Perfil() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const token = localStorage.getItem("token");
  const usuarioLS = JSON.parse(localStorage.getItem("usuario"));

  const [perfil, setPerfil] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [verFavoritos, setVerFavoritos] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================
  // Cargar perfil real
  // ============================
  useEffect(() => {
    async function cargar() {
      if (!token || !usuarioLS) return navigate("/login");

      try {
        const res = await fetch(`${API}/api/usuarios/${usuarioLS.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return navigate("/login");

        const data = await res.json();
        setPerfil(data);

        // Favoritos si existen:
        setFavoritos(data.lugares_favoritos || []);

      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  // ============================
  // Cerrar sesión
  // ============================
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (!perfil) return <p className="text-center mt-10">Error cargando perfil</p>;

  return (
    <div className="w-full min-h-screen bg-crema pb-28">

      {/*HEADER  */}
      <div className="sticky top-0 z-50">
        <Header disableFilter={true} />
      </div>

      <div className="px-6 mt-6 relative">

        <div className="absolute right-2 -top-6">
          <BotonCerrar onClick={() => navigate("/home")} />
        </div>

        <div className="w-full bg-white rounded-3xl shadow-lg border border-uva/10 p-6">

          <div className="w-full flex justify-center -mt-14 relative">
  
  {/* avatar */}
    <div className="
        w-32 h-32 
        bg-menta 
        rounded-full 
        absolute 
        top-0 
        blur-[0px]
    "></div>
    <img
        src={perfil.foto && perfil.foto.trim() !== "" ? perfil.foto : Avatar}
        onError={(e) => { e.target.src = Avatar; }}
        className="
        w-32 h-32 
        relative z-10 
        rounded-full 
        object-cover 
        border-4 border-crema
        "
    />
    </div>

          {/* Nombre */}
          <p className="text-center text-lg font-nunito mt-3">
            Usuario:{" "}
            <span className="text-morado font-bold">{perfil.nombre}</span>
          </p>
          <p className="text-center text-uva">{perfil.email}</p>

          {/* Botones editar */}
          <div className="flex justify-center gap-12 mt-4">
            <button
              onClick={() => navigate("/perfil/editar")}
              className="flex flex-col items-center text-morado hover:text-uva"
            >
              <Pencil size={24} />
              <span className="text-sm font-semibold">Editar</span>
            </button>

            <button
              onClick={() => navigate("/perfil/config")}
              className="flex flex-col items-center text-morado hover:text-uva"
            >
              <Settings size={24} />
              <span className="text-sm font-semibold">Config</span>
            </button>
          </div>
{/* Métricas */}
<div className="mt-6 bg-crema rounded-2xl py-4 px-3 flex justify-around border border-uva/10">

  <div className="text-center opacity-40">
    <p className="text-lg font-bold text-morado">
      {perfil.insignias?.length || 0}
    </p>
    <p className="text-sm text-uva">Insignias</p>
  </div>

  <div className="text-center">
    <p className="text-lg font-bold text-morado">
      {favoritos.length}
    </p>
    <p className="text-sm text-uva">Favoritos</p>
  </div>

</div>

          {/* Opciones */}
          <div className="mt-6 flex flex-col gap-3">

            {/* FAVORITOS */}
            <button
              onClick={() => setVerFavoritos(!verFavoritos)}
              className="w-full flex items-center justify-between bg-white border border-uva/20 p-4 rounded-xl hover:bg-crema/70 transition"
            >
              <span className="font-nunito">Favoritos</span>
              <Heart className="text-rosa" />
            </button>

            {/* Panel de favoritos */}
            {verFavoritos && (
              <div className="bg-crema p-4 rounded-2xl border border-uva/10 mt-2 animate-fadeIn">

                {favoritos.length === 0 && (
                  <p className="text-center text-uva">Todavía no tenés favoritos.</p>
                )}

                {favoritos.map((f) => (
                  <div
                    key={f._id}
                    className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-2"
                  >
                    <img
                      src={f.foto}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-fredoka text-morado">{f.nombre}</p>
                      <p className="text-xs text-uva">{f.categoria}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Otras opciones */}
            <button
              onClick={() => navigate("/perfil/mis-puntos")}
              className="w-full flex items-center justify-between bg-white border border-uva/20 p-4 rounded-xl hover:bg-crema/70 transition"
            >
              <span className="font-nunito">Puntos propios</span>
              <span>›</span>
            </button>

            <button
              onClick={() => navigate("/perfil/info")}
              className="w-full flex items-center justify-between bg-white border border-uva/20 p-4 rounded-xl hover:bg-crema/70 transition"
            >
              <span className="font-nunito">Sobre la app</span>
              <span>›</span>
            </button>

            <button
              onClick={logout}
              className="w-full text-center bg-rosa text-white py-3 rounded-xl font-bold hover:bg-rosa/80 transition mt-2"
            >
              Cerrar sesión
            </button>

          </div>
        </div>
      </div>
      <Navbar active="perfil" />
    </div>
  );
}
