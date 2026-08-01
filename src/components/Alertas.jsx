import { useEffect, useRef } from "react";

export default function Alert({
  variant = "error",
  children,
  id,
  autoFocus = false,
}) {
  const alertRef = useRef(null);

  useEffect(() => {
    if (!autoFocus || !children) return;

    const frame = requestAnimationFrame(() => {
      alertRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      alertRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [autoFocus, children]);

  const styles = {
    error:  "bg-fucsia/10 text-fucsia border border-fucsia/30",
    success:"bg-menta/10 text-uva border border-menta/30",
    info:   "bg-morado/10 text-uva border border-morado/30",
  }[variant];

  return (
    <div
      ref={alertRef}
      role="alert"
      id={id}
      tabIndex={autoFocus ? -1 : undefined}
      className={`rounded-lg px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
