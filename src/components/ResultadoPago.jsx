import { useNavigate } from "react-router-dom";
import Header from "../layouts/Header.jsx";
import Navbar from "./Navbar.jsx";

export default function ResultadoPago({
  illustration,
  icon: Icon,
  title,
  text,
  primaryAction,
  secondaryAction,
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-crema pb-28">
      <div className="sticky top-0 z-50">
        <Header disableFilter showCart />
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center px-4 py-8">
        <section className="relative w-full rounded-[2rem] border border-uva/10 bg-white px-5 pb-5 pt-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
            {illustration ? (
              <img
                src={illustration}
                alt=""
                className="h-full w-full object-contain drop-shadow-sm"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-morado/12 text-morado">
                {Icon && <Icon size={42} strokeWidth={2.4} />}
              </span>
            )}
          </div>

          <h1 className="font-fredoka text-3xl leading-tight text-morado">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-relaxed text-uva/65">
            {text}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {primaryAction && (
              <button
                type="button"
                onClick={() => navigate(primaryAction.to)}
                className={`h-12 rounded-2xl px-5 font-extrabold shadow-md transition active:scale-[0.98] ${primaryAction.className}`}
              >
                {primaryAction.label}
              </button>
            )}

            {secondaryAction && (
              <button
                type="button"
                onClick={() => navigate(secondaryAction.to)}
                className={`h-12 rounded-2xl px-5 font-extrabold transition active:scale-[0.98] ${secondaryAction.className}`}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  );
}
