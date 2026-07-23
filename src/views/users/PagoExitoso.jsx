import ResultadoPago from "../../components/ResultadoPago.jsx";
import pagoExito from "../../assets/pago-exito.png";

export default function PagoExitoso() {
  return (
    <ResultadoPago
      illustration={pagoExito}
      title="Pago aprobado"
      text="Tu compra se procesó correctamente. Podés revisar el detalle desde tu perfil."
      primaryAction={{
        label: "Ver mis compras",
        to: "/perfil?seccion=compras",
        className: "bg-menta text-uva",
      }}
      secondaryAction={{
        label: "Volver a la tienda",
        to: "/merch",
        className: "bg-rosa text-white shadow-md",
      }}
    />
  );
}
