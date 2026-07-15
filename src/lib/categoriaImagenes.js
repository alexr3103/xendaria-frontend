const imagenesCategoria = import.meta.glob(
  "../assets/puntos-propios/*.{png,jpg,jpeg,webp}",
  { eager: true, import: "default" }
);

export function getCategoriaImagen(categoria) {
  const entrada = Object.entries(imagenesCategoria).find(([path]) =>
    path.includes(`/puntos-propios/${categoria}.`)
  );

  return entrada?.[1] || null;
}
