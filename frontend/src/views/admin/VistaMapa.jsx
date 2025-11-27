import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import MapaAdmin from "../../components/Mapa_admin.jsx";
import FormsAdmin from "../../layouts/FormsAdmin.jsx";
import BotonCerrar from "../../components/BotonCerrar.jsx";
import { MapPin, Trash2 } from "lucide-react";

export default function MapaAdminWrapper() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [searchParams] = useSearchParams();
  const idDesdeURL = searchParams.get("punto");

  const [puntos, setPuntos] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);

 
  // CARGAR

  async function cargarPuntos() {
    const res = await fetch(`${API}/api/puntos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPuntos(data);
  }

  useEffect(() => {
    cargarPuntos();
  }, []);


//abrir desde el punto
  useEffect(() => {
    if (!idDesdeURL || puntos.length === 0) return;

    const encontrado = puntos.find((p) => p._id === idDesdeURL);
    if (encontrado) {
      setPuntoSeleccionado(encontrado);
      setModoNuevo(false);
    }
  }, [idDesdeURL, puntos]);


  // SELECCIÓN DESDE MAPA / LISTA
  function handleSelectPunto(p) {
    setPuntoSeleccionado(p);
    setModoNuevo(false);
  }

  // NUEVO PUNTO
  function handleNuevoPunto() {
    setModoNuevo(true);
    setPuntoSeleccionado({
      nombre: "",
      categoria: "",
      direccion: "",
      descripcion: "",
      descripcion_completa: "",
      lat: "",
      lon: "",
      foto: "",
      link: "",
      insignia: null,
    });
  }

  // GUARDAR
  async function handleGuardar() {
    try {
      const { _id, ...datos } = puntoSeleccionado;

      const method = modoNuevo ? "POST" : "PATCH";
      const url = modoNuevo
        ? `${API}/api/puntos`
        : `${API}/api/puntos/${_id}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error();

      await cargarPuntos();
      setPuntoSeleccionado(null);
      setModoNuevo(false);
    } catch {
      alert("No se pudo guardar el punto");
    }
  }

  // ELIMINAR
  async function eliminarPunto() {
    if (!confirm("¿Seguro que querés eliminar este punto?")) return;

    const res = await fetch(`${API}/api/puntos/${puntoSeleccionado._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return alert("Error eliminando");

    await cargarPuntos();
    setPuntoSeleccionado(null);
  }

  return (
    <AdminStyle title="Mapa de Puntos">
      <div className="flex gap-6">

        {/* LISTA IZQUIERDA */}
        <aside className="w-80 h-[80vh] bg-white shadow-xl rounded-2xl p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-fredoka text-xl text-morado">
              Puntos ({puntos.length})
            </h3>

            <button
              onClick={handleNuevoPunto}
              className="bg-morado text-crema px-3 py-1 rounded-xl hover:bg-morado/80"
            >
              + Nuevo
            </button>
          </div>

          {puntos.map((p) => (
            <button
              key={p._id}
              onClick={() => handleSelectPunto(p)}
              className="w-full text-left bg-crema/40 p-3 rounded-xl mb-2 hover:bg-crema transition"
            >
              <p className="font-bold text-uva">{p.nombre}</p>
              <p className="text-sm text-gray-600">{p.categoria}</p>
            </button>
          ))}
        </aside>

        {/* MAPA */}
        <div className="flex-1 h-[80vh] relative rounded-2xl overflow-hidden">
          <MapaAdmin
            puntos={puntos}
            onSelectPunto={handleSelectPunto}
            puntoSeleccionado={puntoSeleccionado}
          />
        </div>

        {/* PANEL DERECHO */}
        {puntoSeleccionado && (
          <aside className="w-[420px] h-[80vh] bg-white shadow-xl rounded-2xl p-4 overflow-y-auto relative">

            {/* BOTÓN CERRAR */}
            <div className="absolute top-4 right-4 z-20">
              <BotonCerrar onClick={() => setPuntoSeleccionado(null)} />
            </div>

            <FormsAdmin
              title={modoNuevo ? "Nuevo Punto" : "Editar Punto"}
              subtitle={
                modoNuevo
                  ? "Cargá un nuevo lugar para el mapa"
                  : "Modificá los datos del punto"
              }
              icon={<MapPin size={22} />}
              onSubmit={handleGuardar}
              width="100%"
              showBack={false}
              footer={
                <>
                  <button
                    type="submit"
                    className="bg-morado text-crema px-5 py-2.5 rounded-xl hover:bg-morado/80 transition font-semibold shadow-sm"
                  >
                    Guardar
                  </button>

                  {!modoNuevo && (
                    <button
                      type="button"
                      onClick={eliminarPunto}
                      className="bg-fucsia text-crema px-5 py-2.5 rounded-xl hover:bg-fucsia/80 transition ml-auto flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      Eliminar
                    </button>
                  )}
                </>
              }
            >
            
              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Nombre
                </label>
                <input
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                  value={puntoSeleccionado.nombre}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      nombre: e.target.value,
                    })
                  }
                />
              </div>

              {/* Categoría */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Categoría
                </label>
                <select
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                  value={puntoSeleccionado.categoria}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      categoria: e.target.value,
                    })
                  }
                >
                  <option value="puntos_populares">Puntos Populares</option>
                  <option value="paradas_de_bus_turistico">Bus Turístico</option>
                  <option value="paseo_de_la_historieta">Paseo de la Historieta</option>
                  <option value="espacios_verdes_publicos">Verde Público</option>
                  <option value="espacios_verdes_privados">Verde Privado</option>
                  <option value="lugares_de_esparcimiento">Esparcimiento</option>
                  <option value="curiosos">Curiosos</option>
                </select>
              </div>

              {/* Dirección */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Dirección
                </label>
                <input
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                  value={puntoSeleccionado.direccion}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>

              {/* Descripción breve */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Descripción breve
                </label>
                <textarea
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20 h-28 resize-none"
                  value={puntoSeleccionado.descripcion}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              {/* Descripción completa */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Descripción completa
                </label>
                <textarea
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20 h-40 resize-none"
                  value={puntoSeleccionado.descripcion_completa || ""}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      descripcion_completa: e.target.value,
                    })
                  }
                />
              </div>

              {/* Foto */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Foto (URL)
                </label>
                <input
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                  value={puntoSeleccionado.foto}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      foto: e.target.value,
                    })
                  }
                />
              </div>

              {/* Link */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Link externo
                </label>
                <input
                  className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                  value={puntoSeleccionado.link}
                  onChange={(e) =>
                    setPuntoSeleccionado({
                      ...puntoSeleccionado,
                      link: e.target.value,
                    })
                  }
                />
              </div>

              {/* Coordenadas */}
              <div className="flex flex-col gap-1">
                <label className="font-nunito text-sm text-uva/80 font-semibold">
                  Coordenadas
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                    placeholder="Latitud"
                    value={puntoSeleccionado.lat}
                    onChange={(e) =>
                      setPuntoSeleccionado({
                        ...puntoSeleccionado,
                        lat: e.target.value,
                      })
                    }
                  />

                  <input
                    className="p-3 rounded-xl bg-crema text-uva border border-uva/20"
                    placeholder="Longitud"
                    value={puntoSeleccionado.lon}
                    onChange={(e) =>
                      setPuntoSeleccionado({
                        ...puntoSeleccionado,
                        lon: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </FormsAdmin>
          </aside>
        )}
      </div>
    </AdminStyle>
  );
}
