import { useState } from "react";
import { Filter } from "lucide-react";
import logoMini from "../assets/logo-mini.png";
import FilterPanel from "./FilterPanel";

export default function Header({
  categorias,
  filtro,
  setFiltro,
  disableFilter = false, 
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-gris text-white py-3 px-4 flex justify-between items-center shadow-md z-50 relative">
        {/* LOGO + NOMBRE */}
        <div className="flex items-center gap-3">
          <img
            src={logoMini}
            alt="Xendaria logo"
            className="w-10 h-10 rounded-xl"
          />
          <h1 className="font-fredoka text-xl tracking-wide">Xendaria</h1>
        </div>

        {!disableFilter && (
          <button
            onClick={() => setOpen(!open)}
            className="
              p-2 rounded-lg transition
              hover:bg-crema/10
            "
          >
            <Filter
              size={26}
              className={open || filtro ? "text-menta" : "text-crema"}
            />
          </button>
        )}
      </header>

      {!disableFilter && open && (
        <FilterPanel
          categorias={categorias}
          filtro={filtro}
          setFiltro={setFiltro}
          close={() => setOpen(false)}
        />
      )}
    </>
  );
}
