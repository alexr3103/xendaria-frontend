import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../layouts/Header.jsx";
import MapaUsuario from "../../components/Mapa_usuarios.jsx";
import UserNav from "../../components/Navbar.jsx";
import DescripcionPunto from "../../components/DescripcionPunto.jsx";
import Alert from "../../components/Alertas.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import CargadorMapa from "../../components/CargadorMapa.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";
import {
  Check,
  CheckCircle2,
  Flag,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Pause,
  Plus,
  Save,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { categorias as categoriasInfo } from "../../components/CategoriasFiltros.jsx";
import { getMensajeError } from "../../lib/errores.js";

const CATEGORIA_DEFAULT = "propios";
const FOTO_KEY_DEFAULT = "propios";
const CATEGORIA_COMERCIOS = "comercios";

const imagenesPuntoPropio = import.meta.glob(
  "../../assets/puntos-propios/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" }
);

function getImagenPuntoPropio(fotoKey) {
  const entrada = Object.entries(imagenesPuntoPropio).find(([path]) =>
    path.includes(`/puntos-propios/${fotoKey}.`)
  );

  return entrada?.[1] || null;
}

const FOTOS_PUNTO_PROPIO = [
  {
    id: "propios",
    label: "Propios",
    fotoKey: "propios",
  },
  {
    id: "puntos_populares",
    label: "Popular",
    fotoKey: "puntos_populares",
  },
  {
    id: "paradas_de_bus_turistico",
    label: "Bus",
    fotoKey: "paradas_de_bus_turistico",
  },
  {
    id: "paseo_de_la_historieta",
    label: "Historieta",
    fotoKey: "paseo_de_la_historieta",
  },
  {
    id: "espacios_verdes_publicos",
    label: "Parque",
    fotoKey: "espacios_verdes_publicos",
  },
  {
    id: "espacios_verdes_privados",
    label: "Jardin",
    fotoKey: "espacios_verdes_privados",
  },
  {
    id: "lugares_de_esparcimiento",
    label: "Recreación",
    fotoKey: "lugares_de_esparcimiento",
  },
  {
    id: "curiosos",
    label: "Curioso",
    fotoKey: "curiosos",
  },
];

const PUNTO_PROPIO_INICIAL = {
  nombre: "",
  descripcion: "",
  categoria: CATEGORIA_DEFAULT,
  direccion: "",
  fotoKey: FOTO_KEY_DEFAULT,
};

const RADIO_PUNTO_RUTA_KM = 0.08;

function getUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem("usuario"));
  } catch {
    return null;
  }
}

function getPuntoId(punto) {
  if (!punto) return "";
  if (typeof punto === "string") return punto;
  if (punto.$oid) return punto.$oid;
  if (punto._id?.$oid) return punto._id.$oid;
  if (punto.id?.$oid) return punto.id.$oid;
  return String(punto._id || punto.id || "");
}

function getCoordsPunto(punto) {
  const lat = Number(punto?.lat);
  const lon = Number(punto?.lon);

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }

  const coordinates = punto?.ubicacion?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    return {
      lat: Number(coordinates[1]),
      lon: Number(coordinates[0]),
    };
  }

  return null;
}

function distanciaKm(origen, destino) {
  if (!origen || !destino) return Infinity;

  const lat1 = Number(origen.lat);
  const lon1 = Number(origen.lng ?? origen.lon);
  const lat2 = Number(destino.lat);
  const lon2 = Number(destino.lng ?? destino.lon);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;

  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function ordenarPuntosSugeridos(puntos = [], coordsUsuario) {
  const pendientes = puntos.filter((punto) => getCoordsPunto(punto));
  if (!coordsUsuario || pendientes.length <= 1) return pendientes;

  const ordenados = [];
  let cursor = { lat: coordsUsuario.lat, lng: coordsUsuario.lng };

  while (pendientes.length > 0) {
    let indiceCercano = 0;
    let distanciaCercana = Infinity;

    pendientes.forEach((punto, index) => {
      const puntoCoords = getCoordsPunto(punto);
      const distancia = distanciaKm(cursor, puntoCoords);

      if (distancia < distanciaCercana) {
        distanciaCercana = distancia;
        indiceCercano = index;
      }
    });

    const [siguiente] = pendientes.splice(indiceCercano, 1);
    ordenados.push(siguiente);
    const siguienteCoords = getCoordsPunto(siguiente);
    cursor = { lat: siguienteCoords.lat, lng: siguienteCoords.lon };
  }

  return ordenados;
}

function normalizarPuntoPropio(punto) {
  const fotoKey = punto.fotoKey || punto.categoria || FOTO_KEY_DEFAULT;

  return {
    ...punto,
    categoria: punto.categoria || CATEGORIA_DEFAULT,
    fotoKey,
    foto: punto.foto || getImagenPuntoPropio(fotoKey) || "",
    origen: "usuario",
    visibilidad: "privado",
  };
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const token = localStorage.getItem("token");
  const recenterDesdeDetalle = location.state?.recenterUser || 0;
  const puntoPropioIdDesdePerfil = location.state?.puntoPropioId || null;
  const puntoDesdePerfil = location.state?.puntoEnFoco || null;
  const rutaDesdeRutas = location.state?.rutaActiva || null;

  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState(null);

  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [coords, setCoords] = useState(null);
  const [destino, setDestino] = useState(null);
  const [cargandoMapa, setCargandoMapa] = useState(true);
  const [modalPuntoPropio, setModalPuntoPropio] = useState(false);
  const [puntoPropioForm, setPuntoPropioForm] = useState(PUNTO_PROPIO_INICIAL);
  const [puntoPropioCoords, setPuntoPropioCoords] = useState(null);
  const [direccionBusqueda, setDireccionBusqueda] = useState("");
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [direccionCalculada, setDireccionCalculada] = useState(false);
  const [guardandoPuntoPropio, setGuardandoPuntoPropio] = useState(false);
  const [mensajePuntoPropio, setMensajePuntoPropio] = useState(null);
  const [puntosPropios, setPuntosPropios] = useState([]);
  const [puntoPropioEditando, setPuntoPropioEditando] = useState(null);
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState(false);
  const [ajustandoUbicacion, setAjustandoUbicacion] = useState(false);
  const [coordsAntesAjuste, setCoordsAntesAjuste] = useState(null);
  const [ubicacionConfirmadaAntesAjuste, setUbicacionConfirmadaAntesAjuste] =
    useState(false);
  const [ajusteDesdeDireccion, setAjusteDesdeDireccion] = useState(false);
  const [recenterManualToken, setRecenterManualToken] = useState(0);
  const [puntoEnFoco, setPuntoEnFoco] = useState(null);
  const [puntosPropiosCargados, setPuntosPropiosCargados] = useState(false);
  const [mensajeFocoPunto, setMensajeFocoPunto] = useState("");
  const [rutaEnCurso, setRutaEnCurso] = useState(null);
  const [rutaCompletados, setRutaCompletados] = useState([]);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [confirmarCancelacionRuta, setConfirmarCancelacionRuta] =
    useState(false);
  const [esperandoGeoInicial, setEsperandoGeoInicial] = useState(true);
  const finalizarCargaMapa = useCallback(() => setCargandoMapa(false), []);

  useEffect(() => {
    if (coords) {
      setEsperandoGeoInicial(false);
      return undefined;
    }

    const timeout = setTimeout(() => {
      setEsperandoGeoInicial(false);
    }, 12000);

    return () => clearTimeout(timeout);
  }, [coords]);

  useEffect(() => {
    if (!rutaDesdeRutas?.ruta) return;

    setPuntoSeleccionado(null);
    setDestino(null);
    setRutaEnCurso({
      ruta: rutaDesdeRutas.ruta,
      modo: rutaDesdeRutas.modo || "corta",
      puntosBase: Array.isArray(rutaDesdeRutas.puntosBase)
        ? rutaDesdeRutas.puntosBase
        : rutaDesdeRutas.ruta.puntos || [],
    });
    setRutaCompletados(
      Array.isArray(rutaDesdeRutas.completados) ? rutaDesdeRutas.completados : []
    );
    setMensajeFocoPunto(
      rutaDesdeRutas.retomando ? "Ruta retomada..." : "Ruta iniciada..."
    );
    navigate("/home", { replace: true, state: null });
    setTimeout(() => setMensajeFocoPunto(""), 1400);
  }, [navigate, rutaDesdeRutas]);

  useEffect(() => {
    fetch(`${API}/api/puntos`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los puntos");
        return res.json();
      })
      .then((data) => {
        const cats = [
          ...new Set([
            ...data
              .flatMap((p) => [
                ...(Array.isArray(p.categorias) ? p.categorias : []),
                p.categoria,
              ])
              .filter(Boolean),
            CATEGORIA_COMERCIOS,
            "propios",
          ]),
        ];
        setCategorias(cats);
      })
      .catch(() => setCategorias([CATEGORIA_COMERCIOS, "propios"]));
  }, [API, token]);

  useEffect(() => {
    if (!puntoPropioIdDesdePerfil) return;

    const coordsDesdePerfil = getCoordsPunto(puntoDesdePerfil);

    if (coordsDesdePerfil) {
      setFiltro(null);
      setDestino(null);
      setPuntoSeleccionado(null);
      setPuntoEnFoco({
        id: getPuntoId(puntoDesdePerfil) || String(puntoPropioIdDesdePerfil),
        lat: coordsDesdePerfil.lat,
        lon: coordsDesdePerfil.lon,
      });
      setMensajeFocoPunto("Centrando tu punto...");
      navigate("/home", { replace: true, state: null });
      setTimeout(() => setMensajeFocoPunto(""), 1400);
      return;
    }

    if (!puntosPropiosCargados) {
      setMensajeFocoPunto("Buscando tu punto...");
      return;
    }

    const punto = puntosPropios.find(
      (item) => getPuntoId(item) === String(puntoPropioIdDesdePerfil)
    );

    if (!punto) {
      setMensajeFocoPunto("No encontramos ese punto.");
      navigate("/home", { replace: true, state: null });
      setTimeout(() => setMensajeFocoPunto(""), 1800);
      return;
    }

    const lat = Number(punto.lat);
    const lon = Number(punto.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMensajeFocoPunto("No pudimos ubicar ese punto.");
      navigate("/home", { replace: true, state: null });
      setTimeout(() => setMensajeFocoPunto(""), 1800);
      return;
    }

    setFiltro(null);
    setDestino(null);
    setPuntoSeleccionado(null);
    setPuntoEnFoco({
      id: getPuntoId(punto),
      lat,
      lon,
    });
    setMensajeFocoPunto("Centrando tu punto...");
    navigate("/home", { replace: true, state: null });
    setTimeout(() => setMensajeFocoPunto(""), 1400);
  }, [
    navigate,
    puntoDesdePerfil,
    puntoPropioIdDesdePerfil,
    puntosPropios,
    puntosPropiosCargados,
  ]);

  useEffect(() => {
    const usuario = getUsuarioLocal();
    const token = localStorage.getItem("token");
    const usuarioId = usuario?.id || usuario?._id;

    if (!usuarioId || !token) {
      setPuntosPropiosCargados(true);
      return;
    }

    let activo = true;
    setPuntosPropiosCargados(false);

    fetch(`${API}/api/usuarios/${usuarioId}/puntos-propios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "No se pudo guardar el punto propio.");
        }
        return res.json();
      })
      .then((data) => {
        if (activo && Array.isArray(data)) {
          setPuntosPropios(data.map(normalizarPuntoPropio));
        }
      })
      .catch(() => {
        if (activo) setPuntosPropios([]);
      })
      .finally(() => {
        if (activo) setPuntosPropiosCargados(true);
      });

    return () => {
      activo = false;
    };
  }, [API]);

  // Categoria que se esta usando
  const categoriaActiva = filtro ? categoriasInfo[filtro] : null;
  const IconoCategoriaActiva = categoriaActiva?.icon;
  const mostrarCargandoGeo =
    esperandoGeoInicial &&
    !coords &&
    !puntoSeleccionado &&
    !destino &&
    !rutaEnCurso &&
    !modalPuntoPropio &&
    !ajustandoUbicacion;
  const rutaCompletadosSet = useMemo(
    () => new Set(rutaCompletados),
    [rutaCompletados]
  );
  const puntosRutaEnCurso = useMemo(
    () =>
      rutaEnCurso
        ? ordenarPuntosSugeridos(
            rutaEnCurso.puntosBase || rutaEnCurso.ruta?.puntos || [],
            coords
          )
        : [],
    [coords, rutaEnCurso]
  );
  const siguientePuntoRuta = puntosRutaEnCurso.find(
    (punto) => !rutaCompletadosSet.has(getPuntoId(punto))
  );
  const siguientePuntoCoords = getCoordsPunto(siguientePuntoRuta);
  const destinoRuta = siguientePuntoCoords
    ? {
        lat: siguientePuntoCoords.lat,
        lon: siguientePuntoCoords.lon,
      }
    : null;
  const destinoMapa = destino || destinoRuta;

  const guardarProgresoRuta = useCallback(
    async (estado = "pausada", puntosCompletados = rutaCompletados) => {
      if (!rutaEnCurso?.ruta?._id) return null;

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return null;
      }

      const res = await fetch(`${API}/api/rutas/${rutaEnCurso.ruta._id}/progreso`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modo: rutaEnCurso.modo,
          puntosCompletados,
          estado,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo guardar el progreso.");
      }

      return data;
    },
    [API, navigate, rutaCompletados, rutaEnCurso]
  );

  const completarRutaEnCurso = useCallback(
    async (puntosCompletados) => {
      if (!rutaEnCurso?.ruta?._id) return;

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setGuardandoRuta(true);
      try {
        const res = await fetch(`${API}/api/rutas/${rutaEnCurso.ruta._id}/completar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            modo: rutaEnCurso.modo,
            puntosCompletados,
          }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "No se pudo completar la ruta.");
        }

        setRutaEnCurso(null);
        setRutaCompletados([]);
        setDestino(null);
        setMensajeFocoPunto("Ruta completada.");
      } catch (error) {
        setMensajeFocoPunto(
          getMensajeError(error, "No se pudo completar la ruta.")
        );
      } finally {
        setGuardandoRuta(false);
        setTimeout(() => setMensajeFocoPunto(""), 1600);
      }
    },
    [API, navigate, rutaEnCurso]
  );

  async function registrarVisitaPunto(punto) {
    const usuario = getUsuarioLocal();
    const token = localStorage.getItem("token");
    const usuarioId = usuario?.id || usuario?._id;
    const idPunto = getPuntoId(punto);

    if (!usuarioId || !token) {
      navigate("/login");
      throw new Error("Tenés que iniciar sesión para registrar la visita.");
    }

    const res = await fetch(`${API}/api/usuarios/${usuarioId}/visitados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        idPunto,
        ubicacionActual: coords
          ? { lat: coords.lat, lng: coords.lng }
          : null,
      }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "No se pudo registrar la visita.");
    }

    return data;
  }

  async function handleVisitar(punto, opciones = {}) {
    try {
      await registrarVisitaPunto(punto);
    } catch (error) {
      if (opciones.quedarseEnModal) throw error;

      setMensajeFocoPunto(
        getMensajeError(error, "No se pudo registrar la visita.")
      );
      setTimeout(() => setMensajeFocoPunto(""), 1600);
      return;
    }

    if (opciones.quedarseEnModal) return;

    setPuntoSeleccionado(null);
    navigate(`/punto/${punto._id}`);
  }

  function volverAMiUbicacion() {
    setPuntoEnFoco(null);
    setPuntoSeleccionado(null);
    setDestino(null);
    setMensajeFocoPunto("Volviendo a tu ubicación...");
    setRecenterManualToken(Date.now());
    setTimeout(() => setMensajeFocoPunto(""), 1200);
  }

  async function descartarProgresoRutaEnCurso() {
    if (!rutaEnCurso?.ruta?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(
      `${API}/api/rutas/${rutaEnCurso.ruta._id}/progreso?modo=${rutaEnCurso.modo}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  async function pausarRutaEnCurso() {
    if (!rutaEnCurso) return;

    setGuardandoRuta(true);
    try {
      await guardarProgresoRuta("pausada");
      setRutaEnCurso(null);
      setRutaCompletados([]);
      setDestino(null);
      setMensajeFocoPunto("Ruta pausada.");
    } catch (error) {
      setMensajeFocoPunto(
        getMensajeError(error, "No se pudo pausar la ruta.")
      );
    } finally {
      setGuardandoRuta(false);
      setTimeout(() => setMensajeFocoPunto(""), 1400);
    }
  }

  async function cancelarRutaEnCurso() {
    if (!rutaEnCurso) return;

    setConfirmarCancelacionRuta(false);
    setGuardandoRuta(true);
    try {
      if (rutaCompletados.length > 0) {
        await guardarProgresoRuta("pausada");
        setMensajeFocoPunto("Ruta cancelada y progreso guardado.");
      } else {
        await descartarProgresoRutaEnCurso();
        setMensajeFocoPunto("Ruta cancelada.");
      }

      setRutaEnCurso(null);
      setRutaCompletados([]);
      setDestino(null);
    } catch (error) {
      setMensajeFocoPunto(
        getMensajeError(error, "No se pudo cancelar la ruta.")
      );
    } finally {
      setGuardandoRuta(false);
      setTimeout(() => setMensajeFocoPunto(""), 1600);
    }
  }

  const actualizarCoordsPuntoPropio = useCallback((nextCoords, opciones = {}) => {
    setPuntoPropioCoords(nextCoords);
    if (opciones.confirmado) {
      setUbicacionConfirmada(true);
    }
  }, []);

  function abrirModalPuntoPropio() {
    setPuntoSeleccionado(null);
    setDestino(null);
    setPuntoPropioEditando(null);
    setPuntoPropioForm(PUNTO_PROPIO_INICIAL);
    setDireccionBusqueda("");
    setDireccionCalculada(false);
    setMensajePuntoPropio(null);
    setUbicacionConfirmada(false);
    setAjustandoUbicacion(false);
    setAjusteDesdeDireccion(false);
    setPuntoPropioCoords(
      coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
          }
        : null
    );
    setModalPuntoPropio(true);
  }

  function abrirEditarPuntoPropio(punto) {
    setPuntoSeleccionado(null);
    setDestino(null);
    setPuntoPropioEditando(punto);
    setPuntoPropioForm({
      nombre: punto.nombre || "",
      descripcion: punto.descripcion || "",
      categoria: punto.categoria || CATEGORIA_DEFAULT,
      direccion: punto.direccion || "",
      fotoKey: punto.fotoKey || punto.categoria || FOTO_KEY_DEFAULT,
    });
    setDireccionBusqueda(punto.direccion || "");
    setDireccionCalculada(true);
    setMensajePuntoPropio(null);
    setUbicacionConfirmada(true);
    setAjustandoUbicacion(false);
    setAjusteDesdeDireccion(false);
    setPuntoPropioCoords({
      lat: Number(punto.lat),
      lng: Number(punto.lon),
    });
    setModalPuntoPropio(true);
  }

  function cerrarModalPuntoPropio() {
    setModalPuntoPropio(false);
    setPuntoPropioEditando(null);
    setPuntoPropioCoords(null);
    setDireccionCalculada(false);
    setMensajePuntoPropio(null);
    setUbicacionConfirmada(false);
    setAjustandoUbicacion(false);
    setAjusteDesdeDireccion(false);
    setCoordsAntesAjuste(null);
  }

  function iniciarAjusteUbicacion() {
    if (!puntoPropioCoords) {
      setMensajePuntoPropio({
        variant: "error",
        text: "Todavía no hay una ubicación para ajustar.",
      });
      return;
    }

    setCoordsAntesAjuste(puntoPropioCoords);
    setUbicacionConfirmadaAntesAjuste(ubicacionConfirmada);
    setUbicacionConfirmada(false);
    setAjusteDesdeDireccion(false);
    setMensajePuntoPropio(null);
    setModalPuntoPropio(false);
    setAjustandoUbicacion(true);
  }

  function confirmarAjusteUbicacion() {
    setUbicacionConfirmada(true);
    setDireccionCalculada(true);
    setAjustandoUbicacion(false);
    setAjusteDesdeDireccion(false);
    setMensajePuntoPropio({
      variant: "success",
      text: "Ubicación lista. Ya podés guardar el punto.",
    });
    setModalPuntoPropio(true);
  }

  function cancelarAjusteUbicacion() {
    if (ajusteDesdeDireccion) {
      setUbicacionConfirmada(false);
    } else {
      setPuntoPropioCoords(coordsAntesAjuste);
      setUbicacionConfirmada(ubicacionConfirmadaAntesAjuste);
    }
    setAjustandoUbicacion(false);
    setAjusteDesdeDireccion(false);
    setModalPuntoPropio(true);
  }

  async function buscarDireccionPuntoPropio() {
    const query = direccionBusqueda.trim();
    if (!query) return;

    if (!MAPBOX_TOKEN) {
      setMensajePuntoPropio({
        variant: "error",
        text: "No está configurado el buscador de direcciones.",
      });
      return;
    }

    setBuscandoDireccion(true);
    setDireccionCalculada(false);
    setMensajePuntoPropio(null);

    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: "ar",
        language: "es",
        limit: "1",
      });

      if (coords) {
        params.set("proximity", `${coords.lng},${coords.lat}`);
      }

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?${params.toString()}`
      );
      const data = await res.json();
      const feature = data.features?.[0];

      if (!feature) {
        setDireccionCalculada(false);
        setMensajePuntoPropio({
          variant: "error",
          text: "No encontramos esa dirección. Revisala e intentá nuevamente.",
        });
        return;
      }

      const [lng, lat] = feature.center;
      const direccionEncontrada = feature.place_name || query;

      setCoordsAntesAjuste(puntoPropioCoords);
      setUbicacionConfirmadaAntesAjuste(ubicacionConfirmada);
      setPuntoPropioCoords({ lat, lng });
      setUbicacionConfirmada(false);
      setDireccionCalculada(true);
      setDireccionBusqueda(direccionEncontrada);
      setPuntoPropioForm((actual) => ({
        ...actual,
        direccion: direccionEncontrada,
      }));
      setAjusteDesdeDireccion(true);
      setModalPuntoPropio(false);
      setAjustandoUbicacion(true);
    } catch {
      setDireccionCalculada(false);
      setMensajePuntoPropio({
        variant: "error",
        text: "No pudimos calcular la ubicación. Intentá nuevamente.",
      });
    } finally {
      setBuscandoDireccion(false);
    }
  }

  async function guardarPuntoPropio(event) {
    event.preventDefault();

    const usuario = getUsuarioLocal();
    const token = localStorage.getItem("token");
    const usuarioId = usuario?.id || usuario?._id;

    if (!usuarioId || !token) {
      navigate("/login");
      return;
    }

    if (!puntoPropioForm.nombre.trim() || !puntoPropioForm.descripcion.trim()) {
      setMensajePuntoPropio({
        variant: "error",
        text: "Nombre y descripción son obligatorios.",
      });
      return;
    }

    if (!puntoPropioForm.direccion.trim()) {
      setMensajePuntoPropio({
        variant: "error",
        text: "La dirección es obligatoria.",
      });
      return;
    }

    if (!puntoPropioCoords) {
      setMensajePuntoPropio({
        variant: "error",
        text: "Todavía no hay una ubicación para el punto.",
      });
      return;
    }

    if (!ubicacionConfirmada) {
      setMensajePuntoPropio({
        variant: "error",
        text: "Ubicá y confirmá el pin en el mapa antes de guardar.",
      });
      return;
    }

    const lat = Number(puntoPropioCoords.lat);
    const lon = Number(puntoPropioCoords.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setMensajePuntoPropio({
        variant: "error",
        text: "La ubicación del punto no es válida.",
      });
      return;
    }

    setGuardandoPuntoPropio(true);
    setMensajePuntoPropio(null);

    try {
      const editando = Boolean(puntoPropioEditando?._id);
      const res = await fetch(
        editando
          ? `${API}/api/usuarios/${usuarioId}/puntos-propios/${puntoPropioEditando._id}`
          : `${API}/api/usuarios/${usuarioId}/puntos-propios`,
        {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: puntoPropioForm.nombre.trim(),
          descripcion: puntoPropioForm.descripcion.trim(),
          categoria: puntoPropioForm.categoria,
          direccion: puntoPropioForm.direccion.trim(),
          fotoKey: puntoPropioForm.fotoKey,
          lat,
          lon,
          ubicacion: {
            type: "Point",
            coordinates: [lon, lat],
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar el punto.");
      }

      const puntoCreado = normalizarPuntoPropio({
        ...(data.punto || data.nuevoPunto || {}),
        _id:
          data.punto?._id ||
          data.nuevoPunto?._id ||
          puntoPropioEditando?._id ||
          `propio-${Date.now()}`,
        nombre: puntoPropioForm.nombre.trim(),
        descripcion: puntoPropioForm.descripcion.trim(),
        categoria: puntoPropioForm.categoria,
        direccion: puntoPropioForm.direccion.trim(),
        fotoKey: puntoPropioForm.fotoKey,
        lat,
        lon,
        origen: "usuario",
        visibilidad: "privado",
      });

      setPuntosPropios((actuales) =>
        editando
          ? actuales.map((punto) =>
              punto._id === puntoCreado._id ? puntoCreado : punto
            )
          : [
              puntoCreado,
              ...actuales.filter((punto) => punto._id !== puntoCreado._id),
            ]
      );

      setMensajePuntoPropio({
        variant: "success",
        text: editando
          ? "Punto propio editado correctamente."
          : "Punto propio creado correctamente.",
      });

      setTimeout(cerrarModalPuntoPropio, 800);
    } catch (error) {
      setMensajePuntoPropio({
        variant: "error",
        text: getMensajeError(error, "No se pudo guardar el punto."),
      });
    } finally {
      setGuardandoPuntoPropio(false);
    }
  }

  useEffect(() => {
    if (!rutaEnCurso || !coords || guardandoRuta) return;

    const nuevos = [];
    puntosRutaEnCurso.forEach((punto) => {
      const id = getPuntoId(punto);
      if (!id || rutaCompletadosSet.has(id)) return;

      const puntoCoords = getCoordsPunto(punto);
      if (distanciaKm(coords, puntoCoords) <= RADIO_PUNTO_RUTA_KM) {
        nuevos.push(id);
      }
    });

    if (nuevos.length === 0) return;

    const actualizados = [...new Set([...rutaCompletados, ...nuevos])];
    setRutaCompletados(actualizados);
    setMensajeFocoPunto(
      nuevos.length === 1 ? "Punto de ruta registrado." : "Puntos de ruta registrados."
    );
    setTimeout(() => setMensajeFocoPunto(""), 1300);

    if (
      actualizados.length >= puntosRutaEnCurso.length &&
      puntosRutaEnCurso.length >= 3
    ) {
      completarRutaEnCurso(actualizados);
      return;
    }

    guardarProgresoRuta("en_progreso", actualizados).catch(() => {});
  }, [
    completarRutaEnCurso,
    coords,
    guardandoRuta,
    guardarProgresoRuta,
    puntosRutaEnCurso,
    rutaCompletados,
    rutaCompletadosSet,
    rutaEnCurso,
  ]);

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
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-uva"
              aria-label="Quitar filtro"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Boton cancelar navegacion */}
      {destino && !rutaEnCurso && (
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
        puntoPropioDraft={ajustandoUbicacion ? puntoPropioCoords : null}
        puntoPropioCategoria={puntoPropioForm.categoria}
        puntoPropioEditandoId={
          ajustandoUbicacion ? puntoPropioEditando?._id : null
        }
        onPuntoPropioCoordsChange={actualizarCoordsPuntoPropio}
        puntosPropios={puntosPropios}
        puntoEnFoco={puntoEnFoco}
        recenterToken={recenterDesdeDetalle || recenterManualToken}
        destino={destinoMapa}
        onListo={finalizarCargaMapa}
      />

      {mensajeFocoPunto && (
        <CargadorMapa
          text={mensajeFocoPunto}
          className={`${cargandoMapa ? "top-40" : "top-24"} z-[1000]`}
        />
      )}

      {cargandoMapa && (
        <CargadorMapa
          text={
            mostrarCargandoGeo
              ? "Buscando ubicación..."
              : "Buscando puntos..."
          }
          className="top-24 z-[999]"
        />
      )}

      {!cargandoMapa && mostrarCargandoGeo && (
        <CargadorMapa text="Buscando ubicación..." className="top-24 z-[999]" />
      )}

      {rutaEnCurso && (
        <RutaEnCursoPanel
          ruta={rutaEnCurso.ruta}
          modo={rutaEnCurso.modo}
          puntos={puntosRutaEnCurso}
          completados={rutaCompletadosSet}
          siguiente={siguientePuntoRuta}
          guardando={guardandoRuta}
          onPausar={pausarRutaEnCurso}
          onCancelar={() => setConfirmarCancelacionRuta(true)}
        />
      )}

      {/* Descripcion del punto */}
      {puntoSeleccionado && (
        <DescripcionPunto
          punto={puntoSeleccionado}
          onClose={() => {
            setPuntoSeleccionado(null);
            setRecenterManualToken(Date.now());
          }}
          userCoords={coords}
          onVisitar={handleVisitar}
          onEditar={abrirEditarPuntoPropio}
          onNavegar={(coordsDestino) => {
            setDestino(coordsDestino);
            setPuntoSeleccionado(null);
          }}
        />
      )}

      {!puntoSeleccionado &&
        !destino &&
        !rutaEnCurso &&
        !modalPuntoPropio &&
        !ajustandoUbicacion && (
          <div className="absolute right-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[900] flex flex-col items-center gap-3 sm:right-4">
            <button
              type="button"
              onClick={volverAMiUbicacion}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-uva/10 bg-crema text-morado shadow-xl transition active:scale-95"
              aria-label="Volver a mi ubicación"
              title="Volver a mi ubicación"
            >
              <LocateFixed size={23} />
            </button>

            <button
              type="button"
              onClick={abrirModalPuntoPropio}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-morado text-crema shadow-xl transition active:scale-95"
              aria-label="Agregar punto propio"
              title="Agregar punto propio"
            >
              <Plus size={28} />
            </button>
          </div>
        )}

      {ajustandoUbicacion && (
        <div className="absolute inset-x-0 bottom-[86px] z-[1200] px-4 pointer-events-none">
          <div className="mx-auto max-w-md bg-crema rounded-3xl shadow-2xl border border-uva/15 p-4 pointer-events-auto">
            <div className="flex items-start gap-3 mb-4">
              <LocateFixed size={24} className="text-morado shrink-0 mt-1" />
              <div>
                <h2 className="font-fredoka text-xl text-uva">
                  Confirmá la ubicación
                </h2>
                <p className="text-sm text-uva/70">
                  {ajusteDesdeDireccion
                    ? "Calculamos este punto desde la dirección. Arrastrá el pin si hace falta."
                    : "Arrastrá el pin hasta el lugar correcto."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={cancelarAjusteUbicacion}
                className="inline-flex items-center justify-center gap-2 bg-fucsia text-white py-3 rounded-2xl font-bold shadow active:scale-95 transition"
              >
                <X size={18} aria-hidden="true" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAjusteUbicacion}
                disabled={!puntoPropioCoords}
                className="bg-morado text-crema py-3 rounded-2xl font-bold shadow active:scale-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPuntoPropio && (
        <div
          className="absolute inset-0 z-[1100] pointer-events-none flex items-center justify-center overflow-x-hidden bg-uva/10 px-3 py-4 backdrop-blur-[1px]"
        >
          <div className="relative pointer-events-auto w-full max-w-md">
            <div className="absolute right-1 top-1 z-20 translate-x-[30%] -translate-y-[30%] sm:right-0 sm:top-0 sm:translate-x-1/2 sm:-translate-y-1/2">
              <BotonCerrar onClick={cerrarModalPuntoPropio} />
            </div>
          <form
            onSubmit={guardarPuntoPropio}
            className={`w-full bg-white rounded-3xl shadow-2xl border border-uva/10 p-4 flex flex-col gap-4 overflow-y-auto ${
              puntoPropioEditando ? "max-h-[86dvh]" : "max-h-[82dvh]"
            }`}
          >
            <div className="pr-12">
                <h2 className="font-fredoka text-2xl text-morado">
                  {puntoPropioEditando ? "Editar punto" : "Agregar punto"}
                </h2>
                <p className="text-sm text-uva/70">
                  {puntoPropioEditando
                    ? "Actualizá los datos de tu punto."
                    : "Quedará guardado solo en tu perfil."}
                </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-crema px-3 py-3 text-uva">
              <Info size={20} className="mt-0.5 shrink-0 text-morado" />
              <p className="text-sm leading-relaxed">
                Completá la dirección, ubicá el pin en el mapa y confirmá la
                posición antes de guardar.
              </p>
            </div>

            {mensajePuntoPropio && (
              <Alert variant={mensajePuntoPropio.variant}>
                {mensajePuntoPropio.text}
              </Alert>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-uva/80">
              Nombre
              <input
                value={puntoPropioForm.nombre}
                onChange={(event) =>
                  setPuntoPropioForm((actual) => ({
                    ...actual,
                    nombre: event.target.value,
                  }))
                }
                maxLength={90}
                className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none focus:border-morado"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-semibold text-uva/80">
              Categoría
              <select
                value={puntoPropioForm.categoria}
                onChange={(event) =>
                  setPuntoPropioForm((actual) => ({
                    ...actual,
                    categoria: event.target.value,
                    fotoKey: event.target.value,
                  }))
                }
                className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none focus:border-morado"
              >
                {Object.entries(categoriasInfo)
                  .filter(([value]) => value !== CATEGORIA_COMERCIOS)
                  .map(([value, categoria]) => (
                    <option key={value} value={value}>
                      {categoria.label}
                    </option>
                  ))}
              </select>
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-uva/80">
                Imagen del punto
              </span>
              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="flex gap-3 min-w-max px-1">
                  {FOTOS_PUNTO_PROPIO.map((foto) => {
                    const seleccionada =
                      puntoPropioForm.fotoKey === foto.fotoKey;
                    const categoriaFoto = categoriasInfo[foto.id];
                    const IconoFoto = categoriaFoto?.icon;
                    const imagenSrc = getImagenPuntoPropio(foto.fotoKey);

                    return (
                      <button
                        key={foto.fotoKey}
                        type="button"
                        onClick={() =>
                          setPuntoPropioForm((actual) => ({
                            ...actual,
                            categoria: foto.id,
                            fotoKey: foto.fotoKey,
                          }))
                        }
                        className="flex flex-col items-center gap-1 shrink-0"
                        aria-pressed={seleccionada}
                      >
                        <span
                          className={`relative w-20 h-20 rounded-full border-4 shadow-md overflow-hidden flex items-center justify-center transition ${
                            seleccionada
                              ? "border-morado scale-105"
                              : "border-crema"
                          }`}
                          style={{
                            backgroundColor: categoriaFoto?.color || "#F4EFFF",
                          }}
                        >
                          {IconoFoto && (
                            <IconoFoto
                              size={26}
                              className="absolute text-uva/70 pointer-events-none"
                            />
                          )}
                          {imagenSrc && (
                            <img
                              src={imagenSrc}
                              alt=""
                              className="relative z-10 h-[116%] w-[116%] max-w-none object-cover"
                            />
                          )}
                        </span>
                        <span className="text-[11px] font-semibold text-uva/70 max-w-20 truncate">
                          {foto.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm font-semibold text-uva/80">
              Descripción
              <textarea
                value={puntoPropioForm.descripcion}
                onChange={(event) =>
                  setPuntoPropioForm((actual) => ({
                    ...actual,
                    descripcion: event.target.value,
                  }))
                }
                maxLength={500}
                className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none focus:border-morado h-28 resize-none"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-uva/80">
                Dirección
              </span>
              <div className="flex gap-2">
                <input
                  value={direccionBusqueda}
                  onChange={(event) => {
                    setDireccionBusqueda(event.target.value);
                    setPuntoPropioForm((actual) => ({
                      ...actual,
                      direccion: event.target.value,
                    }));
                    setPuntoPropioCoords(null);
                    setDireccionCalculada(false);
                    setUbicacionConfirmada(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      buscarDireccionPuntoPropio();
                    }
                  }}
                  placeholder="Ej. Av. Corrientes 1234"
                  className="min-w-0 flex-1 p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none focus:border-morado"
                />
                <button
                  type="button"
                  onClick={buscarDireccionPuntoPropio}
                  disabled={buscandoDireccion || !direccionBusqueda.trim()}
                  className="min-w-[92px] rounded-xl bg-uva px-3 text-crema flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                  aria-label="Calcular ubicación desde la dirección"
                >
                  {buscandoDireccion ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <MapPin size={19} />
                  )}
                  <span>{buscandoDireccion ? "Ubicando" : "Ubicar"}</span>
                </button>
              </div>

              <div aria-live="polite">
                {buscandoDireccion && (
                  <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl bg-morado/10 px-3 py-2 text-sm font-semibold text-uva"
                  >
                    <Loader2 size={17} className="shrink-0 animate-spin text-morado" />
                    Calculando latitud y longitud automáticamente...
                  </div>
                )}

                {!buscandoDireccion &&
                  direccionCalculada &&
                  !ubicacionConfirmada && (
                    <div className="flex items-center gap-2 rounded-xl bg-menta/25 px-3 py-2 text-sm font-semibold text-uva">
                      <CheckCircle2 size={17} className="shrink-0 text-uva" />
                      Coordenadas calculadas. Revisá el pin en el mapa.
                    </div>
                  )}
              </div>
            </div>

            <div className="rounded-2xl bg-crema border border-uva/10 p-3 flex items-center gap-3">
              <LocateFixed size={22} className="text-morado shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-uva">Ubicación del pin</p>
                <p className="text-xs text-uva/65 truncate">
                  {puntoPropioCoords
                    ? `${puntoPropioCoords.lat.toFixed(6)}, ${puntoPropioCoords.lng.toFixed(6)}`
                    : "Ingresá una dirección para calcularla"}
                </p>
                <p
                  className={`mt-2 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-bold leading-tight ${
                    ubicacionConfirmada
                      ? "bg-uva text-crema"
                      : "bg-fucsia/10 text-fucsia border border-fucsia/20"
                  }`}
                >
                  {ubicacionConfirmada
                    ? "Ubicación confirmada"
                    : "Falta confirmar el pin"}
                </p>
              </div>
              <button
                type="button"
                onClick={iniciarAjusteUbicacion}
                disabled={!puntoPropioCoords}
                className="bg-uva text-crema rounded-xl px-3 py-2 text-sm font-bold shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {ubicacionConfirmada ? "Revisar" : "Ajustar"}
              </button>
            </div>

            {!ubicacionConfirmada && (
              <p className="flex items-center gap-2 text-sm font-semibold text-uva/70">
                <Info size={17} className="shrink-0 text-morado" />
                Confirmá la ubicación del pin para habilitar Guardar.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={guardandoPuntoPropio || !ubicacionConfirmada}
                className="flex-1 bg-morado text-crema py-3 rounded-xl font-bold shadow disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {guardandoPuntoPropio ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save size={18} aria-hidden="true" />
                )}
                {puntoPropioEditando ? "Actualizar" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cerrarModalPuntoPropio}
                className="inline-flex items-center justify-center gap-2 px-4 bg-crema text-uva py-3 rounded-xl font-bold"
              >
                <X size={18} aria-hidden="true" />
                Cancelar
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <ModalConfirmacion
        open={confirmarCancelacionRuta}
        title="Cancelar ruta"
        eyebrow="Ruta en curso"
        message={
          rutaCompletados.length > 0
            ? "¿Seguro que querés cancelar esta ruta? Guardaremos los puntos que ya visitaste para que puedas retomarla después."
            : "¿Seguro que querés cancelar esta ruta? Todavía no registraste puntos del recorrido."
        }
        confirmText="Cancelar ruta"
        cancelText="Seguir recorriendo"
        danger
        icon={Flag}
        confirmIcon={XCircle}
        cancelIcon={null}
        onConfirm={cancelarRutaEnCurso}
        onCancel={() => setConfirmarCancelacionRuta(false)}
      />

      <UserNav />
    </div>
  );
}

function RutaEnCursoPanel({
  ruta,
  modo,
  puntos,
  completados,
  siguiente,
  guardando,
  onPausar,
  onCancelar,
}) {
  const total = puntos.length;
  const actuales = puntos.filter((punto) => completados.has(getPuntoId(punto))).length;
  const porcentaje = total > 0 ? Math.round((actuales / total) * 100) : 0;
  const siguienteCoords = getCoordsPunto(siguiente);

  return (
    <div className="absolute inset-x-0 bottom-[86px] z-[920] px-3 pointer-events-none">
      <section className="relative mx-auto max-w-md overflow-hidden rounded-[28px] bg-crema shadow-2xl border border-uva/15 pointer-events-auto">
        <div className="h-12 bg-morado/55" />
        <div className="px-4 pb-4 pt-0">
          <div className="-mt-7 mb-3 flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-crema bg-uva text-crema shadow-lg">
              <Share2 size={25} />
            </span>
            <div className="min-w-0 flex-1 pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-fucsia">
                Ruta en curso
              </p>
              <h2 className="truncate font-fredoka text-xl leading-tight text-morado">
                {ruta.nombre}
              </h2>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-uva">
                {modo === "larga" ? "Ruta larga" : "Ruta corta"} - {actuales}/{total}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-morado transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
            <span className="rounded-full bg-menta/45 px-3 py-1 text-xs font-bold text-uva">
              {porcentaje}%
            </span>
          </div>

          {siguiente ? (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-morado/10 text-morado">
                <Flag size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-uva">
                  Siguiente: {siguiente.nombre}
                </p>
                {siguienteCoords && (
                  <p className="text-xs text-uva/60">
                    El mapa te lleva hasta este punto.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-menta/35 px-3 py-2 text-sm font-bold text-uva">
              <CheckCircle2 size={18} />
              Todos los puntos registrados
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPausar}
              disabled={guardando}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-uva px-4 py-3 text-sm font-bold text-crema shadow disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Pause size={17} />
              )}
              Pausar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-uva/15 bg-white px-4 py-3 text-sm font-bold text-uva shadow-sm disabled:opacity-60"
            >
              <XCircle size={17} className="text-fucsia" />
              Cancelar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
