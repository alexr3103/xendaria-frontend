import React from "react";
import logo from "../assets/logo-oficial.png";

export default function AuthLayout({ children, title }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-rosa/40 px-6 relative overflow-hidden font-nunito">
      {/* círculo decorativo con logo */}
      <div
        className="absolute top-8 flex items-center justify-center w-28 h-28 rounded-full bg-crema shadow-lg border-4 border-morado"
        aria-hidden="true"
      >
        <img
          src={logo}
          alt="Logo de Xendaria"
          className="w-16 h-16 object-contain"
        />
      </div>

      <section
        className="w-full max-w-xs mt-40 bg-crema shadow-xl rounded-3xl p-6 mb-10 flex flex-col 
                  gap-4 focus-within:ring-4  transition-all"
      >
        {title && (
          <h1 className="text-center text-2xl font-bold text-morado mb-2 font-fredoka">
            {title}
          </h1>
        )}
        {children}
      </section>
    </main>
  );
}
