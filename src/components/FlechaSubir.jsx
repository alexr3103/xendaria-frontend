import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function FlechaSubir({ targetSelector = "main > section" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(targetSelector);

    function handleScroll() {
      const scrollTop = target?.scrollTop || window.scrollY || 0;
      setVisible(scrollTop > 260);
    }

    handleScroll();
    target?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [targetSelector]);

  function subirArriba() {
    document
      .querySelector(targetSelector)
      ?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={subirArriba}
      className={`fixed bottom-8 right-8 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-uva text-crema shadow-xl transition hover:-translate-y-1 hover:bg-uva/90 hover:shadow-2xl active:translate-y-0 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      <ArrowUp size={21} />
    </button>
  );
}
