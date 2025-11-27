import {
    Star,
    Bus,
    BookOpen,
    Trees,
    Leaf,
    FerrisWheel,
    Ghost,
} from "lucide-react";

//filtros nombre/color/icono
export const categorias = {
    puntos_populares: { label: "Populares", color: "#F28FA0", icon: Star },
    paradas_de_bus_turistico: { label: "Bus turístico", color: "#FFF7A8", icon: Bus },
    paseo_de_la_historieta: { label: "Historieta", color: "#D1D1D1", icon: BookOpen },
    espacios_verdes_publicos: { label: "Parques", color: "#83FFC4", icon: Trees },
    espacios_verdes_privados: { label: "Jardines", color: "#B6FF83", icon: Leaf },
    lugares_de_esparcimiento: { label: "Recreación", color: "#A0CDFF", icon: FerrisWheel },
    curiosos: { label: "Curiosos", color: "#C69BFF", icon: Ghost },
};
