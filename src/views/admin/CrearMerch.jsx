import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Image,
  Loader2,
  Package,
  Save,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import CampoGaleriaMerch from "../../components/CampoGaleriaMerch.jsx";
import InterruptorProductoMerch from "../../components/InterruptorProductoMerch.jsx";
import {
  FormularioEditorAdmin,
  PaginaEditorAdmin,
  CampoAdmin,
  SeccionPlanaAdmin,
  TituloSeccionAdmin,
  claseInputAdmin,
} from "../../components/EditorAdmin.jsx";
import {
  MERCH_CATEGORY_OPTIONS,
  MERCH_COLOR_OPTIONS,
  TALLES_DISPONIBLES,
} from "../../constants/merchOptions.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function crearVarianteVacia() {
  return {
    color: "",
    talle: "",
    diseno: "",
    stock: "",
    esNueva: true,
  };
}

export default function CrearMerch() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const productoGuardadoRef = useRef(false);
  const imagenesTemporalesRef = useRef([]);

  const [producto, setProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    imagenes: [],
    activo: true,
    variantes: [],
  });

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    return () => {
      if (productoGuardadoRef.current) return;
      if (!token) return;

      imagenesTemporalesRef.current.forEach((publicId) => {
        fetch(`${API}/api/upload/imagen`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publicId }),
          keepalive: true,
        }).catch(() => {});
      });
    };
  }, [API, token]);

  function actualizarVariante(index, campo, valor) {
    const nuevasVariantes = [...producto.variantes];
    nuevasVariantes[index] = {
      ...nuevasVariantes[index],
      [campo]: valor,
    };

    setProducto((prev) => ({
      ...prev,
      variantes: nuevasVariantes,
    }));
  }

  function agregarVariante() {
    setProducto((prev) => ({
      ...prev,
      variantes: [...prev.variantes, crearVarianteVacia()],
    }));
  }

  function eliminarVariante(index) {
    setProducto((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index),
    }));
  }

  function agregarImagen(data) {
    if (data.publicId) {
      imagenesTemporalesRef.current.push(data.publicId);
    }

    setProducto((prev) => ({
      ...prev,
      imagenes: [
        ...prev.imagenes,
        {
          url: data.url,
          publicId: data.publicId,
          fechaSubida: new Date().toISOString(),
        },
      ],
    }));
  }

  async function subirImagenMerch(file) {
    if (!file.type.startsWith("image/")) {
      setError("Solo se pueden subir imágenes.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("La imagen no debe superar los 5MB.");
      return;
    }

    try {
      setSubiendoImagen(true);
      setError("");

      const formData = new FormData();
      formData.append("imagen", file);

      const res = await fetch(`${API}/api/upload/merch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(" ")
            : data?.message || "No se pudo subir la imagen"
        );
      }

      agregarImagen(data);
    } catch (err) {
      setError(err.message || "No se pudo subir la imagen");
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function eliminarImagenCloudinary(publicId) {
    const res = await fetch(`${API}/api/upload/imagen`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "No se pudo eliminar la imagen");
    }
  }

  async function eliminarImagen(index) {
    const imagenAEliminar = producto.imagenes[index];

    try {
      if (imagenAEliminar?.publicId) {
        await eliminarImagenCloudinary(imagenAEliminar.publicId);
        imagenesTemporalesRef.current = imagenesTemporalesRef.current.filter(
          (publicId) => publicId !== imagenAEliminar.publicId
        );
      }

      setProducto((prev) => ({
        ...prev,
        imagenes: prev.imagenes.filter((_, i) => i !== index),
      }));
    } catch (err) {
      setError(err.message || "No se pudo eliminar la imagen");
    }
  }

  async function cancelarCreacion() {
    try {
      for (const publicId of imagenesTemporalesRef.current) {
        await eliminarImagenCloudinary(publicId);
      }

      imagenesTemporalesRef.current = [];
      navigate("/admin/merch");
    } catch (err) {
      setError(err.message || "No se pudieron limpiar las imágenes subidas");
    }
  }

  async function guardarProducto() {
    try {
      setGuardando(true);
      setError("");
      setOk("");

      if (!producto.imagenes.length) {
        setError("Tenés que subir al menos una imagen del producto.");
        return;
      }

      const variantesLimpias = producto.variantes
        .map((variante) => ({
          color: variante.color?.trim() || undefined,
          talle: variante.talle?.trim() || undefined,
          diseno: variante.diseno?.trim() || undefined,
          stock:
            variante.stock === "" || variante.stock === null
              ? undefined
              : Number(variante.stock),
        }))
        .filter(
          (variante) =>
            variante.color ||
            variante.talle ||
            variante.diseno ||
            variante.stock !== undefined
        );

      const stockTotal = variantesLimpias.reduce(
        (acc, variante) => acc + (variante.stock || 0),
        0
      );

      const body = {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        stock: stockTotal,
        categoria: producto.categoria,
        activo: producto.activo !== false,
        imagenes: producto.imagenes,
        variantes: variantesLimpias,
      };

      const res = await fetch(`${API}/api/merch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(" ")
            : data?.message || "No se pudo crear el producto"
        );
      }

      productoGuardadoRef.current = true;
      imagenesTemporalesRef.current = [];

      setOk("Producto creado correctamente");
      setTimeout(() => navigate("/admin/merch"), 900);
    } catch (err) {
      setError(err.message || "No se pudo crear el producto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AdminStyle title="Nuevo producto">
      <PaginaEditorAdmin
        title="Nuevo producto"
        actions={
          <>
            <button
              type="button"
              onClick={guardarProducto}
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-full bg-morado px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-morado/85 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelarCreacion}
              className="flex items-center justify-center gap-2 rounded-full bg-fucsia px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-fucsia/85"
            >
              <X size={18} />
              Cancelar
            </button>
          </>
        }
      >
        <div className="mb-6 space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          {ok && <Alert variant="success">{ok}</Alert>}
        </div>

        <FormularioEditorAdmin
          onSubmit={(event) => {
            event.preventDefault();
            guardarProducto();
          }}
        >
          <section className="space-y-9 pb-4">
            <TituloSeccionAdmin
              icon={Package}
              title="Datos principales"
              subtitle="Lo básico que identifica al producto en la tienda."
            />

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(260px,1.35fr)_220px_160px_180px]">
              <CampoAdmin label="Nombre del producto">
                <input
                  className={claseInputAdmin}
                  value={producto.nombre}
                  onChange={(event) =>
                    setProducto({ ...producto, nombre: event.target.value })
                  }
                />
              </CampoAdmin>

              <CampoAdmin label="Categoría">
                <select
                  className={claseInputAdmin}
                  value={producto.categoria}
                  onChange={(event) =>
                    setProducto({ ...producto, categoria: event.target.value })
                  }
                >
                  <option value="">Seleccionar categoría</option>
                  {MERCH_CATEGORY_OPTIONS.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </CampoAdmin>

              <CampoAdmin label="Precio">
                <input
                  type="number"
                  className={claseInputAdmin}
                  value={producto.precio}
                  onChange={(event) =>
                    setProducto({ ...producto, precio: event.target.value })
                  }
                />
              </CampoAdmin>

              <div className="flex items-end">
                <InterruptorProductoMerch
                  active={producto.activo !== false}
                  onClick={() =>
                    setProducto({ ...producto, activo: producto.activo === false })
                  }
                />
              </div>
            </div>

            <CampoAdmin label="Descripción">
              <textarea
                className={`${claseInputAdmin} min-h-36 resize-y`}
                value={producto.descripcion}
                onChange={(event) =>
                  setProducto({ ...producto, descripcion: event.target.value })
                }
              />
            </CampoAdmin>
          </section>

          <SeccionPlanaAdmin
            title="Imágenes"
            description="La primera imagen se usa como imagen principal del producto."
            icon={Image}
          >
            {producto.imagenes.length === 0 && (
              <p className="text-sm font-semibold text-fucsia">
                Tenés que dejar al menos una imagen cargada.
              </p>
            )}

            <CampoGaleriaMerch
              imagenes={producto.imagenes}
              subiendo={subiendoImagen}
              onDelete={eliminarImagen}
              onUpload={subirImagenMerch}
            />
          </SeccionPlanaAdmin>

          <SeccionPlanaAdmin
            title="Variantes"
            description="Combinaciones de color, talle, diseño y stock."
            icon={Shapes}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={agregarVariante}
                className="rounded-full bg-uva px-4 py-2.5 text-sm font-bold text-crema shadow transition hover:bg-uva/90"
              >
                + Agregar variante
              </button>
            </div>

            {producto.variantes.length === 0 ? (
              <p className="text-sm font-semibold text-uva/55">
                Este producto no tiene variantes cargadas.
              </p>
            ) : (
              <div className="grid gap-4">
                {producto.variantes.map((variante, index) => (
                  <VariantEditor
                    key={`${variante.esNueva ? "nueva" : "existente"}-${index}`}
                    variante={variante}
                    index={index}
                    onChange={actualizarVariante}
                    onDelete={eliminarVariante}
                  />
                ))}
              </div>
            )}
          </SeccionPlanaAdmin>

          <div className="mt-16 flex flex-wrap items-center justify-end gap-3 border-t border-uva/10 pt-8">
            <button
              type="button"
              onClick={cancelarCreacion}
              className="flex items-center justify-center gap-2 rounded-full bg-fucsia px-4 py-2.5 font-bold text-crema shadow-md transition hover:bg-fucsia/85"
            >
              <X size={18} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-full bg-morado px-5 py-2.5 font-bold text-crema shadow-md transition hover:bg-morado/85 disabled:opacity-60"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </FormularioEditorAdmin>
      </PaginaEditorAdmin>
    </AdminStyle>
  );
}

function VariantEditor({ variante, index, onChange, onDelete }) {
  return (
    <article className="rounded-[26px] border border-uva/10 bg-crema/70 p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-fredoka text-lg leading-none text-uva">
            {variante.esNueva ? "Nueva variante" : "Variante"}
          </h4>
          <p className="text-xs font-semibold text-uva/45">
            Color, talle, diseño y stock.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(index)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-fucsia/10 text-fucsia transition hover:bg-fucsia hover:text-crema"
          title="Eliminar variante"
          aria-label="Eliminar variante"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(250px,1.2fr)_minmax(240px,1fr)_minmax(190px,.85fr)_120px]">
        <div className="space-y-2">
          <span className="text-sm font-bold text-uva/80">Color</span>
          <div className="flex flex-wrap gap-2">
            {MERCH_COLOR_OPTIONS.map((color) => {
              const seleccionado = variante.color === color.nombre;

              return (
                <button
                  key={color.nombre}
                  type="button"
                  title={color.nombre}
                  onClick={() => onChange(index, "color", color.nombre)}
                  className={`${color.swatchClassName} h-8 w-8 rounded-full border-2 shadow-sm transition ${
                    seleccionado
                      ? "scale-110 border-morado"
                      : "border-uva/20 hover:border-morado/60"
                  } ${color.nombre === "Blanco" ? "ring-1 ring-uva/20" : ""}`}
                />
              );
            })}
          </div>
          <p className="text-xs font-semibold text-uva/45">
            {variante.color ? `Color seleccionado: ${variante.color}` : "Sin color"}
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-bold text-uva/80">Talle</span>
          <div className="flex flex-wrap gap-2">
            {TALLES_DISPONIBLES.map((talle) => {
              const seleccionado = variante.talle === talle;

              return (
                <button
                  key={talle}
                  type="button"
                  onClick={() => onChange(index, "talle", talle)}
                  className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                    seleccionado
                      ? "border-morado bg-morado text-crema"
                      : "border-uva/20 bg-white text-uva hover:border-morado/60"
                  }`}
                >
                  {talle}
                </button>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-uva/45">
            {variante.talle ? `Talle seleccionado: ${variante.talle}` : "Sin talle"}
          </p>
        </div>

        <CampoAdmin label="Diseño">
          <input
            className={claseInputAdmin}
            value={variante.diseno || ""}
            onChange={(event) => onChange(index, "diseno", event.target.value)}
          />
        </CampoAdmin>

        <CampoAdmin label="Stock">
          <input
            type="number"
            className={claseInputAdmin}
            value={variante.stock ?? ""}
            onChange={(event) => onChange(index, "stock", event.target.value)}
          />
        </CampoAdmin>
      </div>
    </article>
  );
}
