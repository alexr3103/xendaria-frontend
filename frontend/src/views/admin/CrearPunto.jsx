import { useState } from "react";
import FormsAdmin from "../../layouts/FormsAdmin.jsx";
import { MapPin } from "lucide-react";

export default function NuevoPunto() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [punto, setPunto] = useState({
    nombre: "",
    categoria: "",
    direccion: "",
    descripcion: "",
    descripcion_completa: "",
    foto: "",
    link: "",
    insignia: null,     
    lat: "",
    lon: "",
  });

  async function guardarPunto() {
    try {
      const res = await fetch(`${API}/api/puntos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(punto),
      });

      if (!res.ok) throw new Error("Error guardando");

      alert("Punto creado correctamente");
      window.location.href = "/admin/mapa";
    } catch (err) {
      alert("No se pudo crear el punto");
    }
  }

return (
  <div className="w-full min-h-screen bg-crema/40 flex items-start justify-center py-16 px-6">

    <div className="w-full max-w-3xl bg-white shadow-2xl rounded-3xl p-10 border border-uva/10">

      <FormsAdmin
        title="Nuevo Punto"
        subtitle="Ingresá los datos del nuevo lugar del mapa."
        icon={<MapPin size={26} />}
        onSubmit={guardarPunto}
        width="100%"
      >
        {/* NOMBRE */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Nombre del punto
          </label>
          <input
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 
                       shadow-sm outline-none focus:border-morado transition w-full"
            value={punto.nombre}
            placeholder="Ej: Museo del Agua"
            onChange={(e) => setPunto({ ...punto, nombre: e.target.value })}
          />
        </div>

        {/* CATEGORÍA */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Categoría
          </label>
          <select
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full"
            value={punto.categoria}
            onChange={(e) => setPunto({ ...punto, categoria: e.target.value })}
          >
            <option value="">Seleccionar…</option>
            <option value="puntos_populares">Puntos Populares</option>
            <option value="paradas_de_bus_turistico">Bus Turístico</option>
            <option value="paseo_de_la_historieta">Paseo de la Historieta</option>
            <option value="espacios_verdes_publicos">Espacios Verdes Públicos</option>
            <option value="espacios_verdes_privados">Espacios Verdes Privados</option>
            <option value="lugares_de_esparcimiento">Esparcimiento</option>
            <option value="curiosos">Curiosos</option>
          </select>
        </div>

        {/* DIRECCIÓN */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Dirección
          </label>
          <input
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full"
            placeholder="Ej: Av. Córdoba 1234"
            value={punto.direccion}
            onChange={(e) => setPunto({ ...punto, direccion: e.target.value })}
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Descripción breve
          </label>
          <textarea
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full h-28 resize-none"
            placeholder="Texto corto, resumen…"
            value={punto.descripcion}
            onChange={(e) => setPunto({ ...punto, descripcion: e.target.value })}
          />
        </div>

        {/* DESCRIPCIÓN COMPLETA */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Descripción completa
          </label>
          <textarea
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full h-40 resize-none"
            placeholder="Historia, detalles largos…"
            value={punto.descripcion_completa}
            onChange={(e) =>
              setPunto({ ...punto, descripcion_completa: e.target.value })
            }
          />
        </div>

        {/* FOTO */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Foto (URL)
          </label>
          <input
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full"
            placeholder="https://…"
            value={punto.foto}
            onChange={(e) => setPunto({ ...punto, foto: e.target.value })}
          />
        </div>

        {/* LINK */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Enlace externo (opcional)
          </label>
          <input
            className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                       outline-none focus:border-morado transition w-full"
            placeholder="Referencia, web o video"
            value={punto.link}
            onChange={(e) => setPunto({ ...punto, link: e.target.value })}
          />
        </div>

        {/* COORDENADAS */}
        <div className="flex flex-col gap-1">
          <label className="font-nunito text-sm text-uva/80 font-semibold">
            Coordenadas
          </label>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                         outline-none focus:border-morado transition w-full"
              placeholder="Latitud"
              value={punto.lat}
              onChange={(e) => setPunto({ ...punto, lat: e.target.value })}
            />

            <input
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 shadow-sm 
                         outline-none focus:border-morado transition w-full"
              placeholder="Longitud"
              value={punto.lon}
              onChange={(e) => setPunto({ ...punto, lon: e.target.value })}
            />
          </div>
        </div>
      </FormsAdmin>

    </div>
  </div>
);

}
