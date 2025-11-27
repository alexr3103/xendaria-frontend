import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../../layouts/Header.jsx";
import MapaUsuario from "../../components/Mapa_usuarios.jsx";
import UserNav from "../../components/Navbar.jsx";
import DescripcionPunto from "../../components/DescripcionPunto.jsx";
import { XCircle } from "lucide-react";
import { categorias as categoriasInfo } from "../../components/CategoriasFiltros.jsx";

export default function Home() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState(null);

  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [coords, setCoords] = useState(null);
  const [destino, setDestino] = useState(null);
  const [cargandoMapa, setCargandoMapa] = useState(true);

  // login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/puntos`)
      .then((res) => res.json())
      .then((data) => {
        const cats = [...new Set(data.map((p) => p.categoria).filter(Boolean))];
        setCategorias(cats);
      })
      .catch(() => setCategorias([]));
  }, []);

  // categoría que se está usando
  const categoriaActiva = filtro ? categoriasInfo[filtro] : null;
  const IconoCategoriaActiva = categoriaActiva?.icon;

  function handleVisitar(punto) {
    setPuntoSeleccionado(null);
    navigate(`/punto/${punto._id}`);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-crema">

      {/* HEADER */}
      <Header
        categorias={categorias}
        filtro={filtro}
        setFiltro={setFiltro}
      />

      {/* FILTRO ACTIVO */}
      {categoriaActiva && (
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[950]">
          <div
            className="
              flex items-center gap-2
              px-4 py-2
              rounded-full shadow-lg
              font-fredoka text-base
              border border-uva/30
            "
            style={{
              backgroundColor: categoriaActiva.color,
              color: "#401A37",
            }}
          >
            {/* Icono */}
            {IconoCategoriaActiva && (
              <IconoCategoriaActiva size={18} className="text-uva" />
            )}

            {/* Label */}
            <span>{categoriaActiva.label}</span>

            {/* Cerrar */}
            <button
              onClick={() => setFiltro(null)}
              className="font-bold text-uva ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN CANCELAR NAVEGACIÓN */}
      {destino && (
        <button
          onClick={() => setDestino(null)}
          className="
            absolute 
            top-[130px] 
            left-1/2 
            -translate-x-1/2
            bg-fucsia 
            text-white 
            px-6 py-2 
            rounded-2xl 
            shadow-lg 
            font-fredoka
            flex items-center gap-2
            z-[900]
          "
        >
          <XCircle size={20} className="text-crema" />
          Cancelar navegación
        </button>
      )}

      {/* MAPA */}
      <MapaUsuario
        filtro={filtro}
        onSelectPunto={setPuntoSeleccionado}
        onCoordsChange={setCoords}
        destino={destino}
        onListo={() => setCargandoMapa(false)}
      />

      {/* LOADER */}
      {cargandoMapa && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2
            bg-crema/95 backdrop-blur-md z-[999] px-5 py-3
            rounded-2xl shadow-lg flex items-center gap-3 border border-uva/20"
        >
          <div className="animate-spin w-6 h-6 border-4 border-fucsia border-t-transparent rounded-full"></div>
          <span className="text-uva font-fredoka text-lg tracking-wide">
            Buscando lugares cerca…
          </span>
        </div>
      )}

      {/* DESCRIPCIÓN DEL PUNTO */}
      {puntoSeleccionado && (
        <DescripcionPunto
          punto={puntoSeleccionado}
          onClose={() => setPuntoSeleccionado(null)}
          userCoords={coords}
          onVisitar={handleVisitar}
          onNavegar={(coordsDestino) => {
            setDestino(coordsDestino);
            setPuntoSeleccionado(null);
          }}
        />
      )}

      <UserNav />
    </div>
  );
}
