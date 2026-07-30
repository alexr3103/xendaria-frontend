import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { CampoAdmin, claseInputAdmin } from "./EditorAdmin.jsx";

const DEMORA_BUSQUEDA_MS = 800;

export default function CampoDireccionAdmin({
  value,
  onChange,
  onCoordenadasChange,
  placeholder = "Ej: Av. Córdoba 1234",
}) {
  const tokenMapbox = import.meta.env.VITE_MAPBOX_TOKEN;
  const primeraDireccionRef = useRef(true);
  const ultimaDireccionRef = useRef("");
  const ultimaPeticionRef = useRef(0);
  const onCoordenadasChangeRef = useRef(onCoordenadasChange);
  const [estado, setEstado] = useState("idle");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    onCoordenadasChangeRef.current = onCoordenadasChange;
  }, [onCoordenadasChange]);

  useEffect(() => {
    const direccion = String(value || "").trim();

    if (primeraDireccionRef.current) {
      primeraDireccionRef.current = false;
      ultimaDireccionRef.current = direccion;
      return undefined;
    }

    if (direccion.length < 5) {
      ultimaDireccionRef.current = "";
      setEstado("idle");
      setMensaje("");
      return undefined;
    }

    if (direccion === ultimaDireccionRef.current) return undefined;

    const idPeticion = ++ultimaPeticionRef.current;
    setEstado("waiting");
    setMensaje("La ubicación se calculará automáticamente.");

    const temporizador = window.setTimeout(async () => {
      if (!tokenMapbox) {
        setEstado("error");
        setMensaje("Falta configurar Mapbox. Podés completar las coordenadas manualmente.");
        return;
      }

      setEstado("loading");
      setMensaje("Calculando latitud y longitud...");

      try {
        const parametros = new URLSearchParams({
          access_token: tokenMapbox,
          country: "ar",
          language: "es",
          limit: "1",
          proximity: "-58.3816,-34.6037",
        });
        const endpoint =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
          `${encodeURIComponent(direccion)}.json?${parametros}`;
        const respuesta = await fetch(endpoint);

        if (!respuesta.ok) throw new Error("No se pudo consultar la dirección");

        const data = await respuesta.json();
        const [lon, lat] = data.features?.[0]?.center || [];

        if (
          idPeticion !== ultimaPeticionRef.current ||
          !Number.isFinite(Number(lat)) ||
          !Number.isFinite(Number(lon))
        ) {
          if (idPeticion === ultimaPeticionRef.current) {
            setEstado("error");
            setMensaje(
              "No encontramos esa dirección. Podés ajustarla o completar las coordenadas manualmente."
            );
          }
          return;
        }

        ultimaDireccionRef.current = direccion;
        onCoordenadasChangeRef.current?.({
          lat: Number(lat),
          lon: Number(lon),
        });
        setEstado("success");
        setMensaje("Coordenadas actualizadas automáticamente.");
      } catch {
        if (idPeticion !== ultimaPeticionRef.current) return;
        setEstado("error");
        setMensaje(
          "No pudimos calcular las coordenadas. Podés completar la latitud y longitud manualmente."
        );
      }
    }, DEMORA_BUSQUEDA_MS);

    return () => {
      window.clearTimeout(temporizador);
      ultimaPeticionRef.current += 1;
    };
  }, [tokenMapbox, value]);

  return (
    <CampoAdmin label="Dirección">
      <input
        className={claseInputAdmin}
        placeholder={placeholder}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby="estado-geocodificacion-admin"
      />

      {mensaje && (
        <span
          id="estado-geocodificacion-admin"
          className={`flex items-center gap-2 text-xs font-semibold ${
            estado === "error" ? "text-fucsia" : "text-uva/65"
          }`}
          aria-live="polite"
        >
          {estado === "loading" && <Loader2 size={14} className="animate-spin" />}
          {estado === "success" && <CheckCircle2 size={14} className="text-uva" />}
          {(estado === "waiting" || estado === "error") && <MapPin size={14} />}
          {mensaje}
        </span>
      )}
    </CampoAdmin>
  );
}
