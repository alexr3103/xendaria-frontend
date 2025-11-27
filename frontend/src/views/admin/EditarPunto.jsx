import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormsAdmin from "../../layouts/FormsAdmin.jsx";
import { MapPin, Trash2 } from "lucide-react";

export default function EditarPunto() {
  const { id } = useParams();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [punto, setPunto] = useState(null);
  const [cargando, setCargando] = useState(true);

  // CARGAR PUNTO 

  useEffect(() => {
    async function obtenerPunto() {
      try {
        const res = await fetch(`${API}/api/puntos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error al cargar punto");

        const data = await res.json();

        // NORMALIZAR coordenadas inválidas
        setPunto({
          ...data,
          lat: data.lat ? parseFloat(data.lat) : "",
          lon: data.lon ? parseFloat(data.lon) : "",
        });
      } catch {
        alert("No se pudo cargar el punto");
      } finally {
        setCargando(false);
      }
    }

    obtenerPunto();
  }, [id]);

const [guardadoOK, setGuardadoOK] = useState(false);

async function guardarCambios() {
  try {
    const { _id, ...dataSinId } = punto;

    const res = await fetch(`${API}/api/puntos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataSinId),
    });

    if (!res.ok) throw new Error("Error editando");

    setGuardadoOK(true);
    setTimeout(() => setGuardadoOK(false), 3000);

  } catch (err) {
    alert("No se pudieron guardar los cambios");
  }
}

  // ELIMINAR
  async function eliminarPunto() {
    if (!confirm("¿Seguro que querés eliminar este punto?")) return;

    try {
      const res = await fetch(`${API}/api/puntos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error eliminando");

      alert("Punto eliminado");
      window.location.href = "/admin/mapa";
    } catch {
      alert("No se pudo eliminar el punto");
    }
  }

  if (cargando || !punto)
    return (
      <div className="w-full min-h-screen bg-crema/40 flex items-center justify-center">
        <p className="text-morado text-xl">Cargando información…</p>
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-crema/40 flex items-start justify-center py-16 px-6">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-3xl p-10 border border-uva/10">
        {guardadoOK && (
  <div className="w-full bg-menta text-uva font-semibold text-center py-3 rounded-xl mb-4 shadow-md animate-fadeIn">
    Cambios guardados correctamente 
  </div>
)}

        <FormsAdmin
          title="Editar Punto"
          subtitle="Modificá los datos del punto seleccionado"
          icon={<MapPin size={22} />}
          onSubmit={guardarCambios}
          width="100%"
          footer={
            <>
              <button
                type="submit"
                className="bg-morado text-crema px-5 py-2.5 rounded-xl hover:bg-morado/80 transition font-semibold shadow-sm"
              >
                Guardar cambios
              </button>

              <button
                type="button"
                className="bg-crema text-uva px-5 py-2.5 rounded-xl hover:bg-crema/80 transition font-semibold shadow-sm"
                onClick={() => window.history.back()}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="bg-fucsia text-crema px-5 py-2.5 rounded-xl hover:bg-fucsia/80 transition font-semibold shadow-sm flex items-center gap-2 ml-auto"
                onClick={eliminarPunto}
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            </>
          }
        >

          {/* NOMBRE */}
          <div className="flex flex-col gap-1">
            <label className="font-nunito text-sm text-uva/80 font-semibold">
              Nombre del punto
            </label>
            <input
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full shadow-sm"
              value={punto.nombre}
              onChange={(e) => setPunto({ ...punto, nombre: e.target.value })}
            />
          </div>

          {/* CATEGORÍA */}
          <div className="flex flex-col gap-1">
            <label className="font-nunito text-sm text-uva/80 font-semibold">
              Categoría
            </label>
            <select
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full shadow-sm"
              value={punto.categoria}
              onChange={(e) => setPunto({ ...punto, categoria: e.target.value })}
            >
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
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full shadow-sm"
              value={punto.direccion}
              onChange={(e) => setPunto({ ...punto, direccion: e.target.value })}
            />
          </div>

          {/* DESCRIPCIÓN BREVE */}
          <div className="flex flex-col gap-1">
            <label className="font-nunito text-sm text-uva/80 font-semibold">
              Descripción breve
            </label>
            <textarea
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full h-28 resize-none shadow-sm"
              value={punto.descripcion}
              onChange={(e) =>
                setPunto({ ...punto, descripcion: e.target.value })
              }
            />
          </div>

          {/* DESCRIPCIÓN COMPLETA */}
          <div className="flex flex-col gap-1">
            <label className="font-nunito text-sm text-uva/80 font-semibold">
              Descripción completa
            </label>
            <textarea
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full h-40 resize-none shadow-sm"
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
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full shadow-sm"
              value={punto.foto}
              onChange={(e) => setPunto({ ...punto, foto: e.target.value })}
            />
          </div>

          {/* LINK */}
          <div className="flex flex-col gap-1">
            <label className="font-nunito text-sm text-uva/80 font-semibold">
              Enlace externo
            </label>
            <input
              className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                         focus:border-morado transition w-full shadow-sm"
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
                className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                           focus:border-morado transition w-full shadow-sm"
                value={punto.lat}
                onChange={(e) => setPunto({ ...punto, lat: e.target.value })}
              />

              <input
                className="p-3 rounded-xl bg-crema text-uva border border-uva/20 outline-none 
                           focus:border-morado transition w-full shadow-sm"
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
