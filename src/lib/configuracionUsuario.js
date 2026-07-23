export const CONFIGURACION_USUARIO_DEFAULT = {
  perfilPublico: true,
  mostrarFavoritosPerfil: true,
  mostrarInsigniasPerfil: true,
  mostrarAlbumInsigniasPerfil: true,
  mostrarContadorVisitados: true,
  mostrarPuntosVisitadosPerfil: true,
  mostrarPreferenciaLugaresPerfil: true,
  mostrarActividadRanking: true,
  permitirUbicacion: true,
  vista360Habilitada: true,
  categoriaFavorita: "",
  notificaciones: {
    puntosCercanos: true,
    insignias: true,
    recompensas: true,
  },
};

export function normalizarConfiguracionUsuario(configuracion = {}) {
  const config = configuracion || {};

  return {
    ...CONFIGURACION_USUARIO_DEFAULT,
    ...config,
    notificaciones: {
      ...CONFIGURACION_USUARIO_DEFAULT.notificaciones,
      ...(config.notificaciones || {}),
    },
  };
}
