export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        morado: "#AA63E0",
        gris: "#3E3E3E",
        rosa: "#F28FA0",
        uva: "#401A37",
        crema: "#FDF6F0",
        menta: "#83FFC4",
        fucsia: "#D81159",
        vainilla: "#FFF7A8",
        grisaceo: "#D1D1D1",
        lima: "#B6FF83",
        celeste: "#A0CDFF",
        lila: "#C69BFF",
        chicle: "#FF8BC6",
      },
      fontFamily: {
        fredoka: ['"Fredoka"', "sans-serif"],
        nunito: ['"Nunito Sans"', "sans-serif"],
        sans: ['"Nunito Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

