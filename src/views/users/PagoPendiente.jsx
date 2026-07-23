import ResultadoPago from "../../components/ResultadoPago.jsx";
import reloj from "../../assets/reloj.png";

export default function PagoPendiente() {
  return (
    <ResultadoPago
      illustration={reloj}
      title="Pago pendiente"
      text="Todavía no se confirmó. Cuando MercadoPago lo apruebe, se registra la orden."
      primaryAction={{
        label: "Volver al carrito",
        to: "/carrito",
        className: "bg-rosa text-white",
      }}
      secondaryAction={{
        label: "Ir a compras",
        to: "/perfil?seccion=compras",
        className: "bg-menta text-uva shadow-md",
      }}
    />
  );
}
