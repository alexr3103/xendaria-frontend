import { useState, useEffect } from "react";
import { categorias } from "./CategoriasFiltros";
import { calcDistance } from "../lib/calcDistance";
import cargafail from "../assets/cargafail.png";
import { 
  Loader2,
  MapPin, 
  Lock, 
  LockOpen, 
  Navigation,
  Pencil,
  Rotate3D,
  X,
} from "lucide-react";
import BotonCerrar from "./BotonCerrar";

function getCategoriasPunto(punto = {}) {
  const valores = [
    ...(Array.isArray(punto.categorias) ? punto.categorias : []),
    punto.categoria,
  ];

  return [...new Set(valores.filter(Boolean))];
}

export default function DescripcionPunto({
  punto,
  onClose,
  userCoords,
  onVisitar,
  onNavegar,
  onEditar,
}) {
  const { _id, nombre, direccion, descripcion, foto, lat, lon } = punto;
  const esPuntoPropio = punto.origen === "usuario" || punto.visibilidad === "privado";
  const [insigniaObtenida, setInsigniaObtenida] = useState(false);
  const [mostrarVistaLugar, setMostrarVistaLugar] = useState(false);
  const [vista360, setVista360] = useState(punto.vista360 || null);
  const [consultandoVista, setConsultandoVista] = useState(false);
  const [errorVista, setErrorVista] = useState("");
  const [registrandoVisita, setRegistrandoVisita] = useState(false);
  const [errorVisita, setErrorVisita] = useState("");
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;
  const vistaVerificada = Boolean(vista360?.ultimaVerificacion);
  const vistaDisponible = Boolean(vista360?.disponible && googleMapsKey);
  const streetViewUrl = vistaDisponible
    ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(
        googleMapsKey
      )}&location=${lat},${lon}&radius=100`
    : null;

  async function abrirVistaLugar() {
    setErrorVista("");

    if (vistaDisponible) {
      setMostrarVistaLugar(true);
      return;
    }

    if (vistaVerificada && !vista360?.disponible) return;

    setConsultandoVista(true);
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      const token = localStorage.getItem("token");
      const url = esPuntoPropio && usuario?.id
        ? `${import.meta.env.VITE_API_URL}/api/usuarios/${usuario.id}/puntos-propios/${_id}/vista-360/consultar`
        : `${import.meta.env.VITE_API_URL}/api/puntos/${_id}/vista-360/consultar`;
      const headers = esPuntoPropio && token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      const response = await fetch(url, { method: "POST", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo consultar");

      setVista360(data.vista360);
      if (data.vista360.disponible) {
        setMostrarVistaLugar(true);
      }
    } catch (error) {
      setErrorVista(error.message);
    } finally {
      setConsultandoVista(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(`insignia-${_id}`);
    if (saved === "true") setInsigniaObtenida(true);
  }, [_id]);

  useEffect(() => {
    setVista360(punto.vista360 || null);
    setMostrarVistaLugar(false);
    setErrorVista("");
  }, [_id, punto.vista360]);

  async function desbloquearInsignia() {
    if (registrandoVisita) return;

    setRegistrandoVisita(true);
    setErrorVisita("");

    try {
      if (onVisitar) {
        await onVisitar(punto, { quedarseEnModal: true });
      }

      localStorage.setItem(`insignia-${_id}`, "true");
      setInsigniaObtenida(true);
    } catch (error) {
      setErrorVisita(error.message || "No se pudo registrar la visita.");
    } finally {
      setRegistrandoVisita(false);
    }
  }

  // Distancia
  let estaCerca = false;
  if (userCoords && lat && lon) {
    const dist = calcDistance(userCoords.lat, userCoords.lng, lat, lon);
    estaCerca = dist <= 100;
  }

  //Categorías 
  const categoriasPunto = getCategoriasPunto(punto).filter((categoria) => categorias[categoria]);

  return (
    <div className="fixed inset-0 bg-morado/10 backdrop-blur-sm flex items-end sm:items-center justify-center px-3 sm:px-4 pt-4 pb-3 sm:py-6 z-[9999]">
      <div className="relative w-full max-w-[430px] max-h-[calc(100dvh-1rem)]">

        {!mostrarVistaLugar && (
          <div className="absolute right-2 top-[62px] z-[9999] translate-x-1/2 -translate-y-1/2 sm:right-3 sm:top-[67px]">
            <BotonCerrar onClick={onClose} />
          </div>
        )}
        
        {/* Card */}
        <div className="absolute top-[52px] sm:top-[55px] left-0 right-0 h-[150px] sm:h-[200px] bg-morado/60 rounded-t-[32px] sm:rounded-t-[40px] z-0"></div>
        {!mostrarVistaLugar && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[18px] sm:top-[40px] z-20">
            <div className="w-[132px] h-[132px] sm:w-[165px] sm:h-[165px] rounded-full border-[5px] sm:border-[6px] border-crema shadow-2xl overflow-hidden bg-crema">
              <img
                src={foto || cargafail}
                alt={nombre}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = cargafail;
                }}
                className="w-full h-full object-cover scale-[1.16]"
              />
            </div>
          </div>
        )}
        <div
          className="
            relative z-10 bg-crema rounded-t-[32px] sm:rounded-[40px] shadow-xl
            mt-[106px] sm:mt-[165px]
            pt-[78px] sm:pt-[100px]
            pb-6 sm:pb-8
            px-5 sm:px-6
            max-h-[calc(100dvh-8rem)] sm:max-h-[calc(100dvh-12rem)]
            overflow-y-auto overflow-x-hidden
          "
        >
          {/* Titulo + insignia */}
          <div className="flex justify-between items-start mb-4">
            <h1 className="font-fredoka text-morado text-[22px] font-semibold leading-tight max-w-[240px]">
              {nombre}
            </h1>
            {!esPuntoPropio && punto.insignia && insigniaObtenida && (
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
            {!esPuntoPropio && punto.insignia && (
              !insigniaObtenida ? (
                <button
                  disabled={!estaCerca || registrandoVisita}
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
                  {registrandoVisita ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  {registrandoVisita ? "Registrando visita..." : "Insignia desbloqueable"}
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
            {errorVisita && (
              <p role="alert" className="w-full text-sm text-fucsia">
                {errorVisita}
              </p>
            )}
            {categoriasPunto.map((categoriaKey) => {
              const categoriaInfo = categorias[categoriaKey];
              const Icon = categoriaInfo.icon;

              return (
                <span
                  key={categoriaKey}
                  className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 text-gris"
                  style={{ backgroundColor: categoriaInfo.color }}
                >
                  {Icon && <Icon size={18} className="text-gris" />}
                  {categoriaInfo.label}
                </span>
              );
            })}
          </div>
          {/* Ver más */}
          {!esPuntoPropio && (
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
          )}
          {esPuntoPropio && (
            <button
              type="button"
              onClick={() => onEditar?.(punto)}
              className="
                w-full py-3 rounded-[16px] font-semibold text-base flex items-center justify-center gap-2 shadow mb-4
                bg-uva text-crema hover:bg-uva/90
              "
            >
              <Pencil size={18} />
              Editar punto
            </button>
          )}
          {/* Vista previa del lugar */}
          <button
            type="button"
            disabled={consultandoVista || (vistaVerificada && !vista360?.disponible)}
            onClick={abrirVistaLugar}
            aria-label={
              !vistaVerificada || vistaDisponible
                ? `Abrir vista 360 de ${nombre}`
                : `No hay vista 360 disponible para ${nombre}`
            }
            className={`
              w-full py-3 rounded-[16px] font-semibold text-base flex items-center justify-center gap-2 shadow mb-4
              ${
                !vistaVerificada || vistaDisponible
                  ? "bg-menta text-uva hover:bg-menta/80"
                  : "bg-gris/10 text-gris/60 cursor-not-allowed"
              }
            `}
          >
            {consultandoVista ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <Rotate3D size={19} />
            )}
            {consultandoVista
              ? "Buscando vista del lugar..."
              : vistaVerificada && !vista360?.disponible
                ? "Vista del lugar no disponible"
                : "Vista del lugar"}
          </button>
          {errorVista && (
            <p role="alert" className="text-sm text-fucsia mb-4 text-center">
              {errorVista}
            </p>
          )}
          {/* Navegar */}
          <button
            onClick={() => onNavegar && onNavegar({ lat, lon })}
            className="
              w-full py-3 rounded-[16px] font-semibold text-base flex items-center justify-center gap-2 shadow 
              bg-morado text-crema hover:bg-morado/90">
            <Navigation size={18} />
            Navegar hasta acá
          </button>

          {mostrarVistaLugar && streetViewUrl && (
            <div
              className="fixed inset-0 z-[10000] bg-gris/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label={`Vista 360 de ${nombre}`}
            >
              <div className="w-full h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-3xl bg-crema rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2 text-uva min-w-0">
                    <Rotate3D size={20} className="shrink-0" />
                    <h2 className="font-fredoka text-base sm:text-lg leading-tight line-clamp-2">
                      {nombre}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarVistaLugar(false)}
                    title="Cerrar vista del lugar"
                    aria-label="Cerrar vista del lugar"
                    className="p-2 rounded-xl text-uva hover:bg-uva/10 shrink-0"
                  >
                    <X size={22} />
                  </button>
                </div>
                <iframe
                  src={streetViewUrl}
                  title={`Vista 360 de ${nombre}`}
                  className="w-full flex-1 min-h-0 sm:flex-none sm:aspect-video sm:min-h-[300px]"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
