export default function Alert({ variant = "error", children, id }) {
  const styles = {
    error:  "bg-fucsia/10 text-fucsia border border-fucsia/30",
    success:"bg-menta/10 text-uva border border-menta/30",
    info:   "bg-morado/10 text-uva border border-morado/30",
  }[variant];

  return (
    <div
      role="alert"
      id={id}
      className={`rounded-lg px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
