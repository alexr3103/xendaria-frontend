import BotonCerrar from "./BotonCerrar.jsx";

export default function ModalXendaria({
  open = true,
  onClose,
  header,
  children,
  footer,
  maxWidth = "max-w-2xl",
  className = "",
  headerClassName = "",
  contentClassName = "",
  footerClassName = "",
  closeClassName = "",
  closeLabel = "Cerrar modal",
  showClose = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-uva/35 px-3 py-6 backdrop-blur-sm">
      <section
        className={`relative flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-visible rounded-3xl border border-uva/10 bg-crema shadow-2xl ${className}`}
      >
        {showClose && onClose && (
          <div className="absolute right-0 top-0 z-30 translate-x-1/2 -translate-y-1/2">
            <BotonCerrar
              onClick={onClose}
              className={closeClassName}
              ariaLabel={closeLabel}
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
          {header && <header className={headerClassName}>{header}</header>}

          <div className={`min-h-0 flex-1 overflow-y-auto ${contentClassName}`}>
            {children}
          </div>

          {footer && <footer className={footerClassName}>{footer}</footer>}
        </div>
      </section>
    </div>
  );
}
