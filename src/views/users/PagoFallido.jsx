import ResultadoPago from "../../components/ResultadoPago.jsx";
import pagoFallido from "../../assets/pago-fallido.png";

export default function PagoFallido() {
  return (
    <ResultadoPago
      illustration={pagoFallido}
      title="Pago no completado"
      text="No se generó una orden. Podés volver al carrito e intentarlo otra vez."
      primaryAction={{
        label: "Volver al carrito",
        to: "/carrito",
        className: "bg-rosa text-white",
      }}
      secondaryAction={{
        label: "Seguir comprando",
        to: "/merch",
        className: "bg-morado text-white shadow-md",
      }}
    />
  );
}
