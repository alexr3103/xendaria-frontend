import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Send,
  ShoppingBasket,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import AdminStyle from "../../layouts/AdminStyle.jsx";
import Alert from "../../components/Alertas.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import AdminSearchBox from "../../components/AdminSearchBox.jsx";
import AdminFilterHeading from "../../components/AdminFilterHeading.jsx";
import FilterPill from "../../components/FilterPill.jsx";
import AdminSegmentedTabs from "../../components/AdminSegmentedTabs.jsx";
import {
  MERCH_CATEGORY_OPTIONS,
  getMerchCategoryInfo,
} from "../../constants/merchOptions.js";

const TAB_LABELS = {
  ordenes: "Ordenes",
  productos: "Productos",
  envios: "Envios",
};

const PROVINCIAS_LABEL = {
  capital_federal: "Capital Federal",
  conurbano_buenos_aires: "GCBA",
  buenos_aires: "Buenos Aires",
  catamarca: "Catamarca",
  chaco: "Chaco",
  chubut: "Chubut",
  cordoba: "Cordoba",
  corrientes: "Corrientes",
  entre_rios: "Entre Rios",
  formosa: "Formosa",
  jujuy: "Jujuy",
  la_pampa: "La Pampa",
  la_rioja: "La Rioja",
  mendoza: "Mendoza",
  misiones: "Misiones",
  neuquen: "Neuquen",
  rio_negro: "Rio Negro",
  salta: "Salta",
  san_juan: "San Juan",
  san_luis: "San Luis",
  santa_cruz: "Santa Cruz",
  santa_fe: "Santa Fe",
  santiago_del_estero: "Santiago del Estero",
  tierra_del_fuego: "Tierra del Fuego",
  tucuman: "Tucuman",
  resto_pais: "Resto del pais",
};

const ESTADO_ORDEN = {
  pagada: {
    label: "Pago procesado",
    className: "bg-menta/35 text-uva",
    icon: Check,
  },
  procesando: {
    label: "Procesando",
    className: "bg-morado/15 text-uva",
    icon: Package,
  },
  enviada: {
    label: "Enviada",
    className: "bg-rosa/30 text-uva",
    icon: Send,
  },
};

const inputClass =
  "rounded-xl border border-uva/20 bg-crema px-3 py-3 text-uva outline-none transition focus:border-morado focus:ring-2 focus:ring-morado/20";

function getToken() {
  return localStorage.getItem("token");
}

function formatMoney(value = 0) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getId(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  if (valor.$oid) return valor.$oid;
  return String(valor._id || valor.id || valor);
}

function calcularStockTotal(producto) {
  if (Array.isArray(producto.variantes) && producto.variantes.length > 0) {
    return producto.variantes.reduce(
      (acc, variante) => acc + (Number(variante.stock) || 0),
      0
    );
  }

  return Number(producto.stock) || 0;
}

function describirVariante(variante) {
  const partes = [];

  if (variante?.color) partes.push(`Color: ${variante.color}`);
  if (variante?.talle) partes.push(`Talle: ${variante.talle}`);
  if (variante?.diseno) partes.push(`Diseno: ${variante.diseno}`);

  return partes.length > 0 ? partes.join(" | ") : "";
}

function describirVarianteCorta(variante) {
  const partes = [variante?.color, variante?.talle, variante?.diseno]
    .filter(Boolean)
    .slice(0, 2);

  return partes.length > 0 ? partes.join(" · ") : "Variante";
}

function pagoProcesado(orden) {
  return (
    orden?.pago?.estado === "aprobado" ||
    ["pagada", "procesando", "enviada"].includes(orden?.estado)
  );
}

export default function MerchAdmin({ initialTab = "ordenes" }) {
  const API = import.meta.env.VITE_API_URL;
  const token = getToken();

  const [tab, setTab] = useState(initialTab);
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [configEnvios, setConfigEnvios] = useState({
    envioGratisDesde: "",
    capital_federal: "",
    conurbano_buenos_aires: "",
    buenos_aires: "",
    resto_pais: "",
  });
  const [cargandoOrdenes, setCargandoOrdenes] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [cargandoEnvios, setCargandoEnvios] = useState(true);
  const [guardandoEnvios, setGuardandoEnvios] = useState(false);
  const [actualizandoOrden, setActualizandoOrden] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarOrdenes = useCallback(async () => {
    try {
      setCargandoOrdenes(true);
      const res = await fetch(`${API}/api/ordenes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudieron cargar las ordenes");
      }

      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudieron cargar las ordenes",
      });
    } finally {
      setCargandoOrdenes(false);
    }
  }, [API]);

  const cargarProductos = useCallback(async () => {
    try {
      setCargandoProductos(true);
      const res = await fetch(`${API}/api/merch`);
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudieron cargar los productos");
      }

      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudieron cargar los productos",
      });
    } finally {
      setCargandoProductos(false);
    }
  }, [API]);

  const cargarEnvios = useCallback(async () => {
    try {
      setCargandoEnvios(true);
      const res = await fetch(`${API}/api/envios`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo cargar envios");
      }

      setConfigEnvios({
        envioGratisDesde: data.envioGratisDesde ?? "",
        capital_federal: data.costos?.capital_federal ?? "",
        conurbano_buenos_aires: data.costos?.conurbano_buenos_aires ?? "",
        buenos_aires: data.costos?.buenos_aires ?? "",
        resto_pais: data.costos?.resto_pais ?? "",
      });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo cargar envios",
      });
    } finally {
      setCargandoEnvios(false);
    }
  }, [API]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    cargarOrdenes();
    cargarProductos();
    cargarEnvios();
  }, [cargarOrdenes, cargarProductos, cargarEnvios]);

  const metricas = useMemo(
    () => ({
      ordenes: ordenes.length,
      productos: productos.length,
    }),
    [ordenes, productos]
  );

  async function actualizarEstadoOrden(idOrden, estado) {
    try {
      setActualizandoOrden(idOrden);
      setMensaje(null);

      const res = await fetch(`${API}/api/ordenes/${idOrden}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo actualizar la orden");
      }

      await cargarOrdenes();
      setMensaje({
        variant: "success",
        text: estado === "enviada" ? "Orden marcada como enviada." : "Orden marcada como procesando.",
      });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo actualizar la orden",
      });
    } finally {
      setActualizandoOrden(null);
    }
  }

  async function eliminarProducto() {
    if (!productoAEliminar) return;

    try {
      setEliminando(true);

      const res = await fetch(`${API}/api/merch/${productoAEliminar._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo eliminar el producto");
      }

      setProductos((prev) =>
        prev.filter((producto) => producto._id !== productoAEliminar._id)
      );

      setProductoAEliminar(null);
      setMensaje({ variant: "success", text: "Producto eliminado." });
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo eliminar el producto",
      });
    } finally {
      setEliminando(false);
    }
  }

  async function guardarConfiguracionEnvios(event) {
    event.preventDefault();

    try {
      setGuardandoEnvios(true);
      setMensaje(null);

      const body = {
        envioGratisDesde: Number(configEnvios.envioGratisDesde),
        costos: {
          capital_federal: Number(configEnvios.capital_federal),
          conurbano_buenos_aires: Number(configEnvios.conurbano_buenos_aires),
          buenos_aires: Number(configEnvios.buenos_aires),
          resto_pais: Number(configEnvios.resto_pais),
        },
      };

      const res = await fetch(`${API}/api/envios`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo guardar la configuracion");
      }

      setMensaje({
        variant: "success",
        text: "Configuracion de envios actualizada.",
      });
      await cargarEnvios();
    } catch (error) {
      setMensaje({
        variant: "error",
        text: error.message || "No se pudo guardar envios",
      });
    } finally {
      setGuardandoEnvios(false);
    }
  }

  return (
    <AdminStyle title="Gestion de Merch">
      <div className="mb-6 border-b border-uva/10 pb-4">
        <AdminSegmentedTabs
          tabs={[
            {
              key: "ordenes",
              active: tab === "ordenes",
              icon: ReceiptText,
              label: TAB_LABELS.ordenes,
              count: metricas.ordenes,
              onClick: () => setTab("ordenes"),
            },
            {
              key: "productos",
              active: tab === "productos",
              icon: ShoppingBasket,
              label: TAB_LABELS.productos,
              count: metricas.productos,
              onClick: () => setTab("productos"),
            },
            {
              key: "envios",
              active: tab === "envios",
              icon: Truck,
              label: TAB_LABELS.envios,
              onClick: () => setTab("envios"),
            },
          ]}
        />
      </div>

      {mensaje && (
        <div className="mb-5 max-w-4xl">
          <Alert variant={mensaje.variant}>{mensaje.text}</Alert>
        </div>
      )}

      {tab === "ordenes" && (
        <OrdenesPanel
          ordenes={ordenes}
          cargando={cargandoOrdenes}
          actualizandoOrden={actualizandoOrden}
          onEstadoChange={actualizarEstadoOrden}
        />
      )}

      {tab === "productos" && (
        <ProductosPanel
          productos={productos}
          cargando={cargandoProductos}
          onDelete={setProductoAEliminar}
        />
      )}

      {tab === "envios" && (
        <EnviosPanel
          form={configEnvios}
          setForm={setConfigEnvios}
          cargando={cargandoEnvios}
          guardando={guardandoEnvios}
          onSubmit={guardarConfiguracionEnvios}
        />
      )}

      <ConfirmModal
        open={!!productoAEliminar}
        title="Eliminar producto"
        message={
          productoAEliminar
            ? `Seguro que queres eliminar "${productoAEliminar.nombre}"?`
            : ""
        }
        confirmText={eliminando ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        onConfirm={eliminarProducto}
        onCancel={() => setProductoAEliminar(null)}
        danger
      />
    </AdminStyle>
  );
}

function OrdenesPanel({ ordenes, cargando, actualizandoOrden, onEstadoChange }) {
  const [filtro, setFiltro] = useState("todas");
  const [ordenExpandida, setOrdenExpandida] = useState(null);
  const [busquedaOrden, setBusquedaOrden] = useState("");

  const filtros = useMemo(
    () => [
      {
        key: "todas",
        label: "Todas",
        count: ordenes.length,
      },
      {
        key: "pagada",
        label: "Pagadas",
        count: ordenes.filter((orden) => orden.estado === "pagada").length,
        color: "#83FFC4",
        icon: CreditCard,
      },
      {
        key: "procesando",
        label: "Procesando",
        count: ordenes.filter((orden) => orden.estado === "procesando").length,
        color: "#AA63E0",
        icon: Package,
      },
      {
        key: "enviada",
        label: "Enviadas",
        count: ordenes.filter((orden) => orden.estado === "enviada").length,
        color: "#F28FA0",
        icon: Send,
      },
    ],
    [ordenes]
  );

  const ordenesFiltradas = useMemo(() => {
    const query = busquedaOrden.trim().toLowerCase();
    const porEstado =
      filtro === "todas"
        ? ordenes
        : ordenes.filter((orden) => orden.estado === filtro);

    const base = !query
      ? porEstado
      : porEstado.filter((orden) => {
          const usuario = orden.usuario || {};
          const items = Array.isArray(orden.items) ? orden.items : [];

          return [
            orden.numeroCompra,
            getId(orden),
            usuario.nombre,
            usuario.email,
            orden.estado,
            orden.pago?.estado,
            ...items.map((item) => item.nombre),
          ]
            .filter(Boolean)
            .some((valor) => String(valor).toLowerCase().includes(query));
        });

    return base;
  }, [busquedaOrden, filtro, ordenes]);

  if (cargando) {
    return <EmptyPanel icon={ReceiptText} text="Cargando ordenes..." />;
  }

  if (ordenes.length === 0) {
    return <EmptyPanel icon={ReceiptText} text="Todavia no hay ordenes de compra." />;
  }

  return (
    <section>
      <div className="mb-5 flex flex-col items-start gap-3">
        <div>
          <h2 className="font-fredoka text-3xl text-uva">Ordenes de compra</h2>
          <p className="text-sm text-uva/65">
            Administra las compras pagadas, el procesamiento de productos y los envios.
          </p>
        </div>

        <AdminSearchBox
          value={busquedaOrden}
          onChange={(value) => {
            setBusquedaOrden(value);
            setOrdenExpandida(null);
          }}
          placeholder="Buscar orden"
          className="w-full sm:max-w-[320px]"
        />

        <AdminFilterHeading>Estados</AdminFilterHeading>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((item) => (
            <FilterPill
              key={item.key}
              active={filtro === item.key}
              onClick={() => {
                setFiltro(item.key);
                setOrdenExpandida(null);
              }}
              color={item.color}
              icon={item.icon}
            >
              {item.label} ({item.count})
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
              <th className="px-3 py-4">Orden</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Pago</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Articulos</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ordenesFiltradas.map((orden) => {
              const idOrden = getId(orden);
              const expandida = ordenExpandida === idOrden;
              const items = Array.isArray(orden.items) ? orden.items : [];
              const usuario = orden.usuario || {};
              const estado = ESTADO_ORDEN[orden.estado] || ESTADO_ORDEN.pagada;
              const EstadoIcon = estado.icon;
              const pagoOk = pagoProcesado(orden);
              const puedeProcesar = pagoOk && orden.estado === "pagada";
              const puedeEnviar = pagoOk && orden.estado === "procesando";
              const actualizando = actualizandoOrden === idOrden;

              return (
                <Fragment key={idOrden}>
                  <tr
                    className="cursor-pointer border-b border-uva/10 transition hover:bg-crema/45"
                    onClick={() => setOrdenExpandida(expandida ? null : idOrden)}
                    title={expandida ? "Ocultar detalle" : "Ver detalle"}
                  >
                    <td className="p-3">
                      <p className="font-extrabold text-uva">
                        {orden.numeroCompra || `Orden ${idOrden.slice(-6)}`}
                      </p>
                      <p className="text-xs font-bold text-uva/55">
                        {formatDate(orden.createdAt)}
                      </p>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-uva">
                        {usuario.nombre || "Usuario sin nombre"}
                      </p>
                      <p className="max-w-[220px] truncate text-xs font-semibold text-gris">
                        {usuario.email || "Sin email"}
                      </p>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                          pagoOk ? "bg-menta/35 text-uva" : "bg-fucsia/10 text-fucsia"
                        }`}
                      >
                        <CreditCard size={13} />
                        {pagoOk ? "Procesado" : "No procesado"}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${estado.className}`}
                      >
                        <EstadoIcon size={13} />
                        {estado.label}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-uva">
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </td>

                    <td className="p-3 font-extrabold text-morado">
                      {formatMoney(orden.total)}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          disabled={!puedeProcesar || actualizando}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEstadoChange(idOrden, "procesando");
                          }}
                          className="rounded-lg bg-morado/20 p-2 text-morado transition hover:bg-morado/30 disabled:cursor-not-allowed disabled:bg-uva/10 disabled:text-uva/30"
                          title="Marcar como procesando"
                        >
                          <Package size={18} />
                        </button>
                        <button
                          type="button"
                          disabled={!puedeEnviar || actualizando}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEstadoChange(idOrden, "enviada");
                          }}
                          className={`rounded-lg p-2 transition disabled:cursor-not-allowed ${
                            puedeEnviar && !actualizando
                              ? "bg-rosa/45 text-uva hover:bg-rosa/65"
                              : "bg-uva/10 text-uva/30"
                          }`}
                          title="Marcar como enviada"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandida && (
                    <tr>
                      <td colSpan="7" className="p-0">
                        <OrdenDetalle orden={orden} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {ordenesFiltradas.length === 0 && (
          <EmptyPanel icon={ReceiptText} text="No hay ordenes con ese filtro." />
        )}
      </div>
    </section>
  );
}

function OrdenDetalle({ orden }) {
  const items = Array.isArray(orden.items) ? orden.items : [];
  const datosEnvio = orden.datosEnvio || {};

  return (
    <div className="border-b border-uva/10 bg-crema/35 px-5 py-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h3 className="mb-3 font-fredoka text-xl text-uva">
            Articulos comprados
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((item, index) => (
              <OrderItem key={`${item.idProducto}-${index}`} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-uva/10 bg-crema/65 p-4">
          <h3 className="font-fredoka text-xl text-uva">Detalle de envio</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <DetailRow label="Nombre" value={datosEnvio.nombreCompleto} />
            <DetailRow label="Telefono" value={datosEnvio.telefono} />
            <DetailRow
              label="Direccion"
              value={`${datosEnvio.calle || ""} ${datosEnvio.numero || ""}, ${
                datosEnvio.ciudad || "-"
              }`}
            />
            <DetailRow
              label="Provincia"
              value={PROVINCIAS_LABEL[datosEnvio.provincia] || datosEnvio.provincia}
            />
            <DetailRow label="CP" value={datosEnvio.codigoPostal} />
            <DetailRow label="Piso/depto" value={datosEnvio.pisoDepto || "-"} />
            <DetailRow label="Referencias" value={datosEnvio.referencias || "-"} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function OrderItem({ item }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl bg-crema/70 p-3">
      <img
        src={item.imagen}
        alt={item.nombre}
        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold text-uva">{item.nombre}</p>
        {describirVariante(item.variante) && (
          <p className="text-xs font-semibold text-uva/60">
            {describirVariante(item.variante)}
          </p>
        )}
        <p className="mt-1 text-sm font-bold text-morado">
          {item.cantidad} x {formatMoney(item.precioUnitario)}
        </p>
      </div>
      <p className="shrink-0 font-extrabold text-uva">{formatMoney(item.subtotal)}</p>
    </div>
  );
}

function ProductosPanel({
  productos,
  cargando,
  onDelete,
}) {
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [categoriaProducto, setCategoriaProducto] = useState("");
  const [productoVariantesAbiertas, setProductoVariantesAbiertas] =
    useState(null);

  const categoriasProducto = useMemo(() => {
    const categoriasBase = MERCH_CATEGORY_OPTIONS.map((categoria) => ({
      ...categoria,
      count: productos.filter(
        (producto) =>
          getMerchCategoryInfo(producto.categoria).value === categoria.value
      ).length,
    }));

    const categoriasExtra = productos
      .map((producto) => getMerchCategoryInfo(producto.categoria))
      .filter(
        (categoria) =>
          categoria.value &&
          !MERCH_CATEGORY_OPTIONS.some((opcion) => opcion.value === categoria.value)
      );

    return [
      ...categoriasBase,
      ...Array.from(
        new Map(categoriasExtra.map((categoria) => [categoria.value, categoria])).values()
      ),
    ];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const query = busquedaProducto.trim().toLowerCase();
    const porCategoria = categoriaProducto
      ? productos.filter(
          (producto) =>
            getMerchCategoryInfo(producto.categoria).value === categoriaProducto
        )
      : productos;

    const base = !query
      ? porCategoria
      : porCategoria.filter((producto) =>
          [
            producto.nombre,
            producto.categoria,
            producto.descripcion,
            ...(Array.isArray(producto.variantes)
              ? producto.variantes.flatMap((variante) => [
                  variante.color,
                  variante.talle,
                  variante.diseno,
                ])
              : []),
          ]
            .filter(Boolean)
            .some((valor) => String(valor).toLowerCase().includes(query))
        );

    return base;
  }, [busquedaProducto, categoriaProducto, productos]);

  if (cargando) {
    return <EmptyPanel icon={ShoppingBasket} text="Cargando productos..." />;
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-fredoka text-3xl text-uva">Productos</h2>
        <p className="text-sm text-uva/65">
          Administra la merch visible en la tienda.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Link
          to="/admin/merch/nuevo"
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-morado px-4 text-sm font-bold text-crema shadow-md transition hover:bg-morado/85"
        >
          <Plus size={18} />
          Nuevo producto
        </Link>

        <AdminSearchBox
          value={busquedaProducto}
          onChange={(value) => {
            setBusquedaProducto(value);
            setProductoVariantesAbiertas(null);
          }}
          placeholder="Buscar producto"
          className="w-full sm:max-w-[320px]"
        />
      </div>

      <AdminFilterHeading className="mb-2">Categorias</AdminFilterHeading>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          active={!categoriaProducto}
          onClick={() => setCategoriaProducto("")}
        >
          Todas
        </FilterPill>
        {categoriasProducto.map((categoria) => (
          <FilterPill
            key={categoria.value}
            active={categoriaProducto === categoria.value}
            onClick={() => {
              setCategoriaProducto(
                categoriaProducto === categoria.value ? "" : categoria.value
              );
              setProductoVariantesAbiertas(null);
            }}
            color={categoria.color}
            icon={Tag}
          >
            {categoria.label}
            {categoria.count !== undefined ? ` (${categoria.count})` : ""}
          </FilterPill>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-morado/25 text-base font-extrabold uppercase tracking-wide text-uva">
              <th className="px-3 py-4">Foto</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.map((producto) => {
              const tieneVariantes =
                Array.isArray(producto.variantes) && producto.variantes.length > 0;
              const variantesAbiertas = productoVariantesAbiertas === producto._id;
              const variantesVisibles = variantesAbiertas
                ? producto.variantes
                : producto.variantes?.slice(0, 2) || [];

              return (
                  <tr
                    key={producto._id}
                    className="border-b border-uva/10 transition hover:bg-crema/45"
                  >
                    <td className="p-3">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="h-14 w-14 rounded-xl border border-uva/10 object-cover"
                      />
                    </td>

                    <td className="p-3 font-semibold text-uva">
                      <div className="min-w-0">
                        <span className="block min-w-0 truncate font-extrabold">
                          {producto.nombre}
                        </span>

                        {tieneVariantes && (
                          <div className="mt-2 flex max-w-[460px] flex-wrap items-center gap-2">
                            {variantesVisibles.map((variante, index) => (
                              <span
                                key={`${producto._id}-variante-resumen-${index}`}
                                className="inline-flex max-w-[210px] items-center rounded-full bg-crema px-2.5 py-1 text-xs font-extrabold leading-tight text-uva/75"
                                title={describirVariante(variante)}
                              >
                                <span className="truncate">
                                  {describirVarianteCorta(variante)}
                                </span>
                              </span>
                            ))}
                            {producto.variantes.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setProductoVariantesAbiertas((actual) =>
                                    actual === producto._id ? null : producto._id
                                  )
                                }
                                aria-expanded={variantesAbiertas}
                                className="inline-flex items-center gap-1 rounded-full bg-rosa/30 px-2.5 py-1 text-xs font-extrabold leading-tight text-uva transition hover:bg-rosa/45"
                              >
                                {variantesAbiertas ? (
                                  <>
                                    <ChevronUp size={13} />
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={13} />
                                    Ver todas ({producto.variantes.length})
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <CategoryBadge categoria={producto.categoria} />
                    </td>

                    <td className="p-3 font-semibold text-morado">
                      {formatMoney(producto.precio)}
                    </td>

                    <td className="p-3 font-semibold">
                      {calcularStockTotal(producto)}
                    </td>

                    <td className="p-3">
                      {producto.activo !== false ? (
                        <span className="rounded-full bg-menta/40 px-3 py-1 text-xs font-bold text-uva">
                          Activo
                        </span>
                      ) : (
                        <span className="rounded-full bg-fucsia/15 px-3 py-1 text-xs font-bold text-fucsia">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-3">
                        <Link
                          to={`/admin/merch/editar/${producto._id}`}
                          className="rounded-lg bg-morado/20 p-2 text-morado transition hover:bg-morado/30"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => onDelete(producto)}
                          className="rounded-lg bg-fucsia p-2 text-crema transition hover:bg-fucsia/80"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>

        {productos.length === 0 && (
          <EmptyPanel icon={ShoppingBasket} text="No hay productos cargados." />
        )}

        {productos.length > 0 && productosFiltrados.length === 0 && (
          <EmptyPanel icon={ShoppingBasket} text="No hay productos con esa busqueda." />
        )}
      </div>
    </section>
  );
}

function CategoryBadge({ categoria }) {
  const info = getMerchCategoryInfo(categoria);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold text-uva"
      style={{
        backgroundColor: `${info.color}66`,
        borderColor: info.color,
      }}
    >
      <Tag size={13} />
      {info.label}
    </span>
  );
}

function EnviosPanel({ form, setForm, cargando, guardando, onSubmit }) {
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  if (cargando) {
    return <EmptyPanel icon={Truck} text="Cargando configuracion de envios..." />;
  }

  return (
    <section className="max-w-4xl rounded-3xl border border-uva/10 bg-white p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="font-fredoka text-3xl text-uva">Envios</h2>
        <p className="text-sm text-uva/65">
          Define costos por zona y monto minimo para envio gratis.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputEnvio
            label="Capital Federal"
            name="capital_federal"
            value={form.capital_federal}
            onChange={handleChange}
          />
          <InputEnvio
            label="GCBA"
            name="conurbano_buenos_aires"
            value={form.conurbano_buenos_aires}
            onChange={handleChange}
          />
          <InputEnvio
            label="Buenos Aires"
            name="buenos_aires"
            value={form.buenos_aires}
            onChange={handleChange}
          />
          <InputEnvio
            label="Resto del pais"
            name="resto_pais"
            value={form.resto_pais}
            onChange={handleChange}
          />
          <InputEnvio
            label="Envio gratis desde"
            name="envioGratisDesde"
            value={form.envioGratisDesde}
            onChange={handleChange}
            className="md:col-span-2"
            step="10000"
          />
        </div>

        <div className="flex justify-end border-t border-uva/10 pt-5">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-morado px-5 py-3 font-bold text-crema shadow transition hover:bg-morado/85 disabled:opacity-50"
          >
            <Check size={18} />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </section>
  );
}

function InputEnvio({ label, name, value, onChange, className = "", step = "100" }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-bold text-uva">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className={inputClass}
      />
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <dt className="font-bold text-uva/55">{label}</dt>
      <dd className="min-w-0 break-words font-semibold text-uva">{value || "-"}</dd>
    </div>
  );
}

function EmptyPanel({ icon: Icon, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-uva/15 bg-white/70 px-4 py-8 text-center text-sm font-semibold text-uva/65">
      <Icon className="mx-auto mb-2 text-morado" size={24} />
      {text}
    </div>
  );
}
